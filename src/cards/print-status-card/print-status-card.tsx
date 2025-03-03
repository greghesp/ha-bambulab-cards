import React, { useEffect, useState } from 'react';
import { HomeAssistant, Device, Entity, EntityState } from '../../types/homeassistant';
import { MANUFACTURER } from '../../const';
import './print-status-card.css';

interface PrintStatusCardProps {
  hass: HomeAssistant;
  config: {
    printer?: string;
    show_toolbar?: boolean;
    show_preview?: boolean;
  };
}

interface PrintStatus {
  stage: string;
  progress: number;
  currentLayer: number;
  totalLayers: number;
  timeRemaining: number;
  timeElapsed: number;
  bedTemp: number;
  nozzleTemp: number;
  chamberTemp: number;
  fanPartSpeed: number;
  fanAuxSpeed: number;
  fanChamberSpeed: number;
}

export const PrintStatusCard: React.FC<PrintStatusCardProps> = ({ hass, config }) => {
  const [deviceId, setDeviceId] = useState<string>(config.printer || '');
  const [status, setStatus] = useState<PrintStatus>({
    stage: '',
    progress: 0,
    currentLayer: 0,
    totalLayers: 0,
    timeRemaining: 0,
    timeElapsed: 0,
    bedTemp: 0,
    nozzleTemp: 0,
    chamberTemp: 0,
    fanPartSpeed: 0,
    fanAuxSpeed: 0,
    fanChamberSpeed: 0
  });

  useEffect(() => {
    if (!deviceId) {
      const devices = Object.values(hass.devices) as Device[];
      const bambuDevices = devices.filter(device => device.manufacturer === MANUFACTURER);
      if (bambuDevices.length > 0) {
        setDeviceId(bambuDevices[0].id);
      }
    }
  }, [hass.devices, deviceId]);

  useEffect(() => {
    if (!deviceId || !hass.entities) return;

    const entities = Object.values(hass.entities) as Entity[];
    const deviceEntities = entities.filter(entity => entity.device_id === deviceId);

    const getEntityState = (key: string): EntityState | null => {
      const entity = deviceEntities.find(e => e.entity_id.includes(key));
      return entity ? hass.states[entity.entity_id] as EntityState : null;
    };

    const stage = getEntityState('stage')?.state || '';
    const progress = parseFloat(getEntityState('progress')?.state || '0');
    const currentLayer = parseInt(getEntityState('current_layer')?.state || '0');
    const totalLayers = parseInt(getEntityState('total_layers')?.state || '0');
    const timeRemaining = parseFloat(getEntityState('time_remaining')?.state || '0');
    const timeElapsed = parseFloat(getEntityState('time_elapsed')?.state || '0');
    const bedTemp = parseFloat(getEntityState('bed_temp')?.state || '0');
    const nozzleTemp = parseFloat(getEntityState('nozzle_temp')?.state || '0');
    const chamberTemp = parseFloat(getEntityState('chamber_temp')?.state || '0');
    const fanPartSpeed = parseInt(getEntityState('fan_part_speed')?.state || '0');
    const fanAuxSpeed = parseInt(getEntityState('fan_aux_speed')?.state || '0');
    const fanChamberSpeed = parseInt(getEntityState('fan_chamber_speed')?.state || '0');

    setStatus({
      stage,
      progress,
      currentLayer,
      totalLayers,
      timeRemaining,
      timeElapsed,
      bedTemp,
      nozzleTemp,
      chamberTemp,
      fanPartSpeed,
      fanAuxSpeed,
      fanChamberSpeed
    });
  }, [hass.entities, hass.states, deviceId]);

  const formatTime = (minutes: number): string => {
    const mins = Math.round(minutes % 60);
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.floor(minutes / 60) % 24;

    let result = "";
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    result += `${mins}m`;

    return result.trim();
  };

  return (
    <div className="card">
      <div className="header">
        <div className="stage">{status.stage}</div>
        <div className="progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${status.progress}%` }} />
          </div>
          <div className="progress-text">{status.progress.toFixed(1)}%</div>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-item">
          <div className="info-label">Layer</div>
          <div className="info-value">{status.currentLayer} / {status.totalLayers}</div>
        </div>

        <div className="info-item">
          <div className="info-label">Time Remaining</div>
          <div className="info-value">{formatTime(status.timeRemaining)}</div>
        </div>

        <div className="info-item">
          <div className="info-label">Time Elapsed</div>
          <div className="info-value">{formatTime(status.timeElapsed)}</div>
        </div>

        <div className="info-item">
          <div className="info-label">Bed Temp</div>
          <div className="info-value">{status.bedTemp}°C</div>
        </div>

        <div className="info-item">
          <div className="info-label">Nozzle Temp</div>
          <div className="info-value">{status.nozzleTemp}°C</div>
        </div>

        <div className="info-item">
          <div className="info-label">Chamber Temp</div>
          <div className="info-value">{status.chamberTemp}°C</div>
        </div>

        <div className="info-item">
          <div className="info-label">Part Fan</div>
          <div className="info-value">{status.fanPartSpeed}%</div>
        </div>

        <div className="info-item">
          <div className="info-label">Aux Fan</div>
          <div className="info-value">{status.fanAuxSpeed}%</div>
        </div>

        <div className="info-item">
          <div className="info-label">Chamber Fan</div>
          <div className="info-value">{status.fanChamberSpeed}%</div>
        </div>
      </div>
    </div>
  );
}; 