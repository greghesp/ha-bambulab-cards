import { createRoot, Root } from "react-dom/client";
import { ComponentType } from "react";
import { HomeAssistant } from "custom-card-helpers";
import * as React from "react";

export class ReactHassElement extends HTMLElement {
  private readonly root: Root;
  private hass_: HomeAssistant | undefined;
  private config_: any;

  constructor(private Component: ComponentType<{ hass?: HomeAssistant; config?: any }>) {
    super();
    this.root = createRoot(this);
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    // Uncomment if you want to clean up when element is removed
    // this.root.unmount();
  }

  private render() {
    const Component = this.Component;
    this.root.render(
      React.createElement(Component, {
        hass: this.hass_,
        config: this.config_,
      })
    );
  }

  set hass(hass: HomeAssistant | undefined) {
    this.hass_ = hass;
    this.render();
  }

  setConfig(config: any) {
    this.config_ = config;
    this.render();
  }

  // Optional: Add a method to fire events if needed
  fireEvent(name: string, detail: any) {
    this.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        composed: true,
        detail,
      })
    );
  }
}
