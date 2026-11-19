import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

export const NOZZLE_BADGE_NAME = "bambu-lab-nozzle-badge";

/* The integration's AMS "Connected nozzle" sensor reports which extruder an AMS feeds on
   printers with two nozzles (H2D, H2C, ...). It doesn't exist on single nozzle printers. */
export const CONNECTED_NOZZLE_KEY = "connected_nozzle";

const NO_VALUE = ["unavailable", "unknown", ""];

/* Find an AMS device's connected nozzle sensor */
export function findConnectedNozzleEntity(hass, deviceId: string): string | undefined {
  if (!hass?.entities || !deviceId) return undefined;
  for (const ent of Object.values(hass.entities) as any[]) {
    if (
      ent.device_id === deviceId &&
      ent.platform === "bambu_lab" &&
      ent.translation_key === CONNECTED_NOZZLE_KEY &&
      !ent.disabled_by
    ) {
      return ent.entity_id;
    }
  }
  return undefined;
}

/* The nozzle's name ("Left", "Right"), or undefined while the sensor has no value */
export function connectedNozzleLabel(hass, entityId: string | undefined): string | undefined {
  const stateObj = entityId ? hass?.states?.[entityId] : undefined;
  if (!stateObj || NO_VALUE.includes(stateObj.state)) return undefined;
  return hass.formatEntityState ? hass.formatEntityState(stateObj) : String(stateObj.state);
}

/* A small chip saying which nozzle this AMS feeds; opens the sensor's more-info on click */
@customElement(NOZZLE_BADGE_NAME)
export class NozzleBadge extends LitElement {
  @property({ attribute: false }) public hass;
  @property({ attribute: false }) public entityId?: string;

  static styles = css`
    :host {
      display: inline-flex;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 1px 6px 1px 3px;
      border-radius: 10px;
      font-size: 12px;
      line-height: 18px;
      white-space: nowrap;
      cursor: pointer;
      color: var(--primary-text-color);
      background: var(--secondary-background-color, rgba(127, 127, 127, 0.2));
      border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
    }

    .badge:hover {
      border-color: var(--primary-color);
    }

    .badge:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 1px;
    }

    ha-icon {
      --mdc-icon-size: 16px;
      color: var(--primary-color);
    }
  `;

  #open() {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId: this.entityId },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    const label = connectedNozzleLabel(this.hass, this.entityId);
    if (!label) return nothing;
    const description = `Feeds nozzle: ${label}`;
    return html`<span
      class="badge"
      role="button"
      tabindex="0"
      title=${description}
      aria-label=${description}
      @click=${(ev: Event) => {
        ev.stopPropagation();
        this.#open();
      }}
      @keydown=${(ev: KeyboardEvent) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          ev.stopPropagation();
          this.#open();
        }
      }}
    >
      <ha-icon icon="mdi:printer-3d-nozzle" aria-hidden="true"></ha-icon>
      <span>${label}</span>
    </span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [NOZZLE_BADGE_NAME]: NozzleBadge;
  }
}
