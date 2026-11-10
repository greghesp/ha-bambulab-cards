/*
 * AMS card — the AMS 3H's drying zones
 *
 * The AMS 3H has no cabinet-wide humidity or temperature. Each of its drying zones reports its
 * own, plus the remaining drying time, and its sensors carry `zone` (1-based) and `slots` (the
 * 1-based tray numbers in the zone) attributes. They are found by the integration's
 * translation_key, never by entity id, which follows the Home Assistant language.
 */
import type { Entity } from "../../utils/helpers";

const ZONE_SENSORS = {
  humidity: "zone_humidity",
  temperature: "zone_temperature",
  dryingTime: "zone_remaining_drying_time",
} as const;

type ZoneSensor = keyof typeof ZONE_SENSORS;

export interface AmsZone {
  zone: number;
  slots: number[];
  humidity?: Entity;
  temperature?: Entity;
  dryingTime?: Entity;
}

function positiveInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** The zone number of a zone sensor: its zone attribute, else zone_id + 1. */
function zoneNumber(attributes: any): number | null {
  const zone = positiveInt(attributes?.zone);
  if (zone !== null) return zone;
  const zoneId = Number(attributes?.zone_id);
  return Number.isInteger(zoneId) && zoneId >= 0 ? zoneId + 1 : null;
}

/** The device's drying zones in zone order; empty for an AMS without zones. */
export function findAmsZones(hass: any, deviceId: string): AmsZone[] {
  if (!hass?.entities || !deviceId) return [];
  const sensorKeys = Object.keys(ZONE_SENSORS) as ZoneSensor[];
  const zones = new Map<number, AmsZone>();

  for (const entity of Object.values(hass.entities) as Entity[]) {
    if (entity.device_id !== deviceId || entity.platform !== "bambu_lab") continue;
    const sensor = sensorKeys.find((k) => ZONE_SENSORS[k] === entity.translation_key);
    const attributes = hass.states?.[entity.entity_id]?.attributes;
    if (!sensor || !attributes) continue;
    const zone = zoneNumber(attributes);
    if (zone === null) continue;

    const current = zones.get(zone) || { zone, slots: [] };
    const slots = Array.isArray(attributes.slots)
      ? attributes.slots.map(Number).filter((s: number) => Number.isInteger(s))
      : [];
    zones.set(zone, {
      ...current,
      slots: current.slots.length ? current.slots : slots,
      [sensor]: entity,
    });
  }

  return [...zones.values()].sort((a, b) => a.zone - b.zone);
}

/*
 * The AMS 3H layout: a back row of two spools beside the dry box (which holds the trays of the
 * smaller drying zone), and a front row of five spools.
 */

/** The dry box: the zone holding the fewest trays, when it holds fewer than every other zone. */
export function findDryBoxZone(zones: AmsZone[]): AmsZone | undefined {
  if (zones.length < 2) return undefined;
  const [smallest, next] = [...zones].sort((a, b) => a.slots.length - b.slots.length);
  return smallest.slots.length > 0 && smallest.slots.length < next.slots.length
    ? smallest
    : undefined;
}

export interface Ams3hLayout<T> {
  back: T[];
  dryBox: { zone: AmsZone; spools: T[] };
  front: T[];
}

const FRONT_ROW_SIZE = 5;

/**
 * Splits trays (in tray order) into the AMS 3H rows: the dry box zone's trays go in the dry box,
 * the lowest five of the rest in the front row, and the remainder in the back row. Which tray
 * sits where on the unit isn't reported, so the front/back split is by tray number.
 */
export function layoutAms3h<T>(
  trays: { tray: number; spool: T }[],
  dryBox: AmsZone
): Ams3hLayout<T> {
  const inBox = trays.filter((t) => dryBox.slots.includes(t.tray));
  const rest = trays.filter((t) => !dryBox.slots.includes(t.tray));
  return {
    back: rest.slice(FRONT_ROW_SIZE).map((t) => t.spool),
    dryBox: { zone: dryBox, spools: inBox.map((t) => t.spool) },
    front: rest.slice(0, FRONT_ROW_SIZE).map((t) => t.spool),
  };
}
