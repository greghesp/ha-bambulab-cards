import * as helpers from "../../utils/helpers";

import { state } from "lit/decorators.js";
import { customElement } from "../../utils/custom-element";
import { html, nothing } from "lit";
import { provide } from "@lit/context";
import styles from "./card.styles";

import {
  DEFAULT_ICON,
  DEFAULT_NAME,
  SKIP_OBJECTS_CARD_EDITOR_NAME,
  SKIP_OBJECTS_CARD_NAME,
} from "./const";
import { registerCustomCard } from "../../utils/custom-cards";
import { entitiesContext, hassContext } from "../../utils/context";
import EntityProvider from "../shared-components/entity-provider";
import "~/cards/shared-components/confirmation-prompt/confirmation-prompt";
import "~/cards/shared-components/skip-objects";

registerCustomCard({
  type: SKIP_OBJECTS_CARD_NAME,
  name: "Bambu Lab Skip Objects Card",
  description: "A single button that opens the Skip Objects dialog for a Bambu Lab printer",
});

/**
 * A minimal button card that opens the shared Skip Objects dialog, so it can be
 * placed anywhere in a dashboard without the full Print Control Card.
 */
@customElement(SKIP_OBJECTS_CARD_NAME)
export class SkipObjectsCard extends EntityProvider {
  static styles = styles;

  @provide({ context: hassContext })
  @state()
  public _hass;

  @provide({ context: entitiesContext })
  @state()
  public _deviceEntities;

  @state() private _name: string = DEFAULT_NAME;
  @state() private _icon: string = DEFAULT_ICON;
  @state() private _showName: boolean = true;
  @state() private _dialogOpen: boolean = false;

  public static async getConfigElement() {
    await import("./skip-objects-card-editor");
    return document.createElement(SKIP_OBJECTS_CARD_EDITOR_NAME);
  }

  static getStubConfig() {
    return { printer: "MOCK" };
  }

  setConfig(config) {
    if (!config.printer) {
      throw new Error("You need to select a Printer");
    }

    this._device_id = config.printer;
    this._name = config.name || DEFAULT_NAME;
    this._icon = config.icon || DEFAULT_ICON;
    this._showName = config.show_name ?? true;
  }

  public getCardSize() {
    return this._showName ? 2 : 1;
  }

  public getGridOptions() {
    return {
      columns: 3,
      min_columns: 2,
      rows: this._showName ? 2 : 1,
      min_rows: 1,
    };
  }

  #isEnabled(): boolean {
    if (!this._hass || !this._deviceEntities) {
      return false;
    }
    if (helpers.isMqttEncryptionEnabled(this._hass, this._deviceEntities)) {
      return false;
    }
    return helpers.isSkipButtonEnabled(this._hass, this._deviceEntities);
  }

  #openDialog() {
    if (this.#isEnabled()) {
      this._dialogOpen = true;
    }
  }

  #closeDialog() {
    this._dialogOpen = false;
  }

  render() {
    const enabled = this.#isEnabled();
    const title = enabled ? this._name : `${this._name} (not available)`;

    return html`
      <ha-card>
        <button
          class="skip-button"
          ?disabled=${!enabled}
          title=${title}
          aria-label=${title}
          @click=${this.#openDialog}
        >
          <ha-icon .icon=${this._icon}></ha-icon>
          ${this._showName ? html`<span class="name">${this._name}</span>` : nothing}
        </button>
      </ha-card>
      ${this._dialogOpen
        ? html`<skip-objects
            ._device_id=${this._device_id}
            .secondaryAction=${this.#closeDialog.bind(this)}
            .onClose=${this.#closeDialog.bind(this)}
          ></skip-objects>`
        : nothing}
    `;
  }
}
