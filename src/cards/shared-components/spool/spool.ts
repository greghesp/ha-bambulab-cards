import { customElement, property } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import styles from "./spool.styles";
import { hassContext } from "../../../utils/context";
import { consume } from "@lit/context";
import "../ams-popup/ams-popup";

@customElement("ha-bambulab-spool")
export class Spool extends LitElement {
  @consume({ context: hassContext, subscribe: true })
  private hass;

  @property({ type: Boolean }) public show_type: boolean = false;
  @property({ type: Boolean }) public spool_anim_reflection: boolean = true;
  @property({ type: Boolean }) public spool_anim_wiggle: boolean = true;
  @property({ type: String })  public entity_id!: string;
  @property({ type: String })  public remaining_entity?: string;
  @property({ type: Number })  private remainHeight = 95;
  @property({ type: Boolean }) public controlBlocked: boolean = true;
  @property() private resizeObserver: ResizeObserver | null = null;
  @property({ type: Boolean }) private emptySpool: boolean = false;

  static styles = styles;

  connectedCallback() {
    super.connectedCallback();

    // Start observing the parent element for size changes
    this.resizeObserver = new ResizeObserver(() => {
      if (this.isConnected) {
        this.calculateHeights();
        this.updateLayers();
      }
    });

    const rootNode = this.getRootNode() as ShadowRoot;
    const parent = this.parentElement || (rootNode instanceof ShadowRoot ? rootNode.host : null);
    if (parent) {
      this.resizeObserver.observe(parent);
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
    // initial layers/heights after first render
    this.calculateHeights();
    this.updateLayers();
  }

  updated(changedProps: Map<string, any>) {
    // hass arrives through context, so it never shows up in changedProps. Track what the
    // fill depends on instead, so the spool level follows the value rather than only resizes.
    const key = this.heightKey();
    if (changedProps.has("entity_id") || key !== this._heightKey) {
      this._heightKey = key;
      this.calculateHeights();
      this.updateLayers();
    }
  }

  private _heightKey?: string;

  heightKey() {
    const attrs = this.hass.states[this.entity_id]?.attributes;
    const custom = this.remaining_entity ? this.hass.states[this.remaining_entity] : undefined;
    return [attrs?.remain, attrs?.empty, attrs?.tray_weight, attrs?.tag_uid,
            custom?.state, custom?.attributes?.unit_of_measurement].join("|");
  }

  render() {
    const isActive = this.hass.states[this.entity_id]?.attributes.active ||
                     this.hass.states[this.entity_id]?.attributes.in_use
    return html`
      <ams-popup .entity_id=${this.entity_id} .controlBlocked=${this.controlBlocked}>
        <div class="ha-bambulab-spool-card-container">
          <div
            class="ha-bambulab-spool-card-holder ${isActive ? "active" : ""}
            style=""
          >
            <div class="ha-bambulab-spool-container">
              <div class="ha-bambulab-spool-side"></div>
              <div
                class="string-roll-container"
                style="${this.hass.states[this.entity_id]?.attributes.active &&
                this.spool_anim_wiggle
                  ? "animation: wiggle 3s linear infinite"
                  : ""}"
              >
                <div
                  class="${this.emptySpool ? "v-solid-roll":"v-string-roll"}"
                  id="v-string-roll"
                  style=${this.emptySpool ? 
                    `height: ${this.remainHeight.toFixed(2)}%` :
                    `background: ${this.hass.states[this.entity_id]?.attributes.color}; height: ${this.remainHeight.toFixed(2)}%`}
                >
                  ${this.hass.states[this.entity_id]?.attributes.active &&
                  this.spool_anim_reflection
                    ? html`<div class="v-reflection"></div>`
                    : nothing}
                  ${this.remainingLabel() !== nothing
                    ? html`
                        <div class="remaining-percent">
                          <p>${this.remainingLabel()}</p>
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

  // A custom remaining sensor (e.g. grams from Spoolman or Bambuddy) wins while it
  // has a numeric state; otherwise fall back to the tray's RFID remain percentage.
  // An empty tray never shows one: those sensors follow the spool, not the slot, so
  // they keep reporting after it's pulled.
  remainingLabel() {
    if (this.hass.states[this.entity_id]?.attributes?.empty) return nothing;
    const custom = this.customRemaining();
    if (custom) {
      const value = custom.unit === "kg" ? custom.value.toFixed(1) : Math.round(custom.value);
      return `${value}${custom.unit ? ` ${custom.unit}` : ""}`;
    }
    const remain = this.hass.states[this.entity_id]?.attributes?.remain;
    return remain > 0 ? `${remain}%` : nothing;
  }

  customRemaining(): { value: number; unit?: string } | undefined {
    const custom = this.remaining_entity ? this.hass.states[this.remaining_entity] : undefined;
    const value = Number(custom?.state);
    if (!custom || custom.state === "" || !Number.isFinite(value)) return undefined;
    return { value, unit: custom.attributes?.unit_of_measurement };
  }

  // The custom sensor as a percentage of the spool, for the fill height. A weight is
  // measured against the tray's tray_weight, which only RFID spools report, so other
  // spools are taken to be 1 kg. Any other unit leaves the height to remain.
  customRemainingPercent(): number | undefined {
    const custom = this.customRemaining();
    if (!custom) return undefined;
    if (custom.unit === "%") return custom.value;
    const grams = custom.unit === "g" ? custom.value
                : custom.unit === "kg" ? custom.value * 1000
                : undefined;
    if (grams === undefined) return undefined;
    const capacity = Number(this.hass.states[this.entity_id]?.attributes?.tray_weight) || 1000;
    return (grams / capacity) * 100;
  }

  updateLayers() {
    // Query the #string-roll element inside this component's shadow DOM
    const stringRoll = (this.renderRoot as ShadowRoot).getElementById("v-string-roll");
    if (!stringRoll) return;

    // Clear previous layers
    const previousLayers = this.renderRoot.querySelectorAll(".v-string-layer");
    previousLayers.forEach((layer) => layer.remove());

    if (this.emptySpool) return; // No layers for solid spool

    const stringWidth = 2; // matches .string-layer width in CSS
    const rollWidth = stringRoll.offsetWidth; // container width

    // Calculate how many lines fit
    const numLayers = Math.floor(rollWidth / (stringWidth * 2)); // 2 = line width + gap

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
    const maxHeightPercentage = 95;
    const minHeightPercentage = 20;

    // A custom remaining sensor, when it has a usable value, drives the fill instead of remain
    const customPercent = this.customRemainingPercent();

    // If not a Bambu Spool or remaining is less than 0
    this.emptySpool = this.hass.states[this.entity_id]?.attributes.empty;
    if (this.emptySpool) {
      this.remainHeight = 20;
    } else if (customPercent === undefined &&
               (this.isAllZeros(this.hass.states[this.entity_id]?.attributes.tag_uid) ||
                this.hass.states[this.entity_id]?.attributes?.remain < 0)) {
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
        Math.max(customPercent ?? this.hass.states[this.entity_id]?.attributes?.remain, 0),
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
}
