import { html, LitElement } from "lit";
import { state } from "lit/decorators.js";
import { customElement } from "../../utils/custom-element";
import { MANUFACTURER, PRINTER_MODELS } from "../../const";
import { ERROR_CARD_EDITOR_NAME } from "./const";

const filterCombinations = PRINTER_MODELS.map((model) => ({
  manufacturer: MANUFACTURER,
  model: model,
}));

const SCHEMA = [
  {
    name: "printers",
    label: "Printers",
    selector: { device: { filter: filterCombinations, multiple: true } },
  },
  {
    name: "title",
    label: "Title (optional)",
    selector: { text: {} },
  },
  {
    name: "show_when_clear",
    label: "Show the card when there are no errors",
    selector: { boolean: {} },
  },
  {
    name: "show_codes",
    label: "Show error codes",
    selector: { boolean: {} },
  },
];

// Options that are on when they are missing from the config.
const DEFAULT_ON = { show_when_clear: true, show_codes: true };

@customElement(ERROR_CARD_EDITOR_NAME)
export class ErrorCardEditor extends LitElement {
  @state() private _config?;
  @state() private hass: any;

  public setConfig(config): void {
    this._config = config;
  }

  private _valueChanged(ev: CustomEvent) {
    const { printer, ...config } = ev.detail.value;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${{
          ...DEFAULT_ON,
          ...this._config,
          printers: this._config?.printers ?? (this._config?.printer ? [this._config.printer] : []),
        }}
        .schema=${SCHEMA}
        .computeLabel=${(schema) => schema.label}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }
}
