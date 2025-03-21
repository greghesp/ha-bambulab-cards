import { css } from "lit";

export default css`
:host {
  --dark-background: #1c1c1c;
  --text-primary: #ffffff;
  --text-secondary: #888888;
  --accent-color: #4caf50;
  --warning-color: #f44336;
  --control-background: rgba(255, 255, 255, 0.1);
  --sensor-background: #2a2a2a;
  --divider-color: rgba(255, 255, 255, 0.1);
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 2;
}

.scale-container {
  width: 100%;
  height: 100%;
  transform: scale(var(--scale, 1));
  transform-origin: top left;
}

ha-card {
  background: var(--dark-background);
  color: var(--text-primary);
  padding: 12px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.screen-container {
  display: flex;
  gap: 24px;
  height: 100%;
  flex: 1;
}

.main-content {
  flex: 1;
  display: flex;
  gap: 24px;
  min-height: 0; /* Prevents flex overflow */
}

.status-row {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Prevents flex overflow */
}

.status-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.status-icon {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0; /* Allows flex shrinking */
  overflow: hidden; /* Contains the image */
}

.status-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-height: 200px; /* Prevents excessive growth */
}

.status-info {
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
}

.status-time {
  color: var(--text-secondary);
  font-size: 0.9em;
  margin-bottom: 8px;
  text-align: left;
}

.progress-container {
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-bottom: 4px;
}

.progress {
  height: 100%;
  background: var(--accent-color);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  color: var(--text-secondary);
  font-size: 0.9em;
  text-align: left;
}

.side-panel {
  display: flex;
  gap: 8px;
  height: 100%;
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  flex-grow: 1;
}

.side-column.controls {
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  gap: 8px;
  align-content: center;
}

.control-button {
  background: var(--control-background);
  border: none;
  border-radius: 4px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.control-button.robot-icon {
  padding: 8px;
}

.control-button.robot-icon svg {
  width: 100%;
  height: 100%;
}

.control-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.control-button.warning {
  background: var(--warning-color);
}

.temp-indicators {
  display: flex;
  flex-direction: column;
  background: var(--sensor-background);
  padding: 0;
  border-radius: 4px;
  justify-content: space-between;
  height: 100%;
  flex-grow: 1;
}

.temp-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 10px;
  position: relative;
  flex: 1;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.temp-item:not(:last-child)::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 8px;
  right: 8px;
  height: 1px;
  background: var(--divider-color);
}

.temp-target {
  font-size: 0.9em;
  color: var(--text-secondary);
}

.temp-value {
  font-size: 1.1em;
}

.condensed-mode .temp-item {
  flex-direction: row;
  justify-content: space-between;
  gap: 4px;
}

.condensed-mode .temp-item .temp-target {
  display: none;
}

.condensed-mode .temp-item .temp-value {
  font-size: 1.1em;
  white-space: nowrap;
}
`;
