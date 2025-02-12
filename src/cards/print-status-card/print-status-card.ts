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
      stage:                { x: 33, y:9,  width:20,  height:20 },  // sensor
      hms:                  { x: 90, y:10, width:20,  height:20 }, // binary_sensor
      chamber_light:        { x: 20, y:25, width:20,  height:20 }, // light
      chamber_temp:         { x: 80, y:25, width:20,  height:20 }, // sensor
      nozzle_temperature:   { x: 50, y:31, width:20,  height:20 }, // sensor
      chamber_fan:          { x: 80, y:32, width:20,  height:20 }, // fan
      aux_fan:              { x: 20, y:52, width:20,  height:20 }, // fan
      cover_image:          { x: 50, y:53, width:150, height:150 }, // image
      bed_temperature:      { x: 50, y:75, width:20,  height:20 }, // sensor
      print_progress:       { x: 50, y:85, width:20,  height:20 }, // sensor
      remaining_time:       { x: 50, y:92, width:20,  height:20 }, // sensor
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

    // if (this._hass) {
    //   this.hass = this._hass;
    // }
  }

  set hass(hass) {
    if (hass) {
      this._hass = hass;
      this._states = hass.states;
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
      //this.createElements();
      this._asyncFilterBambuDevices();
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
      const entity = this._entityList[key]
      if (entity != undefined) {
        const e = this._entityUX[key];
        let elementType = 'div';
        if (key == 'cover_image') {
          elementType = 'img'
        }

        const element = document.createElement(elementType);
        element.className = 'entity';
        element.id = key;
        const left = (e.x / 100) * imageWidth;
        const top = (e.y / 100) * imageHeight;
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
        element.style.width = `${e.width}px`;
        element.style.height = `${e.height}px`;
        if (key == 'cover_image') {
          let img = element as HTMLImageElement;
          img.src = this._getImageUrl();
        }
        element.innerText = this._states[entity.entity_id].state;
        container.appendChild(element);
      }
      else {
        console.log(`${key} was undefined`)
      }
    }
  }

  private _getImageUrl() {
    const img = this._entityList['cover_image'];
    if (img) {
      const timestamp = this._states[img.entity_id].state;
      const accessToken = this._states[img.entity_id].attributes?.access_token
      const imageUrl = `/api/image_proxy/${img.entity_id}?token=${accessToken}&time=${timestamp}`;
      return imageUrl;
    }
    return '';
  }

  private async _getEntity(entity_id) {
    return await this._hass.callWS({
      type: "config/entity_registry/get",
      entity_id: entity_id,
    });
  }

  private async _asyncFilterBambuDevices() {
    const entities = this._entityUX;
    const keys = Object.keys(entities);
    const result: { [key: string]: Entity } = {}
    // Loop through all hass entities, and find those that belong to the selected device
    for (let k in this._hass.entities) {
      const value = this._hass.entities[k];
      if (value.device_id === this._device_id) {
        const r = await this._getEntity(value.entity_id);
        for (const key of keys) {
          if (r.unique_id.includes(key)) {
            result[key] = r
          }
        };
      }
    }

    this._entityList = result;
    this.createElements()
  }
}
