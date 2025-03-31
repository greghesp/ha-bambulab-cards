import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("confirmation-prompt")
export class ConfirmationPrompt extends LitElement {
  @property({ type: String }) body;
  @property({ type: String }) title = "Please Confirm";
  @property({ type: String }) primaryActionText = "Confirm";
  @property({ type: String }) secondaryActionText = "Cancel";

  @property({ type: Function }) primaryAction;
  @property({ type: Function }) secondaryAction;
  render() {
    return html`
      <ha-dialog id="confirmation-popup" open="true" heading="title">
        <ha-dialog-header slot="heading">
          <div slot="title">${this.title}</div>
        </ha-dialog-header>
        <div class="content">${this.body}</div>
        <mwc-button
          slot="primaryAction"
          @click="${() => {
            this.primaryAction();
          }}"
          >${this.primaryActionText}</mwc-button
        >
        <mwc-button
          slot="secondaryAction"
          @click="${() => {
            this.secondaryAction();
          }}"
          >${this.secondaryActionText}</mwc-button
        >
      </ha-dialog>
    `;
  }
}
