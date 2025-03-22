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
const NODERED_SENSORS_MAP: { [key: string]: string } = {
  aux_fan_speed: "big_fan1",
  chamber_fan_speed: "big_fan2",
  target_bed_temperature: "bed_target_temperature",
  cooling_fan_speed: "cooling_fan",
  current_layer: "layer_num",
  current_stage: "stage",
  heatbreak_fan_speed: "heatbreak_fan",
  nozzle_size: "nozzle_diameter",
  speed_profile: "speed",
  task_name: "subtask",
  total_layer_count: "layer_num",
  enclosure_door: "door",
  cover_image: "print_preview",
};

// Home Assistant entities key -> Node-RED entities value
const NODERED_CONTROL_MAP: { [key: string]: string } = {
  aux_fan: "big_fan1",
  bed_target_temperature: "set_bed_temp",
  chamber_fan: "big_fan2",
  nozzle_target_temperature: "set_nozzle_temp",
  printing_speed: "speed",
  pause_printing: "pause_print",
  resume_printing: "resume_print",
  stop_printing: "stop_print",
};

// Home Assistant entities key ->  Node-RED AMS entities value
const NODERED_AMS_MAP: { [key: string]: string } = {
  ams_temperature: "temp",
  humidity_index: "humidity_level",
  tray_1: "tray_0",
  tray_2: "tray_1",
  tray_3: "tray_2",
  tray_4: "tray_3",
};
