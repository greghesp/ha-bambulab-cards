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
    if (card.offsetWidth < 350) {
      card.classList.add("condensed-mode");
    } else {
      card.classList.remove("condensed-mode");
    }
  }

  #fanPercentage(key: string) {
    const fan = this._hass.states[this._entityList[key].entity_id];
    return fan.attributes["percentage"];
  }

  #getPrintSpeed() {
    const speed = this._hass.states[this._entityList['speed_profile'].entity_id];
    return speed.attributes['modifier'];
  }

  #formattedState(key: string) {
    let formattedString = this._hass.formatEntityState(this._hass.states[this._entityList[key].entity_id]);
    return formattedString.replace(/\s+/g, ''); // Strip space before temperature symbol to save space.
  }

  #clickEntity(key: string) {
    helpers.showEntityMoreInfo(this, this._entityList[key]);
  }

  #isEntityUnavailable(entity: helpers.Entity): boolean {
    return this._hass.states[entity?.entity_id].state == 'unavailable';
  }
  
  #isPauseResumeDisabled(): boolean {
    const pauseDisabled = this.#isEntityUnavailable(this._entityList['pause']);
    const resumeDisabled = this.#isEntityUnavailable(this._entityList['resume']);
    return pauseDisabled && resumeDisabled;
  }

  #getPauseResumeIcon(): string {
    const pauseDisabled = this.#isEntityUnavailable(this._entityList['pause']);
    const resumeDisabled = this.#isEntityUnavailable(this._entityList['resume']);
    if (pauseDisabled) {
      return "mdi:play"
    } else {
      return "mdi:pause"
    }
  }

  #toggleLight() {
    const data = {
      entity_id: this._entityList["chamber_light"].entity_id,
    };
    const lightOn = helpers.getEntityState(this._hass, this._entityList["chamber_light"]) == "on";
    const service = lightOn ? "turn_off" : "turn_on";
    this._hass.callService("light", service, data);
  }

  #getLightButtonHtml() {
    const isOn = helpers.getEntityState(this._hass, this._entityList["chamber_light"]) == "on";
    return html`
      <button class="ha-bambulab-ssc-control-button ${isOn ? 'on':''}" @click="${() => this.#toggleLight()}">
        <ha-icon icon="mdi:lightbulb"></ha-icon>
      </button>
    `
  }

  #isStopButtonDisabled() {
    return this.#isEntityUnavailable(this._entityList['stop']);
  }

  #getStatusText() {
    if (this._hass.states[this._entityList['stage'].entity_id].state == 'printing') {
      const current_layer = this._hass.states[this._entityList['current_layer'].entity_id].state;
      const total_layers = this._hass.states[this._entityList['total_layers'].entity_id].state;
      return `${current_layer}/${total_layers}`;  
    } else {
      return helpers.getLocalizedEntityState(this._hass, this._entityList['stage']);
    }
  }

  #getRemainingTime() {
    if (this._hass.states[this._entityList['stage'].entity_id].state == 'printing') {
      const text = this._hass.states[this._entityList['remaining_time'].entity_id].state;
      return helpers.formatMinutes(Number(text));
    } else {
      return '';
    }
  }

  #getProgress() {
    const current_layer = this._hass.states[this._entityList['current_layer'].entity_id].state;
    const total_layers = this._hass.states[this._entityList['total_layers'].entity_id].state;
    return Number(current_layer / total_layers * 100);
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
                <div class="ha-bambulab-ssc-status-time">${this.#getRemainingTime()}</div>
                <div class="ha-bambulab-ssc-progress-container">
                  <div class="ha-bambulab-ssc-progress-bar">
                    <div class="ha-bambulab-ssc-progress" style="width: ${this.#getProgress()}%"></div>
                  </div>
                  <div class="ha-bambulab-ssc-progress-text">${this.#getStatusText()}</div>
                </div>
              </div>
            </div>

            <div class="ha-bambulab-ssc-control-buttons">
              <button class="ha-bambulab-ssc-control-button ">
                <ha-icon icon="mdi:dots-horizontal"></ha-icon>
              </button>
              ${this.#getLightButtonHtml()}
              <button class="ha-bambulab-ssc-control-button" ?disabled="${this.#isPauseResumeDisabled}">
                <ha-icon icon="${this.#getPauseResumeIcon()}"></ha-icon>
              </button>
              <button class="ha-bambulab-ssc-control-button ${this.#isStopButtonDisabled()?'':'warning'}" ?disabled="${this.#isStopButtonDisabled()}}">
                <ha-icon icon="mdi:stop"></ha-icon>
              </button>
            </div>
          
          </div>

          <div class="ha-bambulab-ssc-sensors">
            <div class="sensor" @click="${() => this.#clickEntity('target_nozzle_temperature')}">
              <span class="icon-and-target">
                <ha-icon icon="mdi:printer-3d-nozzle-heat-outline"></ha-icon>
                <span class="sensor-target-value">${this.#formattedState('target_nozzle_temp')}</span>
              </span>
              <span class="sensor-value">${this.#formattedState('nozzle_temp')}</span>
            </div>
            <div class="sensor" @click="${() => this.#clickEntity('target_bed_temperature')}">
              <span class="icon-and-target">
                <ha-icon icon="mdi:radiator"></ha-icon>
                <span class="sensor-target-value">${this.#formattedState('target_bed_temp')}</span>
              </span>
              <span class="sensor-value">${this.#formattedState('bed_temp')}</span>
            </div>
            <div class="sensor" @click="${() => this.#clickEntity('printing_speed')}">
              <ha-icon icon="mdi:speedometer"></ha-icon>
              <span class="sensor-value">${this.#getPrintSpeed()}%</span>
            </div>
            <div class="sensor" @click="${() => this.#clickEntity('aux_fan')}">
              <ha-icon icon="mdi:fan"></ha-icon>
              <span class="sensor-value">${this.#fanPercentage('aux_fan')}%</span>
            </div>
          </div>

        </div>
      </ha-card>
    `;
  }
}
