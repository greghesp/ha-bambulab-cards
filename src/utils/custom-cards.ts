import { ReactHassElement } from "./react-hass-element";
import { ComponentType } from "react";
import { HomeAssistant } from "custom-card-helpers";

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

export type RegisterCardOptions = {
  name: string;
  description: string;
  card: ComponentType<any>;
  editor: ComponentType<any>;
  getStubConfig?: (hass: HomeAssistant) => any;
  getLayoutOptions?: () => {
    grid_rows?: number;
    grid_min_rows?: number;
    grid_max_rows?: number;
    grid_columns?: number;
    grid_min_columns?: number;
    grid_max_columns?: number;
  };
};

export function registerCustomCard(
  type: string,
  {
    name,
    description,
    card: Card,
    editor: Editor,
    getStubConfig,
    getLayoutOptions,
  }: RegisterCardOptions
) {
  try {
    // Check if the element is already defined
    if (customElements.get(type)) {
      console.warn(`Custom element ${type} already defined, skipping registration`);
      return;
    }

    const editorType = `${type}-editor`;

    // Check if editor is already defined
    if (customElements.get(editorType)) {
      console.warn(`Editor element ${editorType} already defined, skipping registration`);
      return;
    }

    class ReactCard extends ReactHassElement {
      constructor() {
        super(Card);
      }

      static getStubConfig(hass: HomeAssistant) {
        return getStubConfig ? getStubConfig(hass) : undefined;
      }

      getLayoutOptions() {
        return getLayoutOptions ? getLayoutOptions() : {};
      }

      static getConfigElement() {
        return document.createElement(editorType);
      }
    }

    class EditorCard extends ReactHassElement {
      constructor() {
        super(Editor);
      }
    }

    // Add try/catch around the define calls
    try {
      customElements.define(type, ReactCard);
    } catch (e) {
      console.warn(`Failed to define ${type}`, e);
    }

    try {
      customElements.define(editorType, EditorCard);
    } catch (e) {
      console.warn(`Failed to define ${editorType}`, e);
    }

    // Add the card to window.customCards
    if (!window.customCards) {
      window.customCards = [];
    }

    // Check if this card type is already registered
    if (!window.customCards.some((card) => card.type === type)) {
      window.customCards.push({
        type,
        name,
        description,
        preview: true,
      });
    }

    return ReactCard;
  } catch (error) {
    console.error(`Error registering card ${type}:`, error);
    return null;
  }
}
