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
    flex-direction: row;
    height: 100%;
    width: 100%;
    gap: 12px;
  }

  .condensed-mode .ha-bambulab-ssc-status-and-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .ha-bambulab-ssc-status-content {
    display: flex;
    flex-direction: column;
    flex: 1 1 0%;
    min-width: 0;
    min-height: 0;
    gap: 0;
  }

  .condensed-mode .ha-bambulab-ssc-status-content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    width: auto;
    min-width: 0;
    min-height: 0;
    flex: 1 1 0%;
  }

  .ha-bambulab-controls-content {
    display: flex;
    flex: 1;
    flex-direction: row;
    gap: 12px;
    align-items: center;
    justify-content: center;
  }

  .ha-bambulab-ssc-status-icon {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
    overflow: hidden;
    position: relative;
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
    justify-content: flex-start;
    gap: 8px;
    max-width: 70px;
    width: 100%;
    flex: 1 1 0%;
    height: 100%;
  }

  .ha-bambulab-ssc-extra-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 70px;
    width: 100%;
  }

  .condensed-mode .ha-bambulab-ssc-control-buttons {
    flex-direction: row;
    width: 100%;
    max-width: none;
    height: auto;
    min-height: 0;
    flex: none;
    margin-top: 8px;
    gap: 8px;
  }

  .condensed-mode .ha-bambulab-ssc-control-buttons .ha-bambulab-ssc-control-button {
    min-height: 48px;
    height: 48px;
    flex: 1 1 0;
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
    flex: 0 1 19%;
    max-height: 19%;
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

  .ha-bambulab-ssc-control-button ha-icon {
    --mdc-icon-size: 24px;
  }

  .ha-bambulab-ssc-sensors {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    max-width: 70px;
    width: 70px;
    background: var(--control-background);
    border-radius: 4px;
    color: var(--text-primary);
    padding: 8px;
    box-sizing: border-box;
    cursor: pointer;
    flex: none;
    height: 100%;
  }

  .sensor {
    position: relative;
    flex: 0 1 24%;
    max-height: 24%;
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

  .circle-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 75%;
    height: 100%;
    margin: 0 auto;
  }

  .outer-slice {
    fill: #7f8c8d; /* Dark grey */
    transition: fill 0.3s ease;
  }

  .inner-slice {
    fill: #bdc3c7; /* Light grey */
    transition: fill 0.3s ease;
  }

  .middle {
    fill: #7f8c8d; /* Dark grey */
    transition: fill 0.3s ease;
  }

  .outer-slice:hover {
    fill: #5a6b76; /* Darker grey */
  }

  .inner-slice:hover {
    fill: #95a5a6; /* Medium grey */
  }

  .middle:hover {
    fill: #5a6b76; /* Darker grey */
  }

  .outer-slice:active {
    fill: #34495e; /* Darker grey when clicked */
  }

  .inner-slice:active {
    fill: #7f8c8d; /* Darker grey when clicked */
  }

  .middle:active {
    fill: #34495e; /* Darker grey when clicked */
  }

  .move-axis-container {
    position: relative;
    width: 200px;
    height: 200px;
    margin: 0 auto;
    transform: scale(1.25);
  }

  .move-axis-container svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  .label {
    width: 20px;
    height: 20px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
  }

  .label ha-icon {
    width: 25px;
    height: 25px;
    pointer-events: none;
    color: black;
  }

  .menu-left {
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 1000;
  }

  .menu-left button {
    padding: 0px 0px;
  }

  .menu-left ha-icon {
    --mdc-icon-size: 36px;
  }

  .ams {
    flex: 0 1 16%;
    max-height: 16%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: auto;
  }

  .ams-page-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    height: 100%;
    width: 100%;
    padding-top: 0px;
  }

  .close-button {
    position: absolute;
    top: 0px;
    right: 0px;
    background: none;
    border: none;
    color: var(--secondary-text-color);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .close-button:hover {
    color: var(--primary-text-color);
  }

  .ams-selector-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    overflow: hidden;
  }

  .ams-selector {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    gap: 8px;
    padding: 0px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  .ams-selector-item {
    cursor: pointer;
    padding: 4px;
    border-radius: 8px;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ams-selector-item svg {
    display: block;
  }

  .ams-selector-item:hover {
    background-color: var(--ha-card-background, var(--card-background-color));
  }

  .ams-selector-item.selected {
    background-color: var(--primary-color);
  }

  .spool-container {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    margin-top: 4px;
    width: 100%;
    flex: 1;
  }

  .spool-container ha-bambulab-spool {
    width: 25%;
    min-width: 25%;
    max-width: 25%;
    padding-right: 8px;
    height: 100%;
  }

  .spool-container ha-bambulab-spool:last-child {
    padding-right: 0;
  }

  .controls-page-container {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .extra-controls-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 16px;
    color: var(--text-primary);
  }

  .extra-controls-content h2 {
    margin: 0;
    font-size: 1.2em;
    color: var(--text-primary);
  }

  .power-button {
    top: 4px;
    left: 4px;
    background: var(--control-background);
    border: none;
    border-radius: 4px;
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
    padding: 8px;
    z-index: 1;
  }

  .ha-bambulab-ssc-control-button.power-button.on,
  .power-button.on {
    background: #2ecc40 !important;
  }

  .power-button.off {
    background: var(--control-background) !important;
  }

  .power-button.off .power-icon {
    color: #f44336 !important;
  }

  .power-button.on .power-icon {
    color: var(--text-primary) !important;
  }

  .power-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .power-button ha-icon {
    --mdc-icon-size: 24px;
  }

  .bed-move-controls-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    background: var(--control-background);
    border-radius: 4px;
    width: 56px;
    height: fit-content;
    align-items: center;
  }

  .bed-move-controls-container ha-icon {
    --mdc-icon-size: 24px;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .bed-move-control-button {
    background: var(--control-background);
    border: none;
    border-radius: 4px;
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
    padding: 8px;
  }

  .bed-move-control-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .bed-move-control-button:active {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0.95);
  }

  .bed-move-control-button ha-icon {
    color: var(--text-primary);
  }

  .bed-move-control-button:disabled {
    background: rgba(255, 255, 255, 0.1);
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none;
  }

  .video-toggle-button {
    position: absolute;
    top: 8px;
    left: 8px;
    background: var(--control-background);
    border: none;
    border-radius: 50%;
    color: var(--text-primary);
    cursor: pointer;
    padding: 6px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .video-toggle-button:hover {
    background: rgba(255,255,255,0.2);
  }

  .video-toggle-button ha-icon {
    --mdc-icon-size: 22px;
  }

  .invisible-placeholder {
    visibility: hidden !important;
    pointer-events: none !important;
  }

  .ams-divider {
    border-top: 1px solid var(--divider-color);
    width: 100%;
    margin: 0 0 0 0;
    height: 0;
  }

  .condensed-mode .ha-bambulab-ssc-sensors {
    width: 70px;
    max-width: 70px;
    min-width: 0;
    height: 100%;
    flex: none;
    margin-top: 0;
  }

  .video-maximize-btn {
    position: absolute;
    bottom: 0px;
    right: 0px;
    z-index: 10;
    background: none;
    border: none;
    box-shadow: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .video-maximize-btn ha-icon {
    --mdc-icon-size: 28px;
    color: var(--text-primary);
    background: none;
    filter:
      drop-shadow(0 0 0.5px #000)
      drop-shadow(0 0 0.5px #000)
      drop-shadow(0 0 0.5px #000)
      drop-shadow(0 0 0.5px #000);
  }

  .video-maximized .video-maximized-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    background: black;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .video-maximized-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: black;
    margin: 0;
    padding: 0;
    display: block;
  }
  .video-maximized .ha-bambulab-ssc-status-content,
  .video-maximized .ha-bambulab-ssc-control-buttons,
  .video-maximized .ha-bambulab-ssc-sensors {
    display: none !important;
  }

  .mirrored {
    transform: scaleX(-1);
  }

`;
