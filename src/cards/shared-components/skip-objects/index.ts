import { html, LitElement, nothing } from "lit";
import { consume } from "@lit/context";
import { customElement, property, state } from "lit/decorators.js";
import styles from "./card.styles";
import * as helpers from "../../../utils/helpers";
import { css } from "lit";

import BUILD_PLATE_IMAGE from "~/images/build_plate.svg";
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
  @property({ type: String }) _device_id!: string;
  @property() secondaryAction!: () => void;
  @state() private printableObjects: Map<number, PrintableObject> = new Map();
  @state() private _visibleContext: CanvasRenderingContext2D | null = null;
  @state() private _pickImage: HTMLImageElement | null = null;
  @state() private _hiddenContext: CanvasRenderingContext2D | null = null;
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

    // Only handle updates for _hass and _deviceEntities
    if (changedProperties.has("_hass") || changedProperties.has("_deviceEntities")) {
      this.#populateCheckboxList();
    }
  }

  #handleContentReady() {
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
                      @mouseover="${() => this._onMouseOverCheckBox(key)}"
                      @mouseout="${() => this._onMouseOutCheckBox(key)}}"
                    >
                      <input
                        type="checkbox"
                        .checked="${item.to_skip}"
                        @change="${(e: Event) => this._toggleCheckbox(e, key)}"
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

  #handleCanvasClick(event: MouseEvent) {
    if (!this._hiddenContext) return;

    const canvas = event.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();

    // Get click coordinates relative to canvas
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Scale coordinates if canvas display size differs from internal size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get the pixel data at click location
    const pixel = this._hiddenContext.getImageData(x * scaleX, y * scaleY, 1, 1).data;
    const key = helpers.rgbaToInt(pixel[0], pixel[1], pixel[2], 0);

    if (key !== 0) {
      const object = this.printableObjects.get(key);
      if (object) {
        // Don't allow toggling already skipped objects
        if (!object.skipped) {
          object.to_skip = !object.to_skip;
          this._updateObject(key, object);
        }
      }
    }
  }

  #initializeCanvas() {
    if (!this._deviceEntities["ftp"]) {
      return;
    }

    const confirmationPrompt = this.shadowRoot!.querySelector("confirmation-prompt")!;
    const content = confirmationPrompt.shadowRoot!.querySelector(".content")!;
    const canvas = content.querySelector("#canvas") as HTMLCanvasElement;

    // Create hidden canvas for original image
    const hiddenCanvas = document.createElement("canvas");
    hiddenCanvas.width = 512;
    hiddenCanvas.height = 512;
    this._hiddenContext = hiddenCanvas.getContext("2d", { willReadFrequently: true });

    this._visibleContext = canvas.getContext("2d", { willReadFrequently: true });
    if (!this._visibleContext || !this._hiddenContext) return;

    // Add click and hover events to canvas
    canvas.addEventListener("click", this.#handleCanvasClick.bind(this));
    canvas.addEventListener("mousemove", this.#handleCanvasHover.bind(this));
    canvas.addEventListener("mouseout", () => {
      this._hoveredObject = 0;
      this.#colorizeCanvas();
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

  #handleCanvasHover(event: MouseEvent) {
    if (!this._hiddenContext) return;

    const canvas = event.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();

    // Get hover coordinates relative to canvas
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Scale coordinates if canvas display size differs from internal size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get the pixel data at hover location
    const pixel = this._hiddenContext.getImageData(x * scaleX, y * scaleY, 1, 1).data;
    const key = helpers.rgbaToInt(pixel[0], pixel[1], pixel[2], 0);

    if (this._hoveredObject !== key) {
      this._hoveredObject = key;
      this.#colorizeCanvas();
    }
  }

  #colorizeCanvas() {
    if (!this._visibleContext || !this._hiddenContext) {
      return;
    }

    const WIDTH = 512;
    const HEIGHT = 512;

    // Clear the visible canvas
    this._visibleContext.clearRect(0, 0, WIDTH, HEIGHT);

    // Get the original image data
    const imageData = this._hiddenContext.getImageData(0, 0, WIDTH, HEIGHT);
    const data = imageData.data;

    // Create output image data
    const outputData = this._visibleContext.createImageData(WIDTH, HEIGHT);
    const outData = outputData.data;

    // Process the image
    for (let i = 0; i < data.length; i += 4) {
      const key = helpers.rgbaToInt(data[i], data[i + 1], data[i + 2], 0);

      if (key !== 0) {
        const object = this.printableObjects.get(key);
        if (object) {
          if (object.to_skip) {
            // Red for skipped
            outData[i] = 255;
            outData[i + 1] = 0;
            outData[i + 2] = 0;
          } else {
            // Green for not skipped
            outData[i] = 0;
            outData[i + 1] = 255;
            outData[i + 2] = 0;
          }
          // Set alpha
          outData[i + 3] = 255;

          // Blue highlight for hovered object
          if (key === this._hoveredObject) {
            outData[i] = 0;
            outData[i + 1] = 0;
            outData[i + 2] = 255;
            outData[i + 3] = 255;
          }
        }
      }
    }

    // Put the image data back
    this._visibleContext.putImageData(outputData, 0, 0);
  }

  _onMouseOverCheckBox(key: number) {
    requestAnimationFrame(() => {
      if (this._hoveredObject !== key) {
        this._hoveredObject = key;
        this.#colorizeCanvas();
      }
    });
  }

  _onMouseOutCheckBox(key: number) {
    requestAnimationFrame(() => {
      if (this._hoveredObject === key) {
        this._hoveredObject = 0;
        this.#colorizeCanvas();
      }
    });
  }

  private _toggleCheckbox(e: Event, key: number) {
    const skippedBool = this.printableObjects.get(key)?.skipped;
    if (skippedBool) {
      // Force the checkbox to remain checked if the object has already been skipped.
      (e.target as HTMLInputElement).checked = true;
    } else {
      const value = this.printableObjects.get(key)!;
      value.to_skip = !value.to_skip;
      this._updateObject(key, value);
      this._hoveredObject = 0;
      requestAnimationFrame(() => {
        this.#colorizeCanvas();
      });
    }
  }

  private _updateObject(key: number, value: PrintableObject) {
    this.printableObjects.set(key, value);
    this.printableObjects = new Map(this.printableObjects); // Trigger Lit reactivity
  }

  private _callSkipObjectsService() {
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
        .primaryAction=${this._callSkipObjectsService.bind(this)}
        .secondaryAction=${this.secondaryAction}
        .styles=${styles}
        @content-ready=${this.#handleContentReady}
      ></confirmation-prompt>
    `;
  }
}
