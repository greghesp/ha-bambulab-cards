import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators";

@customElement("confirmation-prompt")
export class AMSPopup extends LitElement {
  @property({ type: String }) body;

  @property({ type: Boolean }) open = false;

  @property({ type: String }) primaryActionText = "Confirm";
  @property({ type: String }) secondaryActionText = "Cancel";

  @property({ type: Function }) primaryAction;

  render() {
    if (!this.open) {
      return nothing;
    }
    return html`
      <ha-dialog id="confirmation-popup" open="true" heading="title">
        <ha-dialog-header slot="heading">
          <div slot="title">Please confirm</div>
        </ha-dialog-header>
        <div class="content">${this.body}</div>
        <mwc-button
          slot="primaryAction"
          @click="${() => {
            this.primaryAction();
            this.open = false;
          }}"
          >${this.primaryActionText}</mwc-button
        >
        <mwc-button
          slot="secondaryAction"
          @click="${() => {
            this.open = false;
          }}"
          >${this.secondaryActionText}</mwc-button
        >
      </ha-dialog>
    `;
  }
}
