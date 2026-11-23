// Turns the attributes of the integration's `hms_errors` and `print_error`
// binary sensors into a flat list the card can render. Kept free of Lit and
// Home Assistant types so it can be tested on its own.

export type AlertType = "error" | "warning" | "info";

export interface PrinterError {
  source: "hms" | "print";
  alertType: AlertType;
  severity: string;
  message: string;
  code?: string;
  wikiUrl?: string;
}

type Attributes = Record<string, unknown> | undefined;

interface EntityState {
  state: string;
  attributes?: Record<string, unknown>;
}

// HMS severities as the integration names them (pybambu HMS_SEVERITY_LEVELS).
const SEVERITY_ALERT_TYPES: Record<string, AlertType> = {
  fatal: "error",
  serious: "warning",
  common: "info",
  info: "info",
};

const SEVERITY_RANK: Record<string, number> = { fatal: 0, serious: 1, common: 2, info: 3 };
const UNKNOWN_SEVERITY_RANK = 4;

function asText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value).trim();
  return text === "" ? undefined : text;
}

// Only pass through links that are plain web URLs.
export function safeUrl(value: unknown): string | undefined {
  const text = asText(value);
  if (!text) {
    return undefined;
  }
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function severityRank(severity: string): number {
  return SEVERITY_RANK[severity] ?? UNKNOWN_SEVERITY_RANK;
}

export function hmsErrors(attributes: Attributes): PrinterError[] {
  const count = Number(attributes?.["Count"] ?? 0);
  if (!Number.isFinite(count) || count <= 0) {
    return [];
  }
  const errors: PrinterError[] = [];
  for (let index = 1; index <= count; index++) {
    const message = asText(attributes?.[`${index}-Error`]);
    if (!message) {
      continue;
    }
    const severity = (asText(attributes?.[`${index}-Severity`]) ?? "unknown").toLowerCase();
    errors.push({
      source: "hms",
      alertType: SEVERITY_ALERT_TYPES[severity] ?? "warning",
      severity,
      message,
      code: asText(attributes?.[`${index}-Code`]),
      wikiUrl: safeUrl(attributes?.[`${index}-Wiki`]),
    });
  }
  // Most severe first; the sort is stable so equal severities keep printer order.
  return errors.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

export function printError(isOn: boolean, attributes: Attributes): PrinterError[] {
  const message = isOn ? asText(attributes?.["error"]) : undefined;
  if (!message) {
    return [];
  }
  return [
    {
      source: "print",
      alertType: "error",
      severity: "print_error",
      message,
      code: asText(attributes?.["code"]),
    },
  ];
}

export function collectErrors(
  printErrorState: EntityState | undefined,
  hmsState: EntityState | undefined
): PrinterError[] {
  return [
    ...printError(printErrorState?.state === "on", printErrorState?.attributes),
    ...(hmsState?.state === "on" ? hmsErrors(hmsState.attributes) : []),
  ];
}
