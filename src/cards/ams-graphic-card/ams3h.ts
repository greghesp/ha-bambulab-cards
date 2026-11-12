/* AMS 3H entity resolution. Keep the nine positions even when a sensor is missing. */
import { traySlot } from "./trays";

export interface GraphicZone {
  temperature: string;
  humidity: string;
  remaining: string;
  drying: boolean;
  slots: number[];
}

export interface Ams3hData {
  zones: GraphicZone[]; // zone 1 is the dry box; zone 2 is the rest of the cabinet
  active: number;
  diameters: string[];
}

const available = (s: any): boolean =>
  !!s && !["unknown", "unavailable"].includes(s.state) && !s.attributes?.restored;

export function resolveAms3h(hass: any, cfg: any, device: any) {
  const states = hass.states || {};
  const entries = Object.entries(hass.entities || {}) as [string, any][];
  const owned = entries.filter(([, e]) => e.device_id === cfg.ams && !e.disabled_by);
  const trays = Array.from(
    { length: 9 },
    (_, i) =>
      cfg[`tray_${i + 1}`] ||
      cfg.trays?.[i] ||
      owned.find(([id]) => traySlot(hass, id) === i + 1)?.[0] ||
      ""
  );
  const zones = [1, 2].map((zone): GraphicZone => {
    const sensors = ["temperature", "humidity", "remaining_drying_time"].map((key) => {
      const id =
        cfg[`zone_${zone}_${key}`] ||
        owned.find(([id, e]) => {
          const a = states[id]?.attributes;
          const number = a?.zone ?? (a?.zone_id != null ? Number(a.zone_id) + 1 : undefined);
          return Number(number) === zone && e.translation_key === `zone_${key}`;
        })?.[0];
      return states[id];
    });
    const live = sensors.filter(available);
    const duration = live
      .map((s) => s.attributes?.dry_setting?.dry_duration)
      .find((v) => v != null);
    const slots = live.find((s) => Array.isArray(s.attributes?.slots))?.attributes.slots || [];
    const reading = (i: number, unit: string): string =>
      available(sensors[i])
        ? `${sensors[i].state}${sensors[i].attributes?.unit_of_measurement || unit}`
        : "—";
    return {
      temperature: reading(0, "°C"),
      humidity: reading(1, "%"),
      remaining: reading(2, " min"),
      drying: Number(duration) > 0,
      slots: slots.map(Number).filter((n: number) => Number.isInteger(n) && n >= 1 && n <= 9),
    };
  });
  const parent = device?.via_device_id;
  const printerEntity = (key: string): string => {
    const matches = entries.filter(
      ([id, e]) =>
        parent &&
        e.device_id === parent &&
        !e.disabled_by &&
        (e.translation_key === key || id.endsWith(`_${key}`))
    );
    return matches.length === 1 ? matches[0][0] : "";
  };
  const activeState = states[cfg.active_tray || printerEntity("active_tray")];
  let active = 0;
  if (available(activeState) && !["none", "", "?"].includes(String(activeState.state).toLowerCase())) {
    const value = String(activeState.state);
    const index = trays.indexOf(value);
    const number = /^(?:tray_)?([1-9])$/.exec(value);
    const slot = Number(activeState.attributes?.slot);
    if (index >= 0) active = index + 1;
    else if (number) active = Number(number[1]);
    else if (Number.isInteger(slot) && slot >= 1 && slot <= 9) active = slot;
    else {
      const uuid = String(activeState.attributes?.tray_uuid || "")
        .replace(/-/g, "")
        .toLowerCase();
      if (/^[0-9a-f]{32}$/.test(uuid) && !/^0+$/.test(uuid)) {
        const matches = trays
          .map((id, i) => ({ s: states[id], i }))
          .filter(
            ({ s }) =>
              available(s) &&
              String(s.attributes?.tray_uuid || "")
                .replace(/-/g, "")
                .toLowerCase() === uuid
          );
        if (matches.length === 1) active = matches[0].i + 1;
      }
    }
  }
  const printState = states[printerEntity("print_status")];
  if (printState && (!available(printState) || !["prepare", "running"].includes(printState.state)))
    active = 0;
  if (!available(states[trays[active - 1]])) active = 0;
  const diameters = Array.from({ length: 9 }, (_, i) => {
    const candidates = entries.filter(
      ([id, e]) =>
        parent &&
        !e.disabled_by &&
        (e.device_id === parent || hass.devices?.[e.device_id]?.via_device_id === parent) &&
        (e.translation_key === "printtool" || /_printtool_\d+$/.test(id)) &&
        Number(states[id]?.attributes?.tool) === i + 1
    );
    const tool = states[cfg[`tool_${i + 1}`] || (candidates.length === 1 ? candidates[0][0] : "")];
    const diameter = Number(tool?.attributes?.nozzle_diameter);
    return available(tool) && tool.state !== "empty" && diameter > 0 && Number.isFinite(diameter)
      ? `${diameter} mm`
      : "—";
  });
  return { trays, data: { zones, active, diameters } as Ams3hData };
}
