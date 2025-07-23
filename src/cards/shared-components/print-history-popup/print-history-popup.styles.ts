import { css } from "lit";

export default css`
  .print-history-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    overflow: hidden;
  }

  .print-history-popup {
    box-shadow: var(--ha-card-box-shadow, 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2));
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: var(--ha-card-border-radius, 8px);
    background: var(--ha-card-background, var(--card-background-color, white));
    font-family: var(--ha-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif);
    max-width: 90%;
    max-height: 70vh;
    min-height: 260px;
    width: 800px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: manipulation;
  }

  .print-history-header,
  .print-history-controls {
    flex-shrink: 0;
  }

  .print-history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .print-history-title {
    font-size: 18px;
    font-weight: 500;
    color: var(--primary-text-color, #212121);
  }

  .print-history-close {
    background: none;
    border: none;
    color: var(--secondary-text-color, #757575);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }

  .print-history-close:hover {
    background: var(--divider-color, #e0e0e0);
  }

  .print-history-close ha-icon {
    --mdc-icon-size: 24px;
  }

  .print-history-controls {
    display: flex;
    gap: 8px;
    padding: 16px;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .print-history-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background: var(--primary-color, #03a9f4);
    color: var(--primary-text-color, white);
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
    font-weight: 500;
  }

  .print-history-btn:hover {
    background: var(--primary-color-dark, #0288d1);
  }

  .print-history-btn.secondary {
    background: var(--secondary-text-color, #757575);
    color: var(--primary-text-color, white);
  }

  .print-history-btn.secondary:hover {
    background: var(--disabled-text-color, #9e9e9e);
  }

  .print-history-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .print-history-search {
    padding: 8px;
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 4px;
    font-size: 14px;
    margin-right: 8px;
    flex: 1 1 0;
    min-width: 0;
    background: var(--ha-card-background, var(--card-background-color, white));
    color: var(--primary-text-color, #212121);
  }

  .print-history-error {
    color: var(--error-color, #f44336);
    padding: 8px 16px;
    background: var(--error-color-light, rgba(244, 67, 54, 0.1));
    border-radius: 4px;
    margin: 16px;
    border-left: 4px solid var(--error-color, #f44336);
  }

  .print-history-stats {
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
    font-size: 12px;
    color: var(--secondary-text-color, #757575);
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .print-history-count {
    font-weight: 500;
    color: var(--primary-text-color, #212121);
  }

  .print-history-loading {
    text-align: center;
    padding: 40px;
    color: var(--secondary-text-color, #757575);
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .print-history-empty {
    text-align: center;
    padding: 40px;
    color: var(--secondary-text-color, #757575);
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .print-history-empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  .print-history-empty-subtitle {
    margin-top: 8px;
    font-size: 12px;
    opacity: 0.8;
  }

  .print-history-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    grid-auto-rows: minmax(260px, auto);
    gap: 16px;
    padding: 16px;
    background: var(--ha-card-background, var(--card-background-color, white));
    flex: 1
    min-height: 0;
  }

  .print-history-card {
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: var(--ha-card-border-radius, 8px);
    overflow: hidden;
    transition: box-shadow 0.2s, border-color 0.2s;
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .print-history-card:hover {
    box-shadow: var(--ha-card-box-shadow, 0 4px 8px rgba(0, 0, 0, 0.1));
    border-color: var(--primary-color, #03a9f4);
  }

  .print-history-thumbnail {
    width: 100%;
    height: 210px;
    background: var(--divider-color, #e0e0e0);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .print-history-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .print-history-placeholder {
    color: var(--secondary-text-color, #757575);
    font-size: 24px;
    opacity: 0.6;
  }

  .print-history-info {
    padding: 12px;
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .print-history-name {
    font-weight: 500;
    margin-bottom: 4px;
    color: var(--primary-text-color, #212121);
    word-break: break-word;
    font-size: 14px;
    line-height: 1.3;
  }

  .print-history-meta {
    font-size: 12px;
    color: var(--secondary-text-color, #757575);
    line-height: 1.4;
  }

  .print-history-print-btn {
    margin-top: 8px;
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    background: var(--primary-color, #03a9f4);
    color: var(--primary-text-color, white);
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: background-color 0.2s;
    width: 100%;
    justify-content: center;
  }

  .print-history-print-btn:hover {
    background: var(--primary-color-dark, #0288d1);
  }

  .print-history-print-btn ha-icon {
    --mdc-icon-size: 16px;
  }

  .print-history-type {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .print-history-type.3mf { 
    background: var(--primary-color-light, #e3f2fd); 
    color: var(--primary-color, #1976d2); 
  }
  
  .print-history-type.gcode { 
    background: var(--accent-color-light, #f3e5f5); 
    color: var(--accent-color, #7b1fa2); 
  }
  
  .print-history-type.timelapse { 
    background: var(--success-color-light, #e8f5e8); 
    color: var(--success-color, #388e3c); 
  }
  
  .print-history-type.thumbnail { 
    background: var(--warning-color-light, #fff3e0); 
    color: var(--warning-color, #f57c00); 
  }
  
  .print-history-type.unknown { 
    background: var(--divider-color, #f5f5f5); 
    color: var(--secondary-text-color, #666); 
  }

  /* Print Settings Popup: ensure scrollability */
  .print-settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  .print-settings-popup {
    background: var(--ha-card-background, var(--card-background-color, white));
    border-radius: var(--ha-card-border-radius, 8px);
    box-shadow: var(--ha-card-box-shadow, 0 4px 8px rgba(0, 0, 0, 0.2));
    max-width: 90vw;
    width: 400px;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--divider-color, #e0e0e0);
    height: auto;
  }
  .print-settings-header,
  .print-settings-actions {
    flex-shrink: 0;
  }
  .print-settings-content {
    padding: 16px;
    overflow-y: auto;
    background: var(--ha-card-background, var(--card-background-color, white));
    min-height: 0;
    max-height: unset;
  }
  .print-settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .print-settings-title {
    font-size: 18px;
    font-weight: 500;
    color: var(--primary-text-color, #212121);
  }

  .print-settings-close {
    background: none;
    border: none;
    color: var(--secondary-text-color, #757575);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }

  .print-settings-close:hover {
    background: var(--divider-color, #e0e0e0);
  }

  .print-settings-close ha-icon {
    --mdc-icon-size: 24px;
  }

  .print-settings-file {
    margin-bottom: 16px;
    padding: 8px;
    background: var(--divider-color, #f5f5f5);
    border-radius: 4px;
    font-size: 14px;
    color: var(--primary-text-color, #212121);
  }

  .print-settings-group {
    margin-bottom: 12px;
  }

  .print-settings-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--primary-text-color, #212121);
    font-size: 14px;
  }

  .print-settings-label input {
    width: 80px;
    padding: 4px 8px;
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 4px;
    background: var(--ha-card-background, var(--card-background-color, white));
    color: var(--primary-text-color, #212121);
  }

  .print-settings-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--primary-text-color, #212121);
    font-size: 14px;
    cursor: pointer;
  }

  .print-settings-checkbox input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--primary-color, #03a9f4);
  }

  .print-settings-actions {
    display: flex;
    gap: 8px;
    padding: 16px;
    border-top: 1px solid var(--divider-color, #e0e0e0);
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .print-settings-btn {
    flex: 1;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .print-settings-btn.primary {
    background: var(--primary-color, #03a9f4);
    color: var(--primary-text-color, white);
  }

  .print-settings-btn.primary:hover {
    background: var(--primary-color-dark, #0288d1);
  }

  .print-settings-btn.secondary {
    background: var(--secondary-text-color, #757575);
    color: var(--primary-text-color, white);
  }

  .print-settings-btn.secondary:hover {
    background: var(--disabled-text-color, #9e9e9e);
  }

  .print-settings-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .custom-dropdown {
    position: relative;
    display: inline-block;
    width: auto;
    max-width: 100%;
    box-sizing: border-box;
    margin-top: 8px;
    cursor: pointer;
    z-index: 10;
    max-width: 100%;
  }
  .custom-dropdown-selected {
    padding: 8px 12px;
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 4px;
    background: var(--ha-card-background, var(--card-background-color, white));
    color: var(--primary-text-color, #212121);
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    width: auto;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dropdown-label-content {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1 1 0;
    overflow: hidden;
  }
  .dropdown-label-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    display: inline-block;
  }
  .dropdown-arrow {
    flex-shrink: 0;
    margin-left: 4px;
  }
  .custom-dropdown-list {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    background: var(--ha-card-background, var(--card-background-color, white));
    border: 1.5px solid var(--primary-color, #03a9f4);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    max-height: 240px;
    overflow-y: auto;
    z-index: 1000;
    display: flex;
    flex-direction: column;
  }
  .custom-dropdown-option {
    padding: 10px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: background 0.2s, border 0.2s;
    border-radius: 4px;
    margin: 2px 8px;
    border: 2px solid transparent;
    background: none;
    color: var(--primary-text-color, #212121);
  }
  .custom-dropdown-option.selected {
    background: var(--primary-color, #03a9f4);
    color: #fff;
    border: 2px solid var(--primary-color-dark, #0288d1);
  }
  .custom-dropdown-option:hover,
  .custom-dropdown-option.selected:hover {
    background: var(--primary-color-dark, #0288d1);
    color: #fff;
  }

  .filament-mapping-row {
    /* no margin here */
  }

  .filament-mapping-row label {
    margin-left: 32px;
  }
  .filament-mapping-row .custom-dropdown {
    margin-left: 32px;
  }

  .print-history-tabs {
    display: flex;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
    background: var(--ha-card-background, var(--card-background-color, white));
  }
  .print-history-tab {
    padding: 12px 24px;
    cursor: pointer;
    font-size: 16px;
    color: var(--secondary-text-color, #757575);
    border-bottom: 2px solid transparent;
    transition: color 0.2s, border-color 0.2s;
    user-select: none;
  }
  .print-history-tab.active {
    color: var(--primary-color, #03a9f4);
    border-bottom: 2px solid var(--primary-color, #03a9f4);
    font-weight: 600;
  }
  .timelapse-overlay {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    background: rgba(0,0,0,0.6);
    color: #fff;
    font-size: 14px;
    padding: 6px 10px;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    box-sizing: border-box;
    pointer-events: none;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }

  .timelapse-download-btn {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    color: #fff;
    text-align: center;
    padding: 6px 0;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    font-size: 15px;
    z-index: 2;
    transition: background 0.2s;
  }
  .timelapse-download-btn:hover {
    background: var(--primary-color, #03a9f4);
    color: #fff;
  }

  /* Dark mode adjustments */
  @media (prefers-color-scheme: dark) {
    .print-history-overlay {
      background: rgba(0, 0, 0, 0.7);
    }
    
    .print-history-card:hover {
      border-color: var(--primary-color, #29b6f6);
    }

    .print-settings-overlay {
      background: rgba(0, 0, 0, 0.8);
    }
  }
`; 