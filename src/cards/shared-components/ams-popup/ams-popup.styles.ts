import { css } from "lit";

export default css`
  .popup-action-container {
    cursor: pointer;
    height: 100%;
    display: block;
  }

  .section {
    margin-bottom: 32px;
  }

  .section:last-of-type {
    margin-bottom: 24px;
  }

  .section-title {
    font-family: "Inter";
    font-weight: 700;
    font-size: 16px;
    color: var(--mdc-dialog-content-ink-color, #6a6a6a);
    margin: 0 0 16px 0;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding: 0 8px;
  }

  .info-row:last-child {
    margin-bottom: 0;
  }

  .info-label {
    font-family: "Inter";
    font-size: 16px;
    color: var(--mdc-dialog-content-ink-color, #6a6a6a);
  }

  .info-value {
    font-family: "Inter";
    font-size: 16px;
    color: var(--mdc-dialog-content-ink-color, #000000);
  }

  .color-chip {
    padding: 5px 10px;
    border-radius: 5px;
  }

  .action-buttons {
    display: flex;
    border-radius: 4px;
    overflow: hidden;
    background: #4caf50;
    margin: 0;
  }

  .action-button {
    flex: 1;
    --mdc-theme-primary: white;
    --mdc-theme-on-primary: white;
    --mdc-button-fill-color: transparent;
    --mdc-button-ink-color: white;
    --mdc-button-disabled-fill-color: rgba(255, 255, 255, 0.12);
    --mdc-button-disabled-ink-color: rgba(255, 255, 255, 0.38);
    --mdc-button-outline-color: white;
    margin: 0;
    border-radius: 0;
  }

  .action-button:first-child {
    border-right: 1px solid rgba(255, 255, 255, 0.2);
  }

  #load ha-icon {
    margin-right: 8px;
  }
`;
