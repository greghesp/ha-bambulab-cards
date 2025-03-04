import React from 'react';
import { Spool } from '../../shared-components/spool';
import './graphic-ams-card.css';

interface GraphicAMSCardProps {
  config: Array<{
    entityId: string;
    active: boolean;
    empty: boolean;
    color: string;
    name: string;
  }>;
}

export const GraphicAMSCard: React.FC<GraphicAMSCardProps> = ({ config }) => {
  const spools = config;

  return (
    <div className="graphic-ams-card">
      {spools.map((spool, index) => (
        <Spool
          key={`spool-${index}`}
          trayId={index}
          active={spool.active}
          empty={spool.empty}
          color={spool.color}
          name={spool.name}
        />
      ))}
    </div>
  );
}; 