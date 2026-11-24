export interface InventorySpool {
  id?: number | string;
  filamentVendor?: string | null;
  filamentType?: string | null;
  filamentName?: string | null;
  filamentId?: string | null;
  RFID?: string | null;
  color?: string | null;
  colors?: string[] | null;
  netWeight?: number | string | null;
  totalNetWeight?: number | string | null;
  trayIdName?: string | null;
  note?: string | null;
  displayName?: string | null;
  inPrinter?: boolean | null;
  devId?: string | null;
  deviceName?: string | null;
  amsSn?: string | null;
  amsId?: number | null;
  slotId?: string | number | null;
}

export interface SpoolLocation {
  printerId: string;
  printerName: string;
  deviceName: string;
  slot?: number | string;
}

export function normalizeRfid(value: unknown): string {
  const rfid = typeof value === "string" ? value.replace(/[^a-fA-F0-9]/g, "").toUpperCase() : "";
  return rfid && !/^0+$/.test(rfid) ? rfid : "";
}

export function getSpoolLocations(hass: any): Map<string, SpoolLocation[]> {
  const locations = new Map<string, SpoolLocation[]>();
  for (const entity of Object.values(hass?.entities || {}) as any[]) {
    if (entity.platform !== "bambu_lab" || !["tray", "external_spool"].includes(entity.translation_key)) continue;
    const state = hass.states?.[entity.entity_id];
    const rfid = normalizeRfid(state?.attributes?.tag_uid);
    if (!rfid) continue;
    const device = hass.devices?.[entity.device_id];
    if (!device) continue;
    let printer = device;
    const visited = new Set<string>();
    while (printer.via_device_id && hass.devices?.[printer.via_device_id] && !visited.has(printer.via_device_id)) {
      visited.add(printer.via_device_id);
      printer = hass.devices[printer.via_device_id];
    }
    if (printer === device && !device.via_device_id) continue;
    const location = {
      printerId: printer.id,
      printerName: printer.name_by_user || printer.name || "Printer",
      deviceName: device.name_by_user || device.name || "AMS",
      slot: state.attributes.slot,
    };
    locations.set(rfid, [...(locations.get(rfid) || []), location]);
  }
  return locations;
}

export function spoolLocations(spool: InventorySpool, locations: Map<string, SpoolLocation[]>): SpoolLocation[] {
  if (spool.inPrinter === false) return [];
  if (spool.inPrinter === true) {
    const slot = spool.slotId == null || spool.slotId === "" ? undefined : Number(spool.slotId);
    return [{
      printerId: spool.devId || spool.deviceName || "__unknown_printer__",
      printerName: spool.deviceName || "Unknown printer",
      deviceName: spool.amsSn || spool.amsId != null ? "AMS" : "",
      slot: slot !== undefined && Number.isInteger(slot) && slot >= 0 ? slot + 1 : undefined,
    }];
  }
  return locations.get(normalizeRfid(spool.RFID)) || [];
}

export function weight(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : undefined;
}