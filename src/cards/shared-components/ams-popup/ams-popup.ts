import { LitElement } from "lit";
import { html, nothing } from "lit-html";
import { consume } from "@lit/context";
import { property, state } from "lit/decorators.js";
import { customElement } from "../../../utils/custom-element";
import { hassContext } from "../../../utils/context";
import {
  EMPTY_TRAY,
  getContrastingTextColor,
  getEmptyTrayLabel,
  getFilamentData,
  getTrayText,
  isTrayMqttEncryptionEnabled,
  setFilament,
  refreshRFID,
  loadFilament,
  unloadFilament,
} from "../../../utils/helpers";
import styles from "./ams-popup.styles";

// Upper bound on how long to wait for the printer to report the tray as (in)active.
// Loading can involve heating, cutting and purging, so this is deliberately generous.
const LOAD_TIMEOUT_MS = 5 * 60 * 1000;
// How long the success/error icon is shown before the buttons return to idle.
const RESULT_DISPLAY_MS = 2000;

interface FilamentInfo {
  name: string;
  filament_vendor: string;
  filament_type: string;
  filament_density: number;
  nozzle_temperature: number;
  nozzle_temperature_range_high: number;
  nozzle_temperature_range_low: number;
}

interface FilamentData {
  [key: string]: FilamentInfo | undefined;
}

@customElement("ams-popup")
export class AMSPopup extends LitElement {
  @property({ type: String }) entity_id;
  @property({ type: Boolean }) hideControls: boolean = false;

  @consume({ context: hassContext, subscribe: true })
  private hass;

  @property({ type: Boolean })
  private _dialogOpen = false;

  @state()
  private selectedFilament: FilamentInfo;

  @state()
  private color: string = "";
  @state()
  private tray_info_idx: string = "";

  @state()
  private filamentData: FilamentInfo[] = [];

  private is_bambu_lab: boolean = true;

  constructor() {
    super();
    this.filamentData = [];
    this.selectedFilament = {
      name: "",
      filament_vendor: "",
      filament_type: "",
      filament_density: 0,
      nozzle_temperature: 0,
      nozzle_temperature_range_high: 0,
      nozzle_temperature_range_low: 0,
    };
  }

  firstUpdated() {
    if (this.entity_id) {
      this.is_bambu_lab = this.hass.entities[this.entity_id].platform == "bambu_lab";
      this.color = (this.hass.states[this.entity_id]?.attributes?.color ?? "").substring(0, 7);
    }
  }

  #closeDialog() {
    this._dialogOpen = false;
  }

  async #asyncHandleClick() {
    if (this.is_bambu_lab) {
      const result = await getFilamentData(this.hass, this.entity_id);
      this.filamentData = result.response;
    }
    this.#handleReset();
    this._dialogOpen = true;
  }

  #onFilamentTypeChange(event) {
    if (this.selectedFilament.filament_type != event.target.value) {
      if (event.target.value == this.hass.states[this.entity_id].attributes.type) {
        this.tray_info_idx = this.hass.states[this.entity_id].attributes.filament_id;
        this.selectedFilament = this.filamentData[this.tray_info_idx];
      } else {
        const [key, filament] = Object.entries(this.filamentData).find(
          ([_, filament]) => filament.filament_type === event.target.value
        ) || ["", this.selectedFilament];
        this.tray_info_idx = key;
        this.selectedFilament = filament;
      }
    }
  }

  #onFilamentNameChange(event) {
    this.tray_info_idx = event.target.value;
    this.selectedFilament = this.filamentData[this.tray_info_idx];
  }

  // this.tray_info_idx == filament_id
  #generateFilamentTypeOptions() {
    const filaments = Object.values(this.filamentData)
      .map((filament: FilamentInfo) => filament.filament_type)
      .filter((value, index, self) => self.indexOf(value) === index);
    return filaments.map(
      (filament) => html`
        <option value="${filament}" ?selected=${filament === this.selectedFilament.filament_type}>
          ${filament === EMPTY_TRAY ? getEmptyTrayLabel(this.hass, this.entity_id) : filament}
        </option>
      `
    );
  }

  #generateFilamentNameOptions() {
    return Object.entries(this.filamentData)
      .filter(([_, filament]) => filament.filament_type === this.selectedFilament.filament_type)
      .map(
        ([key, filament]) => html`
          <option value="${key}" ?selected=${key === this.tray_info_idx}>${filament.name}</option>
        `
      );
  }

  #isSetEnabled() {
    const colorMatches = this.color.toUpperCase() == (this.hass.states[this.entity_id]?.attributes?.color ?? "").substring(0, 7).toUpperCase();
    const minTempMatches = this.selectedFilament.nozzle_temperature_range_low == this.hass.states[this.entity_id].attributes.nozzle_temp_min;
    const maxTempMatches = this.selectedFilament.nozzle_temperature_range_high == this.hass.states[this.entity_id].attributes.nozzle_temp_max;
    const typeMatches = this.selectedFilament.filament_type == this.hass.states[this.entity_id].attributes.type;
    const idMatches = this.tray_info_idx == this.hass.states[this.entity_id].attributes.filament_id;
    return !(colorMatches && minTempMatches && maxTempMatches && typeMatches && idMatches);
  }

  #areControlsShown(): boolean {
    // Node-RED has no services to call, and the printer rejects them all if it needs signed
    // MQTT commands. hideControls is the print status card's hide_controls option.
    return (
      this.is_bambu_lab &&
      !this.hideControls &&
      !isTrayMqttEncryptionEnabled(this.hass, this.entity_id)
    );
  }

  #isLoadButtonEnabled() {
    return (
      this._loadState === "idle" &&
      !this.hass.states[this.entity_id].attributes.empty &&
      !this.hass.states[this.entity_id].attributes.active
    );
  }

  #isUnloadButtonEnabled() {
    return (
      this._loadState === "idle" &&
      !this.hass.states[this.entity_id].attributes.empty &&
      this.hass.states[this.entity_id].attributes.active
    );
  }

  async #handleSet() {
    const rgbaColor = `${this.color}FF`.toUpperCase();
    await setFilament(
      this.hass,
      this.entity_id,
      this.tray_info_idx,
      this.selectedFilament.filament_type,
      rgbaColor,
      this.selectedFilament.nozzle_temperature_range_low,
      this.selectedFilament.nozzle_temperature_range_high
    );
    this.#closeDialog();
  }

  async #handleReset() {
    this.tray_info_idx =
      this.hass.states[this.entity_id].attributes.tray_info_idx ||
      this.hass.states[this.entity_id].attributes.filament_id;
    if (!this.filamentData[this.tray_info_idx]) {
      const customFilament = {
        name: `Custom: ${this.tray_info_idx}`,
        filament_vendor: "",
        filament_type: this.hass.states[this.entity_id].attributes.type,
        filament_density: 0,
        nozzle_temperature: 0,
        nozzle_temperature_range_high: this.hass.states[this.entity_id].attributes.nozzle_temp_max,
        nozzle_temperature_range_low: this.hass.states[this.entity_id].attributes.nozzle_temp_min,
      };
      this.filamentData[this.tray_info_idx] = customFilament;
    }
    this.selectedFilament = this.filamentData[this.tray_info_idx];
    // Override the defaults with the actual values from the tray entity as they don't always match.
    // This is a reference so we update the values in the global filament list so that if we switch
    // filaments away and back we'll still perfectly match.
    this.selectedFilament.nozzle_temperature_range_low = this.hass.states[this.entity_id].attributes.nozzle_temp_min;
    this.selectedFilament.nozzle_temperature_range_high = this.hass.states[this.entity_id].attributes.nozzle_temp_max;
  }

  #handleColorChange(event: InputEvent) {
    const input = event.target as HTMLInputElement;
    this.color = input.value;
  }

  @property({ type: String })
  private _loadState: "idle" | "loading" | "unloading" | "success" | "error" = "idle";

  // The tray `active` value we're waiting for after a load/unload request, or null if none.
  private _pendingActiveTarget: boolean | null = null;
  private _loadTimeout?: ReturnType<typeof setTimeout>;
  private _resultTimeout?: ReturnType<typeof setTimeout>;

  async #handleRefresh() {
    await refreshRFID(this.hass, this.entity_id);
  }

  async #handleLoad() {
    await this.#runLoadAction("loading", true, () => loadFilament(this.hass, this.entity_id));
  }

  async #handleUnload() {
    await this.#runLoadAction("unloading", false, () => unloadFilament(this.hass, this.entity_id));
  }

  // Keeps the buttons disabled until the printer reports the tray reached the expected
  // active state, rather than re-enabling them after a fixed delay that can be shorter
  // than the actual load/unload.
  async #runLoadAction(
    pendingState: "loading" | "unloading",
    targetActive: boolean,
    action: () => Promise<unknown>
  ) {
    this.#clearLoadTimers();
    this._loadState = pendingState;
    this._pendingActiveTarget = null;
    try {
      await action();
    } catch (error) {
      this.#finishLoadAction("error");
      return;
    }
    if (this.#isTrayActive() === targetActive) {
      this.#finishLoadAction("success");
      return;
    }
    this._pendingActiveTarget = targetActive;
    this._loadTimeout = setTimeout(() => this.#finishLoadAction("error"), LOAD_TIMEOUT_MS);
  }

  #finishLoadAction(result: "success" | "error") {
    this.#clearLoadTimers();
    this._pendingActiveTarget = null;
    this._loadState = result;
    this._resultTimeout = setTimeout(() => {
      this._resultTimeout = undefined;
      this._loadState = "idle";
    }, RESULT_DISPLAY_MS);
  }

  #clearLoadTimers() {
    clearTimeout(this._loadTimeout);
    clearTimeout(this._resultTimeout);
    this._loadTimeout = undefined;
    this._resultTimeout = undefined;
  }

  #isTrayActive(): boolean {
    return Boolean(this.hass?.states[this.entity_id]?.attributes?.active);
  }

  willUpdate() {
    if (this._pendingActiveTarget !== null && this.#isTrayActive() === this._pendingActiveTarget) {
      this.#finishLoadAction("success");
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#clearLoadTimers();
    this._pendingActiveTarget = null;
    this._loadState = "idle";
  }

  async #closePopup() {
    this._dialogOpen = false;
  }

  static styles = styles;

  render() {
    return html`
      <div class="popup-action-container" @click=${this.#asyncHandleClick}>
        <slot></slot>
      </div>
      ${this.modal()}
    `;
  }

  modal() {
    if (!this._dialogOpen) return nothing;

    return html`
      <ha-dialog
        id="confirmation-popup"
        .open=${this._dialogOpen}
        @closed=${this.#closeDialog}
        heading="title"
        hideactions
      >
        <ha-dialog-header slot="heading">
          <ha-icon-button slot="navigationIcon" dialogAction="cancel"
            ><ha-icon icon="mdi:close"></ha-icon
          ></ha-icon-button>
          <div slot="title">${this.hass.states[this.entity_id].attributes.friendly_name}</div>
        </ha-dialog-header>
        <div class="ha-bambulab-spool-modal-container">
          ${this.#populateFilamentInfo()}
          <div class="div6 section-title">Nozzle Temperature</div>
          <div class="div7 item-title">Minimum</div>
          <div class="div7 item-value">
            ${this.selectedFilament.nozzle_temperature_range_low}
          </div>
          <div class="div9 item-title">Maximum</div>
          <div class="div9 item-value ">
            ${this.selectedFilament.nozzle_temperature_range_high}
          </div>
          ${this.#populateActionButtons()}
      </ha-dialog>
    `;
  }

  #populateFilamentInfo() {
    if (this.#areControlsShown()) {
      return html`
        <div class="filament-title section-title">Filament Information</div>
        <div class="filament-type item-title">Filament Type</div>
        <select class="filament-type item-value truncate-select" @change="${this.#onFilamentTypeChange}">
          ${this.#generateFilamentTypeOptions()}
        </select>
        <div class="filament-name item-title">Filament</div>
        <select class="filament-name item-value truncate-select" @change="${this.#onFilamentNameChange}">
          ${this.#generateFilamentNameOptions()}
        </select>
        <div class="div4 item-title">Color</div>
        <div class="div4 item-value">
          <input
            type="color"
            style="padding: 0px 0px; border-radius: 5px;"
            .value="${(this.hass.states[this.entity_id]?.attributes?.color ?? "").substring(0, 7)}"
            @input="${this.#handleColorChange}"
          />
        </div>
      `;
    } else {
      return html`
        <div class="filament-title section-title">Filament Information</div>
        <div class="filament-type item-title">Filament Type</div>
        <div class="filament-type item-value">
          ${getTrayText(this.hass, this.entity_id, "type")}
        </div>
        <div class="filament-name item-title">Filament</div>
        <div class="filament-name item-value">
          ${getTrayText(this.hass, this.entity_id, "name")}
        </div>
        <div class="div4 item-title">Color</div>
        <div class="div4 item-value">
          <span
            style="background-color: ${this.hass.states[this.entity_id].attributes
              .color}; color: ${getContrastingTextColor(
              this.hass.states[this.entity_id].attributes.color
            )}; padding: 5px 10px; border-radius: 5px;"
            >${this.hass.states[this.entity_id].attributes.color}</span
          >
        </div>
      `;
    }
  }

  #populateActionButtons() {
    // There's nothing to control so we need to show the close button
    if (!this.#areControlsShown()) {
      return html`
        <div class="action-buttons">
          <mwc-button id="close" class="action-button" @click=${this.#closePopup}>
            Close
          </mwc-button>
        </div>
      `;
    }

    // The user had adjusted the filament settings so we need to show the confirm and reset buttons
    if (this.#isSetEnabled()) {
      return html`
        <div class="action-buttons">
          <mwc-button id="confirm" class="action-button" @click=${this.#handleSet}>
            Confirm
          </mwc-button>
          <mwc-button id="reset" class="action-button" @click=${this.#handleReset}>
            Reset
          </mwc-button>
        </div>
      `;
    }

    // The user had not adjusted the filament settings so we need to show the load and unload buttons
    return html`
      <div class="action-buttons">
        <mwc-button
          id="refresh"
          class="action-button"
          @click=${this.#handleRefresh}
          ?disabled=${!this.#isLoadButtonEnabled()}
        >
          <ha-icon icon="mdi:refresh"></ha-icon>
        </mwc-button>
        <mwc-button
          id="load"
          class="action-button"
          @click=${this.#handleLoad}
          ?disabled=${!this.#isLoadButtonEnabled()}
        >
          ${this._loadState === "loading"
            ? html`<ha-circular-progress active size="small"></ha-circular-progress>Loading`
            : this._loadState === "success"
              ? html`<ha-icon icon="mdi:check" style="color: var(--success-color)"></ha-icon>Load`
              : this._loadState === "error"
                ? html`<ha-icon icon="mdi:close" style="color: var(--error-color)"></ha-icon>Load`
                : "Load"}
        </mwc-button>
        <mwc-button
          id="unload"
          class="action-button"
          @click=${this.#handleUnload}
          ?disabled=${!this.#isUnloadButtonEnabled()}
        >
          ${this._loadState === "unloading"
            ? html`<ha-circular-progress active size="small"></ha-circular-progress>Unloading`
            : this._loadState === "success"
              ? html`<ha-icon icon="mdi:check" style="color: var(--success-color)"></ha-icon>Unload`
              : this._loadState === "error"
                ? html`<ha-icon icon="mdi:close" style="color: var(--error-color)"></ha-icon>
                    Unload`
                : "Unload"}
        </mwc-button>
      </div>
    `;
  }
}
