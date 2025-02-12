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

interface EntityUX {
  x: number;
  y: number;
  width: number;
  height: number;
}

@customElement(PRINT_STATUS_CARD_NAME)
export class PrintControlCard extends LitElement {
  
  static styles = styles;

  // private property
  _hass;

  @state() private _states;
  @state() private _device_id: any;
  
  //private _entities: string[]
  private _entityList: { [key: string]: Entity }
  private _entityUX: { [key: string]: EntityUX }

  constructor() {
    super();
    this._entityList = {};
    this._entityUX = {
      chamber_light:        { x: 10, y:10, width:20, height:20 }, // light
      hms_errors:           { x: 90, y:10, width:20, height:20 }, // binary_sensor
      cover_image:          { x: 50, y:50, width:100, height:100 }, // image
      nozzle_temperature:   { x: 50, y:10, width:20, height:20 }, // sensor
      current_stage:        { x: 20, y:20, width:20, height:20 }, // sensor
      bed_temperature:      { x: 50, y:80, width:20, height:20 }, // sensor
      chamber_temperature:  { x: 80, y:20, width:20, height:20 }, // sensor
      chamber_fan:          { x: 80, y:40, width:20, height:20 }, // fan
      aux_fan:              { x: 20, y:50, width:20, height:20 }, // fan
      print_progress:       { x: 80, y:80, width:20, height:20 }, // sensor
      remaining_time:       { x: 80, y:90, width:20, height:20 }, // sensor
    };
  }

  public static async getConfigElement() {
    await import("./print-status-card-editor");
    return document.createElement(PRINT_STATUS_CARD_EDITOR_NAME);
  }

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
          <div id="container"></div>
        </div>
      </ha-card>
    `;
  }

  firstUpdated() {
      this.createElements();
  }

  private getPrinterImage() {
    return X1CONIMAGE;
  }

  createElements() {
    const container = this.shadowRoot?.getElementById('container')!;
    const backgroundImage = this.shadowRoot?.getElementById('printer') as HTMLImageElement;

    if (backgroundImage.complete) {
        this.addElements(container, backgroundImage);
    } else {
        backgroundImage.onload = () => {
            this.addElements(container, backgroundImage);
        };
    }
  }

  addElements(container: HTMLElement, backgroundImage: HTMLImageElement) {
    const imageWidth = backgroundImage.width;
    const imageHeight = backgroundImage.height

    for (const key in this._entityUX) {
            const entity = this._entityUX[key];
            const element = document.createElement('div');
            element.className = 'entity';
            const left = (entity.x / 100) * imageWidth;
            const top = (entity.y / 100) * imageHeight;
            element.style.left = `${left}px`;
            element.style.top = `${top}px`;
            element.style.width = `${entity.width}px`;
            element.style.height = `${entity.height}px`;
            element.innerText = key; // Optional, for identification
            container.appendChild(element);
      }
  }

  private async _getEntity(entity_id) {
    return await this._hass.callWS({
      type: "config/entity_registry/get",
      entity_id: entity_id,
    });
  }

  private async _asyncFilterBambuDevices() {
    const entities = this._entityUX;
    const result: { [key: string]: Entity } = {}
    // Loop through all hass entities, and find those that belong to the selected device
    const keys = Object.keys(entities);
    for (let key in this._hass.entities) {
      const value = this._hass.entities[key];
      if (value.device_id === this._device_id) {
        const r = await this._getEntity(value.entity_id);
        Object.keys(keys).forEach((key: string) => {
          if (r.unique_id.includes(key)) {
            result[key] = r
          }
        });
      }
    }

    this._entityList = result;
  }
}
