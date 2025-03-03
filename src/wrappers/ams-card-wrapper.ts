import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import React from "react";
import ReactDOM from "react-dom";
import { AMSCard } from "../cards/ams-card";
import { AMS_CARD_NAME } from "../cards/ams-card/const";
import { HomeAssistant } from "../types/homeassistant";

@customElement(AMS_CARD_NAME)
export class AMSCardWrapper extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @property({ attribute: false }) config?: any;

  // Create a container for React
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
      React.createElement(AMSCard, {
        hass: this.hass,
        config: this.config,
      }),
      this._container
    );
  }

  // This is required for the editor
  static getConfigElement() {
    return document.createElement("bambulab-ams-card-editor");
  }

  // This is required for Home Assistant
  static getStubConfig() {
    return {
      device_id: "",
      title: "AMS",
      style: "vector",
      show_info_bar: true,
    };
  }

  // Required for Home Assistant
  setConfig(config: any) {
    this.config = config;
  }

  // Required for Home Assistant
  getCardSize() {
    return 3;
  }
}
