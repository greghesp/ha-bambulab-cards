import { DEFAULT_ICON, DEFAULT_NAME, SKIP_OBJECTS_CARD_EDITOR_NAME } from "./const";
import { MANUFACTURER, PRINTER_MODELS } from "../../const";
import { customElement, state } from "lit/decorators.js";
import { LitElement, html } from "lit";

const filterCombinations = PRINTER_MODELS.map((model) => ({
  manufacturer: MANUFACTURER,
  model: model,
}));

const SCHEMA = [
  {
    name: "printer",
    label: "Printer",
    selector: { device: { filter: filterCombinations } },
  },
  {
    name: "name",
    label: `Name (default: ${DEFAULT_NAME})`,
    selector: { text: {} },
  },
  {
    name: "icon",
    label: `Icon (default: ${DEFAULT_ICON})`,
    selector: { icon: {} },
  },
  {
    name: "show_name",
    label: "Show name",
    selector: { boolean: {} },
  },
];

@customElement(SKIP_OBJECTS_CARD_EDITOR_NAME)
export class SkipObjectsCardEditor extends LitElement {
  @state() private _config?;
  @state() private hass: any;

  public setConfig(config): void {
    this._config = config;
  }

  _handleValueChanged(ev) {
    const messageEvent = new CustomEvent("config-changed", {
      detail: { config: ev.detail.value },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(messageEvent);
  }

  render() {
    return html`
      <div>
        <ha-form
          .hass=${this.hass}
          .data=${{ show_name: true, ...this._config }}
          .schema=${SCHEMA}
          .computeLabel=${(schema) => schema.label}
          @value-changed=${this._handleValueChanged}
        ></ha-form>
      </div>
    `;
  }
}
