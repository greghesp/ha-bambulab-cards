import { SPOOL_CARD_EDITOR_NAME } from "./const";
import { MANUFACTURER, AMS_MODELS_WITH_EXTERNAL_SPOOL } from "../../const";
import { customElement, state } from "lit/decorators.js";
import { LitElement, html } from "lit";
import memoizeOne from "memoize-one";

// https://www.home-assistant.io/docs/blueprint/selectors/#select-selector
const filterCombinations = AMS_MODELS_WITH_EXTERNAL_SPOOL.map((model) => ({
  manufacturer: MANUFACTURER,
  model: model,
}));

@customElement(SPOOL_CARD_EDITOR_NAME)
export class SpoolCardEditor extends LitElement {
  @state() private _config?;
  @state() private hass: any;

  public setConfig(config): void {
    this._config = config;
  }

  private _schema = [
    {
      name: "spool",
      label: "Spool",
      selector: { device: { filter: filterCombinations } },
    },
    {
      name: "tray",
      label: "Tray",
      selector: { number: { min: 1, max: 4, step: 1 } },
      default: 1,
    },
    {
      name: "show_type",
      label: "Show Filament Types",
      selector: { boolean: true } },
    {
      name: "spool_anim_reflection",
      label: "Active spool animation: Light Reflection",
      selector: { boolean: true },
      default: true,
    },
    {
      name: "spool_anim_wiggle",
      label: "Active spool animation: Wiggle",
      selector: { boolean: true },
      default: true,
    },
  ];

  render() {
    return html`
      <div>
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${this._schema}
          .computeLabel=${(s) => s.label}
          @value-changed=${this._valueChange}
        ></ha-form>
      </div>
    `;
  }

  private _valueChange(ev: CustomEvent): void {
    let config = ev.detail.value;

    const event = new Event("config-changed", {
      bubbles: true,
      composed: true,
    });
    event["detail"] = { config };
    this.dispatchEvent(event);
  }
}
