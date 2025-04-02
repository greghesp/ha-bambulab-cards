import { html, LitElement, nothing } from "lit";
import { consume } from "@lit/context";
import { customElement, property, state } from "lit/decorators.js";
import styles from "./card.styles";
import * as helpers from "../../../utils/helpers";
import { css } from "lit";

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
  @state() private _visibleContext: CanvasRenderingContext2D | null = null;
  @state() private _pickImage: HTMLImageElement | null = null;
  @state() private _hiddenContext: CanvasRenderingContext2D | null = null;
  @state() private _pickImageState: any;
  @state() private _skippedObjectsState: any;
  @state() private _hoveredObject: number = 0;

  @consume({ context: hassContext, subscribe: true })
  @state()
  public _hass;

  @consume({ context: entitiesContext, subscribe: true })
  @state()
  public _deviceEntities;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this.#populateCheckboxList();
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("_hass") || changedProperties.has("_deviceEntities")) {
      this.#populateCheckboxList();
    }

    // Give the shadow DOM time to construct
    setTimeout(() => {
      const confirmationPrompt = this.shadowRoot?.querySelector("confirmation-prompt");
      if (confirmationPrompt) {
        const content = confirmationPrompt.shadowRoot?.querySelector(".content");
        if (content) {
          const canvas = content.querySelector("#canvas");
          if (canvas && (!this._visibleContext || !this._hiddenContext)) {
            this.#initializeCanvas();
          }
        }
      }
    }, 100);
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

  #handleCanvasClick() {
    console.log("Canvas Clicked");
  }

  #initializeCanvas() {
    if (!this._deviceEntities["ftp"]) {
      return;
    }

    console.log("Initializing Canvas");
    const confirmationPrompt = this.shadowRoot?.querySelector("confirmation-prompt");
    if (!confirmationPrompt) return;

    const content = confirmationPrompt.shadowRoot?.querySelector(".content");
    if (!content) return;

    const canvas = content.querySelector("#canvas") as HTMLCanvasElement;
    if (!canvas) return;

    console.log("Canvas found", canvas);

    // Create hidden canvas for original image
    const hiddenCanvas = document.createElement("canvas");
    hiddenCanvas.width = 512;
    hiddenCanvas.height = 512;
    this._hiddenContext = hiddenCanvas.getContext("2d", { willReadFrequently: true });

    this._visibleContext = canvas.getContext("2d", { willReadFrequently: true });
    if (!this._visibleContext || !this._hiddenContext) return;

    canvas.addEventListener("click", (event) => {
      this.#handleCanvasClick();
    });

    // Now create the image to load the pick image into from home assistant.
    this._pickImage = new Image();
    this._pickImage.onload = () => {
      if (!this._hiddenContext || !this._pickImage) return;
      this._hiddenContext.clearRect(0, 0, canvas.width, canvas.height);
      this._hiddenContext.drawImage(this._pickImage, 0, 0);
      this.#colorizeCanvas();
    };

    this._pickImage.src =
      this._hass.states[this._deviceEntities["pick_image"].entity_id].attributes.entity_picture;
  }

  #colorizeCanvas() {
    if (this._visibleContext == undefined) {
      // Lit reactivity can come through here before we're fully initialized.
      return;
    }

    // Now we colorize the image based on the list of skipped objects.
    const WIDTH = 512;
    const HEIGHT = 512;

    // Read original pick image into a data buffer so we can read the pixels.
    const readImageData = this._hiddenContext!.getImageData(0, 0, WIDTH, HEIGHT);
    const readData = readImageData.data;

    // Overwrite the display image with the starting pick image
    this._visibleContext.putImageData(readImageData, 0, 0);

    // Read the data into a buffer that we'll write to to modify the pixel colors.
    const writeImageData = this._visibleContext!.getImageData(0, 0, WIDTH, HEIGHT);
    const writeData = writeImageData.data;
    const writeDataView = new DataView(writeData.buffer);

    const red = helpers.rgbaToInt(255, 0, 0, 255); // For writes we set alpha to 255 (fully opaque).
    const green = helpers.rgbaToInt(0, 255, 0, 255); // For writes we set alpha to 255 (fully opaque).
    const blue = helpers.rgbaToInt(0, 0, 255, 255); // For writes we set alpha to 255 (fully opaque).

    let lastPixelWasHoveredObject = false;
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const i = y * 4 * HEIGHT + x * 4;
        const key = helpers.rgbaToInt(readData[i], readData[i + 1], readData[i + 2], 0); // For integer comparisons we set the alpha to 0.

        // If the pixel is not clear we need to change it.
        if (key != 0) {
          // Color the object based on it's to_skip state.
          if (this.printableObjects.get(key)?.to_skip) {
            writeDataView.setUint32(i, red, true);
          } else {
            writeDataView.setUint32(i, green, true);
          }

          if (key == this._hoveredObject) {
            // Check to see if we need to render the left border if the pixel to the left is not the hovered object.
            if (x > 0) {
              const j = i - 4;
              const left = helpers.rgbaToInt(readData[j], readData[j + 1], readData[j + 2], 0);
              if (left != key) {
                writeDataView.setUint32(i, blue, true);
              }
            }
            // And the next pixel out too for a 2 pixel border.
            if (x > 1) {
              const j = i - 4 * 2;
              const left = helpers.rgbaToInt(readData[j], readData[j + 1], readData[j + 2], 0);
              if (left != key) {
                writeDataView.setUint32(i, blue, true);
              }
            }

            // Check to see if we need to render the top border if the pixel above is not the hovered object.
            if (y > 0) {
              const j = i - WIDTH * 4;
              const top = helpers.rgbaToInt(readData[j], readData[j + 1], readData[j + 2], 0);
              if (top != key) {
                writeDataView.setUint32(i, blue, true);
              }
            }
            // And the next pixel out too for a 2 pixel border.
            if (y > 1) {
              const j = i - WIDTH * 4 * 2;
              const top = helpers.rgbaToInt(readData[j], readData[j + 1], readData[j + 2], 0);
              if (top != key) {
                writeDataView.setUint32(i, blue, true);
              }
            }

            // Check to see if pixel to the right is not the hovered object to draw right border.
            if (x < WIDTH - 1) {
              const j = i + 4;
              const right = helpers.rgbaToInt(readData[j], readData[j + 1], readData[j + 2], 0);
              if (right != this._hoveredObject) {
                writeDataView.setUint32(i, blue, true);
              }
            }
            // And the next pixel out too for a 2 pixel border.
            if (x < WIDTH - 2) {
              const j = i + 4 * 2;
              const right = helpers.rgbaToInt(readData[j], readData[j + 1], readData[j + 2], 0);
              if (right != this._hoveredObject) {
                writeDataView.setUint32(i, blue, true);
              }
            }

            // Check to see if pixel above was the hovered object to draw bottom border.
            if (y < HEIGHT - 1) {
              const j = i + WIDTH * 4;
              const below = helpers.rgbaToInt(readData[j], readData[j + 1], readData[j + 2], 0);
              if (below != this._hoveredObject) {
                writeDataView.setUint32(i, blue, true);
              }
            }
            // And the next pixel out too for a 2 pixel border.
            if (y < HEIGHT - 2) {
              const j = i + WIDTH * 4 * 2;
              const below = helpers.rgbaToInt(readData[j], readData[j + 1], readData[j + 2], 0);
              if (below != this._hoveredObject) {
                writeDataView.setUint32(i, blue, true);
              }
            }
          }
        }
      }
    }

    // Put the modified image data back into the canvas
    this._visibleContext.putImageData(writeImageData, 0, 0);
  }

  render() {
    return html`
      <confirmation-prompt
        title="Skip Objects"
        .body=${this.#body()}
        primaryActionText="Skip"
        secondaryActionText="Cancel"
        .primaryAction=${this.#handleConfirm.bind(this)}
        .secondaryAction=${this.secondaryAction}
        .styles=${styles}
      ></confirmation-prompt>
    `;
  }
}
