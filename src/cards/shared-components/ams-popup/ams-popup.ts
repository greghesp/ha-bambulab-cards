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
    return this._loadState === 'idle' && 
           !this.hass.states[this.entity_id].attributes.empty &&
           !this.hass.states[this.entity_id].attributes.active;
  }

  private _unloadButtonEnabled() {
    return this._loadState === 'idle' && 
           !this.hass.states[this.entity_id].attributes.empty &&
           this.hass.states[this.entity_id].attributes.active;
  }

  @property({ type: String })
  private _loadState: "idle" | "loading" | "unloading" | "success" | "error" = "idle";

  private async _handleLoad() {
    this._loadState = "loading";
    try {
      await loadFilament(this.hass, this.entity_id);
      setTimeout(() => {
        this._loadState = "idle";
      }, 10000);
    } catch (error) {
      this._loadState = "error";
      setTimeout(() => {
        this._loadState = "idle";
      }, 2000);
    }
  }

  private async _handleUnload() {
    this._loadState = "unloading";
    try {
      await unloadFilament(this.hass, this.entity_id);
      setTimeout(() => {
        this._loadState = "idle";
      }, 10000);
    } catch (error) {
      this._loadState = "error";
      setTimeout(() => {
        this._loadState = "idle";
      }, 2000);
    }
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
            <mwc-button
              id="load"
              class="action-button" 
              @click=${this._handleLoad}
              ?disabled=${!this._enableLoadButton()}
            >
              ${this._loadState === "loading" 
                ? html`<ha-circular-progress active size="small"></ha-circular-progress>Loading` 
                : this._loadState === "success"
                ? html`<ha-icon icon="mdi:check" style="color: var(--success-color)"></ha-icon>Load`
                : this._loadState === "error"
                ? html`<ha-icon icon="mdi:close" style="color: var(--error-color)"></ha-icon>Load`
                : "Load"
              }
            </mwc-button>
            <mwc-button
              id="unload"
              class="action-button" 
              @click=${this._handleUnload}
              ?disabled=${!this._unloadButtonEnabled()}
            >
              ${this._loadState === "unloading" 
                ? html`<ha-circular-progress active size="small"></ha-circular-progress>Unloading` 
                : this._loadState === "success"
                ? html`<ha-icon icon="mdi:check" style="color: var(--success-color)"></ha-icon>Unload`
                : this._loadState === "error"
                ? html`<ha-icon icon="mdi:close" style="color: var(--error-color)"></ha-icon> Unload`
                : "Unload"
              }
            </mwc-button>            
          </div>
      </ha-dialog>
    `;
  }
}
