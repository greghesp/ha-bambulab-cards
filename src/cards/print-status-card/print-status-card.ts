import * as helpers from "../../utils/helpers";

import { customElement, state, property, query } from "lit/decorators.js";
import { html, LitElement, nothing, PropertyValues } from "lit";
import { provide, consume } from "@lit/context";
import styles from "./card.styles";

import { INTEGRATION_DOMAIN, MANUFACTURER, PRINTER_MODELS } from "../../const";
import { PRINT_STATUS_CARD_EDITOR_NAME, PRINT_STATUS_CARD_NAME } from "./const";
import { registerCustomCard } from "../../utils/custom-cards";
import { entitiesContext, hassContext } from "../../utils/context";

import A1_ON_IMAGE from "../../images/A1_on.png";
import A1_OFF_IMAGE from "../../images/A1_off.png";
import A1MINI_ON_IMAGE from "../../images/A1Mini_on.png";
import A1MINI_OFF_IMAGE from "../../images/A1Mini_off.png";
import H2D_ON_IMAGE from "../../images/H2D_on.png";
import H2D_OFF_IMAGE from "../../images/H2D_off.png";
import H2S_ON_IMAGE from "../../images/H2S_on.png";
import H2S_OFF_IMAGE from "../../images/H2S_off.png";
import P1P_ON_IMAGE from "../../images/P1P_on.png";
import P1P_OFF_IMAGE from "../../images/P1P_off.png";
import P1S_ON_IMAGE from "../../images/P1S_on.png";
import P1S_OFF_IMAGE from "../../images/P1S_off.png";
import X1C_ON_IMAGE from "../../images/X1C_on.png";
import X1C_OFF_IMAGE from "../../images/X1C_off.png";
import X1E_ON_IMAGE from "../../images/X1E_on.png";
import X1E_OFF_IMAGE from "../../images/X1E_off.png";

import "./a1-screen/a1-screen-card";
import EntityProvider from "../shared-components/entity-provider";

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

const _onImages: { [key: string]: any } = {
  A1: A1_ON_IMAGE,
  A1MINI: A1MINI_ON_IMAGE,
  H2D: H2D_ON_IMAGE,
  H2S: H2S_ON_IMAGE,
  P1P: P1P_ON_IMAGE,
  P1S: P1S_ON_IMAGE,
  X1C: X1C_ON_IMAGE,
  X1E: X1E_ON_IMAGE,
};

const _offImages: { [key: string]: any } = {
  A1: A1_OFF_IMAGE,
  A1MINI: A1MINI_OFF_IMAGE,
  H2D: H2D_OFF_IMAGE,
  H2S: H2S_OFF_IMAGE,
  P1P: P1P_OFF_IMAGE,
  P1S: P1S_OFF_IMAGE,
  X1C: X1C_OFF_IMAGE,
  X1E: X1E_OFF_IMAGE,
};

@customElement(PRINT_STATUS_CARD_NAME)
export class PrintStatusCard extends EntityProvider {
  static styles = styles;

  @state() private _style;

  @state() private _coverImageUrl: string | undefined;

  private _entityUX: { [key: string]: EntityUX } | undefined;
  private _model: string;

  private resizeObserver: ResizeObserver;

  @query("#cover-image") coverImageElement: HTMLImageElement | undefined;

  @provide({ context: hassContext })
  @state()
  public _hass;

  @provide({ context: entitiesContext })
  @state()
  public _deviceEntities;

  private A1EntityUX: { [key: string]: EntityUX | undefined } = {
    power:          { x: 95, y: 9,    width: 20,  height: 0 },
    chamber_light:  { x: 46, y: 30,   width: 20,  height: 0 },
    nozzle_temp:    { x: 46, y: 42,   width: 25,  height: 0, click_target: "target_nozzle_temperature" },
    cover_image:    { x: 46, y: 60,   width: 42,  height: 42 },
    bed_temp:       { x: 46, y: 81,   width: 25,  height: 0, click_target: "target_bed_temperature" },
    print_progress: { x: 85, y: 81,   width: 25,  height: 0 },
    remaining_time: { x: 85, y: 85,   width: 100, height: 0 },
    stage:          { x: 46, y: 92.5, width: 300, height: 0 },
  };

  private A1MiniEntityUX: { [key: string]: EntityUX | undefined } = {
    power:          { x: 95, y: 9,  width: 20,  height: 0 },
    chamber_light:  { x: 88, y: 29, width: 20,  height: 0 },
    nozzle_temp:    { x: 41, y: 38, width: 25,  height: 0, click_target: "target_nozzle_temperature" },
    cover_image:    { x: 41, y: 59, width: 42,  height: 42 },
    bed_temp:       { x: 41, y: 80, width: 25,  height: 0, click_target: "target_bed_temperature" },
    print_progress: { x: 74, y: 89, width: 25,  height: 0 },
    remaining_time: { x: 74, y: 93, width: 100, height: 0 },
    stage:          { x: 41, y: 93, width: 300, height: 0 },
  };

  private H2SEntityUX: { [key: string]: EntityUX | undefined } = {
    power:          { x: 95.5, y: 10, width: 20,  height: 0 },
    print_progress: { x: 29,   y: 4,  width: 25,  height: 0 },
    remaining_time: { x: 29,   y: 9,  width: 100, height: 0 },
    chamber_light:  { x: 13,   y: 24, width: 20,  height: 0 },
    chamber_fan_speed: { x: 86,   y: 24, width: 70,  height: 0, click_target: "chamber_fan" },
    nozzle_temp:    { x: 50,   y: 31, width: 25,  height: 0, click_target: "target_nozzle_temperature" },
    chamber_temp:   { x: 86,   y: 33, width: 20,  height: 0 },
    humidity:       { x: 86,   y: 42, width: 20,  height: 0 },
    aux_fan_speed:  { x: 13,   y: 60, width: 70,  height: 0, click_target: "aux_fan" },
    cover_image:    { x: 50,   y: 60, width: 50,  height: 50 },
    bed_temp:       { x: 50,   y: 88, width: 25,  height: 0, click_target: "target_bed_temperature" },
    stage:          { x: 50,   y: 94, width: 300, height: 0 },
    door_open:      { x: 86,   y: 60, width: 20,  height: 0 },
  };

  private H2DEntityUX: { [key: string]: EntityUX | undefined } = {
    power:          { x: 95.5, y: 10, width: 20,  height: 0 },
    print_progress: { x: 29,   y: 4,  width: 25,  height: 0 },
    remaining_time: { x: 29,   y: 9,  width: 100, height: 0 },
    chamber_light:  { x: 13,   y: 24, width: 20,  height: 0 },
    chamber_fan_speed: { x: 86,   y: 24, width: 70,  height: 0, click_target: "chamber_fan" },
    nozzle_temp:    { x: 50,   y: 31, width: 25,  height: 0, click_target: "target_nozzle_temperature" },
    chamber_temp:   { x: 86,   y: 33, width: 20,  height: 0 },
    humidity:       { x: 86,   y: 42, width: 20,  height: 0 },
    aux_fan_speed:  { x: 13,   y: 60, width: 70,  height: 0, click_target: "aux_fan" },
    cover_image:    { x: 50,   y: 60, width: 50,  height: 50 },
    bed_temp:       { x: 50,   y: 88, width: 25,  height: 0, click_target: "target_bed_temperature" },
    stage:          { x: 50,   y: 94, width: 300, height: 0 },
    door_open:      { x: 86,   y: 60, width: 20,  height: 0 },
  };

  private P1PEntityUX: { [key: string]: EntityUX | undefined } = {
    power:          { x: 94, y: 5,   width: 20,  height: 0 },
    print_progress: { x: 23, y: 3.5, width: 25,  height: 0 },
    remaining_time: { x: 59, y: 4.5, width: 100, height: 0 },
    chamber_light:  { x: 12, y: 19,  width: 20,  height: 0 },
    nozzle_temp:    { x: 50, y: 33,  width: 25,  height: 0, click_target: "target_nozzle_temperature" },
    chamber_temp:   { x: 86, y: 32,  width: 20,  height: 0 },
    humidity:       { x: 86, y: 42,  width: 20,  height: 0 },
    aux_fan_speed:  { x: 12, y: 60,  width: 70,  height: 0, click_target: "aux_fan" },
    cover_image:    { x: 50, y: 60,  width: 50,  height: 50 },
    bed_temp:       { x: 50, y: 86,  width: 25,  height: 0, click_target: "target_bed_temperature" },
    stage:          { x: 50, y: 94,  width: 300, height: 0 },
  };

  private P1SEntityUX: { [key: string]: EntityUX | undefined } = {
    power:          { x: 95, y: 5.5, width: 20,  height: 0 },
    print_progress: { x: 23, y: 4,   width: 25,  height: 0 },
    remaining_time: { x: 59, y: 5,   width: 100, height: 0 },
    chamber_light:  { x: 13, y: 21,  width: 20,  height: 0 },
    chamber_fan_speed: { x: 86, y: 21,  width: 70,  height: 0, click_target: "chamber_fan" },
    nozzle_temp:    { x: 50, y: 33,  width: 25,  height: 0, click_target: "target_nozzle_temperature" },
    chamber_temp:   { x: 86, y: 32,  width: 20,  height: 0 },
    humidity:       { x: 86, y: 42,  width: 20,  height: 0 },
    aux_fan_speed:  { x: 13, y: 60,  width: 70,  height: 0, click_target: "aux_fan" },
    cover_image:    { x: 50, y: 60,  width: 50,  height: 50 },
    bed_temp:       { x: 50, y: 88,  width: 25,  height: 0, click_target: "target_bed_temperature" },
    stage:          { x: 50, y: 95,  width: 300, height: 0 },
  };

  private X1CEntityUX: { [key: string]: EntityUX | undefined } = {
    power:             { x: 95.5, y: 10, width: 20,  height: 0 },
    print_progress:    { x: 29,   y: 6,  width: 25,  height: 0 },
    remaining_time:    { x: 29,   y: 11, width: 100, height: 0 },
    chamber_light:     { x: 13,   y: 24, width: 20,  height: 0 },
    chamber_fan_speed: { x: 86,   y: 24, width: 70,  height: 0, click_target: "chamber_fan" },
    nozzle_temp:       { x: 50,   y: 31, width: 25,  height: 0, click_target: "target_nozzle_temperature" },
    chamber_temp:      { x: 86,   y: 33, width: 20,  height: 0 },
    humidity:          { x: 86,   y: 42, width: 20,  height: 0 },
    aux_fan_speed:     { x: 13,   y: 60, width: 70,  height: 0, click_target: "aux_fan" },
    cover_image:       { x: 50,   y: 60, width: 50,  height: 50 },
    bed_temp:          { x: 50,   y: 88, width: 25,  height: 0, click_target: "target_bed_temperature" },
    stage:             { x: 50,   y: 95, width: 300, height: 0 },
    door_open:         { x: 86,   y: 60, width: 20,  height: 0 },
  };

  private EntityUX: { [key: string]: any } = {
    A1: this.A1EntityUX,
    A1MINI: this.A1MiniEntityUX,
    H2D: this.H2DEntityUX,
    H2S: this.H2SEntityUX,
    P1P: this.P1PEntityUX,
    P1S: this.P1SEntityUX,
    X1:  this.X1CEntityUX,
    X1C: this.X1CEntityUX,
    X1E: this.X1CEntityUX,
  };

  constructor() {
    super();
    this._model = "";
    this._entityUX = undefined; // Initialized once we know what model printer it is.

    this.resizeObserver = new ResizeObserver(() => {
      const background = this.shadowRoot?.getElementById("control-container") as HTMLElement;
      this.requestUpdate();
    });
  }

  private _initializeModelAndUX() {
    if (!this._model) {
      this._model = this._hass.devices[this._device_id!]?.model?.toUpperCase() || "";
      if (this._model == "A1 MINI") {
        this._model = "A1MINI";
      }
      this._entityUX = this.EntityUX[this._model];
    }
  }

  public static async getConfigElement() {
    await import("./print-status-card-editor");
    return document.createElement(PRINT_STATUS_CARD_EDITOR_NAME);
  }

  static getStubConfig() {
    return {
      printer: "MOCK",
    };
  }

  public getLayoutOptions() {
    if (this._style == "simple") {
      return {
        grid_rows: 5,
        grid_min_rows: 5,
        grid_columns: 4,
        grid_min_columns: 4,
      };
    }
    return {};
  }

  set hass(hass) {
    const firstTime = hass && !this._hass;
    super.hass = hass;
    if (firstTime) {
      this._initializeModelAndUX()
    }
  }

  setConfig(config) {
    if (!config.printer) {
      throw new Error("You need to select a Printer");
    }

    this._style = config.style;
    this._device_id = config.printer;
    this._customEntities = {
      chamber_temp: config.custom_temperature,
      humidity: config.custom_humidity,
      power: config.custom_power,
      chamber_light: config.custom_light,
      camera: config.custom_camera
    };
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    // Hook up the resize observer on the background image so that we can react to it being re-layed out
    // to move all the entities to their correct positions. On initial creation this cannot be done on
    // connection as that's too early - there's no html at that point.
    const element = this.shadowRoot?.querySelector("#control-container");
    if (element) {
      this.resizeObserver.observe(element);
    }

    // On the first render, the background image gets loaded but is not yet in the shadow DOM nor
    // at it's layed out size. So we need a second pass to update the entity positions.
    this.requestUpdate();
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has("_hass")) {
      this._coverImageUrl = helpers.getImageUrl(this._hass, this._deviceEntities["cover_image"]);
    }
  }

  connectedCallback() {
    super.connectedCallback();
    const element = this.shadowRoot?.querySelector("#control-container");
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
    if (this._style == "simple") {
      return html`
        <a1-screen-card
          .coverImage=${this._coverImageUrl}
          _device_id=${this._device_id}
        ></a1-screen-card>
      `;
    } else {
      return html`
        <ha-card class="card">
          <div id="control-container" class="control-container">
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
  }

  private _getPrinterImage() {
    const lightOn =
      helpers.getEntityState(this._hass, this._deviceEntities["chamber_light"]) == "on";
    if (lightOn) {
      return _onImages[this._model];
    } else {
      return _offImages[this._model];
    }
  }

  private _addElement(key) {
    const background = this.shadowRoot?.getElementById("printer") as HTMLElement;
    if (!background) {
      return html``;
    }

    if (helpers.isEntityUnavailable(this._hass, this._deviceEntities[key])) {
      return html``;
    }

    const imageWidth = background.getBoundingClientRect().width;
    const imageHeight = background.getBoundingClientRect().height;

    const entity = this._deviceEntities[key];
    const e = this._entityUX![key];
    if (entity != undefined && e != undefined) {
      // Determine element type
      const left = (e.x / 100) * imageWidth;
      const top = (e.y / 100) * imageHeight;

      let style = "";
      if (e.height == 0) {
        style = `left:${left}px; top:${top}px; width:auto; height:auto;`;
      } else {
        style = `left:${left}px; top:${top}px; width:auto; height:${e.height}px;`;
      }

      let clickTarget = key;
      const click_target = this._entityUX![key].click_target;
      if (click_target != undefined) {
        if (!helpers.isEntityUnavailable(this._hass, this._deviceEntities[click_target])) {
          clickTarget = click_target;
        }
      }

      const entity = this._hass.entities[this._deviceEntities[key].entity_id];

      // Build the HTML string for each element
      let target_temperature: string | undefined = undefined;
      let text = helpers.getLocalizedEntityState(this._hass, this._deviceEntities[key]);
      switch (key) {
        case "aux_fan_speed":
        case "chamber_fan_speed":
          if (text != "0") {
            style = `${style} background-color: rgba(0,0,255,0.1); box-shadow: 0 0 24px rgba(0,0,255,0.4);`;
          }
          return html`
            <div
              id="${key}"
              class="entity"
              style="${style}"
              @click="${() => this._clickEntity(clickTarget)}"
            >
              <ha-icon icon="mdi:fan"></ha-icon>
              ${text}%
            </div>
          `;

        // @ts-expect-error // falls through
        case "chamber_temp":
          target_temperature == "";
        // @ts-expect-error // falls through
        case "bed_temp":
          target_temperature =
            target_temperature == undefined ? "target_bed_temp" : target_temperature;
        case "nozzle_temp":
          target_temperature =
            target_temperature == undefined ? "target_nozzle_temp" : target_temperature;
          if (target_temperature != "") {
            const target = helpers.getEntityState(
              this._hass,
              this._deviceEntities[target_temperature]
            );
            if (target != "0") {
              style = `${style} background-color: rgba(255,100,0,0.2); box-shadow: 0 0 24px rgba(255,100,0,0.5);`;
            }
          }

          // Strip the formatted state down to just the number so we can add just the degree symbol to it.
          let temp = this._hass.formatEntityState(this._hass.states[entity.entity_id]);
          temp = temp.match(/[-+]?\d*\.?\d+/)[0];
          
          return html` <div
            id="${key}"
            class="entity"
            style="${style}"
            @click="${() => this._clickEntity(clickTarget)}"
          >
            ${temp}&deg;
          </div>`;

        case "chamber_light":
          if (text == "on") {
            return html` <ha-icon
              class="entity"
              icon="mdi:lightbulb-outline"
              @click="${this._toggleLight}"
              style="${style} color: rgb(255,165,0); background-color: rgba(255,165,0,0.2); box-shadow: 0 0 24px rgba(255,165,0,0.5);"
            >
            </ha-icon>`;
          } else {
            return html` <ha-icon
              class="entity"
              icon="mdi:lightbulb-outline"
              @click="${this._toggleLight}"
              style="${style} color: white;"
            >
            </ha-icon>`;
          }

        case "cover_image":
          style = `left:${left}px; top:${top}px; width:auto; height:${e.height}%;`;
          if (
            !this._deviceEntities[key] ||
            helpers.isEntityUnavailable(this._hass, this._deviceEntities[key])
          ) {
            return html``;
          } else {
            return html`
              <img
                id="cover-image"
                class="cover-image"
                style="${style} z-index: 1;"
                src="${this._coverImageUrl}"
                @error="${this._handleCoverImageError}"
                @load="${this._handleCoverImageLoad}"
                alt="Cover Image"
              />
            `;
          }

        case "humidity":
          text = this._hass.formatEntityState(this._hass.states[entity.entity_id]);
          return html`
            <div
              id="${key}"
              class="entity"
              style="${style}"
              @click="${() => this._clickEntity(clickTarget)}"
            >
              <ha-icon icon="mdi:water-percent"></ha-icon>
              ${text}
            </div>
          `;

        case "power":
          if (text == "on") {
            return html`
              <div
                id="${key}"
                class="entity"
                style="${style} color:green;"
                @click="${() => this._clickEntity(clickTarget)}"
              >
                <ha-icon icon="mdi:power"></ha-icon>
              </div>
            `;
          } else {
            return html`
              <div
                id="${key}"
                class="entity"
                style="${style} color:red;"
                @click="${() => this._clickEntity(clickTarget)}"
              >
                <ha-icon icon="mdi:power"></ha-icon>
              </div>
            `;
          }

        case "print_progress":
          return html` <div id="${key}" class="entity" style="${style}">${text}%</div>`;

        case "remaining_time":
          return html` <div id="${key}" class="entity" style="${style}">
            ${helpers.getFormattedEntityState(this._hass, this._deviceEntities['remaining_time'].entity_id)}
          </div>`;

        case "door_open":
          const icon = text == "on" || text == "open" ? "mdi:door-open" : "mdi:door-closed";
          return html` <div
            id="${key}"
            class="entity"
            style="${style}"
            @click="${() => this._clickEntity(clickTarget)}"
          >
            <ha-icon icon="${icon}"></ha-icon>
          </div>`;

        default:
          // Default case
          return html`<div class="entity" id="${key}" style="${style}">${text}</div>`;
      }
    }
    return html``;
  }

  private _clickEntity(key) {
    helpers.showEntityMoreInfo(this, this._deviceEntities[key]);
  }

  private _toggleLight() {
    const data = {
      entity_id: this._deviceEntities["chamber_light"].entity_id,
    };
    const lightOn =
      helpers.getEntityState(this._hass, this._deviceEntities["chamber_light"]) == "on";
    const service = lightOn ? "turn_off" : "turn_on";
    this._hass.callService("light", service, data);
  }

  private _handleCoverImageError() {
    console.log("_handleCoverImageError");
    this.coverImageElement!.style.display = "none";
  }

  private _handleCoverImageLoad() {
    console.log("_handleCoverImageLoad");
    this.coverImageElement!.style.display = "block";
  }
}
