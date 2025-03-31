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
    console.log(this._entityList);
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

  #state(key: string) {
    return helpers.getEntityState(this._hass, this._entityList[key]);
  }

  #formattedState(key: string) {
    return helpers.getFormattedEntityState(this._hass, this._entityList[key].entity_id);
  }

  #attribute(key: string, attribute: string) {
    return helpers.getEntityAttribute(this._hass, this._entityList[key].entity_id, attribute);
  }

  #calculateProgress() {
    const currentLayer = helpers.getEntityState(this._hass, this._entityList["current_layer"]);
    const totalLayers = helpers.getEntityState(this._hass, this._entityList["total_layers"]);
    const percentage = Math.round((currentLayer / totalLayers) * 100);
    return `${percentage}%`;
  }

  #getRemainingTime() {
    if (this._hass.states[this._entityList["stage"].entity_id].state == "printing") {
      return this.#formattedState("remaining_time");
    } else {
      return "";
    }
  }

  #isEntityUnavailable(entity: helpers.Entity): boolean {
    return this._hass.states[entity?.entity_id].state == "unavailable";
  }

  #isPauseResumeDisabled(): boolean {
    const pauseDisabled = this.#isEntityUnavailable(this._entityList["pause"]);
    const resumeDisabled = this.#isEntityUnavailable(this._entityList["resume"]);
    return pauseDisabled && resumeDisabled;
  }

  #getPauseResumeIcon(): string {
    const pauseDisabled = this.#isEntityUnavailable(this._entityList["pause"]);
    if (pauseDisabled) {
      return "mdi:play";
    } else {
      return "mdi:pause";
    }
  }

  #isStopButtonDisabled() {
    return this.#isEntityUnavailable(this._entityList["stop"]);
  }

  #getStatusText() {
    if (this._hass.states[this._entityList["stage"].entity_id].state == "printing") {
      const current_layer = this._hass.states[this._entityList["current_layer"].entity_id].state;
      const total_layers = this._hass.states[this._entityList["total_layers"].entity_id].state;
      return `${current_layer}/${total_layers}`;
    } else {
      return helpers.getLocalizedEntityState(this._hass, this._entityList["stage"]);
    }
  }

  render() {
    return html`
      <ha-card class="ha-bambulab-ssc">
        <div class="ha-bambulab-ssc-screen-container">
          <div class="ha-bambulab-ssc-status-and-controls">
            <div class="ha-bambulab-ssc-status-content">
              <div class="ha-bambulab-ssc-status-icon">
                <img src="${this.coverImage}" alt="Cover Image" />
              </div>
              <div class="ha-bambulab-ssc-status-info">
                <div class="ha-bambulab-ssc-status-time">~ ${this.#getRemainingTime()}</div>
                <div class="ha-bambulab-ssc-progress-container">
                  <div class="ha-bambulab-ssc-progress-bar">
                    <div
                      class="ha-bambulab-ssc-progress"
                      style="width: ${this.#calculateProgress()}"
                    ></div>
                  </div>
                  <div class="ha-bambulab-ssc-progress-text">${this.#getStatusText()}</div>
                </div>
              </div>
            </div>

            <div class="ha-bambulab-ssc-control-buttons">
              <button class="ha-bambulab-ssc-control-button ">
                <ha-icon icon="mdi:dots-horizontal"></ha-icon>
              </button>
              <button
                class="ha-bambulab-ssc-control-button ${this.#state("chamber_light")}"
                @click="${() => helpers.toggleLight(this._hass, this._entityList["chamber_light"])}"
              >
                <ha-icon icon="mdi:lightbulb"></ha-icon>
              </button>

              <button class="ha-bambulab-ssc-control-button ">
                <ha-icon icon="mdi:debug-step-over"></ha-icon>
              </button>
              <button
                class="ha-bambulab-ssc-control-button"
                ?disabled="${this.#isPauseResumeDisabled}"
              >
                <ha-icon icon="${this.#getPauseResumeIcon()}"></ha-icon>
              </button>
              <button
                class="ha-bambulab-ssc-control-button ${this.#isStopButtonDisabled()
                  ? ""
                  : "warning"}"
                ?disabled="${this.#isStopButtonDisabled()}}"
              >
                <ha-icon icon="mdi:stop"></ha-icon>
              </button>
            </div>
          </div>

          <div class="ha-bambulab-ssc-sensors">
            <div class="sensor" @click="${() => this.#clickEntity("target_nozzle_temperature")}">
              <span class="icon-and-target">
                <ha-icon icon="mdi:printer-3d-nozzle-heat-outline"></ha-icon>
                <span class="sensor-target-value">
                  ${this.#formattedState("target_nozzle_temp")}</span
                >
              </span>
              <span class="sensor-value"> ${this.#formattedState("nozzle_temp")} </span>
            </div>
            <div class="sensor" @click="${() => this.#clickEntity("target_bed_temperature")}">
              <span class="icon-and-target">
                <ha-icon icon="mdi:radiator"></ha-icon>
                <span class="sensor-target-value">${this.#formattedState("target_bed_temp")}</span>
              </span>
              <span class="sensor-value">${this.#formattedState("bed_temp")}</span>
            </div>
            <div class="sensor" @click="${() => this.#clickEntity("printing_speed")}">
              <ha-icon icon="mdi:speedometer"></ha-icon>
              <span class="sensor-value">${this.#attribute("speed_profile", "modifier")}%</span>
            </div>
            <div class="sensor" @click="${() => this.#clickEntity("aux_fan")}">
              <ha-icon icon="mdi:fan"></ha-icon>
              <span class="sensor-value">${this.#attribute("aux_fan", "percentage")}%</span>
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }
}
