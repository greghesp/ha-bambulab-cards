import { css } from "lit";

export default css`
  .extra-info {
    display: flex;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: center;
    column-gap: 10px;
    padding: 0px 8px;
    height: 56px;
  }

  .title {
    width: 50%;
  }

  .info-slots {
    display: flex;
    flex-wrap: nowrap;
    justify-content: flex-end;
    column-gap: 5px;
    width: 50%;
  }

  .info {
    background: #4f4f4f;
    padding: 0.5em;
    border-radius: 0.5em;
    color: white;
    font-size: smaller;
    display: flex;
    align-items: center;
    gap: 0px;
  }

  .info ha-icon {
    --mdc-icon-size: 16px;
  }
`;
