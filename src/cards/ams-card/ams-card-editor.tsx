import React, { useMemo } from 'react';
import { HomeAssistant } from '../../types/homeassistant';
import { MANUFACTURER, AMS_MODELS } from '../../const';
import './ams-card-editor.css';

// https://www.home-assistant.io/docs/blueprint/selectors/#select-selector
const filterCombinations = AMS_MODELS.map((model) => ({
  manufacturer: MANUFACTURER,
  model: model,
}));

interface AMSCardEditorProps {
  hass: HomeAssistant;
  config: {
    show_info_bar?: boolean;
    subtitle?: string;
    custom_humidity?: string;
    custom_temperature?: string;
    show_type?: boolean;
    ams?: string;
    style?: 'vector' | 'graphic';
  };
  setConfig: (config: any) => void;
}

interface SchemaItem {
  name: string;
  label: string;
  selector: {
    boolean?: boolean;
    text?: Record<string, never>;
    entity?: {
      domain: string;
    };
    device?: {
      filter: Array<{
        manufacturer: string;
        model: string;
      }>;
    };
    select?: {
      options: Array<{
        label: string;
        value: string;
      }>;
    };
  };
}

export const AMSCardEditor: React.FC<AMSCardEditorProps> = ({
  hass,
  config,
  setConfig,
}) => {
  // Create schema based on show_info_bar and style values
  const schema = useMemo(() => {
    const baseSchema: SchemaItem[] = [
      {
        name: "show_info_bar",
        label: "Show Info Bar",
        selector: { boolean: true },
      }
    ];

    if (config.show_info_bar) {
      baseSchema.push(
        {
          name: "subtitle",
          label: "Subtitle",
          selector: { text: {} },
        },
        {
          name: "custom_humidity",
          label: "Custom Humidity Sensor",
          selector: { entity: { domain: "sensor" } },
        },
        {
          name: "custom_temperature",
          label: "Custom Temperature Sensor",
          selector: { entity: { domain: "sensor" } },
        }
      );
    }

    if (config.style === "vector") {
      baseSchema.push({
        name: "show_type",
        label: "Show Filament Types",
        selector: { boolean: true },
      });
    }

    baseSchema.push(
      {
        name: "ams",
        label: "AMS",
        selector: { device: { filter: filterCombinations } },
      },
      {
        name: "style",
        label: "Card Style",
        selector: {
          select: {
            options: [
              { label: "Vector", value: "vector" },
              { label: "Graphic", value: "graphic" },
            ],
          },
        },
      }
    );

    return baseSchema;
  }, [config.show_info_bar, config.style]);

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