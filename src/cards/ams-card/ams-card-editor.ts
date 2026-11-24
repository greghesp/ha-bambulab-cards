import { AMS_CARD_EDITOR_NAME } from "./const";
import { MANUFACTURER, AMS_MODELS, AMS_LITE_MODEL, RACK_AMS_TRAYS } from "../../const";
import { state } from "lit/decorators.js";
import { customElement } from "../../utils/custom-element";
import { LitElement, html, nothing } from "lit";
import memoizeOne from "memoize-one";

// https://www.home-assistant.io/docs/blueprint/selectors/#select-selector
const filterCombinations = AMS_MODELS.map((model) => ({
  manufacturer: MANUFACTURER,
  model: model,
}));

@customElement(AMS_CARD_EDITOR_NAME)
export class AmsCardEditor extends LitElement {
  @state() private _config?;
  @state() private hass: any;

  public setConfig(config): void {
    this._config = config;
  }

  // The AMS 3H and AMS 3P have more than four trays and only the vector style
  private _schema = memoizeOne((showInfoBar: boolean, style: string, rackAmsTrays: number | undefined, isAmsLite: boolean) => [
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
        // The AMS Lite has no humidity sensor, and the AMS 3H already shows percentages
        ...(rackAmsTrays || isAmsLite ? [] : [{
          name: "show_humidity_percentage",
          label: "Show Humidity as Percentage",
          selector: { boolean: {} },
          default: true,
        }]),
        {
          name: "custom_humidity",
          label: "Custom Humidity Sensor",
          selector: { entity: { domain: "sensor" }},
        },
        {
          name: "custom_temperature",
          label: "Custom Temperature Sensor",
          selector: { entity: { domain: "sensor" } },
        }
      ] : ""),
    ...(style === "vector" || rackAmsTrays ? [
      {
        name: "show_type",
        label: "Show Filament Types",
        selector: {
          boolean: true
        }
      }, 
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
      ...Array.from({ length: rackAmsTrays ?? 4 }, (_, i) => i + 1).map((n) => ({
        name: `custom_remaining_${n}`,
        label: `Custom Remaining Sensor (Tray ${n})`,
        selector: { entity: { domain: "sensor" } },
      })),
    ] : ""),
    {
      name: "ams",
      label: "AMS",
      selector: {
        device: {
          filter: filterCombinations
        }
      },
    },
    ...(rackAmsTrays ? [] : [{
      name: "style",
      label: "Card Style",
      selector: {
        select: {
          options: [
            { label: "Vector", value: "vector" },
            { label: "Graphic", value: "graphic" },
          ],
        },
      },
    }]),
  ]);


  render() {
    const model = this.hass?.devices?.[this._config?.ams]?.model;
    const rackAmsTrays = RACK_AMS_TRAYS[model];
    const schema = this._schema(
      this._config?.show_info_bar,
      this._config?.style,
      rackAmsTrays,
      model === AMS_LITE_MODEL
    );

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
 