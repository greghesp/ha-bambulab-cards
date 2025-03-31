import { css } from "lit";

export default css`
  :host {
    --dark-background: #1c1c1c;
    --text-primary: #ffffff;
    --text-secondary: #888888;
    --accent-color: #4caf50;
    --warning-color: #f44336;
    --control-background: rgba(255, 255, 255, 0.1);
    --divider-color: rgba(255, 255, 255, 0.1);
  }

  .ha-bambulab-ssc {
    height: 100%;
    width: 100%;
    background: var(--dark-background);
  }

  .ha-bambulab-ssc-screen-container {
    display: flex;
    height: 100%;
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
    gap: 12px;
  }

  .ha-bambulab-ssc-status-and-controls {
    display: flex;
    flex: 1;
    flex-direction: row;
    gap: 12px;
  }

  .condensed-mode .ha-bambulab-ssc-status-and-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .ha-bambulab-ssc-status-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 24px;
  }

  .ha-bambulab-ssc-status-icon {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
    overflow: hidden;
  }

  .condensed-mode .ha-bambulab-ssc-status-icon {
    max-height: 182px;
  }

  .ha-bambulab-ssc-status-icon img {
    width: 100%;
    height: 100%;
    max-height: 100%;
    object-fit: contain;
    flex-shrink: 1;
  }

  .ha-bambulab-ssc-status-time {
    color: var(--text-secondary);
    font-size: 0.9em;
    margin-bottom: 8px;
    text-align: left;
  }

  .ha-bambulab-ssc-progress-container {
    width: 100%;
  }

  .ha-bambulab-ssc-progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    margin-bottom: 4px;
  }

  .ha-bambulab-ssc-progress {
    height: 100%;
    background: var(--accent-color);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .ha-bambulab-ssc-progress-text {
    color: var(--text-secondary);
    font-size: 0.9em;
    text-align: left;
  }

  .ha-bambulab-ssc-control-buttons {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
    max-width: 70px;
    width: 100%;
  }

  .condensed-mode .ha-bambulab-ssc-control-buttons {
    flex-direction: row;
    max-width: none;
    height: auto;
    align-self: flex-end;
    justify-content: flex-end;
  }

  .ha-bambulab-ssc-control-button {
    width: 100%;
    padding: 0;
    background: var(--control-background);
    border: none;
    border-radius: 4px;
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
    flex-grow: 1;
  }

  .ha-bambulab-ssc-control-button.on {
    background: rgb(255, 165, 0);
  }

  .ha-bambulab-ssc-control-button.on:hover {
    background: rgba(255, 165, 0, 0.7);
  }

  .ha-bambulab-ssc-control-button:disabled {
    background: rgba(255, 255, 255, 0.1);
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none;
  }

  .condensed-mode .ha-bambulab-ssc-control-button {
    padding: 4px;
  }

  .ha-bambulab-ssc-control-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .ha-bambulab-ssc-control-button.warning {
    background: var(--warning-color);
  }

  .ha-bambulab-ssc-sensors {
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: space-between;
    max-width: 70px;
    width: 100%;
    background: var(--control-background);
    border-radius: 4px;
    color: var(--text-primary);
    padding: 8px;
    box-sizing: border-box;
    cursor: pointer;
  }

  .sensor {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    border-bottom: 1px solid var(--divider-color);
  }

  .sensor:last-child {
    border-bottom: none;
  }

  .sensor-target-value {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .sensor-value {
    font-size: 17px;
    color: var(--text-primary);
  }

  .sensor ha-icon {
    --mdc-icon-size: 1.2em;
    color: var(--text-secondary);
  }

  .icon-and-target {
    display: flex;
    flex-direction: row;
    gap: 4px;
  }
`;
