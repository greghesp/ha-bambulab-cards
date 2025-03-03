import React from 'react';

interface SpoolProps {
  trayId: number;
  active: boolean;
  empty: boolean;
  color: string;
  name: string;
}

export const Spool: React.FC<SpoolProps> = ({
  trayId,
  active,
  empty,
  color,
  name,
}) => {
  return (
    <div className={`spool ${active ? 'active' : ''} ${empty ? 'empty' : ''}`}>
      <div className="spool-color" style={{ backgroundColor: color }}>
        <span className="spool-name">{name}</span>
        <span className="tray-id">Tray {trayId}</span>
      </div>
    </div>
  );
}; 