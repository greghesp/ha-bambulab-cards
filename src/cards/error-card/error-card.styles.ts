import { css } from "lit";

export const styles = css`
  .content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
  }

  ha-card[header] .content {
    padding-top: 0;
  }

  ha-alert {
    display: block;
  }

  .message {
    overflow-wrap: anywhere;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 12px;
    margin-top: 4px;
    font-size: 0.85em;
    color: var(--secondary-text-color);
  }

  .code {
    font-family: var(--ha-font-family-code, monospace);
  }

  .meta a {
    color: var(--primary-color);
    text-decoration: none;
    white-space: nowrap;
  }

  .meta a:hover,
  .meta a:focus-visible {
    text-decoration: underline;
  }
`;
