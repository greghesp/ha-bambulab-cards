declare namespace JSX {
  interface IntrinsicElements {
    'ha-dialog': any;
    'ha-dialog-header': any;
    'ha-icon-button': any;
    'ha-icon': any;
    'mwc-button': any;
    'ha-circular-progress': any;
    'ha-bambulab-spool': {
      key?: string;
      entity_id?: string;
      tag_uid?: number;
      show_type?: boolean;
      children?: React.ReactNode;
    };
    'ha-form': {
      hass?: any;
      data?: any;
      schema?: any[];
      computeLabel?: (schema: any) => string;
      onValueChanged?: (ev: CustomEvent) => void;
      children?: React.ReactNode;
    };
  }
} 