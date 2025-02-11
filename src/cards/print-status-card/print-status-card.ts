import { customElement, state, property } from "lit/decorators.js";
import { html, LitElement, nothing, PropertyValues } from "lit";
import styles from "./card.styles";

import { registerCustomCard } from "../../utils/custom-cards";
import { PRINT_STATUS_CARD_EDITOR_NAME, PRINT_STATUS_CARD_NAME } from "./const";

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

interface Result {
  pickImage: Entity | null;
  skippedObjects: Entity | null;
  printableObjects: Entity | null;
  pause: Entity | null;
  resume: Entity | null;
  stop: Entity | null;
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
  @state() private _entities: any;

  constructor() {
    super()
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
          <image src="" />
          <text>Placeholder text</text>
        </div>
      </ha-card>
    `;
  }

  private async _getEntity(entity_id) {
    return await this._hass.callWS({
      type: "config/entity_registry/get",
      entity_id: entity_id,
    });
  }

  private async _asyncFilterBambuDevices() {
    const result: Result = {
      pickImage: null,
      skippedObjects: null,
      printableObjects: null,
      pause: null,
      resume: null,
      stop: null,
    };
    // Loop through all hass entities, and find those that belong to the selected device
    for (let key in this._hass.entities) {
      const value = this._hass.entities[key];
      if (value.device_id === this._device_id) {
        const r = await this._getEntity(value.entity_id);
        if (r.unique_id.includes("pick_image")) {
          result.pickImage = value;
        }
        else if (r.unique_id.includes("skipped_objects")) {
          result.skippedObjects = value;
        }
        else if (r.unique_id.includes("printable_objects")) {
          result.printableObjects = value;
        }
        else if (r.unique_id.includes("pause")) {
          result.pause = value
        }
        else if (r.unique_id.includes("resume")) {
          result.resume = value
        }
        else if (r.unique_id.includes("stop")) {
          result.stop = value
        }
      }
    }

    this._entities = result;
  }
}
