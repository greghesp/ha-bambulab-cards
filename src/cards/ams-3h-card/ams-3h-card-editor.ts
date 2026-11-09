import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import memoizeOne from "memoize-one";

import { MANUFACTURER } from "../../const";
import { AMS_3H_CARD_EDITOR_NAME, AMS_3H_MODEL } from "./const";

@customElement(AMS_3H_CARD_EDITOR_NAME)
export class Ams3hCardEditor extends LitElement {
  @state() private _config?: any;
  @state() private hass: any;

  public setConfig(config: any): void {
    this._config = config;
  }

  private _schema = memoizeOne((showTitle: boolean): any[] => [
    {
      name: "ams",
      label: "AMS 3H",
      selector: { device: { filter: [{ manufacturer: MANUFACTURER, model: AMS_3H_MODEL }] } },
    },
    {
      name: "show_title",
      label: "Show title",
      selector: { boolean: {} },
    },
    ...(showTitle
      ? [
          {
            name: "subtitle",
            label: "Title (defaults to the AMS name)",
            selector: { text: {} },
          },
        ]
      : []),
    {
      name: "show_type",
      label: "Show filament names",
      selector: { boolean: {} },
    },
    {
      name: "spool_anim_reflection",
      label: "Reflection animation on the active spool",
      selector: { boolean: {} },
    },
    {
      name: "spool_anim_wiggle",
      label: "Wiggle animation on the active spool",
      selector: { boolean: {} },
    },
  ]);

  protected render() {
    const data = {
      show_title: true,
      show_type: true,
      spool_anim_reflection: true,
      spool_anim_wiggle: true,
      ...this._config,
    };
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${this._schema(data.show_title !== false)}
        .computeLabel=${(s: any) => s.label}
        @value-changed=${this._valueChange}
      ></ha-form>
    `;
  }

  private _valueChange(ev: CustomEvent): void {
    const event = new Event("config-changed", { bubbles: true, composed: true });
    (event as any).detail = { config: (ev as any).detail.value };
    this.dispatchEvent(event);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AMS_3H_CARD_EDITOR_NAME]: Ams3hCardEditor;
  }
}
