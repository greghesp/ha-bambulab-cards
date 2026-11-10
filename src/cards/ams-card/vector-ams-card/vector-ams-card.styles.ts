import { css } from "lit";

export default css`
  :host {
    --light-reflection-color-low: rgba(255, 255, 255, 0);
    --light-reflection-color-high: rgba(255, 255, 255, 0.2);
    --card-padding-top: 10px;
    --card-padding-bottom: 25px;
    --spool-info-height: 36px;
  }

  .ha-bambulab-spool {
    width: calc(25% - 5px);
    min-width: calc(25% - 5px);
    max-width: calc(25% - 5px);
    padding: 0px 2px;
  }

  .ha-bambulab-spool.ht {
    width: calc(100% - 5px);
    min-width: calc(100% - 5px);
    max-width: calc(100% - 5px);
    padding: 0px 2px;
  }

  /* Two rows of up to five spools (AMS 3H) */
  .ha-bambulab-spool.two-rows {
    width: calc(20% - 4px);
    min-width: calc(20% - 4px);
    max-width: calc(20% - 4px);
  }

  .v-spools-wrapper.two-rows {
    flex-wrap: wrap;
    align-content: stretch;
    row-gap: 8px;
  }

  /* AMS 3H: back row with the dry box, then the front row (spools sized as five per row) */
  .ams3h {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
  }

  .ams3h-row {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 5px;
  }

  .ha-bambulab-spool.ams3h {
    width: calc(20% - 4px);
    min-width: calc(20% - 4px);
    max-width: calc(20% - 4px);
  }

  .dry-box {
    /* Two spools' width plus the gap between them and the box's own border and padding */
    width: calc(40% + 6px);
    box-sizing: border-box;
    padding: 4px 4px 4px;
    border: 2px solid var(--divider-color, #5f6368);
    border-radius: 10px;
    transition: border-color 200ms ease-out, background-color 200ms ease-out;
  }

  .dry-box.drying {
    border-color: #ff8a00;
    background: rgba(255, 138, 0, 0.07);
  }

  .dry-box-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
    min-height: 22px;
    padding: 0 2px 4px;
    font-size: 12px;
    color: var(--secondary-text-color);
    white-space: nowrap;
    overflow: hidden;
  }

  .dry-box.drying .dry-box-head {
    color: #ff8a00;
  }

  .dry-box-readings {
    display: inline-flex;
    gap: 8px;
    min-width: 0;
    overflow: hidden;
  }

  .dry-box-reading {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    cursor: pointer;
  }

  .dry-box-reading ha-icon {
    --mdc-icon-size: 15px;
  }

  .dry-box-spools {
    display: flex;
    gap: 5px;
  }

  .dry-box-spools .ha-bambulab-spool.ams3h {
    width: calc(50% - 3px);
    min-width: calc(50% - 3px);
    max-width: calc(50% - 3px);
  }

  .ha-bambulab-vector-ams-card {
    align-items: center;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 5px 0px;
  }

  .v-wrapper {
    width: 100%;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  .v-info {
    background: #4f4f4f;
    padding: 0.5em;
    border-radius: 0.5em;
    color: white;
    font-size: smaller;
  }

  .v-ams-container {
    display: flex;
    flex-wrap: nowrap;
    justify-content: center;
    flex-grow: 1;
    width: 100%;
    box-sizing: border-box;
    padding: 0px;
  }

  .v-spools-wrapper {
    display: flex;
    flex-wrap: nowrap;
    justify-content: center;
    width: 100%;
    gap: 5px;
    box-sizing: border-box;
  }
`;
