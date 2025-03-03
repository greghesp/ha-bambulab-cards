import React from 'react';
import { HomeAssistant } from '../../types/homeassistant';
import './print-status-card-editor.css';

interface PrintStatusCardEditorProps {
  hass: HomeAssistant;
  config: {
    printer?: string;
    show_toolbar?: boolean;
    show_preview?: boolean;
  };
  setConfig: (config: any) => void;
}

export const PrintStatusCardEditor: React.FC<PrintStatusCardEditorProps> = ({
  hass,
  config,
  setConfig,
}) => {
  const handlePrinterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConfig({ ...config, printer: e.target.value });
  };

  const handleToolbarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, show_toolbar: e.target.checked });
  };

  const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, show_preview: e.target.checked });
  };

  const printers = Object.values(hass.devices)
    .filter(device => device.manufacturer === 'Bambu Lab')
    .map(device => ({
      id: device.id,
      name: device.name
    }));

  return (
    <div className="editor">
      <div className="form-group">
        <label>Printer</label>
        <select value={config.printer || ''} onChange={handlePrinterChange}>
          <option value="">Select a printer</option>
          {printers.map(printer => (
            <option key={printer.id} value={printer.id}>
              {printer.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={config.show_toolbar ?? true}
            onChange={handleToolbarChange}
          />
          Show Toolbar
        </label>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={config.show_preview ?? true}
            onChange={handlePreviewChange}
          />
          Show Preview
        </label>
      </div>
    </div>
  );
}; 