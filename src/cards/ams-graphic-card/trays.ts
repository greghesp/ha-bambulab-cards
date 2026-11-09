/*
 * AMS Graphic Card — find a device's tray entities
 *
 * Entity ids follow the Home Assistant language at the time the entity was created (a German
 * install names the trays "..._slot_1"), so the trays are identified by the integration's
 * translation_key and slot attribute rather than by the entity id.
 */

const ENTITY_ID_TRAY = /_tray_(\d+)$/;
const TRANSLATION_KEY_TRAY = /^tray_(\d+)$/;

/** The 1-based tray number of a tray entity, or null when the entity is not a tray. */
export function traySlot(hass: any, entityId: string): number | null {
  const entry = hass?.entities?.[entityId];
  const state = hass?.states?.[entityId];
  if (entry?.platform === "bambu_lab") {
    const key: string = entry.translation_key || "";
    if (key === "tray") {
      const slot = Number(state?.attributes?.slot);
      return Number.isInteger(slot) && slot > 0 ? slot : null;
    }
    const keyMatch = key.match(TRANSLATION_KEY_TRAY);
    return keyMatch ? Number(keyMatch[1]) : null;
  }
  // Entities from other integrations (e.g. an MQTT bridge) only have their id to go by.
  const idMatch = entityId.match(ENTITY_ID_TRAY);
  return idMatch ? Number(idMatch[1]) : null;
}

/** The tray entities among `entityIds` that have a state, ordered by tray number. */
export function findTrayEntities(hass: any, entityIds: string[]): string[] {
  return entityIds
    .filter((id) => hass?.states?.[id])
    .map((id) => ({ id, slot: traySlot(hass, id) }))
    .filter((t): t is { id: string; slot: number } => t.slot !== null)
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.id);
}
