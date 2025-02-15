import { customElement, property, state } from "lit/decorators.js";
import { registerCustomCard } from "../../utils/custom-cards";
import { SPOOL_CARD_EDITOR_NAME, SPOOL_CARD_NAME } from "./const";
import { css, html, LitElement, nothing } from "lit";
import "../shared-components/spool/spool";
import { styles } from "./spool-card.styles";

registerCustomCard({
  type: SPOOL_CARD_NAME,
  name: "Bambu Lab Spool Card",
  description: "Card for Spool",
});

@customElement(SPOOL_CARD_NAME)
export class SpoolCard extends LitElement {
  @state() private _config?;
  @state() private _hass: any;
  @property() public _spool;
  @property() public states;
  @property() public _spoolEntityId;
  @property() public _showType;

  public getLayoutOptions() {
    return {
      grid_rows: this._showType ? 3 : 2,
      grid_columns: 1,
      grid_min_rows: this._showType ? 3 : 2,
      grid_min_columns: 1,
    };
  }

  public static async getConfigElement() {
    await import("./spool-card-editor");
    return document.createElement(SPOOL_CARD_EDITOR_NAME);
  }

  static getStubConfig() {
    return { header: "Header Text", subtitle: "Subtitle Text", show_header: true };
  }

  static styles = styles;

  setConfig(config) {
    if (this._hass) {
      this.hass = this._hass;
    }
    this._spool = config.spool;
    this._showType = config.show_type;
  }

  set hass(hass) {
    this._hass = hass;
    this.states = hass.states;
    this.getSpool();
  }

  render() {
    return html`
      <ha-card class="card">
        <ha-bambulab-spool
          ?active="${this.states[this._spoolEntityId]?.attributes.active}"
          .color="${this.states[this._spoolEntityId]?.attributes.color}"
          .name="${this.states[this._spoolEntityId]?.attributes.name}"
          .tag_uid=${0} // Force it to be 'unknown' to not show the remaining percentage
          .show_type=${this._showType}
        ></ha-bambulab-spool>
      </ha-card>
    `;
  }

  private async getSpool() {
    let entityId = null;
    // Loop through all hass entities, and find those that belong to the selected device
    for (let key in this._hass.entities) {
      const value = this._hass.entities[key];
      if (value.device_id === this._spool) {
        entityId = value.entity_id;
      }
    }

    this._spoolEntityId = entityId;
  }
}
