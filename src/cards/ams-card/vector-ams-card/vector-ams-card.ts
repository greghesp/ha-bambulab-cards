import * as helpers from "../../../utils/helpers"
import { customElement, property } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import styles from "./vector-ams-card.styles";
import "../components/info-bar/info-bar";

@customElement("vector-ams-card")
export class VectorAmsCard extends LitElement {
  @property() public subtitle;
  @property() public showInfoBar;
  @property({ type: Object }) public entities;
  @property() public showType;
  @property() public hass;

  static styles = styles;

  isActive(attributes) {
    if (attributes?.active || attributes?.in_use) return true;
    return false;
  }

  remainingModifier(remain) {
    {
      if (this.entities.type == "AMS Lite") return 100;
      return remain;
    }
  }

  render() {
    return html`
      <ha-card class="ha-bambulab-vector-ams-card">
        <div class="v-wrapper">
          ${this.showInfoBar
            ? html` <info-bar
                subtitle="${this.subtitle}"
                .hass="${this.hass}"
                .humidity="${this.entities.humidity}"
                .temperature="${this.entities.temperature}"
              ></info-bar>`
            : nothing}
          <div class="v-ams-container">
            ${this.entities?.spools.map(
              (spool: { entity_id: string | number }) => html`
                <ha-bambulab-spool
                  style="padding: 0px 5px"
                  .hass="${this.hass}"
                  ?active="${this.isActive(this.hass.states[spool.entity_id]?.attributes)}"
                  .color="${this.hass.states[spool.entity_id]?.attributes.color}"
                  .name="${this.hass.states[spool.entity_id]?.attributes.name}"
                  .tag_uid="${this.hass.states[spool.entity_id]?.attributes.tag_uid}"
                  .remaining="${this.remainingModifier(
                    this.hass.states[spool.entity_id]?.attributes.remain
                  )}"
                  .show_type=${this.showType}
                ></ha-bambulab-spool>
              `
            )}
          </div>
        </div>
      </ha-card>
    `;
  }
}
