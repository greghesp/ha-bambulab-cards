/*
 * AMS 3H Card — group the AMS 3H trays by drying zone
 *
 * The AMS 3H has nine trays split across two drying zones. Each zone reports its own
 * temperature, humidity and remaining drying time, and its sensors carry a `slots` attribute
 * (1-based tray numbers) saying which trays are in it. Entities are found by the
 * integration's translation_key, never by entity id, which follows the HA language.
 */

export const ZONE_SENSOR_KEYS = {
  temperature: "zone_temperature",
  humidity: "zone_humidity",
  dryingTime: "zone_remaining_drying_time",
} as const;

export type ZoneSensor = keyof typeof ZONE_SENSOR_KEYS;

export interface ZoneGroup {
  /** 1-based zone number, or null for trays no zone claims (or when there are no zone sensors). */
  zone: number | null;
  /** Tray entity ids in tray order. */
  trays: string[];
  /** Zone sensor entity ids, when the zone has them. */
  sensors: Partial<Record<ZoneSensor, string>>;
}

const ID_NUMBER = /_(\d+)$/;

/* hass.entities is only replaced when the entity registry changes, not on state updates, so the
   per-device entity list is cached against it instead of rescanning every entity per render. */
const deviceEntityCache = new WeakMap<object, Map<string, any[]>>();

function deviceEntities(hass: any, deviceId: string): any[] {
  if (!hass?.entities || !deviceId) return [];
  let byDevice = deviceEntityCache.get(hass.entities);
  if (!byDevice) {
    byDevice = new Map();
    deviceEntityCache.set(hass.entities, byDevice);
  }
  let list = byDevice.get(deviceId);
  if (!list) {
    list = Object.values(hass.entities).filter(
      (e: any) => e.device_id === deviceId && e.platform === "bambu_lab" && !e.disabled_by
    );
    byDevice.set(deviceId, list);
  }
  return list;
}

function positiveInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** The tray number of a tray entity: its slot attribute, else the number its id ends in. */
function trayNumber(hass: any, entityId: string): number | null {
  const slot = positiveInt(hass.states?.[entityId]?.attributes?.slot);
  if (slot !== null) return slot;
  const match = entityId.match(ID_NUMBER);
  return match ? positiveInt(match[1]) : null;
}

/** The zone number of a zone sensor: its zone attribute, else zone_id + 1. */
function zoneNumber(hass: any, entityId: string): number | null {
  const attrs = hass.states?.[entityId]?.attributes || {};
  const zone = positiveInt(attrs.zone);
  if (zone !== null) return zone;
  const zoneId = Number(attrs.zone_id);
  return Number.isInteger(zoneId) && zoneId >= 0 ? zoneId + 1 : null;
}

/** The device's tray entities, ordered by tray number. */
export function findTrays(hass: any, deviceId: string): string[] {
  return deviceEntities(hass, deviceId)
    .filter((e) => e.translation_key === "tray" && hass.states?.[e.entity_id])
    .map((e) => ({ id: e.entity_id as string, n: trayNumber(hass, e.entity_id) }))
    .filter((t): t is { id: string; n: number } => t.n !== null)
    .sort((a, b) => a.n - b.n)
    .map((t) => t.id);
}

/** The device's trays grouped by drying zone, zones in order, unzoned trays last. */
export function groupTraysByZone(hass: any, deviceId: string): ZoneGroup[] {
  const trays = findTrays(hass, deviceId);
  const zones = new Map<
    number,
    { sensors: Partial<Record<ZoneSensor, string>>; slots: number[] }
  >();

  for (const entity of deviceEntities(hass, deviceId)) {
    const sensor = (Object.keys(ZONE_SENSOR_KEYS) as ZoneSensor[]).find(
      (k) => ZONE_SENSOR_KEYS[k] === entity.translation_key
    );
    if (!sensor || !hass.states?.[entity.entity_id]) continue;
    const zone = zoneNumber(hass, entity.entity_id);
    if (zone === null) continue;
    const entry = zones.get(zone) || { sensors: {}, slots: [] };
    entry.sensors = { ...entry.sensors, [sensor]: entity.entity_id };
    const slots = hass.states[entity.entity_id].attributes?.slots;
    if (Array.isArray(slots) && slots.length && !entry.slots.length) {
      entry.slots = slots.map(Number).filter((s) => Number.isInteger(s));
    }
    zones.set(zone, entry);
  }

  const claimed = new Set<string>();
  const groups: ZoneGroup[] = [...zones.keys()]
    .sort((a, b) => a - b)
    .map((zone) => {
      const { sensors, slots } = zones.get(zone)!;
      const zoneTrays = trays.filter((id) => slots.includes(trayNumber(hass, id) as number));
      zoneTrays.forEach((id) => claimed.add(id));
      return { zone, trays: zoneTrays, sensors };
    });

  const unclaimed = trays.filter((id) => !claimed.has(id));
  if (unclaimed.length) groups.push({ zone: null, trays: unclaimed, sensors: {} });
  return groups;
}
