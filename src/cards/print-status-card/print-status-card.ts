import * as helpers from "../../utils/helpers"

import { customElement, state, property } from "lit/decorators.js";
import { html, LitElement, nothing, PropertyValues } from "lit";
import styles from "./card.styles";

import { INTEGRATION_DOMAIN, MANUFACTURER, PRINTER_MODELS } from "../../const";
import { PRINT_STATUS_CARD_EDITOR_NAME, PRINT_STATUS_CARD_NAME } from "./const";
import { registerCustomCard } from "../../utils/custom-cards";

import A1_ON_IMAGE  from "../../images/A1_on.png";
import A1_OFF_IMAGE from "../../images/A1_off.png";
import A1MINI_ON_IMAGE  from "../../images/A1Mini_on.png";
import A1MINI_OFF_IMAGE from "../../images/A1Mini_off.png";
import P1P_ON_IMAGE  from "../../images/P1P_on.png";
import P1P_OFF_IMAGE from "../../images/P1P_off.png";
import P1S_ON_IMAGE  from "../../images/P1S_on.png";
import P1S_OFF_IMAGE from "../../images/P1S_off.png";
import X1C_ON_IMAGE  from "../../images/X1C_on.png";
import X1C_OFF_IMAGE from "../../images/X1C_off.png";
import X1E_ON_IMAGE  from "../../images/X1E_on.png";
import X1E_OFF_IMAGE from "../../images/X1E_off.png";

registerCustomCard({
  type: PRINT_STATUS_CARD_NAME,
  name: "Bambu Lab Print Status Card",
  description: "Graphical status card for Bambu Lab Printers",
});

interface EntityUX {
  x: number;
  y: number;
  width: number;
  height: number;
}

const _onImages: { [key: string]: any } =  {
  A1:     A1_ON_IMAGE,
  A1MINI: A1MINI_ON_IMAGE,
  P1P:    P1P_ON_IMAGE,
  P1S:    P1S_ON_IMAGE,
  X1C:    X1C_ON_IMAGE,
  X1E:    X1E_ON_IMAGE,
}

const _offImages: { [key: string]: any } =  {
  A1:     A1_OFF_IMAGE,
  A1MINI: A1MINI_OFF_IMAGE,
  P1P:    P1P_OFF_IMAGE,
  P1S:    P1S_OFF_IMAGE,
  X1C:    X1C_OFF_IMAGE,
  X1E:    X1E_OFF_IMAGE,
}

@customElement(PRINT_STATUS_CARD_NAME)
export class PrintControlCard extends LitElement {
  
  static styles = styles;

  // private property
  _hass;

  @state() private _states;
  @state() private _device_id: any;
  // Home assistant state references that are only used in changedProperties
  //@state() private _entities: any[];
  //@state() private _lightbulb: any;

  private _entityList: { [key: string]: helpers.Entity };
  private _entityUX: { [key: string]: EntityUX } | undefined;
  private _model: string;

  private A1EntityUX: { [key: string]: EntityUX } = {
//    hms:                  { x: 90, y:10, width:20,  height:20 },  // binary_sensor
    chamber_light:        { x: 46, y:30,   width:20,  height:20 },  // light
    nozzle_temp:          { x: 46, y:42,   width:25,  height:20 },  // sensor
    cover_image:          { x: 46, y:60,   width:150, height:150 }, // image
    bed_temp:             { x: 46, y:81,   width:25,  height:20 },  // sensor
    print_progress:       { x: 85, y:81,   width:25,  height:20 },  // sensor
    remaining_time:       { x: 85, y:85,   width:100, height:20 },  // sensor
    stage:                { x: 46, y:92.5, width:300, height:20 },  // sensor
  };

  private A1MiniEntityUX: { [key: string]: EntityUX } = {
//    hms:                  { x: 90, y:10, width:20,  height:20 },  // binary_sensor
    chamber_light:        { x: 88, y:29, width:20,  height:20 },  // light
    nozzle_temp:          { x: 41, y:38, width:25,  height:20 },  // sensor
    cover_image:          { x: 41, y:58, width:150, height:150 }, // image
    bed_temp:             { x: 41, y:80, width:25,  height:20 },  // sensor
    print_progress:       { x: 74, y:89, width:25,  height:20 },  // sensor
    remaining_time:       { x: 74, y:93, width:100, height:20 },  // sensor
    stage:                { x: 41, y:94, width:300, height:20 },  // sensor
  };


  private P1PEntityUX: { [key: string]: EntityUX } = {
    print_progress:       { x: 23, y:9.5, width:25,  height:20 },  // sensor
    remaining_time:       { x: 59, y:10,  width:100, height:20 },  // sensor
//    hms:                  { x: 90,   y:10,  width:20,  height:20 },  // binary_sensor
    chamber_light:        { x: 10, y:24,  width:20,  height:20 },  // light
    chamber_fan_speed:    { x: 90, y:24,  width:70,  height:25 },  // fan
    nozzle_temp:          { x: 50, y:35,  width:25,  height:20 },  // sensor
    chamber_temp:         { x: 80, y:32,  width:20,  height:20 },  // sensor
    aux_fan_speed:        { x: 9,  y:60,  width:70,  height:25 },  // fan
    cover_image:          { x: 50, y:57,  width:150, height:150 }, // image
    bed_temp:             { x: 50, y:76,  width:25,  height:20 },  // sensor
    stage:                { x: 50, y:93,  width:300, height:20 },  // sensor
  };

  private P1SEntityUX: { [key: string]: EntityUX } = {
//    hms:                  { x: 90, y:10,  width:20,  height:20 },  // binary_sensor
    print_progress:       { x: 23, y:6,   width:25,  height:20 },  // sensor
    remaining_time:       { x: 59, y:6.5, width:100, height:20 },  // sensor
    chamber_light:        { x: 10, y:24,  width:20,  height:20 },  // light
    chamber_fan_speed:    { x: 90, y:24,  width:70,  height:25 },  // fan
    nozzle_temp:          { x: 50, y:35,  width:25,  height:20 },  // sensor
    chamber_temp:         { x: 80, y:32,  width:20,  height:20 },  // sensor
    aux_fan_speed:        { x: 9,  y:52,  width:70,  height:25 },  // fan
    cover_image:          { x: 50, y:53,  width:150, height:150 }, // image
    bed_temp:             { x: 50, y:72,  width:25,  height:20 },  // sensor
    stage:                { x: 50, y:91,  width:300, height:20 },  // sensor
  };

  private X1CEntityUX: { [key: string]: EntityUX } = {
//    hms:                  { x: 90, y:10, width:20,  height:20 },  // binary_sensor
    print_progress:       { x: 29, y:6,  width:25,  height:20 },  // sensor
    remaining_time:       { x: 29, y:11, width:100, height:20 },  // sensor
    chamber_light:        { x: 10, y:25, width:20,  height:20 },  // light
    chamber_fan_speed:    { x: 90, y:25, width:70,  height:25 },  // fan
    nozzle_temp:          { x: 50, y:31, width:25,  height:20 },  // sensor
    chamber_temp:         { x: 90, y:32, width:20,  height:20 },  // sensor
    aux_fan_speed:        { x: 10, y:52, width:70,  height:25 },  // fan
    cover_image:          { x: 50, y:53, width:150, height:150 }, // image
    bed_temp:             { x: 50, y:75, width:25,  height:20 },  // sensor
    stage:                { x: 50, y:93, width:300, height:20 },  // sensor
  };

  private EntityUX: { [key: string]: any } = {
    A1:     this.A1EntityUX,
    A1MINI: this.A1MiniEntityUX,
    P1P:    this.P1PEntityUX,
    P1S:    this.P1SEntityUX,
    X1:     this.X1CEntityUX,
    X1C:    this.X1CEntityUX,
    X1E:    this.X1CEntityUX,
  }
  
  constructor() {
    super();
    this._model = "";
    this._entityList = {};
    this._entityUX = undefined; // Initialized once we know what model printer it is.
    //this._entities = [];
    //this._lightbulb = "";
  }

  public static async getConfigElement() {
    await import("./print-status-card-editor");
    return document.createElement(PRINT_STATUS_CARD_EDITOR_NAME);
  }

  static getStubConfig() {
    return {
      printer: "MOCK"
    };
  }

  setConfig(config) {
    if (!config.printer) {
      throw new Error("You need to select a Printer");
    }

    this._device_id = config.printer;
  }

  set hass(hass) {
    const firstTime = hass && !this._hass;

    // This will be called repetitively since the states are constantly changing.
    if (hass) {
      this._hass = hass;
      this._states = hass.states;
    }

    if (this._device_id == 'MOCK') {
      Object.keys(this._hass.devices).forEach((key) => {
        const device = this._hass.devices[key];
        if (device.manufacturer == MANUFACTURER) {
          if (PRINTER_MODELS.includes(device.model)) {
            this._device_id = key;
          }
        }
      })
    }

    if (firstTime) {
      this._model = this._hass.devices[this._device_id].model.toUpperCase();
      if (this._model == 'A1 MINI') {
        this._model = 'A1MINI';
      }
      this._entityUX = this.EntityUX[this._model];
      this._entityList = helpers.getBambuDeviceEntities(hass, this._device_id, Object.keys(this._entityUX!));

      // We have the model and the chamber light entity - kick off the background image load asap.
      this.requestUpdate();

      // Now we create the html elements for the entities.
      this._createEntityElements();
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    //console.log(changedProperties)
    this._createEntityElements();
  }

  render() {
    return html`
      <ha-card class="card">
        <div class="control-container">
          <div id="alpha-text">Alpha</div>
          <img id="printer" src="${this._getPrinterImage()}" width="466" height="516" />
          <div id="container"></div>
        </div>
      </ha-card>
    `;
  }

  private _getPrinterImage() {
    const lightOn = helpers.getEntityState(this._hass, this._entityList['chamber_light']) == 'on'
    if (lightOn) {
      return _onImages[this._model]
    }
    else {
      return _offImages[this._model]
    }
}

  private _createEntityElements() {
    const container = this.shadowRoot?.getElementById('container')!;
    const backgroundImage = this.shadowRoot?.getElementById('printer') as HTMLImageElement;
    if ((backgroundImage == undefined) || !backgroundImage.src.startsWith("data:")) {
      // Image isn't loaded yet.
      return
    }

    if (backgroundImage.complete) {
      this._addElements(container, backgroundImage);
    } else {
      backgroundImage.onload = () => {
        this._addElements(container, backgroundImage);
      };
    }
  }

  private _addElements(container: HTMLElement, backgroundImage: HTMLImageElement) {
    if (this._entityUX == undefined)
      return;
    
    const imageWidth = backgroundImage.width;
    const imageHeight = backgroundImage.height;
  
    let htmlString = ''; // Start with an empty string to build the HTML
  
    for (const key in this._entityUX) {
      const entity = this._entityList[key];
      if (entity != undefined) {
        const e = this._entityUX[key];
  
        // Determine element type
  
        const left = (e.x / 100) * imageWidth;
        const top = (e.y / 100) * imageHeight;

        let style = `left:${left}px; top:${top}px; width:${e.width}px; height:${e.height}px;`
  
        // Build the HTML string for each element
        let elementHTML = ""
        let text = helpers.getLocalizedEntityState(this._hass, this._entityList[key]);
        switch (key) {
          case 'cover_image':
            elementHTML = `<img class="entity" id="${key}" style="${style}" src="${this._getImageUrl()}" alt="Cover Image" />`;
            break;
          case 'chamber_light':
            style += `background-color: rgba(0, 0, 0, 0.5); border-radius: ${2 + e.height/2}px; padding: 4px;`;
            elementHTML = `<ha-icon class="entity" id="${key}" icon="mdi:lightbulb-outline" style="${style} color: ${text=='on'?'#ff0':'#fff'};"></ha-icon>`;
            break;
          default:
            style += `background-color: rgba(0, 0, 0, 0.2); border-radius: ${e.height/2}px; padding: 2px;`;
            if (key.includes('fan')) {
              text = `<ha-icon icon="mdi:fan"></ha-icon>${text}%`
            } 
            else if (key == 'print_progress') {
              text += '%'
            }
            else if (key.includes('temp')) {
              const temp = Math.round(Number(text));
              text = `${temp}&deg`
            }
            else if (key == 'remaining_time') {
              text = helpers.formatMinutes(Number(text))
            }
            elementHTML = `<div class="entity" id="${key}" style="${style}">${text}</div>`;
            break;
        }
  
        htmlString += elementHTML; // Append the generated HTML to the string
      }
    }
  
    // Inject the constructed HTML string into the container
    container.innerHTML = htmlString;
  }

  private _getImageUrl() {
    const img = this._entityList['cover_image'];
    if (img) {
      const timestamp = this._states[img.entity_id]?.state;
      const accessToken = this._states[img.entity_id].attributes?.access_token
      const imageUrl = `/api/image_proxy/${img.entity_id}?token=${accessToken}&time=${timestamp}`;
      return imageUrl;
    }
    return '';
  }
}
