import { css } from "lit";

export default css`
  .file-cache-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    overflow: hidden;
  }

  .file-cache-popup {
    background: var(--ha-card-background, var(--card-background-color, white));
    border-radius: var(--ha-card-border-radius, 8px);
    box-shadow: var(--ha-card-box-shadow, 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2));
    font-family: var(--ha-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif);
    max-width: 90vw;
    max-height: 90vh;
    width: 800px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--divider-color, #e0e0e0);
  }

  .file-cache-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .file-cache-title {
    font-size: 18px;
    font-weight: 500;
    color: var(--primary-text-color, #212121);
  }

  .file-cache-close {
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

  .file-cache-close:hover {
    background: var(--divider-color, #e0e0e0);
  }

  .file-cache-close ha-icon {
    --mdc-icon-size: 24px;
  }

  .file-cache-controls {
    display: flex;
    gap: 8px;
    padding: 16px;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .file-cache-btn {
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

  .file-cache-btn:hover {
    background: var(--primary-color-dark, #0288d1);
  }

  .file-cache-btn.secondary {
    background: var(--secondary-text-color, #757575);
    color: var(--primary-text-color, white);
  }

  .file-cache-btn.secondary:hover {
    background: var(--disabled-text-color, #9e9e9e);
  }

  .file-cache-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .file-cache-error {
    color: var(--error-color, #f44336);
    padding: 8px 16px;
    background: var(--error-color-light, rgba(244, 67, 54, 0.1));
    border-radius: 4px;
    margin: 16px;
    border-left: 4px solid var(--error-color, #f44336);
  }

  .file-cache-stats {
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
    font-size: 12px;
    color: var(--secondary-text-color, #757575);
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .file-cache-count {
    font-weight: 500;
    color: var(--primary-text-color, #212121);
  }

  .file-cache-loading {
    text-align: center;
    padding: 40px;
    color: var(--secondary-text-color, #757575);
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .file-cache-empty {
    text-align: center;
    padding: 40px;
    color: var(--secondary-text-color, #757575);
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .file-cache-empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  .file-cache-empty-subtitle {
    margin-top: 8px;
    font-size: 12px;
    opacity: 0.8;
  }

  .file-cache-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    padding: 16px;
    overflow-y: auto;
    max-height: 60vh;
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .file-cache-card {
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: var(--ha-card-border-radius, 8px);
    overflow: hidden;
    transition: box-shadow 0.2s, border-color 0.2s;
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .file-cache-card:hover {
    box-shadow: var(--ha-card-box-shadow, 0 4px 8px rgba(0, 0, 0, 0.1));
    border-color: var(--primary-color, #03a9f4);
  }

  .file-cache-thumbnail {
    width: 100%;
    height: 210px;
    background: var(--divider-color, #e0e0e0);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .file-cache-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .file-cache-placeholder {
    color: var(--secondary-text-color, #757575);
    font-size: 24px;
    opacity: 0.6;
  }

  .file-cache-info {
    padding: 12px;
    background: var(--ha-card-background, var(--card-background-color, white));
  }

  .file-cache-name {
    font-weight: 500;
    margin-bottom: 4px;
    color: var(--primary-text-color, #212121);
    word-break: break-word;
    font-size: 14px;
    line-height: 1.3;
  }

  .file-cache-meta {
    font-size: 12px;
    color: var(--secondary-text-color, #757575);
    line-height: 1.4;
  }

  .file-cache-print-btn {
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

  .file-cache-print-btn:hover {
    background: var(--primary-color-dark, #0288d1);
  }

  .file-cache-print-btn ha-icon {
    --mdc-icon-size: 16px;
  }

  .file-cache-type {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .file-cache-type.3mf { 
    background: var(--primary-color-light, #e3f2fd); 
    color: var(--primary-color, #1976d2); 
  }
  
  .file-cache-type.gcode { 
    background: var(--accent-color-light, #f3e5f5); 
    color: var(--accent-color, #7b1fa2); 
  }
  
  .file-cache-type.timelapse { 
    background: var(--success-color-light, #e8f5e8); 
    color: var(--success-color, #388e3c); 
  }
  
  .file-cache-type.thumbnail { 
    background: var(--warning-color-light, #fff3e0); 
    color: var(--warning-color, #f57c00); 
  }
  
  .file-cache-type.unknown { 
    background: var(--divider-color, #f5f5f5); 
    color: var(--secondary-text-color, #666); 
  }

  /* Print Settings Popup Styles */
  .print-settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
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
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--divider-color, #e0e0e0);
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

  .print-settings-content {
    padding: 16px;
    overflow-y: auto;
    max-height: 60vh;
    background: var(--ha-card-background, var(--card-background-color, white));
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

  /* Dark mode adjustments */
  @media (prefers-color-scheme: dark) {
    .file-cache-overlay {
      background: rgba(0, 0, 0, 0.7);
    }
    
    .file-cache-card:hover {
      border-color: var(--primary-color, #29b6f6);
    }

    .print-settings-overlay {
      background: rgba(0, 0, 0, 0.8);
    }
  }
`; 