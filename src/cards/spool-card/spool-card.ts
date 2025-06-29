import * as helpers from "../../utils/helpers"
import { customElement, property, state } from "lit/decorators.js";
import { registerCustomCard } from "../../utils/custom-cards";
import { SPOOL_CARD_EDITOR_NAME, SPOOL_CARD_NAME } from "./const";
import { css, html, LitElement, nothing } from "lit";
import { provide } from "@lit/context";
import "../shared-components/spool/spool";
import { styles } from "./spool-card.styles";
import { entitiesContext, hassContext } from "../../utils/context";

registerCustomCard({
  type: SPOOL_CARD_NAME,
  name: "Bambu Lab Spool Card",
  description: "Card for Spool",
});

@customElement(SPOOL_CARD_NAME)
export class SpoolCard extends LitElement {
  @state() private _config?;
  @property() public _spool;
  @property() public states;
  @property() public _spoolEntityId;
  @property() public _showType;
  @property() public _spoolAnimReflection;
  @property() public _spoolAnimWiggle;

  @provide({ context: hassContext })
  @state()
  private _hass?;
  private _tray: Number = 1;

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
    this._tray = config.tray ?? 1;
    this._showType = config.show_type;
    this._spoolAnimReflection = (config.spool_anim_reflection == undefined) ? true : config.spool_anim_reflection;
    this._spoolAnimWiggle = (config.spool_anim_wiggle == undefined) ? true : config.spool_anim_wiggle;
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
          .key="${this._spoolEntityId}"
          .entity_id="${this._spoolEntityId}"
          .tag_uid=${0} // Force it to be 'unknown' to not show the remaining percentage
          .show_type=${this._showType}
          .spoolAnimReflection=${this._spoolAnimReflection}
          .spoolAnimWiggle=${this._spoolAnimWiggle}
        ></ha-bambulab-spool>
      </ha-card>
    `;
  }

  private getSpool() {
    const entities = helpers.getBambuDeviceEntities(
      this._hass,
      this._spool,
      [
        'external_spool',
        'tray_1',
        'tray_2',
        'tray_3',
        'tray_4'
      ]);
    if (entities['external_spool']?.entity_id) {
      this._spoolEntityId = entities['external_spool'].entity_id;
    } else {
      const tray_id = `tray_${this._tray}`;
      if (entities[tray_id]?.entity_id) {
        this._spoolEntityId = entities[tray_id].entity_id;
      } else if (entities['tray_1']?.entity_id) {
        this._spoolEntityId = entities['tray_1'].entity_id;
      }
    }
  }
}
