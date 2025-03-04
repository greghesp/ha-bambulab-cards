import React from 'react';
import { HomeAssistant } from '../../../types/homeassistant';
import './vector-ams-card.css';

interface VectorAMSCardProps {
  hass: HomeAssistant;
  trays: Array<{
    entityId: string;
    active: boolean;
    empty: boolean;
    color: string;
    name: string;
  }>;
}

export const VectorAMSCard: React.FC<VectorAMSCardProps> = ({ trays }) => {
  return (
    <div className="vector-ams-container">
      {trays.map((tray, index) => (
        <div
          key={tray.entityId}
          className={`vector-spool ${tray.active ? 'active' : ''} ${tray.empty ? 'empty' : ''}`}
        >
          <div className="vector-spool-color" style={{ backgroundColor: tray.color }} />
          <div className="vector-spool-info">
            <div className="vector-spool-name">{tray.name || `Slot ${index + 1}`}</div>
            <div className="vector-spool-status">
              {tray.empty ? 'Empty' : tray.active ? 'Active' : 'Loaded'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 