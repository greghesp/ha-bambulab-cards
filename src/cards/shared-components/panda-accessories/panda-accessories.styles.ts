import { css } from "lit";

export default css`
  .panda-accessories {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    padding: 8px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
    border-radius: 999px;
    background: var(--secondary-background-color, rgba(127, 127, 127, 0.1));
    color: var(--primary-text-color);
    font: inherit;
    font-size: 0.85em;
    cursor: pointer;
    transition: box-shadow 150ms ease, background-color 150ms ease;
  }

  .chip:hover {
    box-shadow: 0 0 0 2px var(--primary-color, rgba(3, 169, 244, 0.5));
  }

  .chip:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 2px;
  }

  .chip ha-icon {
    --mdc-icon-size: 16px;
  }

  .chip.heating {
    background-color: rgba(255, 100, 0, 0.2);
    box-shadow: 0 0 12px rgba(255, 100, 0, 0.4);
  }

  .chip.heating ha-icon {
    color: rgb(255, 120, 0);
  }

  .chip.powered ha-icon {
    color: var(--success-color, #43a047);
  }

  .chip.lit {
    background-color: rgba(255, 165, 0, 0.2);
  }

  .chip.lit ha-icon {
    color: rgb(255, 165, 0);
  }

  .chip.unavailable {
    opacity: 0.5;
  }
`;
