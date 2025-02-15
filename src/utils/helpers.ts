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
  const mins  = Math.round(minutes % 60);      // Get the remaining minutes, rounded
  const days  = Math.floor(minutes / (60*24)); // Get the whole days
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

export async function asyncFilterBambuDevices(hass, device_id, entities: string[]): Promise<{ [key: string]: Entity }> {
  const result: { [key: string]: Entity } = {}
  // Loop through all hass entities, and find those that belong to the selected device
  for (let k in hass.entities) {
    const value = hass.entities[k];
    if (value.device_id === device_id) {
      const r = await asyncGetEntity(hass, value.entity_id);
      for (const key of entities) {
        const regex = new RegExp(`^[^_]+_${key}$`);
        if (regex.test(r.unique_id)) {
          result[key] = r
        }
      };
    }
  }
  return result;
}

export function isEntityUnavailable(hass, entity: Entity): boolean {
  return hass.states[entity?.entity_id]?.state == 'unavailable';
}

export function getLocalizedEntityState(hass, entity: Entity) {
  const entityId = entity.entity_id;
  const entityClass = entityId.substring(0, entityId.indexOf('.'));
  const entityState = hass.states[entityId]?.state;
  if (entityId && entityState) {
    // Example localization key:
    // "component.bambu_lab.entity.sensor.stage.state.idle"
    const key = `component.bambu_lab.entity.${entityClass}.${entity.translation_key}.state.${entityState}`;
    return hass.localize(key) || entityState;
  }
  else {
    return "";
  }
}

export function getEntityState(hass, entity: Entity) {
  const entityId = entity.entity_id;
  const entityState = hass.states[entityId]?.state;
  if (entityState) {
    return entityState;
  }
  else {
    return "";
  }
}
