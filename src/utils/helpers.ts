import { nothing } from "lit";

export interface Entity {
  entity_id: string;
  device_id: string;
  labels: any[];
  translation_key: string;
  platform: string;
  name: string;
}

export function formatTimeRemaining(minutes: number): string {
  if (minutes <= 0) return "0m";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  } else if (remainingMinutes === 0) {
    return `${hours}hr`;
  } else {
    return `${hours}hr ${remainingMinutes}m`;
  }
}

export function getContrastingTextColor(hexColor) {
  // Remove the '#' if present
  hexColor = hexColor.replace("#", "");

  // Convert the hex color to RGB
  let r = parseInt(hexColor.substring(0, 2), 16);
  let g = parseInt(hexColor.substring(2, 4), 16);
  let b = parseInt(hexColor.substring(4, 6), 16);

  // Calculate the luminance of the color
  let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // If luminance is greater than 128, the color is light, so we return black text, otherwise white
  return luminance > 128 ? "#000000" : "#FFFFFF";
}

export function rgbaToInt(r, g, b, a) {
  return r | (g << 8) | (b << 16) | (a << 24);
}

export function formatMinutes(minutes: number): string {
  const mins = Math.round(minutes % 60); // Get the remaining minutes, rounded
  const days = Math.floor(minutes / (60 * 24)); // Get the whole days
  const hours = Math.floor(minutes / 60) % 24; // Get the whole hours

  // Create a readable string
  let result = "";
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  result += `${mins}m`;

  return result.trim();
}

export async function asyncGetEntity(hass, entity_id) {
  return await hass.callWS({
    type: "config/entity_registry/get",
    entity_id: entity_id,
  });
}

export function getBambuDeviceEntities(
  hass,
  device_id,
  entities: string[],
  indexedAttribute: string = "slot"
): { [key: string]: Entity } {
  const result: { [key: string]: Entity } = {};
  // Loop through all hass entities, and find those that belong to the selected device
  for (let k in hass.entities) {
    const value = hass.entities[k];
    if (value.device_id === device_id) {
      for (const key of entities) {
        if (value.platform == "bambu_lab") {
          const divider = key.indexOf('|')
          if (divider != -1) {
            const type = key.slice(0, divider)
            const name = key.slice(divider + 1)
            if (value.entity_id.startsWith(type) && name == value.translation_key) {
              result[name] = value;
            }
          } else {
            if (key == value.translation_key) {
              result[key] = value;
            } else {
              // Support numbered requests via a shared translation key and state attribute
              // e.g. "tray_1" matches translation_key "tray" with slot=1
              // e.g. "hotend_rack_printtool_2" matches translation_key "hotend_rack_printtool" with tool=2
              const numberedKey = key.match(/^(.+)_(\d+)$/)
              if (numberedKey && value.translation_key === numberedKey[1]) {
                const index = hass.states[value.entity_id]?.attributes?.[indexedAttribute]
                if (index != null && String(index) === numberedKey[2]) {
                  result[key] = value
                }
              }
            }
          }
        } else if (value.platform == "mqtt") {
          let regex;
          if (key.startsWith("^")) {
            regex = new RegExp(key);
          } else {
            regex = new RegExp(`.*${key}$`);
          }
          if (regex.test(value.entity_id)) {
            result[key] = value;
          }
        }
      }
    }
  }
  return result;
}

export function getAllBambuDeviceEntities(hass): { [key: string]: Entity } {
  const result: { [key: string]: Entity } = {};
  for (let k in hass.entities) {
    const value = hass.entities[k];
    if (value.platform == "bambu_lab") {
      result[value.translation_key] = value;
    }
  }
  return result;
}

export function isEntityUnavailable(hass, entity: Entity): boolean {
  if (!entity?.entity_id) {
    return true;
  }
  // An entity has no state while it's being disabled, or until it's loaded again after being enabled.
  const state = hass.states[entity.entity_id]?.state;
  return state == undefined || state == "unavailable";
}

// What the integration reports as the name and type of a tray with no spool in it
export const EMPTY_TRAY = "Empty";

// Home Assistant can't translate attribute values, but it does translate attribute names, so
// the name of the tray's "empty" attribute is the translated word for it.
export function getEmptyTrayLabel(hass, entity_id: string): string {
  const domain = entity_id?.split(".")[0];
  const translationKey = hass.entities?.[entity_id]?.translation_key;
  // Example localization key:
  // "component.bambu_lab.entity.sensor.tray.state_attributes.empty.name"
  const key = `component.bambu_lab.entity.${domain}.${translationKey}.state_attributes.empty.name`;
  return hass.localize?.(key) || EMPTY_TRAY;
}

// A tray's "name" or "type" attribute for display
export function getTrayText(hass, entity_id: string, attribute: "name" | "type") {
  const value = hass.states[entity_id]?.attributes[attribute];
  return value === EMPTY_TRAY ? getEmptyTrayLabel(hass, entity_id) : value;
}

export function getLocalizedEntityState(hass, entity: Entity) {
  // Disabled entities are not in hass.entities, so callers can pass undefined.
  if (!entity?.entity_id) {
    return "";
  }
  const entityId = entity.entity_id;
  const entityClass = entityId.substring(0, entityId.indexOf("."));
  const entityState = hass.states[entityId]?.state;
  if (entityId && entityState) {
    // Example localization key:
    // "component.bambu_lab.entity.sensor.stage.state.idle"
    const key = `component.bambu_lab.entity.${entityClass}.${entity.translation_key}.state.${entityState}`;
    return hass.localize(key) || entityState;
  } else {
    return "";
  }
}

export function getFormattedEntityState(hass, entity_id) {
  const value = Math.floor(hass.states[entity_id].state);
  const unit = hass.states[entity_id].attributes.unit_of_measurement;
  return `${value}${unit}`;
}

export function getEntityState(hass, entity: Entity) {
  // Disabled entities are not in hass.entities, so callers can pass undefined.
  const entityId = entity?.entity_id;
  const entityState = hass.states[entityId]?.state;
  if (entityState) {
    return entityState;
  } else {
    return "";
  }
}

export function showEntityMoreInfo(obj: HTMLElement, entity: Entity) {
  const entity_id = entity.entity_id;
  const event = new CustomEvent("hass-more-info", {
    detail: {
      entityId: entity.entity_id,
    },
    bubbles: true,
    composed: true, // Make the event work across shadow DOM boundaries
  });
  obj.dispatchEvent(event);
}

export async function getFilamentData(hass, target_id) {
  return hass.callService( "bambu_lab", "get_filament_data", {
      entity_id: target_id
    },
    undefined,
    true,
    true
  );
}

export async function setFilament(
  hass,
  target_id,
  tray_info_idx,
  tray_type,
  color,
  min_temp,
  max_temp
) {
  //github.com/home-assistant/frontend/blob/dev/src/types.ts#L251
  hass
    .callService("bambu_lab", "set_filament", {
      entity_id: target_id,
      tray_info_idx: tray_info_idx,
      tray_type: tray_type,
      tray_color: color.substring(1),
      nozzle_temp_min: Number(min_temp),
      nozzle_temp_max: Number(max_temp),
    })
    .then(() => {
      console.log("Set filament service called successfully");
      return true;
    })
    .catch((error) => {
      console.error("Error calling set filament service:", error);
      return false;
    });
}

export async function refreshRFID(hass, target_id) {
  hass
    .callService("bambu_lab", "read_rfid", { entity_id: target_id })
    .then(() => {
      console.log("ams_read_rfid service called successfully");
      return true;
    })
    .catch((error) => {
      console.error("Error calling ams_read_rfid service:", error);
      return false;
    });
}

export async function loadFilament(hass, target_id) {
  //github.com/home-assistant/frontend/blob/dev/src/types.ts#L251
  hass
    .callService("bambu_lab", "load_filament", {
        entity_id: target_id
    })
    .then(() => {
      console.log("Load filament service called successfully");
      return true;
    })
    .catch((error) => {
      console.error("Error calling load filament service:", error);
      return false;
    });
}

export async function unloadFilament(hass, target_id) {
  //github.com/home-assistant/frontend/blob/dev/src/types.ts#L251
  const device_id = hass.entities[target_id].device_id;

  hass
    .callService("bambu_lab", "unload_filament", {
      device_id: device_id
    })
    .then(() => {
      console.log("Unload filament service called successfully");
      return true;
    })
    .catch((error) => {
      console.error("Error calling unload filament service:", error);
      return false;
    });
}

export function getEntityAttribute(hass, entity_id, attribute) {
  const entity = hass.states[entity_id];
  return entity?.attributes[attribute];
}

export function toggleLight(hass, entity) {
  const data = {
    entity_id: entity.entity_id,
  };
  const lightOn = getEntityState(hass, entity) == "on";
  const service = lightOn ? "turn_off" : "turn_on";
  // A custom light can be a switch, such as a lamp on a smart plug.
  const domain = entity.entity_id.split(".")[0];
  hass.callService(domain, service, data);
}

export function clickButton(hass: any, entity: Entity) {
  const data = {
    entity_id: entity.entity_id,
  };
  hass.callService("button", "press", data);
}

export function isSkipButtonEnabled(hass, entities) {
  const printableObjects = getEntityAttribute(
    hass,
    entities["printable_objects"]?.entity_id,
    "objects"
  );
  if (printableObjects == undefined) {
    return false;
  }

  const countOfPrintableObjects = Object.keys(printableObjects ?? {}).length;

  const pickImageState = hass.states[entities["pick_image"]?.entity_id]?.state;
  if (
    pickImageState == undefined ||
    countOfPrintableObjects < 2 ||
    countOfPrintableObjects > 64
  ) {
    return false;
  }

  if (
    isEntityUnavailable(hass, entities["stop"]) ||
    isEntityStateUnknown(hass, entities["pick_image"])
  ) {
    return false;
  }
  return true;
}

export function isEntityStateUnknown(hass, entity: Entity): boolean {
  return hass.states[entity?.entity_id]?.state == undefined;
}

export function getImageUrl(hass, entity: Entity): string {
  if (isEntityUnavailable(hass, entity)) {
    return "";
  } else {
    const imageEntityId = entity.entity_id;
    const imageState = hass.states[imageEntityId].state;
    return `${hass.states[imageEntityId].attributes.entity_picture}&state=${imageState}`;
  }
}

// Helper to get the stream URL for the camera entity
export function getCameraStreamUrl(hass, entity: Entity): string {
  if (isEntityUnavailable(hass, entity)) {
    console.log("Camera unavailable");
    return "";
  } else {
    const entityId = entity.entity_id;
    const token = hass.states[entityId].attributes.access_token;
    //console.log("URL", `/api/camera_proxy_stream/${entityId}?token=${token}`);
    return `/api/camera_proxy_stream/${entityId}?token=${token}`;
  }
}

export function getAttachedDeviceIds(hass, device_id): string[] {
  const devices: string[] = [];

  // Find all devices that are connected via this device
  const connectedDevices = Object.values(hass.devices)
    .filter((device: any) => device.via_device_id === device_id);
  
  // Add each connected device to the list
  connectedDevices.forEach((device: any) => {
    devices.push(device.id);
  });

  
  return devices;
}

export function isMqttEncryptionEnabled(hass, deviceEntities) {
    // Check if mqtt encryption is present and enabled.
    // Disabled entities are not in hass.entities, so either can be missing.
    if (hass.states[deviceEntities.mqtt_encryption?.entity_id]?.state == "on" &&
        hass.states[deviceEntities.developer_lan_mode?.entity_id]?.state == "off") {
        return true;
    }

    return false;
}

// Same check for a tray. Trays are on the AMS or external spool device, so the sensors to
// look at are on the printer that device is connected to.
export function isTrayMqttEncryptionEnabled(hass, tray_entity_id: string): boolean {
    const deviceId = hass.entities?.[tray_entity_id]?.device_id;
    const printerId = hass.devices?.[deviceId]?.via_device_id;
    if (!printerId) {
        return false;
    }

    const printerEntities = getBambuDeviceEntities(hass, printerId, ["mqtt_encryption", "developer_lan_mode"]);
    return isMqttEncryptionEnabled(hass, printerEntities);
}

export function isHybridMqttConnection(hass, deviceEntities) {
    return hass.states[deviceEntities.hybrid_mode_blocks_control?.entity_id]?.state == "on";
}

export function getFormattedTime(hass, entity_id) {
    const stateObj = hass.states[entity_id]
    const unit = stateObj.attributes.unit_of_measurement;
    let value = Number(stateObj.state);

    switch (unit) {
      case "s":
        value = value;
        break;
      case "min":
        value = value * 60;
        break;
      case "h":
        value = value * 3600;
        break;
      case "d":
        value = value * 86400;
        break;
      default:
        console.warn(`Unknown duration unit: ${unit}`);
    }

    const days = Math.floor(value / 86400);
    const hours = Math.floor((value % 86400) / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const seconds = Math.floor(value % 60);

    const locale = hass.locale?.language ?? navigator.language;
    const fmt = new (Intl as any).DurationFormat(locale, { style: "narrow" });
    if (days != 0) {
      return fmt.format({
        days: days,
        hours: hours,
      });
    } else if (hours != 0) {
      return fmt.format({
        hours: hours,
        minutes: minutes,
      });
    } else {
      return fmt.format({
        minutes: minutes,
        seconds: seconds,
      });
    }
}

// When the print will end, as a clock time in the user's format. Adds the weekday if that's not
// today, or the date if it's six or more days away. Returns "" when it's not known or nothing is
// printing: the end time isn't updated while a print is paused and is left over once it's done.
export function getFormattedEndTime(hass, deviceEntities): string {
  if (hass.states[deviceEntities.print_status?.entity_id]?.state !== "running") {
    return "";
  }
  const end = new Date(hass.states[deviceEntities.end_time?.entity_id]?.state);
  if (isNaN(end.getTime())) {
    return "";
  }

  // Follow the time format and time zone set in the user's Home Assistant profile
  const timeFormat = hass.locale?.time_format;
  const language = timeFormat === "system" ? undefined : hass.locale?.language;
  const options: Intl.DateTimeFormatOptions & { hourCycle?: string } = {
    hour: "numeric",
    minute: "2-digit",
    timeZone: hass.locale?.time_zone === "server" ? hass.config?.time_zone : undefined,
  };
  if (timeFormat === "12" || timeFormat === "24") {
    options.hourCycle = timeFormat === "12" ? "h12" : "h23";
  }

  const now = new Date();
  const dayOf = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: options.timeZone });
  if (dayOf(end) !== dayOf(now)) {
    if (Math.abs(end.getTime() - now.getTime()) < 6 * 24 * 60 * 60 * 1000) {
      options.weekday = "short";
    } else {
      options.month = "short";
      options.day = "numeric";
    }
  }
  return new Intl.DateTimeFormat(language, options).format(end);
}

// A power sensor in whole watts
export function getFormattedPower(hass, entity: Entity): string {
  const stateObj = hass.states[entity?.entity_id];
  const value = parseFloat(stateObj?.state);
  if (isNaN(value)) {
    return "--";
  }
  const isKilowatts = stateObj.attributes.unit_of_measurement === "kW";
  return `${Math.round(isKilowatts ? value * 1000 : value)}W`;
}

// Helper to check if two models are compatible (P1P, P1S, X1C, X1E are equivalent)
export function areModelsCompatible(modelA: string, modelB: string): boolean {
    const eqSet = ["P2S", "P1P", "P1S", "X1C", "X1E"];
    // TO BE DETERMINED:
    // Is H2C compatible with H2D?
    // Is P2S really compatible given it has a different filament cutter?
    const normA = modelA.trim().toUpperCase();
    const normB = modelB.trim().toUpperCase();
    if (eqSet.includes(normA) && eqSet.includes(normB)) return true;
    return normA === normB;
}