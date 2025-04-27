import { html, LitElement, nothing } from "lit";
import { consume } from "@lit/context";
import { customElement, property, state } from "lit/decorators.js";
import styles from "./card.styles";
import * as helpers from "../../../utils/helpers";
import { css } from "lit";

import BUILD_PLATE_IMAGE from "~/images/build_plate.svg";
import { entitiesContext, hassContext } from "../../../utils/context";

interface PrintableObject {
  name: string;
  skipped: boolean;
  to_skip: boolean;
}

@customElement("skip-objects")
export class SkipObjects extends LitElement {
  static styles = styles;

  @property({ type: String }) body!: string;
  @property({ type: String }) _device_id!: string;
  @property() secondaryAction!: () => void;
  @property() onClose!: () => void;
  @state() private printableObjects: Map<number, PrintableObject> = new Map();
  @state() private pickImage: HTMLImageElement | null = null;
  @state() private hoveredObject: number = 0;

  @consume({ context: hassContext, subscribe: true })
  @state()
  public _hass;

  @consume({ context: entitiesContext, subscribe: true })
  @state()
  public _deviceEntities;

  #visibleContext: CanvasRenderingContext2D | null = null;
  #hiddenContext: CanvasRenderingContext2D | null = null;

  // Home assistant state references that are only used in changedProperties
  #pickImageState: any;
  #skippedObjectsState: any;
  
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this.#populateCheckboxList();
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (this._deviceEntities["ftp"]) {
      if (changedProperties.has("_hass")) {
        let newState = this._hass.states[this._deviceEntities["pick_image"].entity_id].state;
        if (newState !== this.#pickImageState) {
          this.#pickImageState = newState;
          this.#initializeCanvas();
          this.#populateCheckboxList();
        }

        newState = this._hass.states[this._deviceEntities["skipped_objects"].entity_id].state;
        if (newState !== this.#skippedObjectsState) {
          this.#skippedObjectsState = newState;
          this.#initializeCanvas();
          this.#populateCheckboxList();
        }
      }

      if (changedProperties.has("hoveredObject") || changedProperties.has("printableObjects")) {
        this.#colorizeCanvas();
      }      
    }
  }

  #handleContentReady() {
    this.#initializeCanvas();
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
                    <label
                      @mouseover="${() => this.#onMouseOverCheckBox(key)}"
                      @mouseout="${() => this.#onMouseOutCheckBox(key)}}"
                    >
                      <input
                        type="checkbox"
                        .checked="${item.to_skip}"
                        @change="${(e: Event) => this.#toggleCheckbox(e, key)}"
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

  #handleCanvasClick(event) {
    if (!this.#hiddenContext) return;

    const canvas = event.target as HTMLCanvasElement;

    // The intrinsic width and height of the canvas (512x512)
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    // The CSS width and height of the canvas (which might be different)
    const canvasStyleWidth = canvas.offsetWidth;
    const canvasStyleHeight = canvas.offsetHeight;
    // Calculate the scaling factors
    const scaleX = canvasStyleWidth / canvasWidth;
    const scaleY = canvasStyleHeight / canvasHeight;

    const rect = event.target.getBoundingClientRect();
    // Get x & y in scaled coordinates.
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    // Upscale to native canvas size.
    x = x / scaleX;
    y = y / scaleY;

    const imageData = this.#hiddenContext?.getImageData(x, y, 1, 1).data!;
    const [r, g, b, a] = imageData;

    const key = helpers.rgbaToInt(r, g, b, 0); // For integer comparisons we set the alpha to 0.
    if (key != 0) {
      if (!this.printableObjects.get(key)!.skipped) {
        let value = this.printableObjects.get(key)!;
        value.to_skip = !value.to_skip;
        this.#updateObject(key, value);
      }
    }
  }

  #initializeCanvas() {
    if (!this._deviceEntities["ftp"]) {
      return;
    }

    const confirmationPrompt = this.shadowRoot?.querySelector("confirmation-prompt");
    if (!confirmationPrompt) {
      return;
    }
    const content = confirmationPrompt.shadowRoot?.querySelector(".content");
    if (!content) {
      return;
    }
    const canvas = content.querySelector("#canvas") as HTMLCanvasElement;
    if (!canvas) {
      return;
    }

    if (this.#visibleContext == null) {
      // Find the visible canvas and set up click listener
      this.#visibleContext = canvas.getContext("2d", { willReadFrequently: true })!;
      // Add the click event listener to it that looks up the clicked pixel color and toggles any found object on or off.
      canvas.addEventListener("click", this.#handleCanvasClick.bind(this));
      canvas.addEventListener("mousemove", this.#handleCanvasHover.bind(this));
      canvas.addEventListener("mouseout", () => { this.hoveredObject = 0; });

      // Create hidden canvas for original image
      const hiddenCanvas = document.createElement("canvas");
      hiddenCanvas.width = 512;
      hiddenCanvas.height = 512;
      this.#hiddenContext = hiddenCanvas.getContext("2d", { willReadFrequently: true });
    }

    // Now create the image to load the pick image into from home assistant.
    this.pickImage = new Image();
    this.pickImage.onload = () => {
      // The image has transparency so we need to wipe the background first or old images can be combined
      this.#hiddenContext!.clearRect(0, 0, canvas.width, canvas.height);
      this.#hiddenContext!.drawImage(this.pickImage!, 0, 0);
      this.#colorizeCanvas();
    };

    // Finally set the home assistant image URL into it to load the image.
    this.pickImage.src =
      this._hass.states[this._deviceEntities["pick_image"].entity_id].attributes.entity_picture;
  }

  #handleCanvasHover(event: MouseEvent) {
    if (!this.#hiddenContext) return;

    const canvas = event.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();

    // Get hover coordinates relative to canvas
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Scale coordinates if canvas display size differs from internal size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get the pixel data at hover location
    const pixel = this.#hiddenContext.getImageData(x * scaleX, y * scaleY, 1, 1).data;
    const key = helpers.rgbaToInt(pixel[0], pixel[1], pixel[2], 0);

    if (this.hoveredObject !== key) {
      this.hoveredObject = key;
    }
  }

  #colorizeCanvas() {
    if (!this.#visibleContext || !this.#hiddenContext) {
      // Lit reactivity can come through here before we're fully initialized.
      return;
    }

    // Now we colorize the image based on the list of skipped objects.
    const WIDTH = 512;
    const HEIGHT = 512;

    // Read original pick image into a data buffer so we can read the pixels.
    const readImageData = this.#hiddenContext!.getImageData(0, 0, WIDTH, HEIGHT);
    const readData = readImageData.data;

    // Overwrite the display image with the starting pick image
    this.#visibleContext.putImageData(readImageData, 0, 0);

    // Read the data into a buffer that we'll write to to modify the pixel colors.
    const writeImageData = this.#visibleContext!.getImageData(0, 0, WIDTH, HEIGHT);
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

          if (key == this.hoveredObject) {
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
              if (right != this.hoveredObject) {
                writeDataView.setUint32(i, blue, true);
              }
            }
            // And the next pixel out too for a 2 pixel border.
            if (x < WIDTH - 2) {
              const j = i + 4 * 2;
              const right = helpers.rgbaToInt(readData[j], readData[j + 1], readData[j + 2], 0);
              if (right != this.hoveredObject) {
                writeDataView.setUint32(i, blue, true);
              }
            }

            // Check to see if pixel above was the hovered object to draw bottom border.
            if (y < HEIGHT - 1) {
              const j = i + WIDTH * 4;
              const below = helpers.rgbaToInt(readData[j], readData[j + 1], readData[j + 2], 0);
              if (below != this.hoveredObject) {
                writeDataView.setUint32(i, blue, true);
              }
            }
            // And the next pixel out too for a 2 pixel border.
            if (y < HEIGHT - 2) {
              const j = i + WIDTH * 4 * 2;
              const below = helpers.rgbaToInt(readData[j], readData[j + 1], readData[j + 2], 0);
              if (below != this.hoveredObject) {
                writeDataView.setUint32(i, blue, true);
              }
            }
          }
        }
      }
    }

    // Put the modified image data back into the canvas
    this.#visibleContext.putImageData(writeImageData, 0, 0);
  }

  #onMouseOverCheckBox(key: number) {
    requestAnimationFrame(() => {
      if (this.hoveredObject !== key) {
        this.hoveredObject = key;
      }
    });
  }

  #onMouseOutCheckBox(key: number) {
    requestAnimationFrame(() => {
      if (this.hoveredObject === key) {
        this.hoveredObject = 0;
      }
    });
  }

  #toggleCheckbox(e: Event, key: number) {
    const skippedBool = this.printableObjects.get(key)?.skipped;
    if (skippedBool) {
      // Force the checkbox to remain checked if the object has already been skipped.
      (e.target as HTMLInputElement).checked = true;
    } else {
      let value = this.printableObjects.get(key)!;
      value.to_skip = !value.to_skip;
      this.#updateObject(key, value);
      this.hoveredObject = 0;
    }
  }

  #updateObject(key: number, value: PrintableObject) {
    this.printableObjects.set(key, value);
    this.printableObjects = new Map(this.printableObjects); // Trigger Lit reactivity
  }

  #callSkipObjectsService() {
    const list = Array.from(this.printableObjects.keys())
      .filter((key) => this.printableObjects.get(key)!.to_skip)
      .map((key) => key)
      .join(",");
    const data = { device_id: [this._device_id], objects: list };
    this._hass
      .callService("bambu_lab", "skip_objects", data)
      .then(() => {
        console.log(`Service called successfully`);
      })
      .catch((error) => {
        console.error(`Error calling service:`, error);
      });
  }

  render() {
    return html`
      <confirmation-prompt
        title="Skip Objects"
        .body=${this.#body()}
        primaryActionText="Skip"
        secondaryActionText="Cancel"
        .primaryAction=${this.#callSkipObjectsService.bind(this)}
        .secondaryAction=${this.secondaryAction}
        .onClose=${this.onClose}
        .styles=${styles}
        @content-ready=${this.#handleContentReady}
      ></confirmation-prompt>
    `;
  }
}
