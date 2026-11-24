import { provide } from "@lit/context";
import { html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { customElement } from "../../../utils/custom-element";
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
  "target_chamber_temp",
  "target_chamber_temperature",
  "cooling_fan",
  "cooling_fan_speed",
  "cover_image",
  "current_layer",
  "developer_lan_mode",
  "door_open",
  "humidity",
  "hybrid_mode_blocks_control",
  "image|p1p_camera",
  "mqtt_connection_mode",
  "mqtt_encryption",
  "model_download_percentage", // Node red does not have
  "nozzle_temp",
  "pause",
  "pick_image", // Node red does not have
  "power",
  "p1s_upgrade_installed",
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
    const previous = this._hass;
    this._hass = hass;

    if (!previous) {
      this._resolveMockDevice();
    }

    // hass.entities is only replaced when the entity registry changes, such as when an entity is
    // disabled or enabled, so that's the only time the entities have to be looked up again.
    if (!previous || previous.entities !== hass.entities) {
      this._deviceEntities = this._resolveDeviceEntities();
    }
  }

  private _resolveMockDevice() {
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
  }

  private _resolveDeviceEntities(): { [key: string]: helpers.Entity } {
    const entityList = ENTITIES.concat(Object.keys(NODEREDENTITIES));
    const entities = helpers.getBambuDeviceEntities(this._hass, this._device_id, entityList);

    // Override the entity list with the Node-RED entities if configured.
    for (const e in NODEREDENTITIES) {
      const target = NODEREDENTITIES[e];
      if (entities[e]) {
        entities[target] = entities[e];
      }
    }

    // Override the entity list with the custom entities if configured.
    if (this._customEntities) {
      for (const [key, entityId] of Object.entries(this._customEntities)) {
        // Keep an override that was already found if it has no state right now.
        const known = this._deviceEntities?.[key];
        const custom =
          this._hass.states[entityId] ?? (known?.entity_id === entityId ? known : undefined);
        if (entityId && custom) {
          entities[key] = custom;
        }
      }
    }

    return entities;
  }
}
