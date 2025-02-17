import { customElement, property, state } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import styles from "./graphic-ams-card.styles";
import AMSImage from "../../../images/ams.png";
import "../components/info-bar/info-bar";
import { deviceEntitesContext, hassContext } from "../../../utils/context";
import { consume, provide } from "@lit/context";

@customElement("graphic-ams-card")
export class GraphicAmsCard extends LitElement {
  @consume({ context: deviceEntitesContext, subscribe: true })
  private _entities;

  @consume({ context: hassContext, subscribe: true })
  @state()
  private _hass;

  static styles = styles;

  render() {
    console.log("graphic ams card", this._hass);
    return html` <ha-card class="card">
      <div class="v-wrapper">
        <info-bar></info-bar>
        <div class="ams-container">
          <img src=${AMSImage} alt="" />
          ${this._entities?.spools.map(
            (spool, i) => html`
              <div class="spool slot-${i + 1}">
                <div class="spool-info">
                  <span
                    class="spool-badge"
                    style="border: ${this._hass.states[spool.entity_id]?.attributes.active ||
                    this._hass.states[spool.entity_id]?.attributes.in_use
                      ? `2px solid ${this._hass.states[spool.entity_id]?.attributes.color}`
                      : `2px solid rgba(255, 255, 255, 0)`}"
                  >
                    <ha-icon
                      icon=${this._hass.states[spool.entity_id]?.state !== "Empty"
                        ? "mdi:printer-3d-nozzle"
                        : "mdi:tray"}
                      style="color: ${this._hass.states[spool.entity_id]?.attributes.color};"
                    >
                    </ha-icon>
                  </span>
                </div>
                <div class="spool-info">
                  <span
                    class="spool-type"
                    style="border: ${this._hass.states[spool.entity_id]?.attributes.active
                      ? `2px solid ${this._hass.states[spool.entity_id]?.attributes.color}`
                      : `2px solid rgba(255, 255, 255, 0)`};"
                    >${this._hass.states[spool.entity_id]?.attributes.type}</span
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
