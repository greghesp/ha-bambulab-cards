import { css } from "lit";

export default css`
  :host {
    --light-reflection-color-low: rgba(255, 255, 255, 0);
    --light-reflection-color-high: rgba(255, 255, 255, 0.2);
    --card-padding-top: 10px;
    --card-padding-bottom: 25px;
    --spool-info-height: 36px;
  }

  .ha-bambulab-vector-ams-card {
    align-items: center;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .v-extra-info {
    display: flex;
    flex-wrap: nowrap;
    justify-content: flex-end;
    column-gap: 10px;
    padding: 2% 4%;
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
    justify-content: space-evenly;
    flex-grow: 1;
  }

  .v-spool-holder {
    border: 7px solid #808080;
    background: linear-gradient(#959595, #626262, #959595);
    border-radius: 0.6em;
    width: 20%;
    display: flex;
    position: relative;
    min-height: calc(
      168px - calc(var(--spool-info-height) / 2) - var(--card-padding-top) - var(
          --card-padding-bottom
        )
    );
  }

  .v-spool-info-container {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-evenly;
  }

  .v-spool-info-wrapper {
    width: 20%;
    margin: 7px;
  }

  .v-spool-info {
    background: #444444;
    padding: 0px 10px;
    border-radius: 0.5em;
    white-space: nowrap;
    color: white;
    font-size: small;
    height: var(--spool-info-height);
    display: flex;
    justify-content: center;
    align-items: center;
    text-wrap: auto;
    text-align: center;
    line-height: 1em;
    overflow: ellipsis;
  }
`;
