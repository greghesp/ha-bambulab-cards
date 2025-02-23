import { customElement, property, state } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import styles from "./spool.styles";
import { getContrastingTextColor } from "../../../utils/helpers";
import { entitiesContext, hassContext } from "../../../utils/context";
import { consume } from "@lit/context";
import "../ams-popup/ams-popup";

@customElement("ha-bambulab-spool")
export class Spool extends LitElement {
  @consume({ context: hassContext, subscribe: true })
  private hass;

  @consume({ context: entitiesContext, subscribe: true })
  private _entities;

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

  render() {
    return html`
      <ams-popup .entity_id=${this.entity_id}>
        <div class="ha-bambulab-spool-card-container">
          <div
            class="ha-bambulab-spool-card-holder"
            style="border-color: ${this.active
              ? this.hass.states[this.entity_id]?.attributes.color
              : "#808080"}"
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
      </ams-popup>
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
