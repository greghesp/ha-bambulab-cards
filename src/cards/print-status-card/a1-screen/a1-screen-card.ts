import * as helpers from "../../../utils/helpers";
import { customElement, property } from "lit/decorators.js";
import { html, LitElement, nothing, svg } from "lit";
import styles from "./a1-screen-styles";
import { hassContext, entitiesContext } from "../../../utils/context";
import { consume } from "@lit/context";

@customElement("a1-screen-card")
export class A1ScreenCard extends LitElement {
  @property() public coverImage;

  @consume({ context: hassContext, subscribe: true })
  private _hass;

  @consume({ context: entitiesContext, subscribe: true })
  private _entityList;

  static styles = styles;

  firstUpdated(changedProperties): void {
    super.firstUpdated(changedProperties);
    this.observeCardHeight();
  }

  observeCardHeight() {
    const card = this.shadowRoot!.querySelector("ha-card")!;
    const resizeObserver = new ResizeObserver(() => {
      this.updateCondensedMode(card);
    });
    resizeObserver.observe(card);
  }

  updateCondensedMode(card) {
    if (card.offsetWidth < 400) {
      card.classList.add("condensed-mode");
    } else {
      card.classList.remove("condensed-mode");
    }
  }

  #clickEntity(key: string) {
    helpers.showEntityMoreInfo(this, this._entityList[key]);
  }

  #calculateProgress() {
    const currentLayer = helpers.getEntityState(this._hass, this._entityList["current_layer"]);
    const totalLayers = helpers.getEntityState(this._hass, this._entityList["total_layers"]);
    const percentage = Math.round((currentLayer / totalLayers) * 100);
    return `${percentage}%`;
  }

  render() {
    console.log("a1 screen entities", this._entityList);
    return html`
      <ha-card class="ha-bambulab-ssc">
        <div class="ha-bambulab-ssc-screen-container">
          <div class="ha-bambulab-ssc-status-and-controls">
            <div class="ha-bambulab-ssc-status-content">
              <div class="ha-bambulab-ssc-status-icon">
                <img src="${this.coverImage}" alt="Cover Image" />
              </div>
              <div class="ha-bambulab-ssc-status-info">
                <div class="ha-bambulab-ssc-status-time">
                  ~
                  ${helpers.getLocalizedEntityState(this._hass, this._entityList["remaining_time"])}
                </div>
                <div class="ha-bambulab-ssc-progress-container">
                  <div class="ha-bambulab-ssc-progress-bar">
                    <div
                      class="ha-bambulab-ssc-progress"
                      style="width: ${this.#calculateProgress()}"
                    ></div>
                  </div>
                  <div class="ha-bambulab-ssc-progress-text">
                    ${helpers.getEntityState(this._hass, this._entityList["current_layer"])}/
                    ${helpers.getEntityState(this._hass, this._entityList["total_layers"])}
                  </div>
                </div>
              </div>
            </div>

            <div class="ha-bambulab-ssc-control-buttons">
              <button class="ha-bambulab-ssc-control-button">
                <ha-icon icon="mdi:lightbulb"></ha-icon>
              </button>
              <button class="ha-bambulab-ssc-control-button ">
                <ha-icon icon="mdi:debug-step-over"></ha-icon>
              </button>
              <button class="ha-bambulab-ssc-control-button">
                <ha-icon icon="mdi:pause"></ha-icon>
              </button>
              <button class="ha-bambulab-ssc-control-button warning">
                <ha-icon icon="mdi:stop"></ha-icon>
              </button>
            </div>
          </div>

          <div class="ha-bambulab-ssc-sensors">
            <div class="sensor" @click="${() => this.#clickEntity("target_nozzle_temperature")}">
              <span class="icon-and-target">
                <ha-icon icon="mdi:printer-3d-nozzle-heat-outline"></ha-icon>
                <span class="sensor-target-value">
                  ${helpers.getFormattedEntityState(
                    this._hass,
                    this._entityList["target_nozzle_temp"].entity_id
                  )}</span
                >
              </span>
              <span class="sensor-value">
                ${helpers.getFormattedEntityState(
                  this._hass,
                  this._entityList["nozzle_temp"].entity_id
                )}</span
              >
            </div>
            <div class="sensor" @click="${() => this.#clickEntity("target_bed_temperature")}">
              <span class="icon-and-target">
                <ha-icon icon="mdi:radiator"></ha-icon>
                <span class="sensor-target-value"
                  >${helpers.getFormattedEntityState(
                    this._hass,
                    this._entityList["target_bed_temp"].entity_id
                  )}</span
                >
              </span>
              <span class="sensor-value"
                >${helpers.getFormattedEntityState(
                  this._hass,
                  this._entityList["bed_temp"].entity_id
                )}</span
              >
            </div>
            <div class="sensor" @click="${() => this.#clickEntity("printing_speed")}">
              <ha-icon icon="mdi:speedometer"></ha-icon>
              <span class="sensor-value"
                >${helpers.getEntityAttribute(
                  this._hass,
                  this._entityList["speed_profile"].entity_id,
                  "modifier"
                )}%</span
              >
            </div>
            <div class="sensor" @click="${() => this.#clickEntity("aux_fan")}">
              <ha-icon icon="mdi:fan"></ha-icon>
              <span class="sensor-value"
                >${helpers.getEntityAttribute(
                  this._hass,
                  this._entityList["aux_fan"].entity_id,
                  "percentage"
                )}%</span
              >
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }
}
