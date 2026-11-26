/*
 * Photo style for the AMS units built into the Swaptek printers: the AMS 3H (H3C) and the
 * AMS 3P (P3C).
 *
 * Each unit is cut from a photo of its printer, with the spools in the photo erased so the
 * card can draw the real ones in their place:
 *
 *   AMS 3H  ams3h-body.webp   the top of H3C.webp down to just above the printer's touchscreen
 *           ams3h-glass.webp  the lid's reflection strip and the front handle from the same crop
 *   AMS 3P  ams3p-body.webp   the top of P3C.webp down to just above the touchscreen
 *           ams3p-glass.webp  the lid's reflections from the same crop
 *
 * Layers, back to front: body photo, back-row spools (clipped to the part of the back row the
 * photo shows), dry box tint, the glass in front of the back row, front-row spools, frosted
 * lower front, the glass in front of the front row, then the chips, readings and print tools.
 *
 * Both units are laid out on an 874-unit-wide canvas (the H3C image's own pixels), so text and
 * chips are the same size on both.
 */
import Ams3hBody from "../../images/ams3h-body.webp";
import Ams3hGlass from "../../images/ams3h-glass.webp";
import Ams3pBody from "../../images/ams3p-body.webp";
import Ams3pGlass from "../../images/ams3p-glass.webp";
import { esc } from "./geo";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RackPhotoGeo {
  w: number;
  h: number;
  body: { href: string; w: number; h: number };
  glass: { href: string; w: number; h: number };
  /* Bands of the glass layer: drawn over the back row (behind the front row) or over everything */
  glassBack?: [number, number];
  glassFront: [number, number];
  front: Record<number, number>; // slot -> centre x
  back: Record<number, number>;
  spoolW: number;
  frontY: number;
  frontH: number;
  frontBandCY: number;
  backY: number;
  backH: number;
  backBandCY: number;
  backClip: [number, number]; // y, height
  frost?: Rect; // frosted lower front, for a light photo interior
  dryBox?: Rect;
  frontPctY: number;
  frontLabelY: number;
  backChipY: number;
  readY: number;
  readX: [number, number];
  tools: { y: number; x0: number; step: number; w: number };
}

export const RACK_PHOTO: { [variant: string]: RackPhotoGeo } = {
  ams3h: {
    w: 874,
    h: 702,
    body: { href: Ams3hBody, w: 874, h: 702 },
    glass: { href: Ams3hGlass, w: 874, h: 380 },
    glassBack: [0, 158],
    glassFront: [300, 380],
    front: { 1: 137, 3: 288, 5: 438, 7: 587, 9: 737 },
    back: { 2: 156, 4: 307, 6: 458, 8: 609 },
    spoolW: 106,
    frontY: 157,
    frontH: 195,
    frontBandCY: 250,
    backY: 60,
    backH: 160,
    backBandCY: 112,
    backClip: [58, 70],
    frost: { x: 40, y: 200, w: 800, h: 152 },
    dryBox: { x: 386, y: 12, w: 290, h: 116 },
    frontPctY: 220,
    frontLabelY: 318,
    backChipY: 110,
    readY: 486,
    readX: [96, 466],
    tools: { y: 598, x0: 86, step: 78.5, w: 72 },
  },
  // The P3C photo is 327 px wide: drawn at 874 wide, so 1 photo px = 2.673 units here
  ams3p: {
    w: 874,
    h: 780,
    body: { href: Ams3pBody, w: 874, h: 780.5 },
    glass: { href: Ams3pGlass, w: 874, h: 780.5 },
    glassFront: [0, 360],
    front: { 1: 182, 3: 350, 5: 527, 7: 698 },
    back: { 2: 267, 4: 438, 6: 612 },
    spoolW: 120,
    frontY: 155,
    frontH: 187,
    frontBandCY: 250,
    backY: 92,
    backH: 160,
    backBandCY: 150,
    backClip: [90, 65],
    frontPctY: 212,
    frontLabelY: 312,
    backChipY: 132,
    readY: 472,
    readX: [96, 466],
    tools: { y: 642, x0: 103, step: 98, w: 80 },
  },
};

const READ_W = 312,
  READ_H = 96,
  TOOL_H = 92;

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
  dryer?: boolean;
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
  readings?: [PhotoReading | null, PhotoReading | null]; // left, right; omitted when the info bar is off
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
function spoolFace(
  s: PhotoSlot,
  cx: number,
  y0: number,
  h: number,
  bandCY: number,
  spoolW: number
): string {
  const x0 = cx - spoolW / 2,
    rim = spoolW * 0.075,
    inner = spoolW - 2 * rim;
  let out =
    `<rect x="${f(x0)}" y="${y0}" width="1" height="${h}" class="flange-edge"/>` +
    `<rect x="${f(x0 + 1)}" y="${y0}" width="${f(rim - 1)}" height="${h}" class="flange"/>` +
    `<rect x="${f(x0 + spoolW - 1)}" y="${y0}" width="1" height="${h}" class="flange-edge"/>` +
    `<rect x="${f(x0 + spoolW - rim)}" y="${y0}" width="${f(rim - 1)}" height="${h}" class="flange"/>`;
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
function emptyMark(
  cx: number,
  y: number,
  h: number,
  spoolW: number,
  offline: boolean,
  mark: boolean
): string {
  return (
    `<rect class="empty-mark" x="${f(cx - spoolW / 2 + 4)}" y="${y + 4}" width="${spoolW - 8}" height="${h - 8}" rx="8"/>` +
    (mark
      ? text(cx, y + h / 2, offline ? "—" : "/", 30, 'text-anchor="middle" class="empty-text"')
      : "")
  );
}

function slotTitle(s: PhotoSlot, active: boolean, inUse: string): string {
  return `${s.number} · ${s.material}${s.name && s.name !== s.material ? " · " + s.name : ""} · ${s.remaining}${active ? inUse : ""}`;
}

function reading(x: number, y: number, r: PhotoReading): string {
  const title = r.extra ? `${r.title} · ${r.extra}` : r.title;
  return (
    `<g class="reading${r.dryer ? " dry" : ""}${r.drying ? " drying" : ""}">` +
    `<rect x="${x}" y="${y}" width="${READ_W}" height="${READ_H}" rx="14"/>` +
    text(x + 18, y + 26, title, 21, 'text-anchor="start" class="reading-title"') +
    text(x + 18, y + 64, r.temperature, 34, 'text-anchor="start" class="reading-temp"') +
    text(x + READ_W - 18, y + 64, r.humidity, 34, 'text-anchor="end" class="reading-hum"') +
    "</g>"
  );
}

/* One print tool from the hotend rack, over the PTFE tubes: the filament colour it holds (a
   dashed bar when it holds none), its number and nozzle size. The tool on the toolhead is
   outlined. */
function tool(t: PhotoTool, g: RackPhotoGeo["tools"]): string {
  const x = g.x0 + (t.number - 1) * g.step,
    cx = x + g.w / 2,
    y = g.y;
  const mounted = t.state === "mounted";
  const cls = `tool${mounted ? " mounted" : ""}${t.loaded ? " loaded" : ""}${t.state === "empty" ? " no-tool" : ""}`;
  const bar = t.loaded
    ? `<rect class="tool-filament" x="${f(x + 10)}" y="${y + 10}" width="${g.w - 20}" height="14" rx="7" fill="${esc(t.color)}"/>`
    : `<rect class="tool-unloaded" x="${f(x + 10)}" y="${y + 10}" width="${g.w - 20}" height="14" rx="7"/>`;
  return (
    `<g class="${cls}" data-more-info="${esc(t.entity)}" role="button" tabindex="0" aria-label="${esc(t.title)}"><title>${esc(t.title)}</title>` +
    `<rect class="tool-frame" x="${f(x)}" y="${y}" width="${g.w}" height="${TOOL_H}" rx="12"/>` +
    bar +
    text(cx, y + 44, String(t.number), 19, 'text-anchor="middle" class="tool-number"') +
    text(cx, y + 71, t.diameter || "—", 25, 'text-anchor="middle" class="tool-diameter"') +
    "</g>"
  );
}

export const PHOTO_STYLES = `
  .a3p{display:block;width:100%;height:auto;font-family:var(--ha-font-family-body,Roboto,"Segoe UI","Microsoft YaHei",sans-serif)}
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

export function renderRackPhoto(g: RackPhotoGeo, o: PhotoOptions, inUse: string): string {
  const bySlot = new Map(o.slots.map((s) => [s.number, s]));
  const known = (s: PhotoSlot) => s.remainKnown && !s.empty && !s.offline;
  const glassBand = ([y0, y1]: [number, number]) =>
    `<svg x="0" y="${y0}" width="${g.w}" height="${y1 - y0}" viewBox="0 ${y0} ${g.w} ${y1 - y0}" overflow="hidden"><image href="${g.glass.href}" width="${g.glass.w}" height="${g.glass.h}"/></svg>`;

  let svg =
    `<svg class="a3p" viewBox="0 0 ${g.w} ${g.h}" style="aspect-ratio:${g.w}/${g.h}" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="${esc(o.ariaLabel)}">` +
    `<defs>` +
    `<pattern id="a3p-hatch" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="2" height="4" fill="#000" fill-opacity=".5"/></pattern>` +
    `<linearGradient id="a3p-frost" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".25" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity=".34"/></linearGradient>` +
    `<linearGradient id="a3p-backhaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient>` +
    `<clipPath id="a3p-back"><rect x="0" y="${g.backClip[0]}" width="${g.w}" height="${g.backClip[1]}"/></clipPath>` +
    `</defs>` +
    `<image href="${g.body.href}" width="${g.body.w}" height="${g.body.h}"/>`;

  // Back row: only the part the photo shows above the front row
  svg += `<g clip-path="url(#a3p-back)">`;
  for (const [n, cx] of Object.entries(g.back)) {
    const s = bySlot.get(+n);
    if (!s) continue;
    svg +=
      spoolFace(s, cx, g.backY, g.backH, g.backBandCY, g.spoolW) +
      `<rect x="${cx - g.spoolW / 2}" y="${g.backClip[0]}" width="${g.spoolW}" height="${g.backClip[1]}" fill="url(#a3p-backhaze)"/>`;
  }
  svg += `</g>`;
  if (g.dryBox)
    svg += `<rect x="${g.dryBox.x}" y="${g.dryBox.y}" width="${g.dryBox.w}" height="${g.dryBox.h}" rx="6" fill="#141517" fill-opacity=".5"/>`;
  if (g.glassBack) svg += glassBand(g.glassBack);

  // Front row
  for (const [n, cx] of Object.entries(g.front)) {
    const s = bySlot.get(+n);
    if (s) svg += spoolFace(s, cx, g.frontY, g.frontH, g.frontBandCY, g.spoolW);
  }
  if (g.frost)
    svg += `<rect x="${g.frost.x}" y="${g.frost.y}" width="${g.frost.w}" height="${g.frost.h}" fill="url(#a3p-frost)"/>`;
  svg += glassBand(g.glassFront);

  // Slots: hit area, chips, empty marks, active and drying frames
  const slotGroup = (s: PhotoSlot, cx: number, front: boolean) => {
    const active = s.number === o.active;
    const drying = o.dryingSlots.has(s.number);
    const w = g.spoolW + 16;
    const y = front ? g.frontY - 7 : g.backClip[0] - 2,
      h = front ? g.frontH - 9 : g.backClip[1] + 4;
    const title = slotTitle(s, active, inUse);
    let out = `<g class="slot" data-slot="${s.number}" data-entity="${esc(s.entity)}" role="button" tabindex="0" aria-label="${esc(title)}"><title>${esc(title)}</title>`;
    out += `<rect class="slot-hit" x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="10"/>`;
    if (s.empty || s.offline)
      out += emptyMark(
        cx,
        front ? g.frontY : g.backClip[0],
        front ? g.frontH - 25 : g.backClip[1],
        g.spoolW,
        s.offline,
        front
      );
    if (front) {
      if (known(s)) out += chip(cx, g.frontPctY, s.remaining, 24, 34, 100);
      if (o.showLabels && (!(s.empty || s.offline) || o.showEmptyLabel)) {
        const type = s.material.length > 6 ? s.material.slice(0, 5) + "…" : s.material;
        out += chip(cx, g.frontLabelY, `${s.number} · ${type}`, 21, 32, w - 4);
      }
    } else {
      out += chip(
        cx,
        g.backChipY,
        known(s) ? `${s.number} · ${s.remaining}` : String(s.number),
        20,
        30,
        w - 12
      );
    }
    if (drying)
      out += `<rect class="drying-frame" x="${cx - w / 2 + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="10"/>`;
    if (active)
      out += `<rect class="active-frame" x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="10"/>`;
    out += `<rect class="focus-frame" x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="10"/>`;
    return out + `</g>`;
  };
  for (const [n, cx] of Object.entries(g.back)) {
    const s = bySlot.get(+n);
    if (s) svg += slotGroup(s, cx, false);
  }
  for (const [n, cx] of Object.entries(g.front)) {
    const s = bySlot.get(+n);
    if (s) svg += slotGroup(s, cx, true);
  }

  // Readings on the dark lower body: left and right tiles
  o.readings?.forEach((r, i) => {
    if (r) svg += reading(g.readX[i], g.readY, r);
  });

  // Print tools along the bottom, over the PTFE tubes
  svg += o.tools
    .filter((t) => t.entity)
    .map((t) => tool(t, g.tools))
    .join("");

  return svg + `</svg>`;
}
