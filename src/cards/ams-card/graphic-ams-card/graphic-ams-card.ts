import { customElement, property } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import styles from "./graphic-ams-card.styles";
import AMSImage from "../../../images/ams.png";
import "../components/info-bar/info-bar";
@customElement("graphic-ams-card")
export class GraphicAmsCard extends LitElement {
  @property() public subtitle;
  @property() public showInfoBar;
  @property({ type: Object }) public entities;
  @property({ type: Object }) public states;
  @property() public customHumidity;
  @property() public customTemperature;

  static styles = styles;
  temperature() {
    if (this.customTemperature) {
      return {
        type: "custom",
        value: this.states[this.customTemperature]?.state,
        unit_of_measurement:
          this.states[this.customTemperature]?.attributes?.unit_of_measurement || "",
      };
    }
    if (this?.entities?.temperature) {
      return {
        type: "default",
        value: this.states[this.entities.temperature.entity_id]?.state,
        unit_of_measurement:
          this.states[this.entities.temperature.entity_id]?.attributes.unit_of_measurement,
      };
    }
    return nothing;
  }

  humidity() {
    if (this.customHumidity) {
      return {
        type: "custom",
        value: this.states[this.customHumidity]?.state,
      };
    }
    if (this?.entities?.humidity) {
      return {
        type: "default",
        value: this.states[this.entities.humidity.entity_id]?.state,
      };
    }
    return nothing;
  }

  render() {
    return html` <ha-card class="card">
      <div class="v-wrapper">
        ${this.showInfoBar
          ? html`<info-bar
              subtitle="${this.subtitle}"
              .humidity="${this.humidity()}"
              .temperature="${this.temperature()}"
            ></info-bar>`
          : nothing}
        <div class="ams-container">
          <img src=${AMSImage} alt="" />
          ${this.entities?.spools.map(
            (spool, i) => html`
              <div class="spool slot-${i + 1}">
                <div class="spool-info">
                  <span
                    class="spool-badge"
                    style="border: ${this.states[spool.entity_id]?.attributes.active ||
                    this.states[spool.entity_id]?.attributes.in_use
                      ? `2px solid ${this.states[spool.entity_id]?.attributes.color}`
                      : `2px solid rgba(255, 255, 255, 0)`}"
                  >
                    <ha-icon
                      icon=${this.states[spool.entity_id]?.state !== "Empty"
                        ? "mdi:printer-3d-nozzle"
                        : "mdi:tray"}
                      style="color: ${this.states[spool.entity_id]?.attributes.color};"
                    >
                    </ha-icon>
                  </span>
                </div>
                <div class="spool-info">
                  <span
                    class="spool-type"
                    style="border: ${this.states[spool.entity_id]?.attributes.active
                      ? `2px solid ${this.states[spool.entity_id]?.attributes.color}`
                      : `2px solid rgba(255, 255, 255, 0)`};"
                    >${this.states[spool.entity_id]?.attributes.type}</span
                  >
                </div>
              </div>
            `
          )}
        </div>
      </div>
    </ha-card>`;
  }
}
