import React from 'react';
import './info-bar.css';

interface InfoBarProps {
  title: string;
  value: string;
}

export const InfoBar: React.FC<InfoBarProps> = ({ title, value }) => {
  return (
    <div className="info-bar">
      <div className="info-bar-title">{title}</div>
      <div className="info-bar-value">{value}</div>
    </div>
  );
}; 