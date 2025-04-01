import { html, LitElement, nothing, TemplateResult, css, CSSResult } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("confirmation-prompt")
export class ConfirmationPrompt extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @property({ type: Object }) body!: TemplateResult;
  @property({ type: Object }) styles?: CSSResult;
  @property({ type: String, attribute: true }) title: string = "Please Confirm";
  @property({ type: String, attribute: true }) primaryActionText: string = "Confirm";
  @property({ type: String, attribute: true }) secondaryActionText: string = "Cancel";

  @property() primaryAction!: () => void;
  @property() secondaryAction!: () => void;

  protected createRenderRoot(): ShadowRoot {
    const root = super.createRenderRoot() as ShadowRoot;
    if (this.styles) {
      const styleSheet = new CSSStyleSheet();
      styleSheet.replaceSync(this.styles.cssText);
      root.adoptedStyleSheets = [styleSheet];
    }
    return root;
  }

  protected updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("styles") && this.styles && this.shadowRoot) {
      const styleSheet = new CSSStyleSheet();
      styleSheet.replaceSync(this.styles.cssText);
      this.shadowRoot.adoptedStyleSheets = [styleSheet];
    }
  }

  render() {
    return html`
      <ha-dialog id="confirmation-popup" open="true" .heading=${this.title}>
        <ha-dialog-header slot="heading">
          <div slot="title">${this.title}</div>
        </ha-dialog-header>
        <div class="content">${this.body}</div>
        <mwc-button slot="primaryAction" @click=${this.primaryAction}
          >${this.primaryActionText}</mwc-button
        >
        <mwc-button slot="secondaryAction" @click=${this.secondaryAction}
          >${this.secondaryActionText}</mwc-button
        >
      </ha-dialog>
    `;
  }
}
