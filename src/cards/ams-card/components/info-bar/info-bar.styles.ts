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

  /* AMS HT: the title sits beside the readings when the card is wide enough, and wraps onto its own
     line above them when it isn't. Both lines fit in the bar, so the card keeps its height. The
     graphic style sizes itself to its contents, so a long title must not count towards its width; the
     intrinsic size keeps the bar usable there if the picture fails to load. */
  .extra-info.ht {
    contain: inline-size;
    contain-intrinsic-inline-size: 64px;
    flex-wrap: wrap;
    align-content: center;
    row-gap: 2px;
  }

  .extra-info.ht .title {
    flex: 0 1 auto;
    width: auto;
    min-width: 0;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .extra-info.ht .info-slots {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
  }
`;
