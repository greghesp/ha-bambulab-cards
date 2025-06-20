import { provide } from "@lit/context";
import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { PRINTER_MODELS } from "~/const";
import { MANUFACTURER } from "~/const";
import { entitiesContext, hassContext } from "~/utils/context";
import * as helpers from "~/utils/helpers";

const ENTITIES: string[] = [
  "aux_fan",
  "aux_fan_speed",
  "bed_temp",
  "camera|camera",
  "chamber_fan",
  "chamber_fan_speed",
  "chamber_light",
  "chamber_temp",
  "cooling_fan",
  "cooling_fan_speed",
  "cover_image",
  "current_layer",
  "developer_lan_mode",
  "door_open",
  "ftp", // Node red does not have
  "humidity",
  "mqtt_encryption",
  "nozzle_temp",
  "pause",
  "pick_image", // Node red does not have
  "power",
  "print_progress",
  "print_status",
  "printable_objects",
  "printing_speed", // Select - note the unique id is inconsistent as '..._Speed'
  "remaining_time",
  "resume",
  "skipped_objects", // Node red does not have
  "speed_profile", // Sensor
  "stage",
  "stop",
  "target_bed_temp",
  "target_bed_temperature",
  "target_nozzle_temp",
  "target_nozzle_temperature",
  "total_layers",
];

const NODEREDENTITIES: { [key: string]: string } = {
  bed_target_temperature: "target_bed_temp",
  bed_temperature: "bed_temp",
  "^fan.*big_fan1$": "aux_fan",
  "^fan.*big_fan2$": "chamber_fan",
  chamber_temperature: "chamber_temp",
  door: "door_open",
  nozzle_target_temperature: "target_nozzle_temp",
  nozzle_temperature: "nozzle_temp",
  print_preview: "cover_image",
  print_remaining_time: "remaining_time",
  set_bed_temp: "target_bed_temperature",
  set_nozzle_temp: "target_nozzle_temperature",
  pause_print: "pause",
  resume_print: "resume",
  "^select.*_speed$": "printing_speed",
  "^sensor.*_speed$": "speed_profile",
  stop_print: "stop",
};

export default class EntityProvider extends LitElement {
  @property({ type: String }) public _device_id: string | undefined;
  @property({ type: Object })
  public _customEntities!: { [key: string]: string } | Object;

  @state() public _hass?: any;

  @state() public _deviceEntities!: { [key: string]: helpers.Entity } | Object;

  set hass(hass) {
    if (this._hass) {
      this._hass = hass;
      return
    }
    
    this._hass = hass;

    if (this._device_id == "MOCK") {
      Object.keys(this._hass.devices).forEach((key) => {
        const device = this._hass.devices[key];
        if (device.manufacturer == MANUFACTURER) {
          if (PRINTER_MODELS.includes(device.model)) {
            this._device_id = key;
          }
        }
      });
    }

    let entityList = ENTITIES.concat(Object.keys(NODEREDENTITIES));
    this._deviceEntities = helpers.getBambuDeviceEntities(hass, this._device_id, entityList);

    // Override the entity list with the Node-RED entities if configured.
    for (const e in NODEREDENTITIES) {
      const target = NODEREDENTITIES[e];
      if (this._deviceEntities[e]) {
        this._deviceEntities[target] = this._deviceEntities[e];
      }
    }

    // Override the entity list with the custom entities if configured.
    if (this._customEntities) {
      for (const [key, entityId] of Object.entries(this._customEntities)) {
        if (entityId && this._hass.states[entityId]) {
          this._deviceEntities[key] = this._hass.states[entityId];
        }
      }
    }
  }
}
