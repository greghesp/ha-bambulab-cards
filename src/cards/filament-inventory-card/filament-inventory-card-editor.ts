import { LitElement, html } from "lit";
import { state } from "lit/decorators.js";
import { MANUFACTURER } from "../../const";
import { customElement } from "../../utils/custom-element";
import { FILAMENT_INVENTORY_CARD_EDITOR_NAME } from "./const";

const schema = [{
  name: "inventory",
  label: "Filament Inventory",
  selector: { device: { filter: [{ manufacturer: MANUFACTURER, model: "Filament Manager" }] } },
}];

@customElement(FILAMENT_INVENTORY_CARD_EDITOR_NAME)
export class FilamentInventoryCardEditor extends LitElement {
  @state() private _config: any = {};
  @state() private hass: any;

  public setConfig(config: any): void {
    this._config = config;
  }

  render() {
    return html`<ha-form
      .hass=${this.hass}
      .data=${this._config}
      .schema=${schema}
      .computeLabel=${(item) => item.label}
      @value-changed=${this._valueChanged}
    ></ha-form>`;
  }

  private _valueChanged(event: CustomEvent): void {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: event.detail.value }, bubbles: true, composed: true,
    }));
  }
}