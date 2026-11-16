import { css } from "lit";

export default css`
  :host {
    display: block;
    height: 100%;
  }

  ha-card {
    height: 100%;
    overflow: hidden;
  }

  .skip-button {
    all: unset;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    height: 100%;
    min-height: 48px;
    padding: 8px;
    cursor: pointer;
    color: var(--primary-text-color);
    border-radius: var(--ha-card-border-radius, 12px);
    transition: background-color 150ms ease-out;
  }

  .skip-button:hover:not([disabled]) {
    background-color: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.05);
  }

  .skip-button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
  }

  .skip-button[disabled] {
    cursor: default;
    opacity: 0.4;
  }

  .skip-button ha-icon {
    --mdc-icon-size: 28px;
    color: var(--state-icon-color, var(--primary-color));
  }

  .skip-button[disabled] ha-icon {
    color: var(--disabled-text-color, var(--secondary-text-color));
  }

  .name {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
`;
