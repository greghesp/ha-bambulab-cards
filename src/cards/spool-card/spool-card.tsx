import React, { useEffect, useState } from 'react';
import { HomeAssistant } from '../../types/homeassistant';
import { Spool } from '../shared-components/spool';
import './spool-card.css';

interface SpoolCardProps {
  hass: HomeAssistant;
  config?: {
    device_id?: string;
    title?: string;
  };
}

interface SpoolData {
  color: string;
  name: string;
  empty: boolean;
}

export const SpoolCard: React.FC<SpoolCardProps> = ({ hass, config }) => {
  const [spoolData, setSpoolData] = useState<SpoolData | null>(null);

  useEffect(() => {
    if (!config?.device_id || !hass.entities) return;

    const entity = Object.values(hass.entities).find(
      entity => entity.device_id === config.device_id
    );

    if (entity) {
      const state = hass.states[entity.entity_id];
      if (state) {
        setSpoolData({
          color: state.attributes.color || '#808080',
          name: state.attributes.friendly_name || 'Unknown',
          empty: state.state === 'unavailable',
        });
      }
    }
  }, [hass.entities, hass.states, config?.device_id]);

  if (!spoolData) {
    return null;
  }

  return (
    <div className="card">
      {config?.title && <h2 className="title">{config.title}</h2>}
      <Spool
        trayId={0}
        active={false}
        empty={spoolData.empty}
        color={spoolData.color}
        name={spoolData.name}
      />
    </div>
  );
}; 