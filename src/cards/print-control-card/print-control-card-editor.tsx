import React from 'react';
import { HomeAssistant } from '../../types/homeassistant';
import './print-control-card-editor.css';

interface PrintControlCardEditorProps {
  hass: HomeAssistant;
  config: {
    printer?: string;
  };
  setConfig: (config: any) => void;
}

export const PrintControlCardEditor: React.FC<PrintControlCardEditorProps> = ({
  hass,
  config,
  setConfig,
}) => {
  const handlePrinterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConfig({ ...config, printer: e.target.value });
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
    </div>
  );
}; 