import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { amsDeviceModel, variantFromModel } from "./geo";
import memoizeOne from "memoize-one";

import { AMS_MODELS, MANUFACTURER } from "../../const";
import { AMS_GRAPHIC_CARD_EDITOR_NAME } from "./const";

/* AMS-3H uses vector geometry; only AMS Lite lacks a supported view. */
const AMS_FILTER = AMS_MODELS.filter((m) => m !== "AMS Lite").map((model) => ({
  manufacturer: MANUFACTURER,
  model,
}));

@customElement(AMS_GRAPHIC_CARD_EDITOR_NAME)
export class AmsGraphicCardEditor extends LitElement {
  @state() private _config?: any;
  @state() private hass: any;

  public setConfig(config: any): void {
    this._config = config;
  }

  private _schema = memoizeOne((showTitle: boolean, showLabels: boolean, ams3h: boolean): any[] => [
    {
      name: "ams",
      label: "AMS",
      selector: { device: { filter: AMS_FILTER } },
    },
    {
      name: "show_info_bar",
      label: "Show info bar",
      selector: { boolean: {} },
    },
    ...(!ams3h
      ? [
          {
            name: "show_title",
            label: "Show title",
            selector: { boolean: {} },
          },
        ]
      : []),
    ...(!ams3h && showTitle
      ? [
          {
            name: "subtitle",
            label: "Title",
            selector: { text: {} },
          },
        ]
      : []),
    {
      name: "custom_temperature",
      label: "Custom temperature sensor",
      selector: { entity: { domain: "sensor" } },
    },
    {
      name: "custom_humidity",
      label: "Custom humidity sensor",
      selector: { entity: { domain: "sensor" } },
    },
    {
      name: "show_labels",
      label: "Show filament labels",
      selector: { boolean: {} },
    },
    ...(!ams3h && showLabels
      ? [
          {
            name: "label_mode",
            label: "Label content",
            selector: {
              select: {
                options: [
                  { label: "Filament type (e.g. PLA)", value: "type" },
                  { label: "Spool name", value: "name" },
                ],
              },
            },
          },
          {
            name: "show_empty_label",
            label: "Show label on empty slots",
            selector: { boolean: {} },
          },
        ]
      : []),
    ...(ams3h
      ? [
          {
            name: "active_tray_entity",
            label: "Active tray sensor",
            selector: { entity: { domain: "sensor" } },
          },
          ...([] as any[]).concat(
            ...[1, 2].map((zone) =>
              ["temperature", "humidity", "remaining_drying_time"].map((key) => ({
                name: `zone_${zone}_${key}_entity`,
                label: `${zone === 1 ? "Right drying zone" : "Left chamber"}: ${key}`,
                selector: { entity: { domain: "sensor" } },
              }))
            )
          ),
          {
            name: "ams3h_trays",
            label: "Slots 1–9 (use an empty string for automatic matching)",
            selector: { object: {} },
          },
          {
            name: "show_empty_label",
            label: "Show label on empty slots",
            selector: { boolean: {} },
          },
        ]
      : []),
  ]);

  protected render() {
    const schema = this._schema(
      this._config?.show_title !== false,
      this._config?.show_labels !== false,
      variantFromModel(amsDeviceModel(this.hass?.devices?.[this._config?.ams], this.hass)) ===
        "ams3h"
    );

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${schema}
        .computeLabel=${(s: any) => s.label}
        @value-changed=${this._valueChange}
      ></ha-form>
    `;
  }

  private _valueChange(ev: CustomEvent): void {
    const event = new Event("config-changed", {
      bubbles: true,
      composed: true,
    });
    (event as any).detail = { config: (ev as any).detail.value };
    this.dispatchEvent(event);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AMS_GRAPHIC_CARD_EDITOR_NAME]: AmsGraphicCardEditor;
  }
}
