import { html, LitElement, nothing, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { provide } from "@lit/context";

import { MANUFACTURER } from "../../const";
import { registerCustomCard } from "../../utils/custom-cards";
import { hassContext } from "../../utils/context";
import "../shared-components/spool/spool";
import styles from "./card.styles";
import { AMS_3H_CARD_NAME, AMS_3H_MODEL } from "./const";
import { groupTraysByZone, ZoneGroup, ZoneSensor } from "./zones";

registerCustomCard({
  type: AMS_3H_CARD_NAME,
  name: "Bambu Lab AMS 3H Card",
  description: "Spool status for the H3C's AMS 3H: nine trays grouped by drying zone",
});

const ZONE_CHIPS: { sensor: ZoneSensor; icon: string }[] = [
  { sensor: "humidity", icon: "mdi:water-percent" },
  { sensor: "temperature", icon: "mdi:thermometer" },
  { sensor: "dryingTime", icon: "mdi:heat-wave" },
];

@customElement(AMS_3H_CARD_NAME)
export class Ams3hCard extends LitElement {
  @state() private _config?: any;

  @provide({ context: hassContext })
  @state()
  private _hass?: any;

  static styles = styles;

  public setConfig(config: any): void {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this._config = {
      ams: "",
      show_title: true,
      subtitle: "",
      show_type: true,
      spool_anim_reflection: true,
      spool_anim_wiggle: true,
      ...config,
    };
  }

  set hass(hass: any) {
    this._hass = hass;
  }

  public getCardSize(): number {
    return 7;
  }

  public getLayoutOptions() {
    return { grid_rows: 7, grid_columns: 4, grid_min_rows: 6, grid_min_columns: 4 };
  }

  public static async getConfigElement() {
    await import("./ams-3h-card-editor");
    return document.createElement(AMS_3H_CARD_NAME + "-editor");
  }

  public static getStubConfig() {
    return { ams: "MOCK" };
  }

  private _deviceId(): string {
    const configured = this._config?.ams || "";
    if (configured !== "MOCK") return configured;
    const devices = this._hass?.devices || {};
    return (
      Object.keys(devices).find(
        (key) => devices[key].manufacturer === MANUFACTURER && devices[key].model === AMS_3H_MODEL
      ) || ""
    );
  }

  private _title(deviceId: string): string {
    if (this._config.subtitle) return this._config.subtitle;
    const device = this._hass?.devices?.[deviceId];
    return device?.name_by_user || device?.name || AMS_3H_MODEL;
  }

  private _showMoreInfo(entityId: string): void {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true })
    );
  }

  /* A zone's humidity, temperature and drying time. Drying time only shows while drying. */
  private _renderChips(group: ZoneGroup): TemplateResult[] {
    const shown = ZONE_CHIPS.filter(({ sensor }) => {
      const entityId = group.sensors[sensor];
      const stateObj = entityId ? this._hass.states[entityId] : undefined;
      if (!stateObj || ["unavailable", "unknown", ""].includes(stateObj.state)) return false;
      return sensor !== "dryingTime" || Number(stateObj.state) > 0;
    });
    return shown.map(({ sensor, icon }) => {
      const entityId = group.sensors[sensor]!;
      const stateObj = this._hass.states[entityId];
      const value = this._hass.formatEntityState(stateObj);
      // The icon alone doesn't say which reading this is, so name it for screen readers
      const label = `${stateObj.attributes?.friendly_name || sensor}: ${value}`;
      return html`<button
        class="chip ${sensor}"
        aria-label=${label}
        title=${label}
        @click=${() => this._showMoreInfo(entityId)}
      >
        <ha-icon .icon=${icon} aria-hidden="true"></ha-icon>
        <span>${value}</span>
      </button>`;
    });
  }

  /* showHead is false when there are no zones at all (an integration without the zone sensors),
     where an "Other" heading would mean nothing */
  private _renderZone(group: ZoneGroup, showHead: boolean): TemplateResult {
    const label = group.zone === null ? "Other" : `Zone ${group.zone}`;
    return html`
      <section class="zone" aria-label=${label}>
        ${showHead
          ? html`<div class="zone-head">
              <span class="zone-name">${label}</span>
              <div class="chips">${this._renderChips(group)}</div>
            </div>`
          : nothing}
        <div class="spools">
          ${group.trays.map(
            (trayId) => html`
              <ha-bambulab-spool
                class="spool"
                .entity_id=${trayId}
                .show_type=${this._config.show_type}
                .spool_anim_reflection=${this._config.spool_anim_reflection}
                .spool_anim_wiggle=${this._config.spool_anim_wiggle}
              ></ha-bambulab-spool>
            `
          )}
        </div>
      </section>
    `;
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this._config || !this._hass) return nothing;

    const deviceId = this._deviceId();
    const groups = groupTraysByZone(this._hass, deviceId).filter((g) => g.trays.length);
    if (!groups.length) {
      return html`<ha-card>
        <div class="notice">Select an AMS 3H in the card editor.</div>
      </ha-card>`;
    }

    return html`
      <ha-card class=${this._config.show_type ? "with-type" : ""}>
        ${this._config.show_title
          ? html`<div class="title">${this._title(deviceId)}</div>`
          : nothing}
        ${groups.map((g) =>
          this._renderZone(
            g,
            groups.some((x) => x.zone !== null)
          )
        )}
      </ha-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AMS_3H_CARD_NAME]: Ams3hCard;
  }
}
