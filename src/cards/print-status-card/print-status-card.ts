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
  // Home assistant state references that are only used in changedProperties
  //@state() private _entities: any[];
  //@state() private _lightbulb: any;

  private _entityList: { [key: string]: Entity }
  private _entityUX: { [key: string]: EntityUX }

  private X1CEntityUX: { [key: string]: EntityUX } = {
    stage:                { x: 33, y:9,  width:100, height:60 },  // sensor
    hms:                  { x: 90, y:10, width:20,  height:20 },  // binary_sensor
    chamber_light:        { x: 20, y:25, width:20,  height:20 },  // light
    chamber_fan_speed:    { x: 80, y:25, width:20,  height:20 },  // fan
    nozzle_temp:          { x: 50, y:31, width:25,  height:20 },  // sensor
    chamber_temp:         { x: 80, y:32, width:20,  height:20 },  // sensor
    aux_fan_speed:        { x: 20, y:52, width:20,  height:20 },  // fan
    cover_image:          { x: 50, y:53, width:150, height:150 }, // image
    bed_temp:             { x: 50, y:75, width:25,  height:20 },  // sensor
    print_progress:       { x: 50, y:85, width:25,  height:20 },  // sensor
    remaining_time:       { x: 50, y:92, width:100, height:20 },  // sensor
  };
  
  constructor() {
    super();
    this._entityList = {};
    this._entityUX = this.X1CEntityUX;
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
    // This will be called repetitively since the states are constantly changing.
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
    //console.log(changedProperties)
    this._createEntityElements();
  }

  render() {
    return html`
      <ha-card class="card">
        <div class="control-container">
          <img id="printer" src="${this._getPrinterImage()}" />
          <div id="container"></div>
        </div>
      </ha-card>
    `;
  }

  firstUpdated() {
      this._asyncFilterBambuDevices(Object.keys(this._entityUX)).then(
        result => {
          this._entityList = result;
          // Object.keys(result).forEach((key) => {
          //   this._entities.push(this._states[result[key].entity_id]);
          // });
          //this._lightbulb = this._states[result['chamber_light'].entity_id].state;
          //console.log(this._lightbulb)
          this._createEntityElements();
        })
  }

  private _getPrinterImage() {
    const lightOn = this._getEntityState('chamber_light') == 'on'
    if (lightOn) {
      return X1CONIMAGE;
    }
    else {
      return X1COFFIMAGE;
    }
  }

  private _createEntityElements() {
    const container = this.shadowRoot?.getElementById('container')!;
    const backgroundImage = this.shadowRoot?.getElementById('printer') as HTMLImageElement;

    if (backgroundImage.complete) {
        this._addElements(container, backgroundImage);
    } else {
        backgroundImage.onload = () => {
            this._addElements(container, backgroundImage);
        };
    }
  }

  private _addElements(container: HTMLElement, backgroundImage: HTMLImageElement) {
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
        const style = `left:${left}px; top:${top}px; width:${e.width}px; height:${e.height}px;`
  
        // Build the HTML string for each element
        let elementHTML = ""
        let text = this._getEntityState(key);
        switch (key) {
          case 'cover_image':
            elementHTML = `<img class="entity" id="${key}" style="${style}" src="${this._getImageUrl()}" alt="Cover Image" />`;
            break;
          case 'chamber_light':
            elementHTML = `<ha-icon class="entity" id="${key}" icon="mdi:lightbulb-outline" style="${style} color: ${text=='on'?'#ff0':'#fff'};"></ha-icon>`;
            break;
          default:
            if (key.includes('fan') || key.includes('print_progress')) {
              text += '%'
            }
            else if (key.includes('temp')) {
              // FIXME - Check if display for sensor is configured as C or F
              const temp = Math.round((Number(text)-32)/1.8);
              text = `${temp}&deg`
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
