import { SPOOL_CARD_EDITOR_NAME } from "./const";
import { customElement, state } from "lit/decorators.js";
import { LitElement, html } from "lit";
import memoizeOne from "memoize-one";

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
      selector: { device: {} },
    },
    { name: "show_type", label: "Show Filament Types", selector: { boolean: true } },
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
