import { ReactHassElement } from "./react-hass-element";
import { ComponentType } from "react";
import { HomeAssistant } from "../types/homeassistant";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

declare global {
  interface Window {
    customCards: Array<{
      type: string;
      name: string;
      description: string;
      preview: boolean;
    }>;
  }
}

interface CardConfig {
  type?: string;
  [key: string]: any;
}

interface CardInstance {
  hass: HomeAssistant;
  config: CardConfig;
  [key: string]: any;
}

interface CardSelector {
  querySelector: (selector: string) => Element | null;
  [key: string]: any;
}

interface RegisterCardParams {
  type: string;
  name: string;
  description: string;
  component: React.ComponentType<any>;
  getStubConfig?: () => CardConfig;
}

interface LegacyCardParams {
  card: React.ComponentType<any>;
  editor?: React.ComponentType<any>;
  name: string;
  description: string;
  getLayoutOptions?: () => { [key: string]: any };
}

export function registerCustomCard(typeOrParams: string | RegisterCardParams, legacyParams?: LegacyCardParams) {
  let type: string;
  let params: RegisterCardParams;

  if (typeof typeOrParams === 'string' && legacyParams) {
    // Legacy format
    type = typeOrParams;
    params = {
      type,
      name: legacyParams.name,
      description: legacyParams.description,
      component: legacyParams.card
    };
  } else if (typeof typeOrParams === 'object') {
    // New format
    params = typeOrParams;
    type = params.type;
  } else {
    throw new Error('Invalid parameters for registerCustomCard');
  }

  const windowWithCards = window as unknown as Window & {
    customCards: Array<{ type: string; name: string; description: string }>;
  };

  if (!windowWithCards.customCards) {
    windowWithCards.customCards = [];
  }

  windowWithCards.customCards.push({
    type: params.type,
    name: params.name,
    description: params.description,
  });

  // Create custom element class
  @customElement(type)
  class CustomCardElement extends LitElement {
    @property({ attribute: false }) hass?: HomeAssistant;
    @property({ attribute: false }) config?: CardConfig;

    private _container?: HTMLElement;
    private _root?: ReturnType<typeof createRoot>;

    override firstUpdated() {
      this._container = document.createElement("div");
      this.shadowRoot?.appendChild(this._container);
      this._root = createRoot(this._container);
      this._render();
    }

    override updated() {
      this._render();
    }

    _render() {
      if (!this._root || !this.hass) return;

      this._root.render(
        React.createElement(params.component, {
          hass: this.hass,
          config: this.config,
        })
      );
    }

    // Required for Home Assistant
    setConfig(config: CardConfig) {
      this.config = config;
    }

    // Required for Home Assistant
    getCardSize() {
      return 3;
    }

    // Required for Home Assistant
    static getConfigElement() {
      return document.createElement(`${type}-editor`);
    }

    // Required for Home Assistant
    static getStubConfig() {
      return params.getStubConfig?.() || {
        printer: "",
        show_toolbar: true,
        show_preview: true,
      };
    }
  }
}
