import { css } from "lit";

export const styles = css`
  .card {
    align-items: center;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 5px 0px;
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

  .v-wrapper {
    width: 100%;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
`;
