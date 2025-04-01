import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import styles from "./card.styles";

import BUILD_PLATE_IMAGE from "~/images/bambu_smooth_plate.png";

@customElement("skip-objects")
export class SkipObjects extends LitElement {
  static styles = styles;
  @property({ type: String }) body!: string;
  @property() secondaryAction!: () => void;

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
        <div class="checkbox-list">Skip Objects Here</div>
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
