import { customElement, state, property } from "lit/decorators.js";
import { html, LitElement, nothing, PropertyValues } from "lit";
import styles from "./card.styles";

import { registerCustomCard } from "../../utils/custom-cards";
import { PRINT_STATUS_CARD_EDITOR_NAME, PRINT_STATUS_CARD_NAME } from "./const";
import { formatMinutes } from "../../utils/helpers"

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

  private _entityList: { [key: string]: Entity };
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

  setConfig(config) {
    this._device_id = config.printer;

    if (!config.printer) {
      throw new Error("You need to select a Printer");
    }
  }

  set hass(hass) {
    const firstTime = hass && !this._hass;

    // This will be called repetitively since the states are constantly changing.
    if (hass) {
      this._hass = hass;
      this._states = hass.states;
    }

    if (firstTime) {
      this._asyncGetDeviceInfo(this._device_id).then(
      result => {
        this._model = result['model'].toUpperCase();
        if (this._model == 'A1 MINI') {
          this._model = 'A1MINI';
        }
        this._entityUX = this.EntityUX[this._model];
        // We have the model - kick off the background image load asap.
        this.requestUpdate();
        // Now trigger the load of the entity data.
        this._asyncFilterBambuDevices(Object.keys(this._entityUX!)).then(
          result => {
            this._entityList = result;
            // Object.keys(result).forEach((key) => {
            //   this._entities.push(this._states[result[key].entity_id]);
            // });
            //this._lightbulb = this._states[result['chamber_light'].entity_id].state;
            //console.log(this._lightbulb)
            this._createEntityElements();
          })
      })
    }
  }

  private _isEntityUnavailable(entity: Entity): boolean {
    return this._states[entity?.entity_id]?.state == 'unavailable';
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
    const lightOn = this._getEntityState('chamber_light') == 'on'
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
        let text = this._getEntityState(key);
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
              text = formatMinutes(Number(text))
            }
            elementHTML = `<div class="entity" id="${key}" style="${style}">${text}</div>`;
            break;
        }
  
        htmlString += elementHTML; // Append the generated HTML to the string
      }
    }
  
    // Inject the constructed HTML string into the container
    container.innerHTML = htmlString;
  }wa

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

  private async _getEntity(entity_id) {
    return await this._hass.callWS({
      type: "config/entity_registry/get",
      entity_id: entity_id,
    });
  }

  private _getEntityState(entity: string) {
    const entityId = this._entityList[entity]?.entity_id;
    const entityState = this._states[entityId]?.state;
    if (entityId && entityState) {
      // entity.sensor.stage.state.
      let localizedString = this._hass.localize(`state.${entityId}.${entityState}`);
      // Example localization key:
      // "component.bambu_lab.entity.sensor.stage.state.idle"
      localizedString = this._hass.localize(`component.bambu_lab.entity.sensor.stage.state.${entityState}`);
      return localizedString || entityState;
    }
    else {
      return "";
    }
  }

  private async _asyncGetDeviceInfo(device_id: string): Promise<{any}> {
    // const deviceInfo = await this._hass.connection.sendMessage({
    //   type: "device_registry/get",
    //   device_id: device_id,
    // });
    const devices = await this._hass.callWS({
      type: "config/device_registry/list",
    });
    const deviceInfo = devices.find((device) => device.id === device_id);
    return deviceInfo;
  }

  private async _asyncFilterBambuDevices(entities: string[]): Promise<{ [key: string]: Entity }> {
    const result: { [key: string]: Entity } = {}
    // Loop through all hass entities, and find those that belong to the selected device
    for (let k in this._hass.entities) {
      const value = this._hass.entities[k];
      if (value.device_id === this._device_id) {
        const r = await this._getEntity(value.entity_id);
        for (const key of entities) {
          const regex = new RegExp(`^[^_]+_${key}$`);
          if (regex.test(r.unique_id)) {
            result[key] = r
          }
        };
      }
    }
    return result;
  }
}
