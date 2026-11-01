/*
 * AMS Graphic Card — SVG rendering
 *
 * Produces the whole SVG as a string, which the card injects into the shadow DOM through
 * unsafeSVG. A single string is used instead of a lit template per element because the layer
 * order, clip paths and fade mask depend on exact z-order and userSpaceOnUse coordinates —
 * the string form is the easiest to read and to verify.
 */
import { BASE_IMAGES, BRAND_IMAGES, MECH_IMAGE } from "./assets";
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
