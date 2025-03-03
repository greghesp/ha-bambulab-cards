import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import React from "react";
import ReactDOM from "react-dom";
import { SpoolCard } from "../cards/spool-card";
import { SPOOL_CARD_NAME } from "../cards/spool-card/const";
import { HomeAssistant } from "../types/homeassistant";

@customElement(SPOOL_CARD_NAME)
export class SpoolCardWrapper extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @property({ attribute: false }) config?: any;

  private _container?: HTMLElement;

  firstUpdated() {
    this._container = document.createElement("div");
    this.shadowRoot?.appendChild(this._container);
    this._render();
  }

  updated() {
    this._render();
  }

  _render() {
    if (!this._container || !this.hass) return;

    ReactDOM.render(
      React.createElement(SpoolCard, {
        hass: this.hass,
        config: this.config,
      }),
      this._container
    );
  }

  static getConfigElement() {
    return document.createElement("bambulab-spool-card-editor");
  }

  static getStubConfig() {
    return {
      entity_id: "",
      title: "Spool",
    };
  }

  setConfig(config: any) {
    this.config = config;
  }

  getCardSize() {
    return 2;
  }
}
