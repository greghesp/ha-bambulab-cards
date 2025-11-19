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
    position: relative;
    width: 100%;
    background: var(--dark-background);
    height: 300px;
    overflow: hidden;
  }

  .ha-bambulab-ssc-screen-container {
    display: flex;
    width: 100%;
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
    gap: 12px;
    overflow: hidden;
  }

  .ha-bambulab-ssc-left-column {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    align-items: stretch;
    gap: 4px;
  }

  .ha-bambulab-ssc-preview-and-status {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    justify-content: flex-start;
    width: auto;
    min-width: 0;
    min-height: 0;
    flex: 1 1 auto;
  }

  .ha-bambulab-ssc-preview {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    position: relative;
  }

  .ha-bambulab-ssc-preview ha-camera-stream {
    display: flex;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
  }

  .ha-bambulab-ssc-progress-container {
    flex: 0 0 auto;
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
    margin-top: 8px;
    transition: width 0.3s ease;
  }

  .ha-bambulab-ssc-status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 0;
  }

  .ha-bambulab-ssc-status-text {
    color: var(--text-secondary);
    font-size: 0.9em;
    text-align: left;
    min-width: 0;
  }

  .ha-bambulab-ssc-status-time {
    flex: 0 0 auto;
    color: var(--text-secondary);
    font-size: 0.9em;
    text-align: right;
    min-width: 0;
  }

  .ha-bambulab-ssc-control-buttons {
    display: flex;
    flex-direction: row;
    flex: 0 0 auto; 
    justify-content: flex-start;
    max-width: none;
    width: 100%;
    height: auto;
    margin-top: 0px;
    gap: clamp(1px, 1vw, 4px);
  }

  .ha-bambulab-ssc-controls-page {
    display: flex;
    flex: 1;
    flex-direction: row;
    gap: 12px;
    align-items: center;
    justify-content: center;
  }

  .ha-bambulab-ssc-extra-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 70px;
    width: 100%;
  }

  .ha-bambulab-ssc-control-button {
    display: flex;
    flex: 1 1 auto;
    width: 100%;
    height: 48px;
    min-width: 0;
    max-height: none;
    min-height: 48px;
    padding: 4px;
    background: var(--control-background);
    border: none;
    border-radius: 4px;
    color: var(--text-primary);
    cursor: pointer;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
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
    flex: none;
    max-width: 70px;
    min-width: 0;
    width: 70px;
    height: 100%;
    margin-top: 0;
    justify-content: flex-start;
    align-items: stretch;
    background: var(--control-background);
    border-radius: 4px;
    color: var(--text-primary);
    padding: 8px;
    box-sizing: border-box;
    cursor: pointer;
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

  .invisible-placeholder {
    opacity: 0;
    pointer-events: none !important;
  }

  .sensor-target-value {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .sensor-value {
    font-size: 17px;
    color: var(--text-primary);
  }

  .sensor-value ha-icon[icon="mdi:alert-outline"] {
    color: #ffeb3b;
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
    top: 1px;
    left: 1px;
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

  .ams-divider {
    border-top: 1px solid var(--divider-color);
    width: 100%;
    margin: 0 0 0 0;
    height: 0;
  }

  .video-maximize-btn {
    position: absolute;
    bottom: 0px;
    right: 0px;
    z-index: 1;
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

  .video-maximized .ha-bambulab-ssc-preview-and-status,
  .video-maximized .ha-bambulab-ssc-control-buttons,
  .video-maximized .ha-bambulab-ssc-sensors {
    display: none !important;
  }

  .video-maximized .video-maximized-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: black;
    z-index: 1000;
    overflow: hidden;
  }

  .video-maximized .video-maximized-container video {
    max-width: 100%;
    max-height: 100%;
    width: auto !important;
    height: auto !important;
    object-fit: contain;
    display: block;
    background: black;
  }

  .video-maximized .video-maximized-container img {
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    background: black;
    margin: 0;
    padding: 0;
  }

  .mirrored {
    transform: scaleX(-1);
  }

  /* Model download overlay styles */
  .cover-image-wrapper {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
  }

  .model-download-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 2;
  }

  .model-download-text {
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 6px 10px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 1.1rem;
  }

  /* Ensure cover image fits its container without clipping */
  .cover-image-wrapper img {
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .image_camera {
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

`;
