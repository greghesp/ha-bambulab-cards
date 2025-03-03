export interface HomeAssistant {
  states: Record<string, any>;
  entities?: Record<string, Entity>;
  // Remove devices if it's not provided by Home Assistant
  callService: (domain: string, service: string, data: any) => void;
  // Other properties...
}

export interface Entity {
  entity_id: string;
  device_id?: string;
  // Other properties...
}
