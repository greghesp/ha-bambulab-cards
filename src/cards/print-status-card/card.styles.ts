import { css } from "lit";

export default css`
  /* Styling for the 'alpha' text */
  #alpha-text {
    position: absolute;  /* Position it absolutely within the card */
    top: 10px;           /* 10px from the top */
    right: 10px;         /* 10px from the right */
    color: red;          /* Red text */
    font-size: 18px;     /* Adjust font size */
    font-weight: bold;   /* Optional: make the text bold */
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
  }
`;