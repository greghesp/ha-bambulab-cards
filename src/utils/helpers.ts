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
  entities: string[]
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
  return hass.states[entity?.entity_id]?.state == "unavailable";
}

export function getLocalizedEntityState(hass, entity: Entity) {
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
  let formattedString = hass.formatEntityState(hass.states[entity_id]);
  return formattedString.replace(/\s+/g, ""); // Strip space before temperature symbol to save space.
}

export function getEntityState(hass, entity: Entity) {
  const entityId = entity.entity_id;
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
  return hass.callService(
    "bambu_lab",
    "get_filament_data",
    {
      entity_id: [target_id],
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
      entity_id: [target_id],
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

export async function loadFilament(hass, target_id) {
  //github.com/home-assistant/frontend/blob/dev/src/types.ts#L251
  hass
    .callService("bambu_lab", "load_filament", { entity_id: [target_id] })
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
  const deviceId = hass.entities[target_id].device_id;
  const parentDeviceId = hass.devices[deviceId].via_device_id;

  hass
    .callService("bambu_lab", "unload_filament", { device_id: [parentDeviceId] })
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
  return entity.attributes[attribute];
}

export function toggleLight(hass, entity) {
  const data = {
    entity_id: entity.entity_id,
  };
  const lightOn = getEntityState(hass, entity) == "on";
  const service = lightOn ? "turn_off" : "turn_on";
  hass.callService("light", service, data);
}

export function clickButton(hass: any, entity: Entity) {
  const data = {
    entity_id: entity.entity_id,
  };
  hass.callService("button", "press", data);
}

export function isSkipButtonEnabled(hass, entities) {
  if (!entities["ftp"]) {
    return false;
  }

  const ftpState = hass.states[entities["ftp"].entity_id].state;

  // Only show the Skip button when the integration is configured to enable model download off the printer.
  if (ftpState == "on") {
    const printableObjects = getEntityAttribute(
      hass,
      entities["printable_objects"].entity_id,
      "objects"
    );

    const countOfPrintableObjects = Object.keys(printableObjects).length;

    const pickImageState = hass.states[entities["pick_image"].entity_id].state;
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
  } else {
    return false;
  }
}

export function isEntityStateUnknown(hass, entity: Entity): boolean {
  return hass.states[entity?.entity_id]?.state == undefined;
}

export function getImageUrl(hass, entity: Entity): string {
  if (isEntityUnavailable(hass, entity)) {
    console.log("Image unavailable");
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