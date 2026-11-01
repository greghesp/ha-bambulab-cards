import { css } from "lit";

export default css`
  :host {
    display: block;
    height: 100%;
  }

  ha-card {
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--ha-card-background, var(--card-background-color, #fff));
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 14px 0;
  }

  /* The AMS HT panel is narrow, so centring the values reads better; AMS / AMS 2 PRO keep the
     title on the left and the values on the right */
  .head.center {
    justify-content: center;
  }

  .title {
    font-size: 15px;
    font-weight: 500;
    color: var(--primary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .info {
    display: flex;
    gap: 12px;
    font-size: 14px;
    color: var(--secondary-text-color);
    flex: 0 0 auto;
  }

  .info .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  .info .ic {
    display: block;
  }

  /* Fill the row with flex when the grid fixes the height; otherwise fall back to the natural
     viewBox height */
  .art {
    display: block;
    width: 100%;
    flex: 1 1 auto;
    min-height: 0;
  }

  .notice {
    padding: 10px 16px 14px;
    text-align: center;
    color: var(--secondary-text-color);
    font-size: 13px;
  }

  text {
    font-family: var(
      --ha-font-family-body,
      "Segoe UI",
      Roboto,
      "Helvetica Neue",
      "Microsoft YaHei",
      sans-serif
    );
  }

  .slotlabel {
    cursor: pointer;
  }

  .slotlabel:hover rect {
    fill-opacity: 0.72;
  }
`;
