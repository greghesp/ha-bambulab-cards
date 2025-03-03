import React from 'react';
import { HomeAssistant } from '../../types/homeassistant';
import './spool-card-editor.css';

interface SpoolCardEditorProps {
  hass: HomeAssistant;
  config: {
    device_id?: string;
    title?: string;
  };
  setConfig: (config: any) => void;
}

export const SpoolCardEditor: React.FC<SpoolCardEditorProps> = ({
  hass,
  config,
  setConfig,
}) => {
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConfig({ ...config, device_id: e.target.value });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, title: e.target.value });
  };

  const devices = Object.values(hass.devices)
    .filter(device => device.manufacturer === 'Bambu Lab')
    .map(device => ({
      id: device.id,
      name: device.name
    }));

  return (
    <div className="editor">
      <div className="form-group">
        <label>Device</label>
        <select value={config.device_id || ''} onChange={handleDeviceChange}>
          <option value="">Select a device</option>
          {devices.map(device => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Title</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={handleTitleChange}
          placeholder="Card Title"
        />
      </div>
    </div>
  );
}; 