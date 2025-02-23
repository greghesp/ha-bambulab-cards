import { LitElement } from "lit";
import { html, nothing } from "lit-html";
import { consume } from "@lit/context";
import { customElement, property } from "lit/decorators.js";
import { hassContext } from "../../../utils/context";
import { getContrastingTextColor, loadFilament, unloadFilament } from "../../../utils/helpers";
import styles from "./ams-popup.styles";
@customElement("ams-popup")
export class AMSPopup extends LitElement {
  @property({ type: String }) entity_id;

  @consume({ context: hassContext, subscribe: true })
  private hass;

  @property({ type: Boolean })
  private _dialogOpen = false;

  private _closeDialog() {
    this._dialogOpen = false;
  }

  private _handleClick() {
    this._dialogOpen = true;
  }

  private _enableLoadButton() {
    // TODO - Disable if some other entity is active.
    return !this.hass.states[this.entity_id].attributes.empty && !this.hass.states[this.entity_id].attributes.active;
  }

  private _enableUnloadButton() {
    return !this.hass.states[this.entity_id].attributes.empty && this.hass.states[this.entity_id].attributes.active;
  }

  static styles = styles;

  render() {
    return html`
      <div class="popup-action-container" @click=${this._handleClick}>
        <slot></slot>
      </div>
      ${this.modal()}
    `;
  }

  modal() {
    if (!this._dialogOpen) return nothing;

    return html`
      <ha-dialog
        id="confirmation-popup"
        .open=${this._dialogOpen}
        @closed=${this._closeDialog}
        heading="title"
        hideactions
      >
        <ha-dialog-header slot="heading">
          <ha-icon-button slot="navigationIcon" dialogAction="cancel"
            ><ha-icon icon="mdi:close"></ha-icon
          ></ha-icon-button>
          <div slot="title">${this.hass.states[this.entity_id].attributes.friendly_name}</div>
        </ha-dialog-header>
        <div class="ha-bambulab-spool-modal-container">
          <div class="filament-title section-title">Filament Information</div>
          <div class="div2 item-title">Filament</div>
          <div class="div3 item-value">${this.hass.states[this.entity_id].attributes.name}</div>
          <div class="div4 item-value">
            <span
              style="background-color: ${
                this.hass.states[this.entity_id].attributes.color
              }; color: ${getContrastingTextColor(
                this.hass.states[this.entity_id].attributes.color
              )}; padding: 5px 10px; border-radius: 5px;"
              >${this.hass.states[this.entity_id].attributes.color}</span
            >
          </div>
          <div class="div5 item-title">Color</div>
          <div class="div6 section-title">Nozzle Temperature</div>
          <div class="div7 item-title">Minimum</div>
          <div class="div8 item-value">
            ${this.hass.states[this.entity_id].attributes.nozzle_temp_min}
          </div>
          <div class="div9 item-value ">
            ${this.hass.states[this.entity_id].attributes.nozzle_temp_max}
          </div>
          <div class="div10 item-title">Maximum</div>
          <div class="action-buttons">
            <mwc-button id="load" class="action-button" ?disabled="${!this._enableLoadButton()}" @click=${() => {
              loadFilament(this.hass, this.entity_id);
              this._closeDialog();
            }}
            >Load</mwc-button>
            <mwc-button id="unload" class="action-button" ?disabled="${!this._enableUnloadButton()}" @click=${() => {
              unloadFilament(this.hass, this.entity_id);
              this._closeDialog();
            }}>Unload</mwc-button>
          </div>
      </ha-dialog>
    `;
  }
}
