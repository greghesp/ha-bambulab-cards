import { html, LitElement, nothing, PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { customElement } from "../../utils/custom-element";
import * as helpers from "../../utils/helpers";
import { registerCustomCard } from "../../utils/custom-cards";
import {
  ERROR_CARD_EDITOR_NAME,
  ERROR_CARD_NAME,
  HMS_ERRORS_KEY,
  PRINT_ERROR_KEY,
} from "./const";
import { collectErrors, PrinterError } from "./errors";
import { styles } from "./error-card.styles";

registerCustomCard({
  type: ERROR_CARD_NAME,
  name: "Bambu Lab Error Card",
  description: "Shows the printer's HMS and print errors with links to the Bambu Lab wiki",
});

interface ErrorCardConfig {
  printer?: string;
  title?: string;
  show_when_clear?: boolean;
  show_codes?: boolean;
}

@customElement(ERROR_CARD_NAME)
export class ErrorCard extends LitElement {
  static styles = styles;

  // Set by Home Assistant while the card is shown in the editor or the
  // dashboard is in edit mode, so a hidden card can still be found and edited.
  @property({ type: Boolean }) public preview = false;
  @property({ type: Boolean }) public editMode = false;

  @state() private _config: ErrorCardConfig = {};
  @state() private _errors: PrinterError[] = [];

  private _hass?;

  public static async getConfigElement() {
    await import("./error-card-editor");
    return document.createElement(ERROR_CARD_EDITOR_NAME);
  }

  public static getStubConfig() {
    return { show_when_clear: true, show_codes: true };
  }

  public setConfig(config: ErrorCardConfig) {
    this._config = { ...config };
    this._refreshErrors();
  }

  set hass(hass) {
    this._hass = hass;
    this._refreshErrors();
  }

  public getCardSize(): number {
    return Math.max(1, this._errors.length) + (this._config.title ? 1 : 0);
  }

  // Sections view: full width by default, height follows the content.
  public getGridOptions() {
    return { columns: 12, min_columns: 3, min_rows: 1 };
  }

  private get _isHidden(): boolean {
    const showWhenClear = this._config.show_when_clear !== false;
    return this._errors.length === 0 && !showWhenClear && !this.preview && !this.editMode;
  }

  private _refreshErrors() {
    if (!this._hass || !this._config.printer) {
      if (this._errors.length > 0) {
        this._errors = [];
      }
      return;
    }
    const entities = helpers.getBambuDeviceEntities(this._hass, this._config.printer, [
      HMS_ERRORS_KEY,
      PRINT_ERROR_KEY,
    ]);
    const stateOf = (key: string) => {
      const entityId = entities[key]?.entity_id;
      return entityId ? this._hass.states[entityId] : undefined;
    };
    const errors = collectErrors(stateOf(PRINT_ERROR_KEY), stateOf(HMS_ERRORS_KEY));
    // hass updates arrive constantly; only re-render when the errors change.
    if (JSON.stringify(errors) !== JSON.stringify(this._errors)) {
      this._errors = errors;
    }
  }

  protected updated(changed: PropertyValues) {
    super.updated(changed);
    const hidden = this._isHidden;
    if (this.hidden !== hidden) {
      this.hidden = hidden;
      // Lets Home Assistant drop the empty slot from the dashboard layout.
      this.dispatchEvent(
        new CustomEvent("card-visibility-changed", {
          detail: { value: !hidden },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  render() {
    if (this._isHidden) {
      return nothing;
    }
    return html`
      <ha-card .header=${this._config.title || undefined}>
        <div class="content">${this._renderBody()}</div>
      </ha-card>
    `;
  }

  private _renderBody() {
    if (!this._config.printer) {
      return html`<ha-alert alert-type="info">Select a printer in the card editor.</ha-alert>`;
    }
    if (this._errors.length === 0) {
      return html`<ha-alert alert-type="success">No errors detected</ha-alert>`;
    }
    return this._errors.map((error) => this._renderError(error));
  }

  private _renderError(error: PrinterError) {
    const showCode = this._config.show_codes !== false && Boolean(error.code);
    return html`
      <ha-alert alert-type=${error.alertType}>
        <div class="message">${error.message}</div>
        ${showCode || error.wikiUrl
          ? html`<div class="meta">
              ${showCode ? html`<span class="code">${error.code}</span>` : nothing}
              ${error.wikiUrl
                ? html`<a href=${error.wikiUrl} target="_blank" rel="noopener noreferrer"
                    >View on Bambu Lab wiki</a
                  >`
                : nothing}
            </div>`
          : nothing}
      </ha-alert>
    `;
  }
}
