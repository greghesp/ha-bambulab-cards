import * as helpers from "../../../utils/helpers"
import { customElement, property } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import styles from "./graphic-ams-card.styles";
import AMSImage from "../../../images/ams.png";
import "../components/info-bar/info-bar";
import "../../shared-components/ams-popup/ams-popup";
import { entitiesContext, hassContext } from "../../../utils/context";
import { consume } from "@lit/context";

@customElement("graphic-ams-card")
export class GraphicAmsCard extends LitElement {
  @consume({ context: hassContext, subscribe: true })
  private hass; 
  @consume({ context: entitiesContext, subscribe: true })
  private _entities;

  static styles = styles;

  render() {
    return html` <ha-card class="card">
      <div class="v-wrapper">
        <info-bar></info-bar>
        <div class="ams-container">
          <img src=${AMSImage} alt="" />
            ${this._entities?.spools.map(
              (spool, i) => html`
                <ams-popup .entity_id=${spool.entity_id}>
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
                </ams-popup>
              `
            )}
        </div>
      </div>
    </ha-card>`;
  }
}
