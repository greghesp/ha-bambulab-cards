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
    const speed = this._hass.states[this._entityList["speed_profile"].entity_id];
    return speed.attributes["modifier"];
  }

  #formattedState(key: string) {
    let formattedString = this._hass.formatEntityState(
      this._hass.states[this._entityList[key].entity_id]
    );
    return formattedString.replace(/\s+/g, ""); // Strip space before temperature symbol to save space.
  }

  #clickEntity(key: string) {
    helpers.showEntityMoreInfo(this, this._entityList[key]);
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
                <div class="ha-bambulab-ssc-status-time">~4h22m</div>
                <div class="ha-bambulab-ssc-progress-container">
                  <div class="ha-bambulab-ssc-progress-bar">
                    <div class="ha-bambulab-ssc-progress" style="width: 50%"></div>
                  </div>
                  <div class="ha-bambulab-ssc-progress-text">282/600</div>
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
            <div class="temp-item" @click="${() => this.#clickEntity("target_nozzle_temperature")}">
              <span class="icon-and-target">
                <span>
                  <ha-icon icon="mdi:printer-3d-nozzle-heat-outline"></ha-icon>
                  <span class="temp-target">${this.#formattedState("target_nozzle_temp")}</span>
                </span>
              </span>
              <span class="temp-value">${this.#formattedState("nozzle_temp")}</span>
            </div>
            <div class="temp-item" @click="${() => this.#clickEntity("target_bed_temperature")}">
              <span class="icon-and-target">
                <span>
                  <ha-icon icon="mdi:radiator"></ha-icon>
                  <span class="temp-target">${this.#formattedState("target_bed_temp")}</span>
                </span>
              </span>
              <span class="temp-value">${this.#formattedState("bed_temp")}</span>
            </div>

            <div class="temp-item" @click="${() => this.#clickEntity("printing_speed")}">
              <span class="icon-and-target">
                <span>
                  <ha-icon icon="mdi:speedometer"></ha-icon>
                </span>
              </span>
              <span class="temp-value">${this.#getPrintSpeed()}%</span>
            </div>

            <div class="temp-item" @click="${() => this.#clickEntity("aux_fan")}">
              <span class="icon-and-target">
                <span>
                  <ha-icon icon="mdi:fan"></ha-icon>
                </span>
              </span>
              <span class="temp-value">${this.#fanPercentage("aux_fan")}%</span>
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }
}
