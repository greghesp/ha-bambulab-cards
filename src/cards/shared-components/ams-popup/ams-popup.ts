import { LitElement } from "lit";
import { html, nothing } from "lit-html";
import { consume } from "@lit/context";
import { customElement, property, state } from "lit/decorators.js";
import { hassContext } from "../../../utils/context";
import { getContrastingTextColor, getFilamentData, setFilament, loadFilament, unloadFilament } from "../../../utils/helpers";
import styles from "./ams-popup.styles";

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
    }
  }

  firstUpdated() {
    this.color = this.hass.states[this.entity_id].attributes.color.substring(0,7);
  }

  #closeDialog() {
    this._dialogOpen = false;
  }

  async #asyncHandleClick() {
    const result = await getFilamentData(this.hass, this.entity_id);
    this.filamentData = result.response;
    this.tray_info_idx = this.hass.states[this.entity_id].attributes.filament_id;
    if (!this.filamentData[this.tray_info_idx]) {
      const customFilament = {
        name: `Custom: ${this.tray_info_idx}`,
        filament_vendor: "",
        filament_type: this.hass.states[this.entity_id].attributes.type,
        filament_density: 0,
        nozzle_temperature: 0,
        nozzle_temperature_range_high: this.hass.states[this.entity_id].attributes.nozzle_temp_max,
        nozzle_temperature_range_low: this.hass.states[this.entity_id].attributes.nozzle_temp_min,
      }
      this.filamentData[this.tray_info_idx] = customFilament;
    }
    this.selectedFilament = this.filamentData[this.tray_info_idx];

    this._dialogOpen = true;
  }

  #onFilamentTypeChange(event) {
    if (this.selectedFilament.filament_type != event.target.value) {
      if (event.target.value == this.hass.states[this.entity_id].attributes.type) {
        this.tray_info_idx = this.hass.states[this.entity_id].attributes.filament_id  ;
        this.selectedFilament = this.filamentData[this.tray_info_idx];
      }
      else {
        const [key, filament] = Object.entries(this.filamentData)
            .find(([_, filament]) => filament.filament_type === event.target.value) || ['', this.selectedFilament];
        this.selectedFilament = filament;
        this.tray_info_idx = key;
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
    return filaments.map(filament => html`
      <option value="${filament}" ?selected=${filament === this.selectedFilament.filament_type}>${filament}</option>
    `);
  }

  #generateFilamentNameOptions() {
    return Object.entries(this.filamentData)
      .filter(([_, filament]) => filament.filament_type === this.selectedFilament.filament_type)
      .map(([key, filament]) => html`
        <option value="${key}" ?selected=${key === this.tray_info_idx}>${filament.name}</option>
      `);
  }

  #isSetBuildEnabled() {
    return this.color.toUpperCase() != this.hass.states[this.entity_id].attributes.color.substring(0,7).toUpperCase() ||
           this.selectedFilament.nozzle_temperature_range_low != this.hass.states[this.entity_id].attributes.nozzle_temp_min ||
           this.selectedFilament.nozzle_temperature_range_high != this.hass.states[this.entity_id].attributes.nozzle_temp_max ||
           this.selectedFilament.filament_type != this.hass.states[this.entity_id].attributes.type ||
           this.tray_info_idx != this.hass.states[this.entity_id].attributes.filament_id;
  }

  #isLoadButtonEnabled() {
    return this._loadState === 'idle' && 
           !this.hass.states[this.entity_id].attributes.empty &&
           !this.hass.states[this.entity_id].attributes.active;
  }

  #isUnloadButtonEnabled() {
    return this._loadState === 'idle' && 
           !this.hass.states[this.entity_id].attributes.empty &&
           this.hass.states[this.entity_id].attributes.active;
  }

  async #handleSet() {
    const rgbaColor = `${this.color}FF`.toUpperCase();
    await setFilament(this.hass, this.entity_id, this.tray_info_idx, this.selectedFilament.filament_type, rgbaColor, this.selectedFilament.nozzle_temperature_range_low, this.selectedFilament.nozzle_temperature_range_high);
  }

  #handleColorChange(event: InputEvent) {
    const input = event.target as HTMLInputElement;
    this.color = input.value;
  }

  @property({ type: String })
  private _loadState: "idle" | "loading" | "unloading" | "success" | "error" = "idle";

  async #handleLoad() {
    this._loadState = "loading";
    try {
      await loadFilament(this.hass, this.entity_id);
      setTimeout(() => {
        this._loadState = "idle";
      }, 10000);
    } catch (error) {
      this._loadState = "error";
      setTimeout(() => {
        this._loadState = "idle";
      }, 2000);
    }
  }

  async #handleUnload() {
    this._loadState = "unloading";
    try {
      await unloadFilament(this.hass, this.entity_id);
      setTimeout(() => {
        this._loadState = "idle";
      }, 10000);
    } catch (error) {
      this._loadState = "error";
      setTimeout(() => {
        this._loadState = "idle";
      }, 2000);
    }
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
          <div class="filament-title section-title">Filament Information</div>
          <div class="filament-type item-title">Filament Type</div>
          <select class="filament-type item-value"
              @change="${this.#onFilamentTypeChange}">
              ${this.#generateFilamentTypeOptions()}
          </select>
          <div class="filament-name item-title">Filament</div>
          <select class="filament-name item-value" 
              @change="${this.#onFilamentNameChange}">
              ${this.#generateFilamentNameOptions()}
          </select>
          <div class="div4 item-title">Color</div>
          <div class="div4 item-value">
            <input
              type="color"
              style="padding: 0px 0px; border-radius: 5px;"
              .value="${this.hass.states[this.entity_id].attributes.color.substring(0,7)}"
              @input="${this.#handleColorChange}"
            />
          </div>
          <div class="div6 section-title">Nozzle Temperature</div>
          <div class="div7 item-title">Minimum</div>
          <div class="div7 item-value">
            ${this.selectedFilament.nozzle_temperature_range_low}
          </div>
          <div class="div9 item-title">Maximum</div>
          <div class="div9 item-value ">
            ${this.selectedFilament.nozzle_temperature_range_high}
          </div>
          <div class="action-buttons">
            <mwc-button
              id="set"
              class="action-button" 
              @click=${this.#handleSet}
              ?disabled=${!this.#isSetBuildEnabled()}
            >
              Set
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
                : "Load"
              }
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
                ? html`<ha-icon icon="mdi:close" style="color: var(--error-color)"></ha-icon> Unload`
                : "Unload"
              }
            </mwc-button>            
          </div>
      </ha-dialog>
    `;
  }
}
