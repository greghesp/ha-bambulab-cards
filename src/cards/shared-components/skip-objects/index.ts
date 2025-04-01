import { html, LitElement, nothing } from "lit";
import { consume } from "@lit/context";
import { customElement, property, state } from "lit/decorators.js";
import styles from "./card.styles";
import * as helpers from "../../../utils/helpers";

import BUILD_PLATE_IMAGE from "~/images/bambu_smooth_plate.png";
import { entitiesContext, hassContext } from "~/utils/context";

interface PrintableObject {
  name: string;
  skipped: boolean;
  to_skip: boolean;
}

@customElement("skip-objects")
export class SkipObjects extends LitElement {
  static styles = styles;

  @property({ type: String }) body!: string;
  @property() secondaryAction!: () => void;
  @state() private printableObjects: Map<number, PrintableObject> = new Map();

  @consume({ context: hassContext, subscribe: true })
  @state()
  public _hass;

  @consume({ context: entitiesContext, subscribe: true })
  @state()
  public _deviceEntities;

  connectedCallback() {
    super.connectedCallback();
    this.#populateCheckboxList();
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("_hass") || changedProperties.has("_deviceEntities")) {
      this.#populateCheckboxList();
    }
  }

  #populateCheckboxList() {
    if (!this._deviceEntities["ftp"]) {
      return;
    }

    // Populate the viewmodel
    const list = helpers.getEntityAttribute(
      this._hass,
      this._deviceEntities["printable_objects"].entity_id,
      "objects"
    );
    if (list == undefined) {
      return;
    }
    const skipped = helpers.getEntityAttribute(
      this._hass,
      this._deviceEntities["skipped_objects"].entity_id,
      "objects"
    );

    let objects = new Map<number, PrintableObject>();
    Object.keys(list).forEach((key) => {
      const value = list[key];
      const skippedBool = skipped.includes(Number(key));
      objects.set(Number(key), { name: value, skipped: skippedBool, to_skip: skippedBool });
    });
    this.printableObjects = objects;
  }

  #body() {
    return html`
      <div class="popup-content">
        <p>
          Select the object(s) you want to skip printing by tapping them in the image or the list.
        </p>
        <div id="image-container">
          <img id="build-plate" src="${BUILD_PLATE_IMAGE}" />
          <canvas id="canvas" width="512" height="512"></canvas>
        </div>
        <div class="checkbox-list">
          ${this.printableObjects.size > 0
            ? html` ${Array.from(this.printableObjects.keys()).map((key) => {
                const item = this.printableObjects.get(key)!;
                return html`
                  <div class="checkbox-object">
                    <label @mouseover="${() => {}}" @mouseout="${() => {}}}">
                      <input
                        type="checkbox"
                        .checked="${item.to_skip}"
                        @change="${(e: Event) => {}}"
                      />
                      ${item.skipped ? item.name + " (already skipped)" : item.name}
                    </label>
                    <br />
                  </div>
                `;
              })}`
            : nothing}
        </div>
      </div>
    `;
  }

  #handleConfirm() {
    console.log("Confirm Skip");
  }

  render() {
    return html`
      <confirmation-prompt
        .title="Skip Objects"
        .body=${this.#body()}
        .primaryActionText="Confirm Skip"
        .secondaryActionText="Cancel"
        .primaryAction=${this.#handleConfirm.bind(this)}
        .secondaryAction=${this.secondaryAction}
      ></confirmation-prompt>
    `;
  }
}
