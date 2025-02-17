import { customElement, property, state } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import styles from "./spool.styles";
import "../dialog/dialog";
import { getContrastingTextColor } from "../../../utils/helpers";
import { hassContext } from "../../../utils/context";
import { consume } from "@lit/context";

@customElement("ha-bambulab-spool")
export class Spool extends LitElement {
  @consume({ context: hassContext, subscribe: true })
  private hass;

  @property({ type: Boolean }) public show_type: boolean = false;
  @property({ type: String }) public entity_id;

  @state() private color;
  @state() private name;
  @state() private active;
  @state() private remaining;
  @state() private tag_uid;
  @state() private state;
  @state() private remainHeight: number = 95;
  @state() private resizeObserver: ResizeObserver | null = null;
  @state() private _dialogOpen: boolean = false;

  static styles = styles;

  connectedCallback() {
    super.connectedCallback();
    this.updateFromHass();

    // Create a bound instance method to avoid creating new functions on each resize
    this._handleResize = this._handleResize.bind(this);

    // Start observing the parent element for size changes
    this.resizeObserver = new ResizeObserver(this._handleResize);
    const rootNode = this.getRootNode() as ShadowRoot;
    const parent = this.parentElement || (rootNode instanceof ShadowRoot ? rootNode.host : null);
    if (parent) {
      this.resizeObserver.observe(parent);
    }
  }

  private _handleResize() {
    // Only update if the component is still connected to the DOM
    if (this.isConnected) {
      this.calculateHeights();
      this.updateLayers();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  firstUpdated() {
    this.updateLayers();
  }

  private _handleClick() {
    this._dialogOpen = true;
  }

  private _closeDialog() {
    this._dialogOpen = false;
  }

  render() {
    console.log("spool component render");
    return html`
      ${this.modal()}
      <div class="ha-bambulab-spool-card-container">
        <div
          class="ha-bambulab-spool-card-holder"
          style="border-color: ${this.active
            ? this.hass.states[this.entity_id]?.attributes.color
            : "#808080"}"
          @click=${this._handleClick}
        >
          <div class="ha-bambulab-spool-container">
            <div class="ha-bambulab-spool-side"></div>
            <div
              class="string-roll-container"
              style="${this.active ? "animation: wiggle 3s linear infinite" : nothing}"
            >
              <div
                class="v-string-roll"
                id="v-string-roll"
                style="background: ${this.hass.states[this.entity_id]?.attributes
                  .color}; height: ${this.remainHeight.toFixed(2)}%"
              >
                ${this.active ? html`<div class="v-reflection"></div>` : nothing}
                ${this.hass.states[this.entity_id]?.attributes?.remain > 0
                  ? html`
                      <div class="remaining-percent">
                        <p>${this.hass.states[this.entity_id]?.attributes?.remain}%</p>
                      </div>
                    `
                  : nothing}
              </div>
            </div>
            <div class="ha-bambulab-spool-side"></div>
          </div>
        </div>
        ${this.show_type
          ? html` <div class="ha-bambulab-spool-info-container">
              <div class="ha-bambulab-spool-info-wrapper">
                <div class="ha-bambulab-spool-info">
                  ${this.hass.states[this.entity_id]?.attributes.name}
                </div>
              </div>
            </div>`
          : nothing}
      </div>
    `;
  }

  modal() {
    if (!this._dialogOpen) return nothing;

    console.log("spool component modal rendered");
    return html`
      <ha-dialog
        id="confirmation-popup"
        .open=${this._dialogOpen}
        @closed=${this._closeDialog}
        heading="title"
      >
        <ha-dialog-header slot="heading">
          <ha-icon-button slot="navigationIcon" dialogAction="cancel"
            ><ha-icon icon="mdi:close"></ha-icon
          ></ha-icon-button>
          <div slot="title">${this.hass.states[this.entity_id].attributes.friendly_name}</div>
        </ha-dialog-header>
        <div class="ha-bambulab-spool-modal-container">
          <div class="filament-title section-title">Filament Information</div>
          <div class="div2 item-title">Filament</div>
          <div class="div3 item-value">${this.hass.states[this.entity_id].attributes.name}</div>
          <div class="div4 item-value">
            <span
              style="background-color: ${this.hass.states[this.entity_id].attributes
                .color}; color: ${getContrastingTextColor(
                this.hass.states[this.entity_id].attributes.color
              )}; padding: 5px 10px; border-radius: 5px;"
              >${this.hass.states[this.entity_id].attributes.color}</span
            >
          </div>
          <div class="div5 item-title">Color</div>
          <div class="div6 section-title">Nozzle Temperature</div>
          <div class="div7 item-title">Minimum</div>
          <div class="div8 item-value">
            ${this.hass.states[this.entity_id].attributes.nozzle_temp_min}
          </div>
          <div class="div9 item-value ">
            ${this.hass.states[this.entity_id].attributes.nozzle_temp_max}
          </div>
          <div class="div10 item-title">Maximum</div>
          <div class="action-buttons">
            <mwc-button class="action-button" @click=${this._closeDialog}>Load</mwc-button>
            <mwc-button class="action-button" @click=${this._closeDialog}>Unload</mwc-button>
          </div>
        </div>
      </ha-dialog>
    `;
  }

  updateLayers() {
    // Query the #string-roll element inside this component's shadow DOM
    const stringRoll = (this.renderRoot as ShadowRoot).getElementById("v-string-roll");
    if (!stringRoll) return;

    const stringWidth = 2; // matches .string-layer width in CSS
    const rollWidth = stringRoll.offsetWidth; // container width

    // Calculate how many lines fit
    const numLayers = Math.floor(rollWidth / (stringWidth * 2)); // 2 = line width + gap

    // Clear previous layers
    const previousLayers = this.renderRoot.querySelectorAll(".v-string-layer");
    previousLayers.forEach((layer) => layer.remove());

    // Add new layers
    for (let i = 0; i < numLayers; i++) {
      const layer = document.createElement("div");
      layer.classList.add("v-string-layer");

      // Calculate left position = (index + 1) * (width*2) - width
      const leftPosition = (i + 1) * (stringWidth * 2) - stringWidth;
      layer.style.left = `${leftPosition}px`;

      stringRoll.appendChild(layer);
    }
  }

  isAllZeros(str) {
    return /^0+$/.test(str);
  }

  calculateHeights() {
    // Skip calculation if modal is open to prevent unwanted updates
    if (this._dialogOpen) return;

    const maxHeightPercentage = 95;
    const minHeightPercentage = 12;

    // If not a Bambu Spool or remaining is less than 0
    if (
      this.isAllZeros(this.hass.states[this.entity_id]?.attributes.tag_uid) ||
      this.hass.states[this.entity_id]?.attributes?.remain < 0
    ) {
      this.remainHeight = maxHeightPercentage;
    } else {
      // Get the container's height
      const container = this.renderRoot.querySelector(
        ".string-roll-container"
      ) as HTMLElement | null;
      const containerHeight = container?.offsetHeight || 0;

      // Calculate heights in pixels
      const maxHeightPx = containerHeight * (maxHeightPercentage / 100);
      const minHeightPx = containerHeight * (minHeightPercentage / 100);

      // Calculate remain height based on the remain percentage
      const remainPercentage = Math.min(
        Math.max(this.hass.states[this.entity_id]?.attributes?.remain, 0),
        100
      );
      this.remainHeight = minHeightPx + (maxHeightPx - minHeightPx) * (remainPercentage / 100);

      // Convert back to percentage of container
      this.remainHeight = (this.remainHeight / containerHeight) * 100;
    }

    // Ensure remainHeight is always a number and doesn't exceed maxHeightPercentage
    this.remainHeight = Math.min(
      Number(this.remainHeight) || maxHeightPercentage,
      maxHeightPercentage
    );
    this.requestUpdate();
  }

  // Add willUpdate lifecycle method to handle hass changes
  willUpdate(changedProperties) {
    if (changedProperties.has("hass")) {
      // Skip the update if dialog is open to prevent unwanted re-renders
      if (!this._dialogOpen) {
        this.updateFromHass();
      }
    }
  }

  // New method to handle state updates
  private updateFromHass() {
    if (!this.hass || !this.entity_id) return;
    console.log("updateFromHass");

    const newActive =
      this.hass.states[this.entity_id]?.attributes.active ||
      this.hass.states[this.entity_id]?.attributes.in_use
        ? true
        : false;

    // Only update if the active state has changed
    if (this.active !== newActive) {
      this.active = newActive;
      // Only recalculate heights if dialog is not open
      if (!this._dialogOpen) {
        this.calculateHeights();
      }
    }
  }
}
