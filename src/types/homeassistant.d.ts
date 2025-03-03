export interface HomeAssistant {
  states: { [key: string]: any };
  devices: { [key: string]: Device };
  entities: { [key: string]: Entity };
  localize: (key: string) => string;
  callService: (domain: string, service: string, data: any) => Promise<void>;
  callWS: (data: any) => Promise<any>;
}

export interface Device {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  via_device_id?: string;
}

export interface Entity {
  entity_id: string;
  device_id: string;
  name: string;
  platform: string;
  translation_key: string;
  labels: any[];
}

export interface EntityState {
  entity_id: string;
  state: string;
  attributes: { [key: string]: any };
  last_changed: string;
  last_updated: string;
  context: {
    id: string;
    parent_id: string | null;
    user_id: string | null;
  };
} 