import * as helpers from "../../utils/helpers";
import { customElement, state } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import { provide } from "@lit/context";

import { registerCustomCard } from "../../utils/custom-cards";
import { INTEGRATION_DOMAIN, MANUFACTURER, AMS_MODELS, AMS_3H_MODEL } from "../../const";
import { AMS_CARD_EDITOR_NAME, AMS_CARD_NAME } from "./const";
import styles from "./card.styles";
import "./vector-ams-card/vector-ams-card";
import "./graphic-ams-card/graphic-ams-card";
import { findAmsZones, findDryBoxZone, layoutAms3h } from "./zones";
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
  "tray_5",           // AMS 3H only, as are trays 6-9
  "tray_6",
  "tray_7",
  "tray_8",
  "tray_9",
];

// The most trays any AMS has (the AMS 3H)
const MAX_TRAYS = 9;
const TRAY_NUMBERS = Array.from({ length: MAX_TRAYS }, (_, i) => i + 1);

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
  private _trays: { tray: number; spool: helpers.Entity }[] = [];
  private _zonesKey?: string;

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
  @state() private _customRemaining: (string | undefined)[] = [];

  static styles = styles;

  private _isAms3h(): boolean {
    return this._hass?.devices?.[this._deviceId]?.model === AMS_3H_MODEL;
  }

  public getLayoutOptions() {
    // The AMS 3H shows its nine spools in two rows (taller with the filament names under them)
    // plus the dry box's readings, and has no graphic style
    var rows = this._isAms3h() ? (this._showType ? 7 : 5) : (this._style === "graphic") ? 4 : 3;
    if (this._showInfoBar.active) {
      rows++;
    }

    var columns = 4;
    if (this._hass.devices[this._deviceId].model === "AMS HT") {
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
    this._customRemaining = TRAY_NUMBERS.map((n) => config[`custom_remaining_${n}`] || undefined);

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

      // Trays that don't exist on this AMS are left out
      this._trays = TRAY_NUMBERS
        .map((n) => ({ tray: n, spool: this._entityList[`tray_${n}`] }))
        .filter((t) => t.spool?.entity_id);

      // Convert data to form rest of the cards are expecting.
      this._entities = {
        humidity: this._entityList["humidity_index"],
        temperature: this._entityList["ams_temp"],
        spools: this._trays.map((t) => t.spool),
        zones: [],
        type: this._hass.devices[this._deviceId].model.toUpperCase(),
      };
    }

    if (this._isAms3h()) {
      this.#updateAms3hZones(hass);
    }
  }

  /* The AMS 3H's drying zones stand in for the cabinet humidity and temperature, and the dry box
     (the smaller zone) is drawn with its spools. The zones' trays come from the printer and can
     change, or be missing while it's offline, so they're re-read on every update and the layout
     is rebuilt only when they change. */
  #updateAms3hZones(hass) {
    const zones = findAmsZones(hass, this._deviceId);
    const key = JSON.stringify(zones.map((z) => [z.zone, z.slots, z.humidity?.entity_id, z.temperature?.entity_id, z.dryingTime?.entity_id]));
    if (key === this._zonesKey) return;
    this._zonesKey = key;
    const dryBox = findDryBoxZone(zones);
    this._entities = {
      ...this._entities,
      zones,
      // AMS 3H: the back row, the dry box and the front row, laid out like the unit
      ams3hLayout: dryBox ? layoutAms3h(this._trays, dryBox) : undefined,
    };
  }

  render() {
    if (this._style == "graphic" && !this._isAms3h()) {
      return html` <graphic-ams-card /> `;
    } else {
      // Custom remaining sensors are configured per tray; key them by the tray's entity.
      const customRemaining = {};
      TRAY_NUMBERS.forEach((n) => {
        const tray = this._entityList[`tray_${n}`]?.entity_id;
        if (tray && this._customRemaining[n - 1]) {
          customRemaining[tray] = this._customRemaining[n - 1];
        }
      });
      return html`
        <vector-ams-card
          .customRemaining=${customRemaining}
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
}