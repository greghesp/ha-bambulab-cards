import { css } from "lit";

export const styles = css`
  .card {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  
  .spool-card-holder {
    border: 7px solid #808080;
    background: linear-gradient(#959595, #626262, #959595);
    width: 100%;
    box-sizing: border-box;
    border-radius: 0.6em;
    display: flex;
    position: relative;
    min-height: calc(112px - 7px);
    height: 100%
  }
`;
 