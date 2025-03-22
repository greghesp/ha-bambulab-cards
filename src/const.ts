export const PREFIX_NAME = "ha-bambulab";
export const INTEGRATION_DOMAIN = "bambu_lab";
export const MANUFACTURER = "Bambu Lab";
export const PRINTER_MODELS = [
  "A1",
  "A1 MINI",
  "A1 Mini",
  "A1MINI",
  "A1Mini",
  "A1mini",
  "P1P",
  "P1S",
  "X1C",
  "X1E",
];
export const AMS_MODELS = ["AMS", "AMS Lite"];

// Home Assistant entities key -> Node-RED entities value
const NODEREDENTITIES_MAP: { [key: string]: string } = {
  bed_target_temperature: "target_bed_temp",
  aux_fan_speed: "big_fan1",
  chamber_fan_speed: "big_fan2",
  chamber_temperature: "chamber_temp",
  enclosure_door: "door_open",
  nozzle_target_temperature: "target_nozzle_temp",
  nozzle_temperature: "nozzle_temp",
  pick_image: "cover_image",
  remaining_time: "print_remaining_time",
  set_bed_temp: "target_bed_temperature",
  set_nozzle_temp: "target_nozzle_temperature",
};

// Home Assistant entities key -> Node-RED entities value
const NODEREDSETTERS_MAP: { [key: string]: string } = {
  target_bed_temperature: "set_bed_temp",
  target_nozzle_temperature: "set_nozzle_temp",
};
