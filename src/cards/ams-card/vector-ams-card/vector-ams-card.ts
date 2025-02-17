import { customElement, property, state } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import styles from "./vector-ams-card.styles";
import "../components/info-bar/info-bar";
import { deviceEntitesContext, hassContext } from "../../../utils/context";
import { consume } from "@lit/context";

@customElement("vector-ams-card")
export class VectorAmsCard extends LitElement {
  @consume({ context: deviceEntitesContext, subscribe: true })
  private _entities;

  @property() public subtitle;
  @property() public showInfoBar;
  @property() public showType;
  @property() public customHumidity;
  @property() public customTemperature;

  static styles = styles;

  render() {
    return html`
      <ha-card class="ha-bambulab-vector-ams-card">
        <div class="v-wrapper">
          <info-bar></info-bar>
          <div class="v-ams-container">
            ${this._entities?.spools.map(
              (spool: { entity_id: string | number }) => html`
                <ha-bambulab-spool
                  style="padding: 0px 5px"
                  .entity_id="${spool.entity_id}"
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
