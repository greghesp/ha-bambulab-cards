import { css } from "lit";

export default css`
  :host {
    --light-reflection-color-low: rgba(255, 255, 255, 0);
    --light-reflection-color-high: rgba(255, 255, 255, 0.2);
    --spool-info-height: 36px;
    /* Spools are sized for the widest zone so every zone's spools match */
    --ams-3h-spools-per-row: 7;
    --ams-3h-spool-gap: 6px;
    --ams-3h-spool-height: 112px;
  }

  ha-card {
    container: ams-3h / inline-size;
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    box-sizing: border-box;
    padding: 12px;
  }

  .title {
    font-size: 15px;
    font-weight: 500;
    color: var(--primary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .zone {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    border-radius: 10px;
    background: var(--secondary-background-color, rgba(127, 127, 127, 0.08));
  }

  .zone-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }

  .zone-name {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--secondary-text-color);
    white-space: nowrap;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
    min-width: 0;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 8px 2px 5px;
    border: none;
    border-radius: 999px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    font-size: 13px;
    cursor: pointer;
    transition: background-color 120ms ease-out;
  }

  .chip:hover {
    background: var(--divider-color, rgba(127, 127, 127, 0.2));
  }

  .chip:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 1px;
  }

  .chip ha-icon {
    --mdc-icon-size: 16px;
  }

  .chip.humidity ha-icon {
    color: #2196f3;
  }

  .chip.temperature ha-icon {
    color: #e53935;
  }

  .chip.dryingTime ha-icon {
    color: #fb8c00;
  }

  /* Narrow cards wrap the spools rather than shrinking them past legibility */
  @container ams-3h (max-width: 420px) {
    .zone {
      --ams-3h-spools-per-row: 5;
    }
  }

  .spools {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ams-3h-spool-gap);
  }

  .spool {
    --spool-width: calc(
      (100% - (var(--ams-3h-spools-per-row) - 1) * var(--ams-3h-spool-gap)) /
        var(--ams-3h-spools-per-row)
    );
    width: var(--spool-width);
    min-width: var(--spool-width);
    max-width: var(--spool-width);
    height: var(--ams-3h-spool-height);
  }

  /* Room for the filament name the spool draws under itself. The name box overhangs the
     spool element, as in the AMS card, so the row is padded to keep it inside the zone. */
  .with-type .spool {
    height: calc(var(--ams-3h-spool-height) + var(--spool-info-height));
  }

  .with-type .spools {
    row-gap: calc(var(--ams-3h-spool-gap) + 24px);
    padding-bottom: 24px;
  }

  .notice {
    padding: 16px;
    color: var(--secondary-text-color);
  }
`;
