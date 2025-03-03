import React from 'react';
import { HomeAssistant } from '../../types/homeassistant';
import './example-card.css';

interface ExampleCardProps {
  hass: HomeAssistant;
  config?: {
    show_header?: boolean;
    header?: string;
    subtitle?: string;
  };
}

export const ExampleCard: React.FC<ExampleCardProps> = ({ config }) => {
  // Default config values
  const defaultConfig = {
    header: "Header Text",
    subtitle: "Subtitle Text",
    show_header: true,
  };

  // Merge default config with provided config
  const mergedConfig = { ...defaultConfig, ...config };

  return (
    <div className="card">
      <div className="card-content">
        {mergedConfig.show_header && <h1>{mergedConfig.header}</h1>}
        <p>Subtitle: {mergedConfig.subtitle}</p>
      </div>
    </div>
  );
}; 