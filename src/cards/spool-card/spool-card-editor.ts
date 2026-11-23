import { SPOOL_CARD_EDITOR_NAME } from "./const";
import { MANUFACTURER, AMS_MODELS_WITH_EXTERNAL_SPOOL, AMS_3H_MODEL } from "../../const";
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

  // The AMS 3H has nine trays, every other AMS four
  private _schema = memoizeOne((showInfoBar: boolean, trayCount: number) => [
    {
      name: "spool",
      label: "Spool",
      selector: {
        device: {
          filter: filterCombinations
        }
     },
    },
    { 
      name: "show_info_bar",
      label: "Show Info Bar",
      selector: {
        boolean: true
      }
    },
    ...(showInfoBar ? [
        {
          name: "subtitle",
          label: "Subtitle",
          selector: { text: {} },
        },
      ] : ""),
    {
      name: "tray",
      label: "Tray",
      selector: { number: { min: 1, max: trayCount, step: 1 } },
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
  ]);

  render() {
    const isAms3h = this.hass?.devices?.[this._config?.spool]?.model === AMS_3H_MODEL;
    const schema = this._schema(this._config?.show_info_bar, isAms3h ? 9 : 4);
    
    return html`
      <div>
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${schema}
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
