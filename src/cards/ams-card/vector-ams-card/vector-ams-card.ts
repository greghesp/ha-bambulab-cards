import { customElement, property, state } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import styles from "./vector-ams-card.styles";
import "../components/info-bar/info-bar";
import { deviceEntitesContext, hassContext, infoBarContext } from "../../../utils/context";
import { consume } from "@lit/context";

@customElement("vector-ams-card")
export class VectorAmsCard extends LitElement {
  @consume({ context: deviceEntitesContext, subscribe: true })
  private _entities;

  @consume({ context: hassContext, subscribe: true })
  private hass;

  @property() public subtitle;
  @property() public showInfoBar;
  @property() public showType;
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
        value: this.hass.states[this.customHumidity]?.state,
      };
    }
    if (this?._entities?.humidity) {
      return {
        type: "default",
        value: this.hass.states[this._entities.humidity.entity_id]?.state,
      };
    }
    return nothing;
  }

  isActive(attributes) {
    if (attributes?.active || attributes?.in_use) return true;
    return false;
  }

  remainingModifier(remain) {
    {
      if (this._entities.type == "AMS Lite") return 100;
      return remain;
    }
  }

  render() {
    return html`
      <ha-card class="ha-bambulab-vector-ams-card">
        <div class="v-wrapper">
          <info-bar
            subtitle="${this.subtitle}"
            .humidity="${this.humidity()}"
            .temperature="${this.temperature()}"
          ></info-bar>
          <div class="v-ams-container">
            ${this._entities?.spools.map(
              (spool: { entity_id: string | number }) => html`
                <ha-bambulab-spool
                  style="padding: 0px 5px"
                  ?active="${this.isActive(this.hass.states[spool.entity_id]?.attributes)}"
                  .color="${this.hass.states[spool.entity_id]?.attributes.color}"
                  .name="${this.hass.states[spool.entity_id]?.attributes.name}"
                  .tag_uid="${this.hass.states[spool.entity_id]?.attributes.tag_uid}"
                  .remaining="${this.remainingModifier(
                    this.hass.states[spool.entity_id]?.attributes.remain
                  )}"
                  .show_type=${this.showType}
                  .state=${this.hass.states[spool.entity_id]}
                ></ha-bambulab-spool>
              `
            )}
          </div>
        </div>
      </ha-card>
    `;
  }
}
