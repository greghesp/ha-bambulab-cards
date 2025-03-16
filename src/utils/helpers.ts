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

export interface Entity {
  entity_id: string;
  device_id: string;
  labels: any[];
  translation_key: string;
  platform: string;
  name: string;
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
        if (value.platform == 'bambu_lab') {
          if (key == value.translation_key) {
            result[key] = value;
          }
        }
        else if (value.platform == 'mqtt') {
          let regex;
          if (key.startsWith('^')) {
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
  return hass.callService("bambu_lab", "get_filament_data", {
    entity_id: [ target_id ]
  },
  undefined,
  true,
  true);
}

export async function setFilament(hass, target_id, tray_info_idx, tray_type, color, min_temp, max_temp) {
  //github.com/home-assistant/frontend/blob/dev/src/types.ts#L251
  hass
    .callService("bambu_lab", "set_filament", {
       entity_id: [ target_id ],
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
    .callService("bambu_lab", "load_filament", { entity_id: [ target_id ] })
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
    .callService("bambu_lab", "unload_filament", { device_id: [ parentDeviceId ] })
    .then(() => {
      console.log("Unload filament service called successfully");
      return true;
    })
    .catch((error) => {
      console.error("Error calling unload filament service:", error);
      return false;
    });
}
