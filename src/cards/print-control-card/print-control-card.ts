import * as helpers from "../../utils/helpers"

import { customElement, state, property } from "lit/decorators.js";
import { html, LitElement, nothing, PropertyValues } from "lit";
import styles from "./card.styles";

import { INTEGRATION_DOMAIN, MANUFACTURER } from "../../const";
import { PRINTER_MODELS } from "./const";
import { registerCustomCard } from "../../utils/custom-cards";
import { PRINT_CONTROL_CARD_EDITOR_NAME, PRINT_CONTROL_CARD_NAME, PRINT_CONTROL_CARD_NAME_LEGACY } from "./const";

import BUILD_PLATE_IMAGE from "../../images/bambu_smooth_plate.png";

registerCustomCard({
  type: PRINT_CONTROL_CARD_NAME,
  name: "Bambu Lab Print Control Card",
  description: "Control card for Bambu Lab Printers",
});

const ENTITYLIST: string[] = [
  "pause",
  "pick_image",
  "printable_objects",
  "printing_speed",
  "resume",
  "skipped_objects",
  "Speed",
  "speed_profile",
  "stop",
];

interface PrintableObject {
  name: string;
  skipped: boolean;
  to_skip: boolean;
}

@customElement(PRINT_CONTROL_CARD_NAME)
export class PrintControlCard extends LitElement {

  static styles = styles;

  // private property
  _hass;

  @state() private _states;
  @state() private _device_id: any;
  @state() private _popupVisible: boolean = false;
  @state() private _objects = new Map<number, PrintableObject>();
  @state() private _hoveredObject: number = 0;
  @state() private _pickImage: any;
  @state() private _confirmationDialogVisible: boolean = false;
  @state() private _confirmationDialogBody: string = "";

  // Home assistant state references that are only used in changedProperties
  private _pickImageState: any;
  private _skippedObjectsState: any;

  private _entityList: { [key: string]: helpers.Entity };

  private _hiddenCanvas;
  private _hiddenContext;
  private _visibleContext;
  private _confirmationAction;


  constructor() {
    super()
    this._hiddenCanvas = document.createElement('canvas');
    this._hiddenCanvas.width = 512;
    this._hiddenCanvas.height = 512;
    this._hiddenContext = this._hiddenCanvas.getContext('2d', { willReadFrequently: true });
    this._hoveredObject = 0;
    this._entityList = {};
  }

  public static async getConfigElement() {
    await import("./print-control-card-editor");
    return document.createElement(PRINT_CONTROL_CARD_EDITOR_NAME);
  }

  static getStubConfig() {
    return {
      printer: "MOCK",
    };
  }

  setConfig(config) {
    this._device_id = config.printer;

    if (!config.printer) {
      throw new Error("You need to select a Printer");
    }

    if (this._hass) {
      this.hass = this._hass;
    }
  }

  set hass(hass) {
    const firstTime = hass && !this._hass;

    if (hass) {
      this._hass = hass;
      this._states = hass.states;

      if (this._device_id == 'MOCK') {
        Object.keys(this._hass.devices).forEach((key) => {
          const device = this._hass.devices[key];
          if (device.manufacturer == MANUFACTURER) {
            if (PRINTER_MODELS.includes(device.model)) {
              this._device_id = key;
            }
          }
        })
      }
    }

    if (firstTime) {
      this._entityList = helpers.getBambuDeviceEntities(hass, this._device_id, ENTITYLIST);
    }
  }

  private _handleCanvasClick(event) {
    const canvas = this.shadowRoot!.getElementById('canvas') as HTMLCanvasElement;
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
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    // Get x & y in scaled coordinates.
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    // Upscale to native canvas size.
    x = x / scaleX;
    y = y / scaleY;

    const imageData = this._hiddenContext.getImageData(x, y, 1, 1).data;
    const [r, g, b, a] = imageData;

    const key = helpers.rgbaToInt(r, g, b, 0); // For integer comparisons we set the alpha to 0.
    if (key != 0)
    {
      if (!this._objects.get(key)!.skipped) {
        const value = this._objects.get(key)!
        value.to_skip = !value.to_skip
        this._updateObject(key, value);
      }
    }
  }

  private _initializeCanvas() {
    const canvas = this.shadowRoot!.getElementById('canvas') as HTMLCanvasElement;

    if (this._visibleContext == null) {
      // Find the visible canvas and set up click listener
      this._visibleContext = canvas.getContext('2d', { willReadFrequently: true })!;
      // Add the click event listener to it that looks up the clicked pixel color and toggles any found object on or off.
      canvas.addEventListener('click', (event) => { this._handleCanvasClick(event); });
    }

    // Now create a the image to load the pick image into from home assistant.
    this._pickImage = new Image();
    this._pickImage.onload = () => {
      // The image has transparency so we need to wipe the background first or old images can be combined
      this._hiddenContext.clearRect(0, 0, canvas.width, canvas.height);
      this._hiddenContext.drawImage(this._pickImage, 0, 0)
      this._colorizeCanvas();
    }

    // Finally set the home assistant image URL into it to load the image.
    this._pickImage.src = this._hass.states[this._entityList['pick_image'].entity_id].attributes.entity_picture;
  }

  private _getSkippedObjects() {
    const entity = this._entityList['skipped_objects'];
    const value = this._states[entity.entity_id].attributes['objects'];
    return value
  }

  private _getPrintableObjects() {
    const entity = this._entityList['printable_objects'];
    const value = this._states[entity.entity_id].attributes['objects'];
    return value
  }

  private _isEntityUnavailable(entity: helpers.Entity): boolean {
    return this._states[entity?.entity_id]?.state == 'unavailable';
  }

  private _isEntityStateUnknown(entity: helpers.Entity): boolean {
    return this._states[entity?.entity_id]?.state == undefined;
  }

  private _clickButton(entity: helpers.Entity) {
    const data = {
      entity_id: entity.entity_id
    }
    this._hass.callService('button', 'press', data);
  }

  private _colorizeCanvas() {
    if (this._visibleContext == undefined) {
      // Lit reactivity can come through here before we're fully initialized.
      return
    }

    // Now we colorize the image based on the list of skipped objects.
    const WIDTH = 512;
    const HEIGHT = 512

    // Read original pick image into a data buffer so we can read the pixels.
    const readImageData = this._hiddenContext.getImageData(0, 0, WIDTH, HEIGHT);
    const readData = readImageData.data;

    // Overwrite the display image with the starting pick image
    this._visibleContext.putImageData(readImageData, 0, 0);

    // Read the data into a buffer that we'll write to to modify the pixel colors.
    const writeImageData = this._visibleContext.getImageData(0, 0, WIDTH, HEIGHT);
    const writeData = writeImageData.data;
    const writeDataView = new DataView(writeData.buffer);

    const red = helpers.rgbaToInt(255, 0, 0, 255);   // For writes we set alpha to 255 (fully opaque).
    const green = helpers.rgbaToInt(0, 255, 0, 255); // For writes we set alpha to 255 (fully opaque).
    const blue = helpers.rgbaToInt(0, 0, 255, 255);  // For writes we set alpha to 255 (fully opaque).

    let lastPixelWasHoveredObject = false
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const i = (y * 4 * HEIGHT) + x * 4;
        const key = helpers.rgbaToInt(readData[i], readData[i + 1], readData[i + 2], 0); // For integer comparisons we set the alpha to 0.

        // If the pixel is not clear we need to change it.
        if (key != 0) {
          // Color the object based on it's to_skip state.
          if (this._objects.get(key)?.to_skip) {
            writeDataView.setUint32(i, red, true);
          }
          else {
            writeDataView.setUint32(i, green, true);
          }

          if (key == this._hoveredObject) {
            // Check to see if we need to render the left border if the pixel to the left is not the hovered object.
            if (x > 0) {
              const j = i - 4
              const left = helpers.rgbaToInt(readData[j], readData[j+1], readData[j+2], 0);
              if (left != key)
              {
                writeDataView.setUint32(i, blue, true);
              }
            }
            // And the next pixel out too for a 2 pixel border.
            if (x > 1) {
              const j = i - 4 * 2
              const left = helpers.rgbaToInt(readData[j], readData[j+1], readData[j+2], 0);
              if (left != key)
              {
                writeDataView.setUint32(i, blue, true);
              }
            }

            // Check to see if we need to render the top border if the pixel above is not the hovered object.
            if (y > 0) {
              const j = i - WIDTH * 4
              const top = helpers.rgbaToInt(readData[j], readData[j+1], readData[j+2], 0);
              if (top != key)
              {
                writeDataView.setUint32(i, blue, true);
              }
            }
            // And the next pixel out too for a 2 pixel border.
            if (y > 1) {
              const j = i - WIDTH * 4 * 2
              const top = helpers.rgbaToInt(readData[j], readData[j+1], readData[j+2], 0);
              if (top != key)
              {
                writeDataView.setUint32(i, blue, true);
              }
            }

            // Check to see if pixel to the right is not the hovered object to draw right border.
            if (x < (WIDTH - 1)) {
              const j = i + 4
              const right = helpers.rgbaToInt(readData[j], readData[j+1], readData[j+2], 0);
              if (right != this._hoveredObject)
              {
                writeDataView.setUint32(i, blue, true);
              }
            }
            // And the next pixel out too for a 2 pixel border.
            if (x < (WIDTH - 2)) {
              const j = i + 4 * 2
              const right = helpers.rgbaToInt(readData[j], readData[j+1], readData[j+2], 0);
              if (right != this._hoveredObject)
              {
                writeDataView.setUint32(i, blue, true);
              }
            }

            // Check to see if pixel above was the hovered object to draw bottom border.
            if (y < (HEIGHT - 1)) {
              const j = i + WIDTH * 4
              const below = helpers.rgbaToInt(readData[j], readData[j+1], readData[j+2], 0);
              if (below != this._hoveredObject)
              {
                writeDataView.setUint32(i, blue, true);
              }
            }
            // And the next pixel out too for a 2 pixel border.
            if (y < (HEIGHT - 2)) {
              const j = i + WIDTH * 4 * 2
              const below = helpers.rgbaToInt(readData[j], readData[j+1], readData[j+2], 0);
              if (below != this._hoveredObject)
              {
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

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('_hoveredObject')) {
      this._colorizeCanvas();
    }
    else if (changedProperties.has('_objects')) {
      this._colorizeCanvas();
    }

    if (changedProperties.has("_states")) {
      let newState = this._hass.states[this._entityList['pick_image'].entity_id].state;
      if (newState !== this._pickImageState) {
        console.log("Pick image updated");
        this._pickImageState = newState;
        this._initializeCanvas();
        this._populateCheckboxList();
      }

      newState = this._hass.states[this._entityList['skipped_objects'].entity_id].state;
      if (newState !== this._skippedObjectsState) {
        console.log("Skipped objects list updated");
        this._skippedObjectsState = newState;
        this._initializeCanvas();
        this._populateCheckboxList();
      }
    }
  }

  private _showPauseDialog() {
    this._confirmationAction = () => { this._clickButton(this._entityList['pause']) }
    this._confirmationDialogBody = "Are you sure you want to pause the print. This may cause quality issues.";
    this._confirmationDialogVisible = true;
  }

  private _showStopDialog() {
    this._confirmationAction = () => { this._clickButton(this._entityList['stop']) };
    this._confirmationDialogBody = "Are you sure you want to stop the print. This cannot be reversed.";
    this._confirmationDialogVisible = true;
  }

  private _getSpeedProfile() {
    return helpers.getLocalizedEntityState(this._hass, this._entityList['speed_profile'])
  }

  private _showSkipButton() {
    const countOfPrintableObjects = Object.keys(this._getPrintableObjects()).length;
    if ((this._pickImageState == undefined) ||
        (countOfPrintableObjects < 2) ||
        (countOfPrintableObjects > 64))
    {
      return false;      
    }
    return true;
  }

  private _enableSkipButton() {
    if (this._isEntityUnavailable(this._entityList['stop']) ||
        this._isEntityStateUnknown(this._entityList['pick_image']))
    {
      return false;
    }
    return true;
  }

  render() {
    return html`
      <ha-card class="card">
        <div class="control-container">
          <div id="speed" @click="${() => helpers.showEntityMoreInfo(this, this._entityList['printing_speed'])}">
            <ha-icon icon="mdi:speedometer"></ha-icon>
            ${this._getSpeedProfile()}
          </div>
          <div class="buttons-container">
            <ha-button class="ha-button" @click="${this._showPopup}" ?disabled="${!this._enableSkipButton()}" style="display: ${this._showSkipButton() ? 'block' : 'none'};">
              <ha-icon icon="mdi:debug-step-over"></ha-icon>
            </ha-button>
            <ha-button class="ha-button" @click="${this._showPauseDialog}" ?disabled="${this._isEntityUnavailable(this._entityList['pause'])}">
              <ha-icon icon="mdi:pause"></ha-icon>
            </ha-button>
            <ha-button class="ha-button" @click="${() => { this._clickButton(this._entityList['resume']) }}" ?disabled="${this._isEntityUnavailable(this._entityList['resume'])}">
              <ha-icon icon="mdi:play"></ha-icon>
            </ha-button>
            <ha-button class="ha-button" @click="${this._showStopDialog}" ?disabled="${this._isEntityUnavailable(this._entityList['stop'])}">
              <ha-icon icon="mdi:stop"></ha-icon>
            </ha-button>
          </div>
        </div>
        ${this._confirmationDialogVisible ? html`
          <ha-dialog id="confirmation-popup" open="true" heading="title">
            <ha-dialog-header slot="heading">
              <div slot="title">Please confirm</div>
            </ha-dialog-header>
            <div class="content">
              ${this._confirmationDialogBody}
            </div>
            <mwc-button slot="primaryAction" @click="${() => { this._confirmationAction(); this._confirmationDialogVisible = false; }}">Confirm</mwc-button>
            <mwc-button slot="secondaryAction" @click="${() => { this._confirmationDialogVisible = false; }}">Cancel</mwc-button>
          </ha-dialog>
        ` : ``}
        <div class="popup-container" style="display: ${this._popupVisible ? 'block' : 'none'};">
          <div class="popup-background" @click="${this._cancelPopup}"></div>
          <div class="popup">
            <div class="popup-header">Skip Objects</div>
            <div class="popup-content">
              <p>Select the object(s) you want to skip printing by tapping them in the image or the list.</p>
              <div id="image-container">
                <img id="build-plate" src="${BUILD_PLATE_IMAGE}"/>
                <canvas id="canvas" width="512" height="512"></canvas>
              </div>
              <div class="checkbox-list">
                ${Array.from(this._objects.keys()).map((key) => {
                  const item = this._objects.get(key)!;
                  return html`
                <div class="checkbox-object">
                  <label @mouseover="${() => this._onMouseOverCheckBox(key)}" @mouseout="${() => this._onMouseOutCheckBox(key)}">
                    <input type="checkbox" .checked="${item.to_skip}" @change="${(e: Event) => this._toggleCheckbox(e, key)}" />
                    ${item.skipped ? item.name + " (already skipped)" : item.name}
                  </label>
                  <br />
                </div>
                    `;
                  })}
              </div>
              <div class="popup-button-container">
                <ha-button class="ha-button" @click="${this._cancelPopup}">
                  Cancel
                </ha-button>
                <ha-button class="ha-button" @click="${this._callSkipObjectsService}" ?disabled="${this._isSkipButtonDisabled}">
                  Skip
                </ha-button>
              </div>
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

  // Functions to toggle popup visibility
  private _showPopup() {
    this._popupVisible = true;
  }

  private _cancelPopup() {
    this._popupVisible = false;
    // Now reset all the to_skip to the existing skipped state.
    let objects = new Map<number, PrintableObject>();
    this._objects.forEach((value, key) => {
      value.to_skip = value.skipped;
      objects.set(key, value);
    });
    this._objects = objects;
  }

  // Method to check if the skip button should be disabled
  get _isSkipButtonDisabled() {
    for (const item of this._objects.values()) {
      if (item.to_skip && !item.skipped) {
        return false;  // Found an object that should allow skipping
      }
    }
    return true;  // No items meet the criteria
  }

  private _callSkipObjectsService() {
    const list = Array.from(this._objects.keys()).filter((key) => this._objects.get(key)!.to_skip).map((key) => key).join(',');
    const data = { "device_id": [this._device_id], "objects": list }
    this._hass.callService("bambu_lab", "skip_objects", data).then(() => {
      console.log(`Service called successfully`);
    }).catch((error) => {
      console.error(`Error calling service:`, error);
    });
  }

  private _updateObject(key: number, value: PrintableObject) {
    this._objects.set(key, value);
    this._objects = new Map(this._objects); // Trigger Lit reactivity
  }

  // Toggle the checked state of an item when a checkbox is clicked
  private _toggleCheckbox(e: Event, key: number) {
    const skippedBool = this._objects.get(key)?.skipped;
    if (skippedBool) {
      // Force the checkbox to remain checked if the object has already been skipped.
      (e.target as HTMLInputElement).checked = true
    }
    else {
      const value = this._objects.get(key)!
      value.to_skip = !value.to_skip
      this._updateObject(key, value);
      this._hoveredObject = 0;
    }
  }

  // Function to handle hover
  _onMouseOverCheckBox(key: number) {
    this._hoveredObject = key
  };

  // Function to handle mouse out
  _onMouseOutCheckBox(key: number) {
    if (this._hoveredObject == key) {
      this._hoveredObject = 0
    }
  };

  // Function to populate the list of checkboxes
  private _populateCheckboxList() {
    // Populate the viewmodel
    const list = this._getPrintableObjects();
    if (list == undefined) {
      return
    }
    const skipped = this._getSkippedObjects();

    let objects = new Map<number, PrintableObject>();
    Object.keys(list).forEach(key => {
      const value = list[key];
      const skippedBool = skipped.includes(Number(key));
      objects.set(Number(key), { name: value, skipped: skippedBool, to_skip: skippedBool });
    });
    this._objects = objects;
  }

  private async _getEntity(entity_id) {
    return await this._hass.callWS({
      type: "config/entity_registry/get",
      entity_id: entity_id,
    });
  }
}

@customElement(PRINT_CONTROL_CARD_NAME_LEGACY)
export class PrintControlCardLegacy extends PrintControlCard {
}
