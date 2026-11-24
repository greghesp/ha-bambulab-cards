import { css } from "lit";

export const styles = css`
  :host { display: block; }
  ha-card { display: flex; flex-direction: column; max-height: 900px; overflow: hidden; color: var(--primary-text-color); }
  .header { flex-shrink: 0; padding: 18px 20px 14px; display: flex; align-items: baseline; gap: 10px; }
  h2 { font-size: 18px; font-weight: 600; margin: 0; }
  .count { color: var(--secondary-text-color); font-size: 13px; }
  .toolbar { flex-shrink: 0; padding: 0 20px 16px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  input, select, button { font: inherit; color: var(--primary-text-color); }
  input, select { box-sizing: border-box; border: 1px solid var(--divider-color, #ddd); border-radius: 4px; background: var(--card-background-color, white); height: 36px; padding: 0 10px; min-width: 0; }
  input { flex: 1 1 180px; }
  select { flex: 1 1 130px; max-width: 220px; }
  button { cursor: pointer; }
  .action-button { border: 1px solid var(--divider-color, #ddd); border-radius: 4px; background: transparent; height: 36px; padding: 0 12px; }
  .action-button:disabled { opacity: .5; cursor: default; }
  .show-button { margin-left: auto; }
  .collapse-button { width: 36px; padding: 0; display: grid; place-items: center; }
  .collapse-button ha-icon { --mdc-icon-size: 20px; }
  .inventory-list { min-height: 0; overflow-y: auto; }
  .group { border-top: 1px solid var(--divider-color, #ddd); }
  .group-heading { width: 100%; padding: 9px 20px; border: 0; display: flex; align-items: center; gap: 8px; text-align: left; background: var(--secondary-background-color, #f3f3f3); font-size: 13px; }
  .group-heading ha-icon { --mdc-icon-size: 18px; }
  .group-name { font-weight: 600; flex: 1; min-width: 0; overflow-wrap: anywhere; }
  .group-meta { color: var(--secondary-text-color); white-space: nowrap; }
  .row { position: relative; display: grid; grid-template-columns: 40px minmax(0, 1fr) max-content; gap: 0 12px; padding: 6px 20px; border-top: 1px solid var(--divider-color, #ddd); }
  .swatch { grid-row: 1 / 3; align-self: start; width: 38px; height: 38px; border: 1px solid rgba(127, 127, 127, .35); border-radius: 5px; }
  .name { grid-column: 2 / 4; grid-row: 1; align-self: start; min-width: 0; font-size: 14px; line-height: 1.2; font-weight: 500; overflow-wrap: anywhere; }
  .meta { grid-column: 2; grid-row: 2; align-self: end; min-width: 0; color: var(--secondary-text-color); font-size: 12px; line-height: 1.4; overflow-wrap: anywhere; }
  .remaining { grid-column: 3; grid-row: 2; align-self: start; width: 11ch; min-width: max-content; margin-top: 1px; font-size: 13px; line-height: 1.2; font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
  .remaining small { color: var(--secondary-text-color); font-size: 12px; }
  .bar { height: 5px; margin-top: 2px; background: var(--secondary-background-color, #eee); border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; background: var(--success-color, #22a041); border-radius: 4px; }
  .message { padding: 28px 20px; color: var(--secondary-text-color); text-align: center; font-size: 14px; }
  .error { color: var(--error-color, #b3261e); }
  @media (max-width: 480px) {
    .header { padding: 16px 14px 12px; }
    .toolbar { padding: 0 14px 12px; }
    input { flex-basis: calc(100% - 52px); }
    select { flex: 1 1 110px; max-width: none; }
    .group-heading { padding: 9px 14px; }
    .row { padding: 6px 14px; grid-template-columns: 36px minmax(0, 1fr) max-content; column-gap: 10px; }
    .swatch { width: 34px; height: 34px; }
  }
`;