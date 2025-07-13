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
  }

  .file-cache-popup {
    background: var(--ha-card-background, white);
    border-radius: 8px;
    box-shadow: var(--ha-card-box-shadow, 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2));
    font-family: var(--ha-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif);
    max-width: 90vw;
    max-height: 90vh;
    width: 800px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .file-cache-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
  }

  .file-cache-title {
    font-size: 18px;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .file-cache-close {
    background: none;
    border: none;
    color: var(--secondary-text-color);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
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
  }

  .file-cache-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background: var(--primary-color);
    color: white;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  }

  .file-cache-btn:hover {
    background: var(--primary-color-dark);
  }

  .file-cache-btn.secondary {
    background: var(--secondary-text-color);
  }

  .file-cache-btn.secondary:hover {
    background: var(--disabled-text-color);
  }

  .file-cache-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .file-cache-error {
    color: var(--error-color);
    padding: 8px 16px;
    background: var(--error-color-light);
    border-radius: 4px;
    margin: 16px;
  }

  .file-cache-stats {
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
    font-size: 12px;
    color: var(--secondary-text-color);
  }

  .file-cache-count {
    font-weight: 500;
  }

  .file-cache-loading {
    text-align: center;
    padding: 40px;
    color: var(--secondary-text-color);
  }

  .file-cache-empty {
    text-align: center;
    padding: 40px;
    color: var(--secondary-text-color);
  }

  .file-cache-empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .file-cache-empty-subtitle {
    margin-top: 8px;
    font-size: 12px;
  }

  .file-cache-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    padding: 16px;
    overflow-y: auto;
    max-height: 60vh;
  }

  .file-cache-card {
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: 8px;
    overflow: hidden;
    transition: box-shadow 0.2s;
    background: var(--ha-card-background, white);
  }

  .file-cache-card:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .file-cache-thumbnail {
    width: 100%;
    height: 120px;
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
    color: var(--secondary-text-color);
    font-size: 24px;
  }

  .file-cache-info {
    padding: 12px;
  }

  .file-cache-name {
    font-weight: 500;
    margin-bottom: 4px;
    color: var(--primary-text-color);
    word-break: break-word;
    font-size: 14px;
    line-height: 1.3;
  }

  .file-cache-meta {
    font-size: 12px;
    color: var(--secondary-text-color);
    line-height: 1.4;
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
    background: #e3f2fd; 
    color: #1976d2; 
  }
  
  .file-cache-type.gcode { 
    background: #f3e5f5; 
    color: #7b1fa2; 
  }
  
  .file-cache-type.timelapse { 
    background: #e8f5e8; 
    color: #388e3c; 
  }
  
  .file-cache-type.thumbnail { 
    background: #fff3e0; 
    color: #f57c00; 
  }
  
  .file-cache-type.unknown { 
    background: #f5f5f5; 
    color: #666; 
  }
`; 