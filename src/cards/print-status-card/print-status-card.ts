import * as helpers from "../../utils/helpers"

import { customElement, state, property, query } from "lit/decorators.js";
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
  click_target?: string;
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
  private _coverImageState: any;

  private _entityList: { [key: string]: helpers.Entity };
  private _entityUX: { [key: string]: EntityUX } | undefined;
  private _model: string;
  private _temperature: string | undefined;
  private _humidity: string | undefined;
  private _power: string | undefined;
  private _light: string | undefined;

  private resizeObserver: ResizeObserver;

  @query('#cover-image') coverImageElement: HTMLImageElement | undefined;

  private A1EntityUX: { [key: string]: EntityUX | undefined } = {
    //hms:                    { x: 90, y:10, width:20,  height:0 },
    power:                  { x: 95, y:9,    width:20,  height:0 },
    chamber_light:          { x: 46, y:30,   width:20,  height:0 },
    nozzle_temp:            { x: 46, y:42,   width:25,  height:0, click_target:"target_nozzle_temperature" },
    cover_image:            { x: 46, y:60,   width:250, height:250 },
    bed_temp:               { x: 46, y:81,   width:25,  height:0, click_target:"target_bed_temperature" },
    print_progress:         { x: 85, y:81,   width:25,  height:0 },
    remaining_time:         { x: 85, y:85,   width:100, height:0 },
    stage:                  { x: 46, y:92.5, width:300, height:0 },
  };

  private A1MiniEntityUX: { [key: string]: EntityUX | undefined } = {
    //hms:                    { x: 90, y:10, width:20,  height:0 },
    power:                  { x: 95, y:9,  width:20,  height:0 },
    chamber_light:          { x: 88, y:29, width:20,  height:0 },
    nozzle_temp:            { x: 41, y:38, width:25,  height:0, click_target:"target_nozzle_temperature" },
    cover_image:            { x: 41, y:59, width:250, height:250 },
    bed_temp:               { x: 41, y:80, width:25,  height:0, click_target:"target_bed_temperature" },
    print_progress:         { x: 74, y:89, width:25,  height:0 }, 
    remaining_time:         { x: 74, y:93, width:100, height:0 },
    stage:                  { x: 41, y:93, width:300, height:0 },
  };

  private P1PEntityUX: { [key: string]: EntityUX | undefined } = {
    power:                  { x: 94, y:5,   width:20,  height:0 },
    print_progress:         { x: 23, y:3.5, width:25,  height:0 },
    remaining_time:         { x: 59, y:4.5, width:100, height:0 },
    //hms:                    { x: 90,   y:10,  width:20,  height:0 },
    chamber_light:          { x: 12, y:19,  width:20,  height:0 },
    nozzle_temp:            { x: 50, y:33,  width:25,  height:0, click_target:"target_nozzle_temperature" },
    chamber_temp:           { x: 86, y:32,  width:20,  height:0 },
    humidity:               { x: 86, y:42,  width:20,  height:0 },
    aux_fan:                { x: 12, y:60,  width:70,  height:0 },
    cover_image:            { x: 50, y:60,  width:300, height:300 },
    bed_temp:               { x: 50, y:86,  width:25,  height:0, click_target:"target_bed_temperature" },
    stage:                  { x: 50, y:94,  width:300, height:0 },
  };

  private P1SEntityUX: { [key: string]: EntityUX | undefined } = {
    //hms:                    { x: 90, y:10,  width:20,  height:0 },
    power:                  { x: 95, y:5.5, width:20,  height:0 },
    print_progress:         { x: 23, y:4,   width:25,  height:0 },
    remaining_time:         { x: 59, y:5,   width:100, height:0 },
    chamber_light:          { x: 13, y:21,  width:20,  height:0 },
    chamber_fan:            { x: 86, y:21,  width:70,  height:0 },
    nozzle_temp:            { x: 50, y:33,  width:25,  height:0, click_target:"target_nozzle_temperature" },
    chamber_temp:           { x: 86, y:32,  width:20,  height:0 },
    humidity:               { x: 86, y:42,  width:20,  height:0 },
    aux_fan:                { x: 13, y:60,  width:70,  height:0 },
    cover_image:            { x: 50, y:60,  width:300, height:300 },
    bed_temp:               { x: 50, y:88,  width:25,  height:0, click_target:"target_bed_temperature" },
    stage:                  { x: 50, y:95,  width:300, height:0 },
  };

  private X1CEntityUX: { [key: string]: EntityUX | undefined } = {
    //hms:                    { x: 90, y:10, width:20,  height:0 },
    power:                  { x: 95.5, y:10, width:20,  height:0 },
    print_progress:         { x: 29, y:6,    width:25,  height:0 },
    remaining_time:         { x: 29, y:11,   width:100, height:0 },
    chamber_light:          { x: 13, y:24,   width:20,  height:0 },
    chamber_fan:            { x: 86, y:24,   width:70,  height:0 },
    nozzle_temp:            { x: 50, y:31,   width:25,  height:0, click_target:"target_nozzle_temperature" },
    chamber_temp:           { x: 86, y:33,   width:20,  height:0 },
    humidity:               { x: 86, y:42,   width:20,  height:0 },
    aux_fan:                { x: 13, y:60,   width:70,  height:0 },
    cover_image:            { x: 50, y:60,   width:300, height:300 },
    bed_temp:               { x: 50, y:88,   width:25,  height:0, click_target:"target_bed_temperature" },
    stage:                  { x: 50, y:95,   width:300, height:0 },
    door_open:              { x: 86, y:60,   width:20, height:0 },
  };

  private EXTRAENTITIES: string[] = [
    "target_bed_temp",
    "target_bed_temperature",
    "target_nozzle_temp",
    "target_nozzle_temperature",
  ]

  private NODEREDENTITIES: { [key: string]: string } = {
    "bed_target_temperature": 'target_bed_temp',
    "bed_temperature": "bed_temp",
    "^fan.*big_fan1$": "aux_fan",
    "^fan.*big_fan2$": "chamber_fan",
    "chamber_temperature": "chamber_temp",
    "door": "door_open",
    "nozzle_target_temperature": 'target_nozzle_temp',
    "nozzle_temperature": "nozzle_temp",
    "print_preview": "cover_image",
    "print_remaining_time": "remaining_time",
    "set_bed_temp": "target_bed_temperature",
    "set_nozzle_temp": "target_nozzle_temperature",
  }

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
    this._humidity = undefined;
    this._temperature = undefined;
    this._power = undefined;
    this._light = undefined;

    this.resizeObserver = new ResizeObserver(() => {
      this.requestUpdate();
    });
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
    this._temperature = config.custom_temperature;
    this._humidity = config.custom_humidity;
    this._power = config.custom_power;
    this._light = config.custom_light;
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    // Hook up the resize observer on the background image so that we can react to it being re-layed out
    // to move all the entities to their correct positions. On initial creation this cannot be done on
    // connection as that's too early - there's no html at that point.
    const element = this.shadowRoot?.querySelector('#printer');
    this.resizeObserver.observe(element!);

    // On the first render, the background image gets loaded but is not yet in the shadow DOM nor
    // at it's layed out size. So we need a second pass to update the entity positions.
    this.requestUpdate();
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
      let entityList = Object.keys(this._entityUX!);
      entityList = entityList.concat(this.EXTRAENTITIES);
      entityList = entityList.concat(Object.keys(this.NODEREDENTITIES));
      this._entityList = helpers.getBambuDeviceEntities(hass, this._device_id, entityList);

      // Override the entity list with the Node-RED entities if configured.
      for (const e in this.NODEREDENTITIES) {
        const target = this.NODEREDENTITIES[e];
        if (this._entityList[e]) {
          this._entityList[target] = this._entityList[e];
        }
      }
      
      // Override the entity list with the custom entities if configured.
      for (const e in hass.entities) {
        const value = hass.entities[e];
        if (value.entity_id === this._temperature) {
          this._entityList['chamber_temp'] = value;
        } else if (value.entity_id === this._humidity) {
          this._entityList['humidity'] = value;
        } else if (value.entity_id === this._power) {
          this._entityList['power'] = value;
        } else if (value.entity_id === this._light) {
          this._entityList['chamber_light'] = value;
        }
      }
    
      // We have the model and the chamber light entity - kick off the background image load asap.
      this.requestUpdate();
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has("_states")) {
      if (this._entityList['cover_image']) {
        let newState = this._hass.states[this._entityList['cover_image'].entity_id].state;
        if (newState !== this._coverImageState) {
          console.log("Cover image updated");
          this._coverImageState = newState;
          this.requestUpdate();
        }
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();
    const element = this.shadowRoot?.querySelector('#printer');
    if (element) {
      // Not accessible on first bring up but is accessible if a hidden element is re-shown.
      this.resizeObserver.observe(element);
    }
  }

  disconnectedCallback() {
    if (this.resizeObserver) {
      // Being hidden will disconnect us. Clean up the observer.
      this.resizeObserver.disconnect();
    }
    super.disconnectedCallback();
  }

  render() {
    return html`
      <ha-card class="card">
        <div class="control-container">
          <img id="printer" src="${this._getPrinterImage()}" />
          <div id="container">
            ${Object.keys(this._entityUX!).map((key) => {
              return this._addElement(key);
            })}
          </div>
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

  private _addElement(key) {
    const backgroundImage = this.shadowRoot?.getElementById('printer') as HTMLImageElement;
    if (!backgroundImage) {
      return html``;
    }

    const imageWidth = backgroundImage.width;
    const imageHeight = backgroundImage.height;

    const entity = this._entityList[key];
    const e = this._entityUX![key];
    if ((entity != undefined) && (e != undefined)) {
      // Determine element type
      const left = (e.x / 100) * imageWidth;
      const top = (e.y / 100) * imageHeight;

      let style = "";
      if (e.height == 0) {
        style = `left:${left}px; top:${top}px; width:auto; height:auto;`
      } else {
        style = `left:${left}px; top:${top}px; width:auto; height:${e.height}px;`
      }

      let clickTarget = key;
      const click_target = this._entityUX![key].click_target
      if (click_target != undefined) {
        if (!helpers.isEntityUnavailable(this._hass, this._entityList[click_target])) {
          clickTarget = click_target
        }
      }

      const entity = this._hass.entities[this._entityList[key].entity_id];

      // Build the HTML string for each element
      let target_temperature: string | undefined = undefined;
      let text = helpers.getLocalizedEntityState(this._hass, this._entityList[key]);
      switch (key) {
        case 'aux_fan':
        case 'chamber_fan':
          const fan = this._states[this._entityList[key].entity_id]
          text = fan.attributes['percentage'];
          if (text != "0") {
            style=`${style} background-color: rgba(0,0,255,0.1); box-shadow: 0 0 24px rgba(0,0,255,0.4);`;
          }
          return html`
            <div id="${key}" class="entity" style="${style}" @click="${() => this._clickEntity(clickTarget)}">
              <ha-icon icon="mdi:fan"></ha-icon>
              ${text}%
            </div>
          `;

        // @ts-expect-error // falls through
        case 'chamber_temp':
          target_temperature == ""
        // @ts-expect-error // falls through
        case 'bed_temp':
          target_temperature = (target_temperature == undefined) ? 'target_bed_temp' : target_temperature;
        case 'nozzle_temp':
          target_temperature = (target_temperature == undefined) ? 'target_nozzle_temp' : target_temperature;
          if (target_temperature != "") {
            const target = helpers.getEntityState(this._hass, this._entityList[target_temperature]);
            if (target != "0") {
              style=`${style} background-color: rgba(255,100,0,0.2); box-shadow: 0 0 24px rgba(255,100,0,0.5);`;
            }
          }

          // Strip the formated state down to just the number so we can add just the degree symbol to it.
          let temp = this._hass.formatEntityState(this._hass.states[entity.entity_id]);
          temp = temp.match(/[-+]?\d*\.?\d+/)[0];

          return html`
            <div id="${key}" class="entity" style="${style}" @click="${() => this._clickEntity(clickTarget)}">
              ${temp}&deg;
            </div>`;

        case 'chamber_light':
          if (text == 'on') {
            return html`
              <ha-icon
                class="entity"
                icon="mdi:lightbulb-outline"
                @click="${this._toggleLight}"
                style="${style} color: rgb(255,165,0); background-color: rgba(255,165,0,0.2); box-shadow: 0 0 24px rgba(255,165,0,0.5);"
                >
              </ha-icon>`;
          } else {
            return html`
              <ha-icon
                class="entity"
                icon="mdi:lightbulb-outline"
                @click="${this._toggleLight}"
                style="${style} color: white;"
                >
              </ha-icon>`;
          }

        case 'cover_image':
          if (!this._entityList[key] || helpers.isEntityUnavailable(this._hass, this._entityList[key])) {
            return html``
          } else {
            return html`
              <img
                id="cover-image"
                class="cover-image"
                style="${style} z-index: 1;"
                src="${this._getCoverImageUrl()}"
                @error="${this._handleCoverImageError}"
                @load="${this._handleCoverImageLoad}"
                alt="Cover Image"
                />
              `;
          }

        case 'humidity':
          text = this._hass.formatEntityState(this._hass.states[entity.entity_id])
          return html`
            <div id="${key}" class="entity" style="${style}" @click="${() => this._clickEntity(clickTarget)}">
              <ha-icon icon="mdi:water-percent"></ha-icon>
              ${text}
            </div>
           `;

        case 'power':
          if (text == 'on') {
            return html`
              <div id="${key}" class="entity" style="${style} color:green;" @click="${() => this._clickEntity(clickTarget)}">
                <ha-icon icon="mdi:power"></ha-icon>
              </div>
            `;
          } else {
            return html`
              <div id="${key}" class="entity" style="${style} color:red;" @click="${() => this._clickEntity(clickTarget)}">
                <ha-icon icon="mdi:power"></ha-icon>
              </div>
            `;
          }

        case 'print_progress':
          return html`
            <div id="${key}" class="entity" style="${style}">
              ${text}%
            </div>`;

        case 'remaining_time':
          return html`
            <div id="${key}" class="entity" style="${style}">
              ${helpers.formatMinutes(Number(text))}
            </div>`;

        case 'door_open':
          const icon = ((text == 'on') || (text == 'open')) ? 'mdi:door-open' : 'mdi:door-closed';
          return html`
            <div id="${key}" class="entity" style="${style}" @click="${() => this._clickEntity(clickTarget)}">
              <ha-icon icon="${icon}"></ha-icon>
            </div>`;

        default:
          // Default case
          return html`<div class="entity" id="${key}" style="${style}">${text}</div>`;
      }
    }
    return html``
  }

  private _clickEntity(key) {
    helpers.showEntityMoreInfo(this, this._entityList[key]);
  }

  private _toggleLight() {
    const data = {
      entity_id: this._entityList['chamber_light'].entity_id
    }
    const lightOn = helpers.getEntityState(this._hass, this._entityList['chamber_light']) == 'on'
    const service = lightOn ? 'turn_off' : 'turn_on';
    this._hass.callService('light', service, data);
  }

  private _getCoverImageUrl() {
    if (helpers.isEntityUnavailable(this._hass, this._entityList['cover_image'])) {
      console.log("Cover image unavailable")
      return '';
    } else {
      const coverImageEntityId = this._entityList['cover_image'].entity_id;
      return `${this._hass.states[coverImageEntityId].attributes.entity_picture}&state=${this._coverImageState}`;
    }
  }

  private _handleCoverImageError() {
    console.log("_handleCoverImageError");
    this.coverImageElement!.style.display = 'none';
  }

  private _handleCoverImageLoad() {
    console.log("_handleCoverImageLoad");
    this.coverImageElement!.style.display = 'block';
  }
}
