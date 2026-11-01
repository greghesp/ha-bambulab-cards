import { html, LitElement, nothing, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";

import { AMS_MODELS, MANUFACTURER } from "../../const";
import { registerCustomCard } from "../../utils/custom-cards";
import styles from "./card.styles";
import { AMS_GRAPHIC_CARD_NAME } from "./const";
import { Slot, VARIANTS, variantFromModel } from "./geo";
import { renderSvg } from "./render";

registerCustomCard({
  type: AMS_GRAPHIC_CARD_NAME,
  name: "Bambu Lab AMS Graphic Card",
  description:
    "Spool status for AMS / AMS 2 PRO / AMS HT with graphic spool rendering (fill level, glass overlay, labels)",
});

const ICON_TEMP =
  '<svg class="ic" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">' +
  '<path d="M10.9 14.4V6.5a1.15 1.15 0 0 1 2.3 0v7.9" fill="none" stroke="#e53935" stroke-width="1.5" stroke-linecap="round"/>' +
  '<circle cx="12.05" cy="17.2" r="2.7" fill="none" stroke="#e53935" stroke-width="1.5"/>' +
  '<circle cx="12.05" cy="17.2" r="1.3" fill="#e53935"/>' +
  '<path d="M12.05 10.4v5.2" stroke="#e53935" stroke-width="1.05" stroke-linecap="round"/>' +
  '<path d="M15.1 7.4h1.7M15.1 10h1.1M15.1 12.6h1.7" stroke="#e53935" stroke-width="1.1" stroke-linecap="round"/>' +
  "</svg>";

const ICON_HUM =
  '<svg class="ic" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">' +
  '<path d="M12 3.3c3.3 4.4 6.2 7.6 6.2 10.8a6.2 6.2 0 1 1-12.4 0C5.8 10.9 8.7 7.7 12 3.3Z" fill="none" stroke="#2196f3" stroke-width="1.5" stroke-linejoin="round"/>' +
  '<path d="M9.3 14.4a2.75 2.75 0 0 0 2.75 2.75" fill="none" stroke="#2196f3" stroke-width="1.3" stroke-linecap="round" opacity="0.85"/>' +
  '<path d="M9.9 9.9a4.9 4.9 0 0 1 1.6-2.4" fill="none" stroke="#2196f3" stroke-width="1.1" stroke-linecap="round" opacity="0.6"/>' +
  "</svg>";

@customElement(AMS_GRAPHIC_CARD_NAME)
export class AmsGraphicCard extends LitElement {
  @state() private _config?: any;
  @state() private _hass?: any;

  private _popupEl?: HTMLElement;

  static styles = styles;

  public setConfig(config: any): void {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    const trays = Array.isArray(config.trays)
      ? config.trays.slice(0, 4)
      : [config.tray_1, config.tray_2, config.tray_3, config.tray_4];
    this._config = {
      ams: "",
      custom_temperature: "",
      custom_humidity: "",
      show_info_bar: true,
      subtitle: "",
      show_title: true,
      show_labels: true,
      label_mode: "type",
      show_empty_label: false,
      ...config,
      trays,
    };
  }

  public set hass(hass: any) {
    const firstTime = hass && !this._hass;
    this._hass = hass;
    /* "MOCK" is used by the card-picker preview: auto-select an AMS device so the thumbnail
       shows a real card instead of an empty one */
    if (firstTime && this._config && this._config.ams === "MOCK") {
      const pick = this._pickMockDevice();
      if (pick) this._config = { ...this._config, ams: pick };
    }
  }

  public getCardSize(): number {
    return 4 + (this._config?.show_info_bar === false ? 0 : 1);
  }

  /* Match the graphic style of the integration's own AMS card: 4 rows (plus 1 for the info
     bar), with AMS HT spanning a single column */
  public getLayoutOptions() {
    const rows = this.getCardSize();
    const columns = this._resolve().variantKey === "ht" ? 1 : 4;
    return {
      grid_rows: rows,
      grid_columns: columns,
      grid_min_rows: rows,
      grid_min_columns: columns,
    };
  }

  public static async getConfigElement() {
    await import("./ams-graphic-card-editor");
    return document.createElement(AMS_GRAPHIC_CARD_NAME + "-editor");
  }

  public static getStubConfig() {
    return { ams: "MOCK" };
  }

  /* ---------- entity resolution ---------- */

  private _pickMockDevice(): string {
    const devices = this._hass?.devices || {};
    for (const key of Object.keys(devices)) {
      const d = devices[key];
      if (d.manufacturer === MANUFACTURER && AMS_MODELS.includes(d.model)) return key;
    }
    return "";
  }

  private _deviceEntities(deviceId: string): string[] {
    if (!deviceId || !this._hass || !this._hass.entities) return [];
    const out: string[] = [];
    for (const [eid, ent] of Object.entries(this._hass.entities) as [string, any][]) {
      if (ent.device_id === deviceId && !ent.disabled_by) out.push(eid);
    }
    return out.sort();
  }

  private _resolve(): any {
    const cfg = this._config || {};
    const hass = this._hass;
    const r: any = {
      variantKey: "ams2pro",
      geo: VARIANTS.ams2pro,
      trays: [],
      tempEntity: cfg.custom_temperature || "",
      humEntity: cfg.custom_humidity || "",
      deviceName: "",
    };
    const dev = cfg.ams && hass && hass.devices ? hass.devices[cfg.ams] : null;
    if (dev) {
      r.variantKey = variantFromModel(dev.model);
      r.deviceName = dev.name_by_user || dev.name || "";
      r.geo = VARIANTS[r.variantKey] || VARIANTS.ams2pro;
      const ents = this._deviceEntities(cfg.ams);
      const trayEnts = ents
        .filter((e) => /_tray_\d+$/.test(e) && hass.states[e])
        .sort((a, b) => {
          const na = Number((a.match(/_tray_(\d+)$/) || [])[1] || 0);
          const nb = Number((b.match(/_tray_(\d+)$/) || [])[1] || 0);
          return na - nb;
        });
      if (trayEnts.length) r.trays = trayEnts;
      const dc = (e: string) =>
        (hass.states[e] && hass.states[e].attributes && hass.states[e].attributes.device_class) || "";
      if (!r.tempEntity) {
        r.tempEntity = ents.find((e) => dc(e) === "temperature") || ents.find((e) => /_temperature$/.test(e)) || "";
      }
      if (!r.humEntity) {
        r.humEntity =
          ents.find((e) => dc(e) === "humidity") ||
          ents.find((e) => /_humidity$/.test(e) && !/_index$/.test(e)) ||
          "";
      }
    }
    if (!r.trays.length) r.trays = (cfg.trays || []).filter(Boolean);
    return r;
  }

  private _slot(entityId: string): Slot {
    if (!entityId) {
      return { empty: true, type: "", color: "#000000", remain: -1, name: "", active: false };
    }
    const st = this._hass && this._hass.states[entityId];
    if (!st) {
      return { empty: true, type: "", color: "#000000", remain: -1, name: "", active: false, missing: true };
    }
    const a = st.attributes || {};
    const blank = (c: any) => {
      if (!c) return true;
      const s = String(c).toLowerCase().replace("#", "").trim();
      return s === "" || s === "00000000" || s === "000000" || s === "none" || s === "nil";
    };
    const cols = Array.isArray(a.cols) ? a.cols.filter((c: any) => !blank(c)) : [];
    const rawColor = cols[0] || a.color || "";
    const empty =
      a.unknown === true ||
      a.empty === true ||
      a.type === "?" ||
      blank(rawColor) ||
      st.state === "Empty" ||
      st.state === "empty";
    const remainNum = a.remain == null ? -1 : Number(a.remain);
    const label = empty ? "" : a.type && a.type !== "?" ? String(a.type) : a.name ? String(a.name) : "";
    return {
      empty,
      color: empty ? "#000000" : String(rawColor).slice(0, 7),
      remain: Number.isNaN(remainNum) ? -1 : remainNum,
      type: label || "?",
      name: a.name || st.state || "",
      active: !!(a.active || a.in_use),
    };
  }

  /* ---------- rendering ---------- */

  private _stateValue(e: string): string {
    const st = e && this._hass ? this._hass.states[e] : null;
    if (!st) return "";
    if (st.state === "unavailable" || st.state === "unknown") return "";
    return String(st.state);
  }

  private _unit(e: string): string {
    const st = e && this._hass ? this._hass.states[e] : null;
    return (st && st.attributes && st.attributes.unit_of_measurement) || "";
  }

  private _head(r: any): TemplateResult | typeof nothing {
    const cfg = this._config || {};
    const showTitle = cfg.show_title !== false && !!cfg.subtitle;
    const chip = (e: string, icon: string, fallbackUnit: string) => {
      const v = this._stateValue(e);
      if (v === "") return nothing;
      const u = this._unit(e) || fallbackUnit;
      return html`<span class="chip">${unsafeSVG(icon)}<span class="val">${v}${u}</span></span>`;
    };
    const t = cfg.show_info_bar === false ? nothing : chip(r.tempEntity, ICON_TEMP, "°C");
    const h = cfg.show_info_bar === false ? nothing : chip(r.humEntity, ICON_HUM, "%");
    if (!showTitle && t === nothing && h === nothing) return nothing;
    return html`<div class="head ${r.variantKey === "ht" ? "center" : ""}">
      ${showTitle ? html`<div class="title">${cfg.subtitle}</div>` : nothing}
      ${t === nothing && h === nothing ? nothing : html`<div class="info">${t}${h}</div>`}
    </div>`;
  }

  protected render(): TemplateResult | typeof nothing {
    const cfg = this._config;
    if (!cfg || !this._hass) return nothing;

    const r = this._resolve();
    if (r.geo.unsupported) {
      return html`<ha-card>
        <div class="notice">
          ${r.geo.name} is not supported yet — supported models: AMS / AMS 2 PRO / AMS HT.
        </div>
      </ha-card>`;
    }
    if (!r.trays.length) {
      return html`<ha-card>
        <div class="notice">Select an AMS in the card editor.</div>
      </ha-card>`;
    }

    const slots = r.trays.map((id: string) => this._slot(id));
    const hum = this._stateValue(r.humEntity);
    const temp = this._stateValue(r.tempEntity);
    const svg = renderSvg({
      geo: r.geo,
      slots,
      trayEntities: r.trays,
      showLabels: cfg.show_labels !== false,
      labelMode: cfg.label_mode || "type",
      showEmptyLabel: cfg.show_empty_label === true,
      hum: hum === "" ? "--" : `${hum}${this._unit(r.humEntity) === "%" ? "%" : ""}`,
      temp: temp === "" ? "--" : `${temp}°`,
    });

    return html`<ha-card>${this._head(r)}${unsafeSVG(svg)}</ha-card>`;
  }

  protected updated(): void {
    this.renderRoot.querySelectorAll("[data-tray-entity]").forEach((g) => {
      g.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this._openFilamentPopup((g as HTMLElement).getAttribute("data-tray-entity") || "");
      });
    });
  }

  /* Clicking a filament label opens the integration's filament popup; when the integration
     is not loaded it falls back to the native more-info dialog */
  private _openFilamentPopup(entityId: string): void {
    if (!entityId) return;
    if (customElements.get("ams-popup")) {
      let p = this._popupEl;
      if (!p || !p.isConnected) {
        p = document.createElement("ams-popup");
        p.style.cssText = "position:fixed;left:-200vw;top:0;width:1px;height:1px";
        document.body.appendChild(p);
        this._popupEl = p;
      }
      (p as any).hass = this._hass;
      (p as any).entity_id = entityId;
      if ((p as any).is_bambu_lab === undefined) (p as any).is_bambu_lab = true;
      const inner = p.shadowRoot && p.shadowRoot.querySelector(".popup-action-container");
      if (inner) {
        inner.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
      } else {
        p.click();
      }
      return;
    }
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId },
        bubbles: true,
        composed: true,
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AMS_GRAPHIC_CARD_NAME]: AmsGraphicCard;
  }
}
