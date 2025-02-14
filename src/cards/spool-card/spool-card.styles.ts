import { css } from "lit";

export const styles = css`
  .card {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  .ha-bambulab-spool-card-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .ha-bambulab-spool-card-holder {
    border: 7px solid #808080;
    background: linear-gradient(#959595, #626262, #959595);
    width: 100%;
    box-sizing: border-box;
    border-radius: 0.6em;
    display: flex;
    position: relative;
    flex: 1;
    min-height: calc(112px - 7px);
  }

  .ha-bambulab-spool-info-container {
    display: flex;
    justify-content: center;
  }

  .ha-bambulab-spool-info-wrapper {
    margin-top: 7px;
  }

  .ha-bambulab-spool-info {
    background: #444444;
    padding: 0px 10px;
    border-radius: 0.5em;
    white-space: nowrap;
    color: white;
    font-size: small;
    height: 56px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-wrap: auto;
    text-align: center;
    line-height: 1em;
    overflow: ellipsis;
  }
`;
