import { customElement, state, property } from "lit/decorators.js";
import { html, LitElement, nothing, PropertyValues } from "lit";
import styles from "./card.styles";

import { registerCustomCard } from "../../utils/custom-cards";
import { PRINT_STATUS_CARD_EDITOR_NAME, PRINT_STATUS_CARD_NAME } from "./const";

import P1PONIMAGE  from "../../images/P1P_on.png";
import P1POFFIMAGE from "../../images/P1P_off.png";
import P1SONIMAGE  from "../../images/P1S_on.png";
import P1SOFFIMAGE from "../../images/P1S_off.png";
import X1CONIMAGE  from "../../images/X1C_on.png";
import X1COFFIMAGE from "../../images/X1C_off.png";

registerCustomCard({
  type: PRINT_STATUS_CARD_NAME,
  name: "Bambu Lab Print Status Card",
  description: "Graphical status card for Bambu Lab Printers",
});

interface Entity {
  entity_id: string;
  device_id: string;
  labels: any[];
  translation_key: string;
  platform: string;
  name: string;
}

interface PrintableObject {
  name: string;
  skipped: boolean;
  to_skip: boolean;
}

@customElement(PRINT_STATUS_CARD_NAME)
export class PrintControlCard extends LitElement {
  
  static styles = styles;

  // private property
  _hass;

  @state() private _states;
  @state() private _device_id: any;
  
  private _entityList: { [key: string]: Entity }

  constructor() {
    super()
    this._entityList = {}
  }

  public static async getConfigElement() {
    await import("./print-status-card-editor");
    return document.createElement(PRINT_STATUS_CARD_EDITOR_NAME);
  }

  // static getStubConfig() {
  //   return { entity: "sun.sun" };
  // }

  setConfig(config) {
    this._device_id = config.printer;

    if (!config.printer) {
      throw new Error("You need to select a Printer");
    }

    if (this._hass) {
      this.hass = this._hass;
    }
  }

  set hass(hass) {
    if (hass) {
      this._hass = hass;
      this._states = hass.states;
      this._asyncFilterBambuDevices();
    }
  }

  private _isEntityUnavailable(entity: Entity): boolean {
    return this._states[entity?.entity_id]?.state == 'unavailable';
  }

  updated(changedProperties) {
    super.updated(changedProperties);
  }

  render() {
    return html`
      <ha-card class="card">
        <div class="control-container">
          <img id="printer" src="${this.getPrinterImage()}" />
          <text>Placeholder text</text>
        </div>
      </ha-card>
    `;
  }

  private getPrinterImage() {
    return X1CONIMAGE;
  }

  private async _getEntity(entity_id) {
    return await this._hass.callWS({
      type: "config/entity_registry/get",
      entity_id: entity_id,
    });
  }

  private async _asyncFilterBambuDevices() {
    const result: { [key: string]: Entity } = {}
    // Loop through all hass entities, and find those that belong to the selected device
    for (let key in this._hass.entities) {
      const value = this._hass.entities[key];
      if (value.device_id === this._device_id) {
        const r = await this._getEntity(value.entity_id);
      }
    }

    this._entityList = result;
  }
}
