/*
 * AMS Graphic Card — geometry constants and helpers
 *
 * Coordinate system: 1x design units on a 700 x 360 canvas (matching the actual resolution of
 * src/images/*.png). Every layer of every model is aligned to that same canvas, so all the
 * coordinates can be written straight into the geometry table.
 */

export const LABEL_FONT = 20; // filament label font size
export const PCT_FONT = 21; // remaining-percentage font size
export const EMPTY_LABEL = "Empty"; // text drawn on an empty slot (only when show_empty_label is on)

export const FONT_STACK =
  'var(--ha-font-family-body, "Segoe UI", Roboto, "Helvetica Neue", "Microsoft YaHei", sans-serif)';

export interface Slot {
  empty: boolean;
  color: string;
  remain: number;
  type: string;
  name: string;
  active: boolean;
  missing?: boolean;
}

export interface LcdField {
  key: "hum" | "temp" | string;
  label: string;
  x: number;
  lx: number;
}

export interface VariantGeo {
  name: string;
  base: string; // key into BASE_IMAGES
  brand?: string; // key into BRAND_IMAGES; the silkscreen layer is drawn only when set
  mech?: boolean; // whether to draw the mechanism layer
  centers: number[]; // spool centre x (relative to the left edge of the viewBox)
  spW: number; // spool width
  spH: number; // spool height
  spY: number; // spool top
  flangeFrac: number; // flange width / spool width
  bandCY: number; // filament band centre y
  matCap: number; // max fraction of the spool the filament band may fill
  labelY: number; // y of the label row
  fade: "a2p" | "none"; // fade the lower half of the spool (AMS / AMS 2 PRO), or no fade
  vb: [number, number, number, number];
  lcd?: boolean; // whether the model has a panel that can be drawn from live values
  clipY?: number; // the spool is fully occluded below this y
  chipMaxY?: number; // upper bound for the remaining-percentage chip (keeps it out of the occluded area)
  bandTop?: number; // top edge of the strip where the base image is re-drawn on top of the spool
  bandBot?: number; // bottom edge of that strip (e.g. the silver buckle on AMS HT)
  lcdFields?: LcdField[];
  lcdLabelY?: number;
  lcdValueY?: number;
  lcdLabelFont?: number;
  lcdValueFont?: number;
  unsupported?: boolean;
}

const VB_DEFAULT: [number, number, number, number] = [0, 0, 700, 360];

/* AMS and AMS 2 PRO share one set of geometry (identical spool positions); they differ only
   in the base image and the silkscreen layer */
const AMS_LIKE: Pick<
  VariantGeo,
  "centers" | "spW" | "spH" | "spY" | "flangeFrac" | "bandCY" | "matCap" | "labelY" | "fade" | "vb" | "mech"
> = {
  centers: [155.75, 284.5, 414.25, 542.75],
  spW: 101,
  spH: 265,
  spY: 19,
  flangeFrac: 0.075,
  bandCY: 150,
  matCap: 0.9,
  labelY: 268,
  fade: "a2p",
  vb: VB_DEFAULT,
  mech: true,
};

export const VARIANTS: { [key: string]: VariantGeo } = {
  ams2pro: {
    name: "AMS 2 PRO",
    base: "ams2",
    brand: "ams2pro",
    ...AMS_LIKE,
  },
  ams: {
    /* The shipped ams.png is the AMS v1 body; this card uses an "AMS 2 body + AMS label" base */
    name: "AMS",
    base: "amsAlt",
    brand: "ams",
    ...AMS_LIKE,
  },
  ht: {
    name: "AMS HT",
    base: "amshtClean",
    centers: [114.04],
    spW: 111,
    spH: 292,
    spY: 24,
    flangeFrac: 0.075,
    bandCY: 168,
    matCap: 0.9,
    labelY: 265,
    fade: "none",
    /* The viewBox is larger than the canvas so that, after uniform scaling, the spool is drawn
       at the same height as on AMS / AMS 2 PRO. The side margins follow from the narrower panel
       rather than from cropping. */
    vb: [237.96, -30.1, 223.1, 419.7],
    lcd: true,
    /* Past the cover / silver buckle the lower part of the spool is fully occluded */
    clipY: 168,
    chipMaxY: 152,
    /* Re-draw this strip of the base image above the spool, restoring the buckle it covered */
    bandTop: 163,
    bandBot: 184,
    lcdFields: [
      { key: "hum", label: "Humidity", x: 85.04, lx: 85.04 },
      { key: "temp", label: "Temperature", x: 141.04, lx: 141.04 },
    ],
    lcdLabelY: 205,
    lcdValueY: 224,
    lcdLabelFont: 8,
    lcdValueFont: 14,
  },
  lite: {
    name: "AMS Lite",
    base: "ams2",
    centers: [],
    spW: 0,
    spH: 0,
    spY: 0,
    flangeFrac: 0,
    bandCY: 0,
    matCap: 0,
    labelY: 0,
    fade: "none",
    vb: VB_DEFAULT,
    unsupported: true,
  },
};

/* Vertical opacity of the spool: fully visible on top, fading into the dark housing below */
export const FADE_STOPS: [number, number][] = [
  [0.0, 1.0],
  [140 / 360, 1.0],
  [160 / 360, 0.627],
  [180 / 360, 0.251],
  [190 / 360, 0.251],
  [260 / 360, 0.125],
  [330 / 360, 0.0],
  [1.0, 0.0],
];

/* Pick the geometry table from the device model string */
export function variantFromModel(model: string): string {
  const m = String(model || "").toLowerCase();
  if (m.includes("lite")) return "lite";
  if (m.includes("ht")) return "ht";
  if (m.includes("2")) return "ams2pro";
  if (m.includes("ams")) return "ams";
  return "ams2pro";
}

export function isBlankColor(c: any): boolean {
  if (!c) return true;
  const s = String(c).toLowerCase().replace("#", "").trim();
  return s === "" || s === "00000000" || s === "000000" || s === "none" || s === "nil";
}

/* Filament band height: a tiny value for an empty slot, 95% for full or unknown */
export function remainPct(slot: Slot): number {
  if (slot.empty) return 20;
  const r = slot.remain;
  if (r == null || r < 0 || Number.isNaN(r)) return 95;
  return 20 + (r / 100) * 75;
}

export function esc(s: any): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const _mcv = document.createElement("canvas");
const _mctx = _mcv.getContext("2d") as CanvasRenderingContext2D;
let _fontFam = "";

/* Text width must be measured with the font HA actually renders (the SVG text uses
   --ha-font-family-body); otherwise the measurement comes out too narrow and "100%" overflows
   the frame */
export function fontFamily(): string {
  if (_fontFam) return _fontFam;
  let f = "";
  try {
    f = getComputedStyle(document.documentElement).getPropertyValue("--ha-font-family-body").trim();
  } catch (e) {
    /* ignore */
  }
  _fontFam = f || '"Segoe UI", Roboto, "Microsoft YaHei", sans-serif';
  return _fontFam;
}

export function measureText(text: any, size: number, weight?: number): number {
  const t = String(text);
  if (!_mctx) return t.length * size * 0.62;
  _mctx.font = `${weight || 400} ${size}px ${fontFamily()}`;
  const w = _mctx.measureText(t).width;
  return w > 0 ? w : t.length * size * 0.62;
}

/* Label frame width: measured width plus padding, never below the character-count estimate */
export function chipWidth(text: any, size: number, extra?: number, perChar?: number): number {
  const t = String(text);
  const w = measureText(t, size);
  return Math.max(
    w + (extra == null ? 18 : extra),
    t.length * size * (perChar == null ? 0.72 : perChar)
  );
}
