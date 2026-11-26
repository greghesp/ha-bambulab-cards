/*
 * AMS 3H, photo style.
 *
 * Built from the AMS 3H at the top of the H3C printer image (src/images/H3C.webp, 874 px wide):
 * the crop runs from the top of the lid down to just above the printer's touchscreen
 * (y 0-702), so it includes the black lower body with the PTFE tubes.
 *
 *   - ams3h-body.webp   that crop with the spools baked into the photo erased, so the card
 *                       can draw the real ones in their place
 *   - ams3h-glass.webp  the lid's reflection strip and the front handle, cut from the same
 *                       crop and laid back on top of the drawn spools
 *
 * Layers, back to front: body photo, back-row spools (clipped to the window above the
 * reflection strip), dry box tint, reflection strip, front-row spools, frosted lower front,
 * handle, then the chips, readings and print tools.
 *
 * All coordinates are H3C.webp pixels, so the photo and the overlay line up 1:1.
 */
import BodyImage from "../../images/ams3h-body.webp";
import GlassImage from "../../images/ams3h-glass.webp";
import { esc } from "./geo";

export const PHOTO_W = 874;
export const PHOTO_H = 702;

/* Slot centres measured on the photo. The front row (odd slots) shows the whole spool face;
   the back row (even slots) only shows above the lid's reflection strip. */
const FRONT: Record<number, number> = { 1: 137, 3: 288, 5: 438, 7: 587, 9: 737 };
const BACK: Record<number, number> = { 2: 156, 4: 307, 6: 458, 8: 609 };
const SPOOL_W = 106;
const FRONT_Y = 157,
  FRONT_H = 195,
  FRONT_BAND_CY = 250;
const BACK_Y = 60,
  BACK_H = 160,
  BACK_BAND_CY = 112,
  BACK_CLIP_Y = 58,
  BACK_CLIP_H = 70;
const DRY_BOX = { x: 386, y: 12, w: 290, h: 116 };

/* Readings and print tools sit on the black lower body */
const READ_Y = 486,
  READ_W = 312,
  READ_H = 96;
const TOOL_Y = 598,
  TOOL_H = 92,
  TOOL_W = 72,
  TOOL_X0 = 86,
  TOOL_STEP = 78.5;

export interface PhotoSlot {
  entity: string;
  number: number;
  offline: boolean;
  empty: boolean;
  amount: number; // 20-95, how full the spool is drawn
  material: string;
  name: string;
  color: string;
  colors: string[];
  remaining: string; // "84%" or the "unknown" text
  remainKnown: boolean;
}

export interface PhotoReading {
  title: string;
  temperature: string;
  humidity: string;
  extra?: string; // drying countdown
  drying?: boolean;
}

export interface PhotoTool {
  entity: string;
  number: number;
  state: string; // mounted / docked / empty / unavailable
  diameter: string; // "0.4" or ""
  loaded: boolean;
  color: string;
  title: string;
}

export interface PhotoOptions {
  slots: PhotoSlot[];
  active: number; // 1-based slot feeding the print, 0 for none
  dryingSlots: Set<number>; // slots in the dry box while it is drying
  showLabels: boolean;
  showEmptyLabel: boolean;
  readings?: [PhotoReading, PhotoReading]; // chamber, dry box; omitted when the info bar is off
  tools: PhotoTool[];
  ariaLabel: string;
}

const f = (v: number) => Number(v.toFixed(2));

function text(
  x: number,
  y: number,
  value: string,
  size: number,
  attrs = 'text-anchor="middle"'
): string {
  return `<text x="${f(x)}" y="${f(y)}" font-size="${size}" dominant-baseline="central" ${attrs}>${esc(value)}</text>`;
}

/* A dark rounded chip with centred text, sized to its text */
function chip(cx: number, cy: number, value: string, size: number, h: number, maxW: number) {
  const w = Math.min(maxW, 18 + value.length * size * 0.56);
  return (
    `<rect class="chip" x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${h}" rx="${h / 4}"/>` +
    text(cx, cy, value, size, 'text-anchor="middle" class="chip-text"')
  );
}

/* A spool seen from the front: two flanges and the wound filament between them. The band is
   centred on bandCY and its height follows how much filament is left. */
function spoolFace(s: PhotoSlot, cx: number, y0: number, h: number, bandCY: number): string {
  const x0 = cx - SPOOL_W / 2,
    rim = SPOOL_W * 0.075,
    inner = SPOOL_W - 2 * rim;
  let out =
    `<rect x="${f(x0)}" y="${y0}" width="1" height="${h}" class="flange-edge"/>` +
    `<rect x="${f(x0 + 1)}" y="${y0}" width="${f(rim - 1)}" height="${h}" class="flange"/>` +
    `<rect x="${f(x0 + SPOOL_W - 1)}" y="${y0}" width="1" height="${h}" class="flange-edge"/>` +
    `<rect x="${f(x0 + SPOOL_W - rim)}" y="${y0}" width="${f(rim - 1)}" height="${h}" class="flange"/>`;
  if (s.empty || s.offline) return out;
  const bh = Math.min(h - 4, (h * Math.min(92, s.amount)) / 100);
  const by = Math.max(y0 + 2, bandCY - bh / 2);
  const colors = s.colors.length ? s.colors : [s.color];
  const sw = inner / colors.length;
  colors.forEach((c, i) => {
    out += `<rect x="${f(x0 + rim + i * sw)}" y="${f(by)}" width="${f(sw)}" height="${f(bh)}" fill="${esc(c)}"/>`;
  });
  out += `<rect x="${f(x0 + rim)}" y="${f(by)}" width="${f(inner)}" height="${f(bh)}" fill="url(#a3p-hatch)"/>`;
  return out;
}

/* Dashed outline where a slot has no spool (or the AMS is offline) */
function emptyMark(cx: number, y: number, h: number, offline: boolean, mark: boolean): string {
  return (
    `<rect class="empty-mark" x="${f(cx - SPOOL_W / 2 + 4)}" y="${y + 4}" width="${SPOOL_W - 8}" height="${h - 8}" rx="8"/>` +
    (mark
      ? text(cx, y + h / 2, offline ? "—" : "/", 30, 'text-anchor="middle" class="empty-text"')
      : "")
  );
}

function slotTitle(s: PhotoSlot, active: boolean, inUse: string): string {
  return `${s.number} · ${s.material}${s.name && s.name !== s.material ? " · " + s.name : ""} · ${s.remaining}${active ? inUse : ""}`;
}

function reading(x: number, r: PhotoReading, cls: string): string {
  const title = r.extra ? `${r.title} · ${r.extra}` : r.title;
  return (
    `<g class="reading ${cls}${r.drying ? " drying" : ""}">` +
    `<rect x="${x}" y="${READ_Y}" width="${READ_W}" height="${READ_H}" rx="14"/>` +
    text(x + 18, READ_Y + 26, title, 21, 'text-anchor="start" class="reading-title"') +
    text(x + 18, READ_Y + 64, r.temperature, 34, 'text-anchor="start" class="reading-temp"') +
    text(x + READ_W - 18, READ_Y + 64, r.humidity, 34, 'text-anchor="end" class="reading-hum"') +
    "</g>"
  );
}

/* One print tool from the hotend rack, over the PTFE tubes: the filament colour it holds (a
   dashed bar when it holds none), its number and nozzle size. The tool on the toolhead is
   outlined. */
function tool(t: PhotoTool): string {
  const x = TOOL_X0 + (t.number - 1) * TOOL_STEP,
    cx = x + TOOL_W / 2;
  const mounted = t.state === "mounted";
  const cls = `tool${mounted ? " mounted" : ""}${t.loaded ? " loaded" : ""}${t.state === "empty" ? " no-tool" : ""}`;
  const bar = t.loaded
    ? `<rect class="tool-filament" x="${f(x + 10)}" y="${TOOL_Y + 10}" width="${TOOL_W - 20}" height="14" rx="7" fill="${esc(t.color)}"/>`
    : `<rect class="tool-unloaded" x="${f(x + 10)}" y="${TOOL_Y + 10}" width="${TOOL_W - 20}" height="14" rx="7"/>`;
  return (
    `<g class="${cls}" data-more-info="${esc(t.entity)}" role="button" tabindex="0" aria-label="${esc(t.title)}"><title>${esc(t.title)}</title>` +
    `<rect class="tool-frame" x="${f(x)}" y="${TOOL_Y}" width="${TOOL_W}" height="${TOOL_H}" rx="12"/>` +
    bar +
    text(cx, TOOL_Y + 44, String(t.number), 19, 'text-anchor="middle" class="tool-number"') +
    text(cx, TOOL_Y + 71, t.diameter || "—", 25, 'text-anchor="middle" class="tool-diameter"') +
    "</g>"
  );
}

export const PHOTO_STYLES = `
  .a3p{display:block;width:100%;height:auto;aspect-ratio:${PHOTO_W}/${PHOTO_H};font-family:var(--ha-font-family-body,Roboto,"Segoe UI","Microsoft YaHei",sans-serif)}
  .a3p text{pointer-events:none}
  .a3p .slot{cursor:pointer;outline:none}
  .a3p .slot-hit{fill:transparent}
  .a3p .flange{fill:#d4d4d4}.a3p .flange-edge{fill:#3a3a3a;fill-opacity:.67}
  .a3p .chip{fill:#000;fill-opacity:.58}.a3p .chip-text{fill:#fff;font-weight:500}
  .a3p .empty-mark{fill:none;stroke:#9a9a9a;stroke-width:2;stroke-dasharray:6 6}
  .a3p .empty-text{fill:#bbb}
  .a3p .active-frame{fill:none;stroke:var(--primary-color,#03a9f4);stroke-width:4}
  .a3p .slot:focus-visible .focus-frame{stroke:var(--primary-color,#03a9f4);stroke-width:3;stroke-dasharray:6 4}
  .a3p .focus-frame{fill:none;stroke:none}
  .a3p .drying-frame{fill:none;stroke:var(--ams3h-drying-color,var(--warning-color,#ffa340));stroke-width:3;animation:a3pDrying 2.8s ease-in-out infinite}
  .a3p .reading rect{fill:#000;fill-opacity:.5;stroke:#6b7075;stroke-opacity:.6;stroke-width:1.5}
  .a3p .reading.dry rect{stroke:var(--ams3h-drying-color,var(--warning-color,#ffa340));stroke-opacity:.6}
  .a3p .reading.dry.drying rect{stroke-opacity:1;stroke-width:2.5;animation:a3pDrying 2.8s ease-in-out infinite}
  .a3p .reading-title{fill:#a6acb2}.a3p .reading-temp{fill:#fff;font-weight:500}
  .a3p .reading.drying .reading-temp{fill:var(--ams3h-drying-temperature-color,var(--error-color,#ff4d4f))}
  .a3p .reading-hum{fill:#7fc4ff;font-weight:500}
  .a3p .tool{cursor:pointer;outline:none}
  .a3p .tool-frame{fill:#000;fill-opacity:.55;stroke:#5c6166;stroke-width:1.5}
  .a3p .tool.mounted .tool-frame{stroke:var(--primary-color,#03a9f4);stroke-width:3.5;fill-opacity:.7}
  .a3p .tool:focus-visible .tool-frame{stroke:var(--primary-color,#03a9f4);stroke-dasharray:6 4}
  .a3p .tool-filament{stroke:#fff;stroke-opacity:.35;stroke-width:1}
  .a3p .tool-unloaded{fill:none;stroke:#7a7f84;stroke-width:1.5;stroke-dasharray:4 4}
  .a3p .tool-number{fill:#a6acb2}.a3p .tool-diameter{fill:#fff;font-weight:500}
  .a3p .tool.no-tool .tool-diameter,.a3p .tool.no-tool .tool-number{fill:#6b7075}
  @keyframes a3pDrying{0%,100%{stroke-opacity:.45}50%{stroke-opacity:1}}
  @media(prefers-reduced-motion:reduce){.a3p .drying-frame,.a3p .reading.dry.drying rect{animation:none}}
`;

export function renderAms3hPhoto(o: PhotoOptions, inUse: string): string {
  const bySlot = new Map(o.slots.map((s) => [s.number, s]));
  const pctChip = (s: PhotoSlot) => (s.remainKnown ? s.remaining : "");

  let svg =
    `<svg class="a3p" viewBox="0 0 ${PHOTO_W} ${PHOTO_H}" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="${esc(o.ariaLabel)}">` +
    `<defs>` +
    `<pattern id="a3p-hatch" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="2" height="4" fill="#000" fill-opacity=".5"/></pattern>` +
    `<linearGradient id="a3p-frost" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".25" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity=".34"/></linearGradient>` +
    `<linearGradient id="a3p-backhaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient>` +
    `<clipPath id="a3p-back"><rect x="0" y="${BACK_CLIP_Y}" width="${PHOTO_W}" height="${BACK_CLIP_H}"/></clipPath>` +
    `</defs>` +
    `<image href="${BodyImage}" width="${PHOTO_W}" height="${PHOTO_H}"/>`;

  // Back row: only the top of each spool shows, above the reflection strip
  svg += `<g clip-path="url(#a3p-back)">`;
  for (const [n, cx] of Object.entries(BACK)) {
    const s = bySlot.get(+n);
    if (!s) continue;
    svg +=
      spoolFace(s, cx, BACK_Y, BACK_H, BACK_BAND_CY) +
      `<rect x="${cx - SPOOL_W / 2}" y="${BACK_CLIP_Y}" width="${SPOOL_W}" height="${BACK_CLIP_H}" fill="url(#a3p-backhaze)"/>`;
  }
  svg += `</g>`;
  // The dry box's darker cover over slots 6 and 8
  svg += `<rect x="${DRY_BOX.x}" y="${DRY_BOX.y}" width="${DRY_BOX.w}" height="${DRY_BOX.h}" rx="6" fill="#141517" fill-opacity=".5"/>`;
  // Reflection strip and handle, from the photo (the glass layer is transparent elsewhere)
  const glass = `<image href="${GlassImage}" width="${PHOTO_W}" height="380"/>`;
  svg += `<svg x="0" y="0" width="${PHOTO_W}" height="158" viewBox="0 0 ${PHOTO_W} 158" overflow="hidden">${glass}</svg>`;

  // Front row
  for (const [n, cx] of Object.entries(FRONT)) {
    const s = bySlot.get(+n);
    if (s) svg += spoolFace(s, cx, FRONT_Y, FRONT_H, FRONT_BAND_CY);
  }
  svg += `<rect x="40" y="200" width="800" height="152" fill="url(#a3p-frost)"/>`;
  svg += `<svg x="0" y="300" width="${PHOTO_W}" height="80" viewBox="0 300 ${PHOTO_W} 80" overflow="hidden">${glass}</svg>`;

  // Slots: hit area, chips, empty marks, active and drying frames
  const slotGroup = (s: PhotoSlot, cx: number, front: boolean) => {
    const active = s.number === o.active;
    const drying = o.dryingSlots.has(s.number);
    const y = front ? FRONT_Y - 7 : BACK_CLIP_Y - 2,
      h = front ? FRONT_H - 9 : BACK_CLIP_H + 4,
      w = 122;
    const title = slotTitle(s, active, inUse);
    let g = `<g class="slot" data-slot="${s.number}" data-entity="${esc(s.entity)}" role="button" tabindex="0" aria-label="${esc(title)}"><title>${esc(title)}</title>`;
    g += `<rect class="slot-hit" x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="10"/>`;
    if (s.empty || s.offline)
      g += emptyMark(
        cx,
        front ? FRONT_Y : BACK_CLIP_Y,
        front ? 170 : BACK_CLIP_H,
        s.offline,
        front
      );
    if (front) {
      const pct = pctChip(s);
      if (pct && !s.empty && !s.offline) g += chip(cx, 220, pct, 24, 34, 100);
      if (o.showLabels && (!(s.empty || s.offline) || o.showEmptyLabel)) {
        const type = s.material.length > 6 ? s.material.slice(0, 5) + "…" : s.material;
        g += chip(cx, 318, `${s.number} · ${type}`, 21, 32, 118);
      }
    } else {
      const pct = pctChip(s);
      g += chip(
        cx,
        110,
        pct && !s.empty && !s.offline ? `${s.number} · ${pct}` : String(s.number),
        20,
        30,
        110
      );
    }
    if (drying)
      g += `<rect class="drying-frame" x="${cx - w / 2 + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="10"/>`;
    if (active)
      g += `<rect class="active-frame" x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="10"/>`;
    g += `<rect class="focus-frame" x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="10"/>`;
    return g + `</g>`;
  };
  for (const [n, cx] of Object.entries(BACK)) {
    const s = bySlot.get(+n);
    if (s) svg += slotGroup(s, cx, false);
  }
  for (const [n, cx] of Object.entries(FRONT)) {
    const s = bySlot.get(+n);
    if (s) svg += slotGroup(s, cx, true);
  }

  // Chamber and dry box readings on the black body, under the AMS 3H badge
  if (o.readings) {
    svg += reading(96, o.readings[0], "chamber");
    svg += reading(PHOTO_W - 96 - READ_W, o.readings[1], "dry");
  }

  // Print tools along the bottom, over the PTFE tubes
  if (o.tools.some((t) => t.entity))
    svg += o.tools
      .filter((t) => t.entity)
      .map(tool)
      .join("");

  return svg + `</svg>`;
}
