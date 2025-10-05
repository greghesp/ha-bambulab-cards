import * as helpers from "../../utils/helpers";
import { customElement, state } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import { provide } from "@lit/context";

import { registerCustomCard } from "../../utils/custom-cards";
import { INTEGRATION_DOMAIN, MANUFACTURER, AMS_MODELS } from "../../const";
import { AMS_CARD_EDITOR_NAME, AMS_CARD_NAME } from "./const";
import styles from "./card.styles";
import "./vector-ams-card/vector-ams-card";
import "./graphic-ams-card/graphic-ams-card";
import { entitiesContext, hassContext, showInfoBarContext, nodeRedContext } from "../../utils/context";

registerCustomCard({
  type: AMS_CARD_NAME,
  name: "Bambu Lab AMS Card",
  description: "Card for AMS entity",
});

const ENTITYLIST: string[] = [
  "ams_temp",
  "temp",             // Node-RED only
  "custom_humidity",
  "humidity_index",
  "humidity_level",   // Node-RED only
  "tray_0",           // Node-RED only
  "tray_1",
  "tray_2",
  "tray_3",
  "tray_4",
];

interface Sensor {
  entity_id: string;
  device_id: string;
  labels: any[];
  translation_key: string;
  platform: string;
  name: string;
}

interface Result {
  humidity: Sensor;
  temperature: Sensor | null;
  spools: Sensor[];
  type: (typeof AMS_MODELS)[number] | null;
}

@customElement(AMS_CARD_NAME)
export class AMS_CARD extends LitElement {
  // private property
  @state() private _subtitle;
  @state() private _deviceId: any;
  @state() private _states;
  @state() private _style;
  @state() private _showType;
  @state() private _spoolAnimReflection;
  @state() private _spoolAnimWiggle;
  private _entityList: { [key: string]: helpers.Entity } = {};

  @provide({ context: hassContext })
  @state()
  private _hass?;

  @provide({ context: entitiesContext })
  private _entities;

  @provide({ context: showInfoBarContext })
  @state()
  private _showInfoBar: { [key: string]: any } = {};

  @provide({ context: nodeRedContext })
  private _nodeRed: boolean = false;

  private _customHumidity;
  private _customTemperature;

  static styles = styles;

  public getLayoutOptions() {
    var rows = (this._style === "graphic") ? 4 : 3;
    if (this._showInfoBar) {
      rows++;
    }

    var columns = 4;
    if (this._style !== "graphic" && this._hass.devices[this._deviceId].model === "AMS HT") {
      columns = 1;
    }

    return {
      grid_rows: rows,
      grid_columns: columns,
      grid_min_rows: rows,
      grid_min_columns: columns,
    };
  }

  setConfig(config) {
    if (!config.ams) {
      throw new Error("You need to select an AMS");
    }

    this._showInfoBar["title"] = config.subtitle === "" ? nothing : config.subtitle;
    this._showInfoBar["active"] = config.show_info_bar ? true : false;

    this._deviceId = config.ams;
    this._style = config.style;
    this._showType = config.show_type ? true : false;
    this._spoolAnimReflection = (config.spool_anim_reflection == undefined) ? true : config.spool_anim_reflection;
    this._spoolAnimWiggle = (config.spool_anim_wiggle == undefined) ? true : config.spool_anim_wiggle;
    this._customHumidity = config.custom_humidity === "" ? nothing : config.custom_humidity;
    this._customTemperature =
      config.custom_temperature === "" ? nothing : config.custom_temperature;

    if (this._hass) {
      this.hass = this._hass;
    }
  }

  set hass(hass) {
    const firstTime = hass && !this._hass;

    this._hass = hass;
    this._states = hass.states;

    if (this._deviceId == "MOCK") {
      Object.keys(this._hass.devices).forEach((key) => {
        const device = this._hass.devices[key];
        if (device.manufacturer == MANUFACTURER) {
          if (AMS_MODELS.includes(device.model)) {
            this._style = "graphic";
            this._deviceId = key;
          }
        }
      });
    }

    if (firstTime) {
      this._entityList = helpers.getBambuDeviceEntities(hass, this._deviceId, ENTITYLIST);
      if (this._entityList["tray_0"]) {
        // This is a Node-RED integration so adjust the entity list to match.
        this._nodeRed = true;
        this._entityList["tray_4"] = this._entityList["tray_3"];
        this._entityList["tray_3"] = this._entityList["tray_2"];
        this._entityList["tray_2"] = this._entityList["tray_1"];
        this._entityList["tray_1"] = this._entityList["tray_0"];
        this._entityList["humidity_index"] = this._entityList["humidity_level"];
        this._entityList["ams_temp"] = this._entityList["temp"];
      }

      // Set custom entities
      for (const key in hass.entities) {
        const value = hass.entities[key];
        if (value.entity_id === this._customTemperature) {
          this._entityList["ams_temp"] = value; // Replace normal temp sensor, if present.
        }
        if (value.entity_id === this._customHumidity) {
          this._entityList["humidity_index"] = value; // Replace normal humidity_index sensor.
        }
      }

      // Convert data to form rest of the cards are expecting.
      this._entities = {
        humidity: this._entityList["humidity_index"],
        temperature: this._entityList["ams_temp"],
        spools: (() => {
          const spools = [
            this._entityList["tray_1"],
            this._entityList["tray_2"],
            this._entityList["tray_3"],
            this._entityList["tray_4"],
          ];
          // Filter out undefined entries
          return spools.filter(spool => spool?.entity_id);
        })(),
        type: this._hass.devices[this._deviceId].model.toUpperCase(),
      };
    }
  }

  render() {
    if (this._style == "graphic") {
      return html` <graphic-ams-card /> `;
    } else {
      return html`
        <vector-ams-card
          .showType=${this._showType}
          .spoolAnimReflection=${this._spoolAnimReflection}
          .spoolAnimWiggle=${this._spoolAnimWiggle}
        />
      `;
    }
  }

  public static async getConfigElement() {
    await import("./ams-card-editor");
    return document.createElement(AMS_CARD_EDITOR_NAME);
  }

  static getStubConfig() {
    return {
      entity: "",
      header: "",
      subtitle: "",
      style: "vector",
      ams: "MOCK",
    };
  }

  private async getEntity(entity_id) {
    return await this._hass.callWS({
      type: "config/entity_registry/get",
      entity_id: entity_id,
    });
  }

  private async getDeviceModel() {
    if (!this._deviceId) return;

    try {
      interface Device {
        id: string;
        model?: string;
      }

      const deviceInfo = Object.values(this._hass.devices as Record<string, Device>).find(
        (device: Device) => device.id === this._deviceId
      );
      return deviceInfo?.model;
    } catch (error) {
      console.error("Error fetching device info:", error);
      return null;
    }
  }
}
