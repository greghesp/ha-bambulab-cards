import React from "react";
import ReactDOM from "react-dom/client";

export function reactToWebComponent<P extends object>(
  Component: React.ComponentType<P>,
  properties: Array<keyof P> = []
) {
  class ReactWebComponent extends HTMLElement {
    private root: ReactDOM.Root | null = null;
    private props: Partial<P> = {};

    static get observedAttributes() {
      return properties.map(String);
    }

    connectedCallback() {
      this.mountReactComponent();
    }

    disconnectedCallback() {
      this.unmountReactComponent();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      // Update props when attributes change
      this.props = {
        ...this.props,
        [name]: this.parseAttribute(newValue),
      };
      this.mountReactComponent();
    }

    parseAttribute(value: string) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }

    mountReactComponent() {
      const mountPoint = document.createElement("div");
      this.attachShadow({ mode: "open" }).appendChild(mountPoint);

      // Get properties from element
      properties.forEach((prop) => {
        const attrName = String(prop);
        if (this.hasAttribute(attrName)) {
          this.props[prop] = this.parseAttribute(this.getAttribute(attrName)!);
        }
      });

      // Create React root and render component
      this.root = ReactDOM.createRoot(mountPoint);
      this.root.render(React.createElement(Component, this.props as P));
    }

    unmountReactComponent() {
      if (this.root) {
        this.root.unmount();
        this.root = null;
      }
    }
  }

  return ReactWebComponent;
}
