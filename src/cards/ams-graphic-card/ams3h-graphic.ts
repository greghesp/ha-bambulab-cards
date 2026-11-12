/* AMS-3H geometry and rendering ported from spikekai/ha-ams-graphic-card
 * reference commit 7a3eb8559507cce99c596074b0fce68ac1301fdb.
 * Keep design coordinates, theme fallbacks and responsive humidity sizing in sync.
 * This is an isolated Lit view; no reference runtime is loaded.
 */
import { LitElement, nothing } from "lit";
import { property, customElement } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { esc } from "./geo";
const A2P_MESSAGES = {
  dryingZone: {
    zh: "干燥区",
    en: "Drying",
  },
  emptySlot: {
    zh: "空槽",
    en: "Empty slot",
  },
  offline: {
    zh: "离线",
    en: "Offline",
  },
  unknownMaterial: {
    zh: "未知材料",
    en: "Unknown material",
  },
  unknownRemaining: {
    zh: "余量未知",
    en: "Remaining unknown",
  },
  inUse: {
    zh: " · 正在使用",
    en: " · In use",
  },
  spoolStatus: {
    zh: " 料盘状态",
    en: " spool status",
  },
  dryingStatus: {
    zh: "烘干中",
    en: "Drying",
  },
};
function a2pLanguage(hass) {
  const language =
    hass?.locale?.language || hass?.language || globalThis.navigator?.language || "en";
  return /^zh/i.test(language) ? "zh" : "en";
}
function a2pText(hass, key) {
  return A2P_MESSAGES[key][a2pLanguage(hass)] || A2P_MESSAGES[key].en;
}

const ams3hAvailable = (s) =>
  !!s && !["unknown", "unavailable"].includes(s.state) && !s.attributes?.restored;
const ams3hValidColor = (c) => typeof c === "string" && /^#[\da-f]{6}([\da-f]{2})?$/i.test(c);
const ams3hTrue = (v) => v === true || v === "true";
function ams3hSlotData(state, entity, number, hass) {
  const a = state?.attributes || {};
  const offline = !ams3hAvailable(state);
  const empty =
    !offline &&
    (ams3hTrue(a.unknown) ||
      ams3hTrue(a.empty) ||
      a.type === "Empty" ||
      String(a.color).toUpperCase() === "#00000000");
  const remain = a.remain == null ? -1 : Number(a.remain);
  const amount =
    !Number.isFinite(remain) || remain < 0 ? 95 : 20 + Math.max(0, Math.min(100, remain)) * 0.75;
  return {
    entity,
    number,
    offline,
    empty,
    amount,
    name: a.name || a.type || "",
    material: offline
      ? a2pText(hass, "offline")
      : empty
        ? a2pText(hass, "emptySlot")
        : a.type || a2pText(hass, "unknownMaterial"),
    color: ams3hValidColor(a.color) ? a.color : "#888888",
    colors: Array.isArray(a.cols) ? a.cols.filter(ams3hValidColor).slice(0, 8) : [],
    remaining:
      Number.isFinite(remain) && remain >= 0
        ? `${Math.min(100, remain)}%`
        : a2pText(hass, "unknownRemaining"),
  };
}
// 按实体 ID、一基槽号、tray_N、slot 或唯一且非零的 tray_uuid 匹配。
// 不按颜色/耗材名匹配，不借用各槽 active 标记，避免多个工具同时高亮。
function ams3hActiveNumber(state, cfg) {
  if (!ams3hAvailable(state) || ["none", "", "?"].includes(String(state.state).toLowerCase()))
    return 0;
  const value = String(state.state);
  const entityIndex = cfg.trays.indexOf(value);
  if (entityIndex >= 0) return entityIndex + 1;
  const match = value.match(/^(?:tray_)?([1-9])$/);
  if (match) return Number(match[1]);
  const slot = Number(state.attributes?.slot);
  if (Number.isInteger(slot) && slot >= 1 && slot <= 9) return slot;
  // HA 的 active_tray.state 可能是材料名；用料卷身份匹配，不能按颜色/名字猜。
  const uuid = String(state.attributes?.tray_uuid || "")
    .replace(/-/g, "")
    .toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(uuid) || /^0+$/.test(uuid)) return 0;
  const matches = cfg.trays
    .map((id, i) => ({ i, state: cfg.states?.[id] }))
    .filter(
      (t) =>
        ams3hAvailable(t.state) &&
        String(t.state.attributes?.tray_uuid || "")
          .replace(/-/g, "")
          .toLowerCase() === uuid
    );
  return matches.length === 1 ? matches[0].i + 1 : 0;
}
const ams3hText = (x, y, value, size = 24, attrs = "") =>
  `<text x="${x}" y="${y}" font-size="${size}" ${attrs}>${esc(value)}</text>`;

@customElement("bambu-lab-ams3h-graphic")
export class Ams3hGraphic extends LitElement {
  @property({ attribute: false }) _hass: any;
  @property({ attribute: false }) _config: any;
  private _zoneResizeObserver?: ResizeObserver;
  connectedCallback() {
    super.connectedCallback();
    this._zoneResizeObserver = new ResizeObserver(() => this._fitAms3hZones());
    this._zoneResizeObserver.observe(this);
  }
  disconnectedCallback() {
    this._zoneResizeObserver?.disconnect();
    super.disconnectedCallback();
  }
  protected updated() {
    this._fitAms3hZones();
  }
  protected render() {
    if (!this._hass || !this._config) return nothing;
    const r: any = {};
    this._resolveAms3h(r, this._hass.devices?.[this._config.ams]);
    const states = this._hass.states;
    const slots = r.trays.map((id, i) => ams3hSlotData(states[id], id, i + 1, this._hass));
    const printing = states[r.printStatusEntity];
    let active =
      ams3hAvailable(printing) && ["prepare", "running"].includes(printing.state)
        ? ams3hActiveNumber(states[r.activeEntity], { trays: r.trays, states })
        : 0;
    if (active && (slots[active - 1].offline || slots[active - 1].empty)) active = 0;
    return unsafeHTML(this._renderAms3h(r, slots, active));
  }
  constructor() {
    super();
    this.addEventListener("click", this._openSlot);
    this.addEventListener("keydown", this._openSlot);
  }
  private _openSlot = (event: Event) => {
    if (event instanceof KeyboardEvent && !["Enter", " "].includes(event.key)) return;
    const slot = event
      .composedPath()
      .find((el) => el instanceof Element && el.hasAttribute("data-entity")) as Element | undefined;
    const entityId = slot?.getAttribute("data-entity");
    if (!entityId) return;
    event.preventDefault();
    this.dispatchEvent(
      new CustomEvent("ams3h-filament", { detail: { entityId }, bubbles: true, composed: true })
    );
  };
  _deviceEntities(deviceId) {
    if (!deviceId || !this._hass || !this._hass.entities) return [];
    const out: string[] = [];
    for (const [eid, ent] of Object.entries<any>(this._hass.entities)) {
      if (ent.device_id === deviceId && !ent.disabled_by) out.push(eid);
    }
    return out.sort();
  }

  _resolveAms3h(r, dev) {
    const cfg = this._config,
      states = this._hass.states;
    const ents = this._deviceEntities(cfg.ams);
    // 空槽/缺实体必须保留原槽号，不因数组 filter 发生错位。
    r.trays = Array.from(
      { length: 9 },
      (_, i) =>
        cfg.ams3h_trays?.[i] ||
        ents.find((id) => {
          const slot = states[id]?.attributes?.slot;
          return /_tray_\d+$/.test(id) && Number(slot ?? id.match(/_tray_(\d+)$/)![1]) === i + 1;
        }) ||
        ""
    );
    r.zones = [1, 2].map((z) =>
      ["temperature", "humidity", "remaining_drying_time"].reduce(
        (zone, key) => {
          const configured =
            cfg["zone_" + z + "_" + key + "_entity"] ||
            (z === 1 && key === "temperature"
              ? cfg.custom_temperature
              : z === 1 && key === "humidity"
                ? cfg.custom_humidity
                : "");
          const matches = ents.filter((id) => {
            const a = states[id]?.attributes || {};
            return (
              new RegExp("_zone_" + z + "_" + key + "$").test(id) ||
              (Number(a.zone) === z && (a.device_class === key || a.sensor_type === key))
            );
          });
          zone[key] = configured || (matches.length === 1 ? matches[0] : "");
          return zone;
        },
        {} as Record<string, string>
      )
    );
    const parent = dev?.via_device_id;
    const activeCandidates = parent
      ? this._deviceEntities(parent).filter((id) => /_active_tray$/.test(id))
      : [];
    r.activeEntity =
      cfg.active_tray_entity || (activeCandidates.length === 1 ? activeCandidates[0] : "");
    const printCandidates = parent
      ? this._deviceEntities(parent).filter((id) => /_print_status$/.test(id))
      : [];
    r.printStatusEntity = printCandidates.length === 1 ? printCandidates[0] : "";
    const toolEntities = parent
      ? Object.entries<any>(this._hass.entities || {})
          .filter(([id, entity]) => {
            const device = this._hass.devices?.[entity.device_id];
            return (
              !entity.disabled_by &&
              (entity.device_id === parent || device?.via_device_id === parent) &&
              /_printtool_\d+$/.test(id)
            );
          })
          .map(([id]) => id)
      : [];
    r.tools = Array.from({ length: 9 }, (_, i) => {
      const matches = toolEntities.filter((id) => Number(states[id]?.attributes?.tool) === i + 1);
      return matches.length === 1 ? matches[0] : "";
    });
  }

  static humidityIcon(state, attrs = "") {
    const solid = state !== "" && Number.isFinite(Number(state)) && Number(state) > 20;
    return (
      '<svg class="ic humidity-icon" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" ' +
      attrs +
      ">" +
      '<path d="M12 3.3c3.3 4.4 6.2 7.6 6.2 10.8a6.2 6.2 0 1 1-12.4 0C5.8 10.9 8.7 7.7 12 3.3Z" fill="' +
      (solid ? "#2196f3" : "none") +
      '" stroke="#2196f3" stroke-width="1.5" stroke-linejoin="round"/>' +
      "</svg>"
    );
  }

  _ams3hDrying(z) {
    const entities = ["temperature", "humidity", "remaining_drying_time"]
      .map((key) => this._hass.states[z[key]])
      .filter(ams3hAvailable);
    const duration = entities
      .map((e) => e.attributes?.dry_setting?.dry_duration)
      .find((v) => v != null);
    const slotEntity = entities.find((e) => e.attributes?.slots !== undefined);
    const slots = slotEntity ? slotEntity.attributes.slots : [6, 8];
    return {
      active: Number(duration) > 0,
      slots: new Set(
        (Array.isArray(slots) ? slots : []).filter((v) => Number.isInteger(v) && v >= 1 && v <= 9)
      ),
    };
  }
  _ams3hZone(z, number, x) {
    const states = this._hass.states;
    const value = (key, unit) =>
      ams3hAvailable(states[z[key]])
        ? states[z[key]].state + (states[z[key]].attributes?.unit_of_measurement || unit)
        : "—";
    const isDryingZone = number === 2; // 右侧为 zone_1；左侧整舱 zone_2 不显示烘干信息。
    const heating = isDryingZone && this._ams3hDrying(z).active;
    const remaining = states[z.remaining_drying_time];
    const drying =
      heating && ams3hAvailable(remaining) && Number(remaining.state) > 0
        ? value("remaining_drying_time", "")
        : "";
    // v1.14：以 y=86 为缩放基点，整块放大 40%；九槽几何保持不变。
    const zoneScale = 1.4,
      zoneX = number === 1 ? 182 : 1117;
    return (
      '<g class="zone" transform="translate(' +
      zoneX +
      " 86) scale(" +
      zoneScale +
      ") translate(" +
      -x +
      ' -86)">' +
      (isDryingZone
        ? ams3hText(
            x + 8 / zoneScale,
            106,
            a2pText(this?._hass, "dryingZone"),
            16,
            'class="zone-title"'
          )
        : "") +
      '<g class="zone-humidity"' +
      (isDryingZone ? ' data-center="' + (x + 109.08 / zoneScale / 2) + '"' : "") +
      ">" +
      Ams3hGraphic.humidityIcon(
        states[z.humidity]?.state,
        'x="' + (x + 1) + '" y="130" data-x="' + (x + 1) + '"'
      ) +
      ams3hText(x + 28, 150, value("humidity", "%"), 23) +
      "</g>" +
      ams3hText(
        x,
        188,
        value("temperature", "°C"),
        23,
        'class="zone-temperature"' + (heating ? ' style="fill:var(--a2p-drying-temperature)"' : "")
      ) +
      (drying ? ams3hText(x, 222, drying, 17, 'class="zone-time"') : "") +
      "</g>"
    );
  }
  _renderAms3h(r, slots, active) {
    const drying = this._ams3hDrying(r.zones[0]);
    return `<style>
      :host{display:block;height:100%;
        --a2p-panel:var(--ha-card-background,var(--card-background-color,#242424));
        --a2p-slot-outline:color-mix(in srgb,var(--secondary-text-color,#888) 72%,var(--a2p-panel));
        --a2p-text:var(--primary-text-color,#ddd);
        --a2p-secondary:var(--secondary-text-color,#888);
        --a2p-accent:var(--primary-color,#bbf747);
        --a2p-warm:var(--ams3h-drying-color,var(--warning-color,#ffa340));
        --a2p-drying-temperature:var(--ams3h-drying-temperature-color,var(--error-color,#ff4d4f));
      }ha-card{display:flex;flex-direction:column;justify-content:center;height:100%;min-height:312px;padding:12px 0;box-sizing:border-box;overflow:hidden;background:var(--a2p-panel);border:0;border-radius:16px}
      .art{display:block;flex:none;width:100%;height:auto;aspect-ratio:1096/532;color:var(--a2p-text);font-family:var(--ha-font-family-body,"Segoe UI","Microsoft YaHei",sans-serif)}
      text{fill:currentColor;pointer-events:none}.slot{color:#ddd;cursor:pointer}.slot-frame{fill:#131313;stroke:var(--a2p-slot-outline);stroke-width:1;vector-effect:non-scaling-stroke}
      .slot-number{fill:#404040;stroke:#777;stroke-width:.6;vector-effect:non-scaling-stroke}
      .dimmed > .slot-frame,.dimmed > .slot-number{opacity:1}
      .slot.active .slot-frame{stroke:#eee}.dimmed{opacity:1}.dimmed > :not(text):not(.slot-frame):not(.slot-number):not(.drying-indicator):not(.drying-frame):not(.spool),.dimmed.empty > .spool,.dimmed.offline > .spool{opacity:.32}.offline{color:#888}
      .tube{fill:none;stroke:var(--a2p-secondary);stroke-width:4;stroke-dasharray:8 8}.feed.active .tube{stroke:var(--feed-color);stroke-width:6;stroke-dasharray:none}
      .tool-frame{fill:none;stroke:transparent}.feed.active .tool-frame{stroke:var(--a2p-text);stroke-width:2;vector-effect:non-scaling-stroke}
      .feed.active .tool > path:not(:last-child){stroke:var(--a2p-text);stroke-width:1.5}.tool-filament{fill:none;stroke:var(--feed-color);stroke-width:6;stroke-linecap:round}
      .tool > path:not(:last-child){stroke:var(--a2p-text);stroke-width:1;stroke-linejoin:round}.zone{color:var(--a2p-text)}
      .nozzle-sizes{transform:translateY(10px);display:block;flex:none;width:100%;height:auto;aspect-ratio:1096/44;color:var(--a2p-text);font-family:var(--ha-font-family-body,"Segoe UI","Microsoft YaHei",sans-serif)}
      .nozzle-size rect{fill:var(--a2p-panel);stroke:var(--a2p-slot-outline);stroke-width:1;vector-effect:non-scaling-stroke}
      .drying-frame{fill:none;stroke:var(--a2p-warm);stroke-width:2;pointer-events:none;stroke-opacity:.7;animation:a2pDrying 2.8s linear infinite}
      .drying-indicator{pointer-events:visiblePainted}
      @keyframes a2pDrying{0%,100%{stroke-opacity:.7;animation-timing-function:ease-out}25%{stroke-opacity:1;animation-timing-function:ease-in}50%{stroke-opacity:.7;animation-timing-function:ease-out}75%{stroke-opacity:.4;animation-timing-function:ease-in}}
      @media(prefers-reduced-motion:reduce){.drying-frame{animation:none}}
      .slot:focus-visible{outline:3px solid var(--a2p-accent)}
      </style><ha-card><svg class="art ams3h-art" viewBox="152 64 1096 532" xmlns="http://www.w3.org/2000/svg" aria-label="AMS-3H${a2pText(this?._hass, "spoolStatus")}">
      <defs><linearGradient id="spool-shade" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient></defs>
      <rect x="152" y="64" width="1096" height="532" rx="18" fill="var(--a2p-panel)"/>
      <path d="M152 496H1248V578Q1248 596 1230 596H170Q152 596 152 578Z" fill="none"/>
      ${this._config.show_info_bar !== false ? [r.zones[1], r.zones[0]].map((z, i) => this._ams3hZone(z, i + 1, i ? 1120 : 177)).join("") : ""}
      ${slots.map((s) => this._ams3hPath(s, s.number === active)).join("")}
      ${slots.map((s) => this._ams3hSlot(s, s.number === active, !!active, drying.active && drying.slots.has(s.number))).join("")}
      </svg><svg class="nozzle-sizes" viewBox="152 0 1096 44" xmlns="http://www.w3.org/2000/svg">
      ${r.tools
        .map((id, i) => {
          const tool = this._hass.states[id],
            diameter = Number(tool?.attributes?.nozzle_diameter);
          const value =
            ams3hAvailable(tool) &&
            tool.state !== "empty" &&
            Number.isFinite(diameter) &&
            diameter > 0
              ? String(diameter)
              : "";
          const x = 284 + i * 104;
          return (
            '<g class="nozzle-size" data-tool="' +
            (i + 1) +
            '"><rect x="' +
            (x - 29) +
            '" y="3" width="58" height="34" rx="6"/>' +
            ams3hText(x, 21, value, 23, 'text-anchor="middle" dominant-baseline="middle"') +
            "</g>"
          );
        })
        .join("")}
      </svg></ha-card>`;
  }

  _fitAms3hZones() {
    this.renderRoot.querySelectorAll<SVGGraphicsElement>(".zone-humidity").forEach((el) => {
      el.removeAttribute("transform");
      const factor = el.getScreenCTM()?.a || 0;
      if (!(factor > 0) || !el.getBBox().width) return;
      const icon = el.querySelector<SVGSVGElement>(".humidity-icon")!,
        text = el.querySelector<SVGTextElement>("text")!;
      const size = 19 / factor,
        gap = 4 / factor,
        x = Number(icon.dataset.x);
      icon.setAttribute("width", String(size));
      icon.setAttribute("height", String(size));
      icon.setAttribute("y", String(142 - size / 2));
      text.setAttribute("x", String(x + size + gap));
      text.removeAttribute("textLength");
      text.removeAttribute("lengthAdjust");
      text.setAttribute("font-size", "23");
      const available = Math.max(1, 109.08 / 1.4 - size - gap);
      if (text.getBBox().width > available) {
        text.setAttribute("font-size", String((23 * available) / text.getBBox().width));
      }
      const box = el.getBBox();
      const offset = el.dataset.center
        ? Number(el.dataset.center) - (box.x + box.width / 2)
        : -5 / factor;
      el.setAttribute("transform", "translate(" + offset + " 0)");
    });
    this.renderRoot
      .querySelectorAll<SVGGraphicsElement>(".zone-temperature,.zone-time")
      .forEach((el) => {
        if (el.getBBox().width > 109.08 / 1.4) {
          el.setAttribute("textLength", String(109.08 / 1.4));
          el.setAttribute("lengthAdjust", "spacingAndGlyphs");
        }
      });
  }

  _ams3hSlot(s, active, hasActive, drying) {
    const x = 284 + (s.number - 1) * 104,
      y = s.number % 2 === 0 ? 80 : 292;
    const cls = `slot${drying ? " drying" : ""}${active ? " active" : hasActive ? " dimmed" : ""}${s.empty ? " empty" : ""}${s.offline ? " offline" : ""}`;
    const label = s.external ? `${s.number}-EXT` : s.number;
    const title = `${label} · ${s.material} · ${s.name} · ${s.remaining}${active ? a2pText(this?._hass, "inUse") : ""}`;
    const dryingMark = drying
      ? `<g class="drying-indicator" role="img" aria-label="${a2pText(this._hass, "dryingStatus")}"><title>${a2pText(this._hass, "dryingStatus")}</title><g transform="translate(${x + 49} ${y + 13})" fill="none" stroke="var(--a2p-warm)" stroke-width="2.5" stroke-linecap="round"><path d="M3 23C-2 18 8 13 3 8M11 23C6 18 16 13 11 3M19 23C14 18 24 13 19 8"/></g></g><path class="drying-frame" d="M${x - 72} ${y + 3}H${x + 72}A12 12 0 0 1 ${x + 84} ${y + 15}V${y + 180}A12 12 0 0 1 ${x + 72} ${y + 192}H${x - 72}A12 12 0 0 1 ${x - 84} ${y + 180}V${y + 15}A12 12 0 0 1 ${x - 72} ${y + 3}Z"/>`
      : "";
    const colors = s.colors.length ? s.colors : [s.color];
    const segments = colors
      .map(
        (c, i) =>
          `<circle cx="0" cy="0" r="34" fill="none" stroke="${esc(c)}" stroke-width="25" pathLength="100" stroke-dasharray="${s.amount / colors.length} ${100 - s.amount / colors.length}" stroke-dashoffset="${(-i * s.amount) / colors.length}" transform="rotate(-90)"/>`
      )
      .join("");
    return `<g class="${cls}" data-slot="${s.number}" data-entity="${esc(s.entity)}" role="button" tabindex="0" aria-label="${esc(title)}"><title>${esc(title)}</title>
        <rect class="slot-frame" x="${x - 87}" y="${y}" width="174" height="195" rx="15"/>${dryingMark}
        <rect class="slot-number" x="${x - 77}" y="${y + 10}" width="${s.external ? 82 : 29}" height="29" rx="14" fill="#343434"/>
        ${ams3hText(x - 63, y + 34, label, 25, s.external ? "" : 'text-anchor="middle"')}
        <g transform="translate(${x} ${y + 93})" class="spool">
          ${
            s.empty || s.offline
              ? `<circle r="51" fill="#1e1e1e" stroke="#555" stroke-width="2" stroke-dasharray="4 4"/>${ams3hText(0, 9, s.offline ? "—" : "/", 26, 'text-anchor="middle" fill="#888"')}`
              : `<circle r="51" fill="#282828" stroke="#686868" stroke-width="3"/>${segments}<circle r="46" fill="url(#spool-shade)"/><circle r="20" fill="#131313" stroke="#555" stroke-width="4"/><path d="M35 0h9" stroke="#888" stroke-opacity=".5" stroke-width="6" stroke-linecap="round"/>`
          }
        </g>${this._config.show_labels !== false && (!s.empty || this._config.show_empty_label) ? ams3hText(x, y + 174, s.material.length > 13 ? s.material.slice(0, 12) + "…" : s.material, 25, 'text-anchor="middle"') : ""}</g>`;
  }
  _ams3hPath(s, active) {
    const x = 284 + (s.number - 1) * 104,
      y = s.number % 2 === 0 ? 275 : 487;
    return `<g class="feed${active ? " active" : ""}" data-tool="${s.number}" style="--feed-color:${esc(s.color)}">
        <path class="tube" d="M${x} ${y}V545"/>
        <g class="tool" transform="translate(${x} 508)"><rect class="tool-frame" x="-21" width="42" height="64" rx="4"/>
          <path d="M-5-10H5V1h9v54H-14V1h9Z" fill="#383838"/>
          <path d="M-11 31H11v17H-11Z" fill="#686868"/><path d="M-10 34H10m-20 4H10m-20 4H10" stroke="#222"/>
          <path d="M-4 26H4V67L0 77-4 67Z" fill="#adadad"/>
          <path${active ? ' class="tool-filament"' : ""} d="M0 ${active ? -10 : 28}V73" stroke="${esc(s.empty || s.offline ? "#777" : s.color)}" stroke-width="3"/>
        </g></g>`;
  }
}
