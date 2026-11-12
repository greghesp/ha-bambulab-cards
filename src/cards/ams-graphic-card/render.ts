/*
 * AMS Graphic Card — SVG rendering
 *
 * Produces the whole SVG as a string, which the card injects into the shadow DOM through
 * unsafeSVG. A single string is used instead of a lit template per element because the layer
 * order, clip paths and fade mask depend on exact z-order and userSpaceOnUse coordinates —
 * the string form is the easiest to read and to verify.
 */
import { BASE_IMAGES, BRAND_IMAGES, MECH_IMAGE } from "./assets";
import type { Ams3hData } from "./ams3h";
import {
  chipWidth,
  EMPTY_LABEL,
  esc,
  FADE_STOPS,
  LABEL_FONT,
  PCT_FONT,
  remainPct,
  Slot,
  VariantGeo,
} from "./geo";

const SVG_NS = "http://www.w3.org/2000/svg";
const IMG_W = 700;
const IMG_H = 360;

function gradientStops(): string {
  return FADE_STOPS.map(([off, v]) => {
    const g = Math.round(Math.max(0, Math.min(1, v)) * 255);
    const hex = g.toString(16).padStart(2, "0");
    return `<stop offset="${off.toFixed(5)}" stop-color="#${hex}${hex}${hex}"/>`;
  }).join("");
}

/* A single spool: flange -> filament band (with hatching) -> remaining-percentage chip */
function spoolSvg(cx: number, s: Slot, geo: VariantGeo): string {
  const { spW, spH, spY, flangeFrac, bandCY, matCap } = geo;
  const x0 = cx - spW / 2;
  const x1 = cx + spW / 2;
  const y0 = spY;
  const y1 = spY + spH;
  const rim = Math.max(3, spW * flangeFrac);
  const dk = 1;
  const f = (v: number) => Number(v.toFixed(2));
  let o = "";

  o += `<rect x="${f(x0)}" y="${y0}" width="${dk}" height="${spH}" fill="#3a3a3a" fill-opacity="0.667"/>`;
  o += `<rect x="${f(x0 + dk)}" y="${y0}" width="${f(rim - dk)}" height="${spH}" fill="#d4d4d4"/>`;
  o += `<rect x="${f(x1 - dk)}" y="${y0}" width="${dk}" height="${spH}" fill="#3a3a3a" fill-opacity="0.667"/>`;
  o += `<rect x="${f(x1 - rim)}" y="${y0}" width="${f(rim - dk)}" height="${spH}" fill="#d4d4d4"/>`;

  const rx0 = x0 + rim;
  const rw = spW - 2 * rim;
  const bh = Math.max(1, Math.round(spH * Math.min(matCap, remainPct(s) / 100) * 100) / 100);
  let by = bandCY - bh / 2;
  by = Math.max(y0 + 2, Math.min(by, y1 - bh - 2));
  o += `<rect x="${f(rx0)}" y="${f(by)}" width="${f(rw)}" height="${f(bh)}" fill="${esc(s.color)}"/>`;
  o += `<rect x="${f(rx0)}" y="${f(by)}" width="${f(rw)}" height="${f(bh)}" fill="url(#a2p-hatch)"/>`;

  if (!s.empty && s.remain > 0) {
    const txt = `${Math.round(s.remain)}%`;
    const bcx = rx0 + rw / 2;
    let bcy = by + bh / 2;
    if (geo.chipMaxY != null && bcy > geo.chipMaxY) bcy = geo.chipMaxY;
    const pw = chipWidth(txt, PCT_FONT, 20, 0.72);
    const ph = PCT_FONT + 12;
    o += `<rect x="${f(bcx - pw / 2)}" y="${f(bcy - ph / 2)}" width="${f(pw)}" height="${f(ph)}" rx="5" fill="#000000" fill-opacity="0.549"/>`;
    o += `<text x="${f(bcx)}" y="${f(bcy)}" font-size="${PCT_FONT}" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${esc(txt)}</text>`;
  }
  return o;
}

/* Filament label (clickable, opens the filament popup). Hidden entirely on empty slots by default. */
function labelsSvg(
  slots: Slot[],
  trayEntities: string[],
  geo: VariantGeo,
  showEmptyLabel: boolean,
  labelMode: string
): string {
  const fs = LABEL_FONT;
  const vx = geo.vb[0];
  let o = "";
  slots.forEach((s, i) => {
    if (geo.centers[i] == null) return;
    if (s.empty && !showEmptyLabel) return;
    const txt = s.empty ? EMPTY_LABEL : labelMode === "name" ? s.name || s.type : s.type;
    const cx = geo.centers[i] + vx;
    const pw = chipWidth(txt, fs, 26, 0.78);
    const ph = fs + 16;
    const eid = trayEntities[i] || "";
    o += `<g class="slotlabel" data-tray-entity="${esc(eid)}">`;
    o += `<rect x="${Number((cx - pw / 2).toFixed(2))}" y="${Number((geo.labelY - ph / 2).toFixed(2))}" width="${Number(pw.toFixed(2))}" height="${ph}" rx="6" fill="#000000" fill-opacity="0.45"/>`;
    o += `<text x="${cx}" y="${geo.labelY}" font-size="${fs}" font-weight="500" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${esc(txt)}</text>`;
    o += "</g>";
  });
  return o;
}

/* AMS HT panel: drawn from live sensors (the digits baked into the base image were erased) */
function lcdSvg(geo: VariantGeo, hum: string, temp: string): string {
  const vx = geo.vb[0];
  let o = "";
  (geo.lcdFields || []).forEach((fd) => {
    const v = fd.key === "hum" ? hum : temp;
    o += `<text x="${fd.lx + vx}" y="${geo.lcdLabelY}" font-size="${geo.lcdLabelFont}" fill="#9a9a9a" text-anchor="middle">${esc(fd.label)}</text>`;
    o += `<text x="${fd.x + vx}" y="${geo.lcdValueY}" font-size="${geo.lcdValueFont}" fill="#efefef" text-anchor="middle" font-weight="500">${esc(v)}</text>`;
  });
  return o;
}

export interface RenderOpts {
  ams3h?: Ams3hData;
  showInfo?: boolean;
  geo: VariantGeo;
  slots: Slot[];
  trayEntities: string[];
  showLabels: boolean;
  labelMode: string;
  showEmptyLabel: boolean;
  hum: string;
  temp: string;
}

export function renderSvg(o: RenderOpts): string {
  if (o.ams3h) return renderAms3h(o, o.ams3h);
  const { geo, slots, trayEntities } = o;
  const [vbx, vby, vbw, vbh] = geo.vb;
  const baseSrc = BASE_IMAGES[geo.base];

  let svg =
    `<svg class="art" viewBox="${vbx} ${vby} ${vbw} ${vbh}" preserveAspectRatio="xMidYMid meet"` +
    ` xmlns="${SVG_NS}" aria-label="${esc(geo.name)} spool status">`;

  svg += "<defs>";
  svg +=
    '<pattern id="a2p-hatch" width="4" height="4" patternUnits="userSpaceOnUse">' +
    '<rect width="2" height="4" fill="#000000" fill-opacity="0.502"/></pattern>';
  if (geo.fade === "a2p") {
    svg += `<linearGradient id="a2p-fade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="360">${gradientStops()}</linearGradient>`;
    svg +=
      '<mask id="a2p-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="700" height="360">' +
      '<rect x="0" y="0" width="700" height="360" fill="url(#a2p-fade)"/></mask>';
  }
  if (geo.clipY != null) {
    svg +=
      '<clipPath id="a2p-clip" clipPathUnits="userSpaceOnUse">' +
      `<rect x="${vbx}" y="${vby}" width="${vbw}" height="${geo.clipY - vby}"/></clipPath>`;
  }
  svg += "</defs>";

  /* (1) base image */
  svg += `<image href="${esc(baseSrc)}" x="0" y="0" width="${IMG_W}" height="${IMG_H}" preserveAspectRatio="none"/>`;

  /* (2) spools (fade mask or occlusion clip, depending on the model) */
  if (geo.fade === "a2p") svg += '<g mask="url(#a2p-mask)">';
  else if (geo.clipY != null) svg += '<g clip-path="url(#a2p-clip)">';
  else svg += "<g>";
  slots.forEach((s, i) => {
    if (!s.empty && geo.centers[i] != null) svg += spoolSvg(geo.centers[i] + vbx, s, geo);
  });
  svg += "</g>";

  /* (3) re-draw a strip of the base image above the spools (e.g. the AMS HT silver buckle)
     to restore details the spools covered */
  if (geo.bandTop != null && geo.bandBot != null) {
    svg +=
      '<clipPath id="a2p-band" clipPathUnits="userSpaceOnUse">' +
      `<rect x="${vbx}" y="${geo.bandTop}" width="${vbw}" height="${geo.bandBot - geo.bandTop}"/></clipPath>`;
    svg +=
      `<image href="${esc(baseSrc)}" x="0" y="0" width="${IMG_W}" height="${IMG_H}"` +
      ' preserveAspectRatio="none" clip-path="url(#a2p-band)" style="pointer-events:none"/>';
  }

  /* (4) mechanism layer + silkscreen layer (drawn on top so a spool never covers them) */
  if (geo.mech) {
    svg += `<image href="${esc(MECH_IMAGE)}" x="0" y="0" width="${IMG_W}" height="${IMG_H}" preserveAspectRatio="none" style="pointer-events:none"/>`;
  }
  if (geo.brand && BRAND_IMAGES[geo.brand]) {
    svg += `<image href="${esc(BRAND_IMAGES[geo.brand])}" x="0" y="0" width="${IMG_W}" height="${IMG_H}" preserveAspectRatio="none" style="pointer-events:none"/>`;
  }

  /* (5) filament labels + panel */
  if (o.showLabels) svg += labelsSvg(slots, trayEntities, geo, o.showEmptyLabel, o.labelMode);
  if (geo.lcd) svg += lcdSvg(geo, o.hum, o.temp);

  svg += "</svg>";
  return svg;
}

/* The 3H uses the same 700 × 360 canvas as the image-backed models, entirely in SVG. */
function renderAms3h(o: RenderOpts, data: Ams3hData): string {
  const text = (x: number, y: number, value: string, cls = "", size = 12) =>
    `<text x="${x}" y="${y}" class="${cls}" font-size="${size}" text-anchor="middle">${esc(value)}</text>`;
  let svg = `<svg class="art ams3h" viewBox="${o.geo.vb.join(" ")}" xmlns="${SVG_NS}" aria-label="AMS 3H spool status">`;
  svg += '<rect class="cabinet" x="4" y="4" width="692" height="352" rx="16"/>';
  if (o.showInfo !== false) {
    [data.zones[1], data.zones[0]].forEach((zone, i) => {
      const x = i ? 642 : 58;
      svg += `<g class="drying-zone${zone.drying ? " drying" : ""}" data-zone="${i ? 1 : 2}">`;
      svg += `<rect x="${x - 49}" y="16" width="98" height="112" rx="8"/>`;
      svg += text(x, 36, i ? "Dry box" : "Cabinet");
      svg += text(x, 61, zone.humidity, "humidity", 15);
      svg += text(x, 86, zone.temperature, "temperature", 15);
      if (i && zone.drying) svg += text(x, 113, zone.remaining, "remaining");
      svg += "</g>";
    });
  }
  // Even trays form the back row of four; odd trays form the front row of five.
  o.slots.forEach((slot, i) => {
    const x = o.geo.centers[i];
    const y = i % 2 ? 72 : 197;
    const active = data.active === i + 1 && !slot.empty;
    const color = /^#[\da-f]{6}$/i.test(slot.color) ? slot.color : "#888888";
    svg += `<g class="feed${active ? " active" : ""}" data-tool="${i + 1}">`;
    svg += `<path class="feed-path" d="M${x} ${y + 34}V288" stroke="${active ? color : "#555555"}"/>`;
    svg += `<g class="tool" transform="translate(${x} 288)"><rect x="-13" width="26" height="31" rx="4"/><path class="nozzle" d="M-7 31H7L0 42Z"/>`;
    if (active) svg += `<path d="M0 0V39" stroke="${color}" stroke-width="4"/>`;
    svg += "</g>" + text(x, 347, data.diameters[i], "nozzle-diameter", 11) + "</g>";
  });
  o.slots.forEach((slot, i) => {
    const x = o.geo.centers[i];
    const y = i % 2 ? 72 : 197;
    const color = /^#[\da-f]{6}$/i.test(slot.color) ? slot.color : "#888888";
    const drying = data.zones.some((zone) => zone.drying && zone.slots.includes(i + 1));
    svg += `<g class="ams3h-slot slotlabel${drying ? " drying" : ""}" data-slot="${i + 1}" data-tray-entity="${esc(o.trayEntities[i])}">`;
    svg += `<title>Tray ${i + 1}: ${esc(slot.name || slot.type)}</title>`;
    svg += `<circle class="rim" cx="${x}" cy="${y}" r="34"/>`;
    if (!slot.empty) svg += `<circle cx="${x}" cy="${y}" r="${Math.min(29, Math.max(8, remainPct(slot) * 0.3))}" fill="${color}"/>`;
    svg += `<circle cx="${x}" cy="${y}" r="8" fill="#333333"/>`;
    svg += text(x, y - 40, String(i + 1), "slot-number");
    if (drying) svg += `<path class="heat-icon" d="M${x + 20} ${y - 32}q-4-4 0-8t0-8m6 16q-4-4 0-8t0-8"/>`;
    if (o.showLabels && (!slot.empty || o.showEmptyLabel)) {
      const label = slot.empty ? EMPTY_LABEL : o.labelMode === "name" ? slot.name || slot.type : slot.type;
      const short = label.length > 10 ? label.slice(0, 9) + "…" : label;
      svg += text(x, y + 49, short, "material", 11);
    }
    svg += "</g>";
  });
  return svg + "</svg>";
}
