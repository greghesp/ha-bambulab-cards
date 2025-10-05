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
