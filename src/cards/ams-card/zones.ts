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
