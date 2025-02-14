import { css } from "lit";

export default css`
  /* Styling for the 'alpha' text */
  #alpha-text {
    position: absolute;
    top: 1px;
    right: 1px;
    color: red;
    font-size: 12px;
    font-weight: bold;
  }
  .card {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px;
    background: var(--card-background-color);
  }
  #container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%; 
  }
  .control-container {
      position: relative;
      display: inline-block;
      width: 100%;
      height: 100%;
  }
  .entity {
      position: absolute;
      transform: translate(-50%, -50%);
      display: flex;
      justify-content: center;
      text-align: center;
      align-items: center;
  }
  #printer {
    display: block;
    width: 100%;
    height: auto;
    object-fit: contain;
  }
`;