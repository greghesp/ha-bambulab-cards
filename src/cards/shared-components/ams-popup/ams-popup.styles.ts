import { css } from "lit";

export default css`
  .popup-action-container {
    cursor: pointer;
    height: 100%;
    display: block;
  }

  .ha-bambulab-spool-modal-container {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: repeat(6, 1fr);
    gap: 8px;
    min-width: 0;
    max-width: 100%;
  }

  .filament-title {
    grid-column: span 2 / span 2;
  }

  .section-title {
    font-style: normal;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    display: flex;
    align-items: center;
    color: var(--mdc-dialog-content-ink-color, #6a6a6a);
  }

  .item-title {
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 19px;
    display: flex;
    align-items: center;
    color: var(--mdc-dialog-content-ink-color, #6a6a6a);
  }

  .item-value {
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 19px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    color: var(--mdc-dialog-content-ink-color, #000000);
    min-width: 0;
  }

  .truncate-select {
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-right: 20px;
  }

  .truncate-select option {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .filament-type {
    grid-row-start: 2;
  }

  .filament-name {
    grid-row-start: 3;
  }

  .div4 {
    grid-row-start: 4;
  }

  .div6 {
    grid-column: span 2 / span 2;
    margin-top: 20px;
    grid-row-start: 5;
  }

  .div7 {
    grid-row-start: 6;
  }

  .div9 {
    grid-row-start: 7;
  }

  .action-buttons {
    grid-column: span 2 / span 2;
    display: flex;
    border-radius: 4px;
    overflow: hidden;
    background: #4caf50;
    margin: 16px 0;
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
