import * as helpers from "../../../utils/helpers";
import { customElement, property } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import styles from "./vector-ams-card.styles";
import "../components/info-bar/info-bar";
import { entitiesContext } from "../../../utils/context";
import { consume } from "@lit/context";

@customElement("vector-ams-card")
export class VectorAmsCard extends LitElement {
  @property() public showType;

  @consume({ context: entitiesContext, subscribe: true })
  private _entities;

  static styles = styles;

  render() {
    return html`
      <ha-card class="ha-bambulab-vector-ams-card">
        <div class="v-wrapper">
          <info-bar></info-bar>
          <div class="v-ams-container">
            ${this._entities?.spools?.map(
              (spool: { entity_id: string }) => html`
                <ha-bambulab-spool
                  .key="${spool.entity_id}"
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
