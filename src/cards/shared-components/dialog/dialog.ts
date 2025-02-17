import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("custom-bb-dialog")
export class Dialog extends LitElement {
  @property({ type: String }) heading = "Please confirm";
  @property({ type: Boolean }) open = false;

  render() {
    return html` <ha-dialog id="confirmation-popup" ?open=${this.open} heading="title">
      <ha-dialog-header slot="heading">
        <div slot="title">${this.heading}</div>
      </ha-dialog-header>
      <div class="content">
        <slot></slot>
      </div>
      <slot name="actions" slot="primaryAction"></slot>
      <slot name="secondaryAction" slot="secondaryAction"></slot>
    </ha-dialog>`;
  }
}
