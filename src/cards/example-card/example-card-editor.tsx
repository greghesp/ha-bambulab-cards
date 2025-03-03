import React, { useMemo } from 'react';
import { HomeAssistant } from '../../types/homeassistant';
import './example-card-editor.css';

interface ExampleCardEditorProps {
  hass: HomeAssistant;
  config: {
    show_header?: boolean;
    header?: string;
    subtitle?: string;
  };
  setConfig: (config: any) => void;
}

interface SchemaItem {
  name: string;
  label: string;
  type?: string;
  selector: {
    boolean?: Record<string, never>;
    text?: Record<string, never>;
  };
}

export const ExampleCardEditor: React.FC<ExampleCardEditorProps> = ({
  hass,
  config,
  setConfig,
}) => {
  // Create schema based on show_header value
  const schema = useMemo(() => {
    const baseSchema: SchemaItem[] = [
      {
        name: "show_header",
        label: "Show Header",
        type: "grid",
        selector: { boolean: {} },
      }
    ];

    if (config.show_header) {
      baseSchema.push({
        name: "header",
        label: "Header",
        selector: { text: {} },
      });
    }

    baseSchema.push({
      name: "subtitle",
      label: "Subtitle",
      selector: { text: {} },
    });

    return baseSchema;
  }, [config.show_header]);

  const handleValueChange = (ev: CustomEvent) => {
    const newConfig = ev.detail.value;
    setConfig(newConfig);
  };

  return (
    <div className="editor">
      <ha-form
        hass={hass}
        data={config}
        schema={schema}
        computeLabel={(s: SchemaItem) => s.label}
        onValueChanged={handleValueChange}
      />
    </div>
  );
}; 