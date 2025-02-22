import * as helpers from "../../../utils/helpers"
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
  @property({ type: Object }) public hass;

  static styles = styles;

  render() {
    return html` <ha-card class="card">
      <div class="v-wrapper">
        ${this.showInfoBar
          ? html`<info-bar
              subtitle="${this.subtitle}"
              .hass="${this.hass}"
              .humidity="${this.entities.humidity}"
              .temperature="${this.entities.temperature}"
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
                    style="border: ${this.hass.states[spool.entity_id]?.attributes.active ||
                    this.hass.states[spool.entity_id]?.attributes.in_use
                      ? `2px solid ${this.hass.states[spool.entity_id]?.attributes.color}`
                      : `2px solid rgba(255, 255, 255, 0)`}"
                  >
                    <ha-icon
                      icon=${this.hass.states[spool.entity_id].state !== "Empty"
                        ? "mdi:printer-3d-nozzle"
                        : "mdi:tray"}
                      style="color: ${this.hass.states[spool.entity_id]?.attributes.color};"
                    >
                    </ha-icon>
                  </span>
                </div>
                <div class="spool-info">
                  <span
                    class="spool-type"
                    style="border: ${this.hass.states[spool.entity_id]?.attributes.active
                      ? `2px solid ${this.hass.states[spool.entity_id]?.attributes.color}`
                      : `2px solid rgba(255, 255, 255, 0)`};"
                    >${this.hass.states[spool.entity_id]?.attributes.type}</span
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
