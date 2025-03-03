import { HomeAssistant } from '../types/homeassistant';

export interface Entity {
  entity_id: string;
  device_id: string;
  labels: any[];
  translation_key: string;
  platform: string;
  name: string;
}

export function getContrastingTextColor(hexColor: string): string {
  // Remove the '#' if present
  const cleanHexColor = hexColor.replace("#", "");

  // Convert the hex color to RGB
  const r = parseInt(cleanHexColor.substring(0, 2), 16);
  const g = parseInt(cleanHexColor.substring(2, 4), 16);
  const b = parseInt(cleanHexColor.substring(4, 6), 16);

  // Calculate the luminance of the color
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // If luminance is greater than 128, the color is light, so we return black text, otherwise white
  return luminance > 128 ? "#000000" : "#FFFFFF";
}

export function rgbaToInt(r: number, g: number, b: number, a: number): number {
  return r | (g << 8) | (b << 16) | (a << 24);
}

export function formatMinutes(minutes: number): string {
  const mins = Math.round(minutes % 60); // Get the remaining minutes, rounded
  const days = Math.floor(minutes / (60 * 24)); // Get the whole days
  const hours = Math.floor(minutes / 60) % 24; // Get the whole hours

  // Create a readable string
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${mins}m`);

  return parts.join(' ');
}

export async function asyncGetEntity(hass: HomeAssistant, entityId: string): Promise<any> {
  return await hass.callWS({
    type: "config/entity_registry/get",
    entity_id: entityId,
  });
}

export function getBambuDeviceEntities(
  hass: HomeAssistant,
  deviceId: string,
  entities: string[]
): { [key: string]: Entity } {
  return Object.entries(hass.entities).reduce((acc, [_, value]) => {
    if (value.device_id === deviceId) {
      entities.forEach(key => {
        if (key === value.translation_key) {
          acc[key] = value;
        }
      });
    }
    return acc;
  }, {} as { [key: string]: Entity });
}

export function isEntityUnavailable(hass: HomeAssistant, entity?: Entity): boolean {
  if (!entity) return true;
  return hass.states[entity.entity_id]?.state === "unavailable";
}

export function getLocalizedEntityState(hass: HomeAssistant, entity: Entity): string {
  const entityId = entity.entity_id;
  const entityClass = entityId.substring(0, entityId.indexOf("."));
  const entityState = hass.states[entityId]?.state;

  if (entityId && entityState) {
    // Example localization key:
    // "component.bambu_lab.entity.sensor.stage.state.idle"
    const key = `component.bambu_lab.entity.${entityClass}.${entity.translation_key}.state.${entityState}`;
    return hass.localize(key) || entityState;
  }
  
  return "";
}

export function getEntityState(hass: HomeAssistant, entity: Entity): string {
  return hass.states[entity.entity_id]?.state || "";
}

export function createEntityMoreInfoEvent(entityId: string): CustomEvent {
  return new CustomEvent("hass-more-info", {
    detail: { entityId },
    bubbles: true,
    composed: true, // Make the event work across shadow DOM boundaries
  });
}

interface FilamentConfig {
  trayInfoIdx: number;
  trayType: string;
  color: string;
  minTemp: number;
  maxTemp: number;
}

export async function setFilament(
  hass: HomeAssistant,
  targetId: string,
  config: FilamentConfig
): Promise<boolean> {
  try {
    await hass.callService("bambu_lab", "set_filament", {
      entity_id: [targetId],
      tray_info_idx: config.trayInfoIdx,
      tray_type: config.trayType,
      tray_color: config.color.substring(1),
      nozzle_temp_min: Number(config.minTemp),
      nozzle_temp_max: Number(config.maxTemp),
    });
    console.log("Set filament service called successfully");
    return true;
  } catch (error) {
    console.error("Error calling set filament service:", error);
    return false;
  }
}

export async function loadFilament(hass: HomeAssistant, targetId: string): Promise<boolean> {
  try {
    await hass.callService("bambu_lab", "load_filament", { entity_id: [targetId] });
    console.log("Load filament service called successfully");
    return true;
  } catch (error) {
    console.error("Error calling load filament service:", error);
    return false;
  }
}

export async function unloadFilament(hass: HomeAssistant, targetId: string): Promise<boolean> {
  try {
    const deviceId = hass.entities[targetId].device_id;
    const parentDeviceId = hass.devices[deviceId].via_device_id;

    await hass.callService("bambu_lab", "unload_filament", { device_id: [parentDeviceId] });
    console.log("Unload filament service called successfully");
    return true;
  } catch (error) {
    console.error("Error calling unload filament service:", error);
    return false;
  }
}
