import { customElement, state } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";

import { registerCustomCard } from "../../utils/custom-cards";
import { INTEGRATION_DOMAIN, MANUFACTURER, AMS_MODELS } from "../../const";
import { AMS_CARD_EDITOR_NAME, AMS_CARD_NAME  } from "./const";
import styles from "./card.styles";
import "./vector-ams-card/vector-ams-card";
import "./graphic-ams-card/graphic-ams-card";

registerCustomCard({
  type: AMS_CARD_NAME,
  name: "Bambu Lab AMS Card",
  description: "Card for AMS entity",
});

interface Sensor {
  entity_id: string;
  device_id: string;
  labels: any[];
  translation_key: string;
  platform: string;
  name: string;
}

interface Result {
  humidity: Sensor | null;
  temperature: Sensor | null;
  spools: Sensor[];
  type: (typeof AMS_MODELS)[number] | null;
}

@customElement(AMS_CARD_NAME)
export class AMS_CARD extends LitElement {
  // private property
  @state() private _hass?;
  @state() private _subtitle;
  @state() private _deviceId: any;
  @state() private _entities: any;
  @state() private _states;
  @state() private _style;
  @state() private _showInfoBar;
  @state() private _showType;
  @state() private _customHumidity;
  @state() private _customTemperature;

  static styles = styles;

  public getLayoutOptions() {
    return {
      grid_rows:
        this._style === "graphic" ? (this._showInfoBar ? 5 : 4) : this._showInfoBar ? 4 : 3,
      grid_columns: 4,
      grid_min_rows:
        this._style === "graphic" ? (this._showInfoBar ? 5 : 4) : this._showInfoBar ? 4 : 3,
      grid_min_columns: 4,
    };
  }

  setConfig(config) {
    if (!config.ams) {
      throw new Error("You need to select an AMS");
    }

    this._subtitle = config.subtitle === "" ? nothing : config.subtitle;
    this._entities = config._entities;
    this._deviceId = config.ams;
    this._style = config.style;
    this._showInfoBar = config.show_info_bar ? true : false;
    this._showType = config.show_type ? true : false;
    this._customHumidity = config.custom_humidity === "" ? nothing : config.custom_humidity;
    this._customTemperature =
      config.custom_temperature === "" ? nothing : config.custom_temperature;

    if (this._hass) {
      this.hass = this._hass;
    }
  }

  set hass(hass) {
    this._hass = hass;
    this._states = hass.states;

    if (this._deviceId == 'MOCK') {
      Object.keys(this._hass.devices).forEach((key) => {
        const device = this._hass.devices[key];
        if (device.manufacturer == MANUFACTURER) {
          if (AMS_MODELS.includes(device.model)) {
            this._style = "graphic";
            this._deviceId = key;
          }
        }
      })
    }
    
    this.filterBambuDevices();
  }

  render() {
    if (this._style == "graphic") {
      return html`
        <graphic-ams-card
          .subtitle="${this._subtitle}"
          .entities="${this._entities}"
          .states="${this._states}"
          .showInfoBar=${this._showInfoBar}
          .customHumidity=${this._customHumidity}
          .customTemperature=${this._customTemperature}
        />
      `;
    } else {
      return html`
        <vector-ams-card
          .subtitle="${this._subtitle}"
          .entities="${this._entities}"
          .states="${this._states}"
          .showInfoBar=${this._showInfoBar}
          .showType=${this._showType}
          .customHumidity=${this._customHumidity}
          .customTemperature=${this._customTemperature}
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

  private async filterBambuDevices() {
    const result: Result = {
      humidity: null,
      temperature: null,
      spools: [],
      type: (await this.getDeviceModel()) ?? null,
    };
    // Loop through all hass entities, and find those that belong to the selected device
    for (let key in this._hass.entities) {
      const value = this._hass.entities[key];
      if (value.device_id === this._deviceId) {
        const r = await this.getEntity(value.entity_id);
        if (r.unique_id.includes("humidity")) {
          result.humidity = value;
        } else if (r.unique_id.includes("temp")) {
          result.temperature = value;
        } else if (r.unique_id.includes("tray")) {
          result.spools.push(value);
        }
      }
    }

    this._entities = result;
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
