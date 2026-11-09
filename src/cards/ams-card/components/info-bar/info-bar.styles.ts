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

  /* AMS 3H: one chip per drying zone, which needs more room than the title */
  .title.zones-title {
    width: auto;
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .info-slots.zones {
    width: auto;
    flex: 0 1 auto;
    min-width: 0;
  }

  .info.zone {
    gap: 8px;
    white-space: nowrap;
  }

  .zone-name {
    font-weight: 600;
    opacity: 0.75;
  }

  .zone-reading {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    cursor: pointer;
  }
`;
