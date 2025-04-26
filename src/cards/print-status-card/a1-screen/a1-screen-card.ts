import * as helpers from "../../../utils/helpers";
import { customElement, property, state } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import styles from "./a1-screen-styles";
import { hassContext, entitiesContext } from "../../../utils/context";
import { consume } from "@lit/context";
import "~/cards/shared-components/confirmation-prompt/confirmation-prompt";
import "~/cards/shared-components/skip-objects";

type ConfirmationState = {
  show: boolean;
  action: "stop" | "pause" | "resume" | null;
  title: string;
  body: string;
};

enum MoveAxis {
  X,
  Y,
}

@customElement("a1-screen-card")
export class A1ScreenCard extends LitElement {
  @property() public coverImage;
  @property() public _device_id;
  @state() private processedImage: string | null = null;

  @consume({ context: hassContext, subscribe: true })
  @state()
  public _hass;

  @consume({ context: entitiesContext, subscribe: true })
  @state()
  public _deviceEntities;

  @state() private confirmation: ConfirmationState = {
    show: false,
    action: null,
    title: "",
    body: "",
  };

  @state() private showSkipObjects = false;

  @state() private showFirstPage = true;

  static styles = styles;

  async #processCoverImage() {
    if (!this.coverImage) return null;

    return new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        // Set initial canvas size to image dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Get the image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Find the boundaries of non-transparent pixels
        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = 0;
        let maxY = 0;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const alpha = data[(y * canvas.width + x) * 4 + 3];
            if (alpha > 0) {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }

        // Add a small padding
        const padding = 10;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(canvas.width, maxX + padding);
        maxY = Math.min(canvas.height, maxY + padding);

        // Calculate the original aspect ratio
        const originalAspectRatio = canvas.width / canvas.height;

        // Calculate the trimmed content dimensions
        const trimmedWidth = maxX - minX;
        const trimmedHeight = maxY - minY;

        // Create a new canvas that maintains the original aspect ratio
        const croppedCanvas = document.createElement("canvas");
        if (originalAspectRatio > 1) {
          // Original was wider than tall
          croppedCanvas.width = trimmedWidth;
          croppedCanvas.height = trimmedWidth / originalAspectRatio;
        } else {
          // Original was taller than wide
          croppedCanvas.width = trimmedHeight * originalAspectRatio;
          croppedCanvas.height = trimmedHeight;
        }

        // Draw the cropped image centered in the new canvas
        const croppedCtx = croppedCanvas.getContext("2d")!;
        const xOffset = (croppedCanvas.width - trimmedWidth) / 2;
        const yOffset = (croppedCanvas.height - trimmedHeight) / 2;

        croppedCtx.drawImage(
          canvas,
          minX,
          minY,
          trimmedWidth,
          trimmedHeight,
          xOffset,
          yOffset,
          trimmedWidth,
          trimmedHeight
        );

        resolve(croppedCanvas.toDataURL("image/png"));
      };

      img.onerror = () => {
        resolve(this.coverImage);
      };

      img.src = this.coverImage;
    });
  }

  async firstUpdated(changedProperties): Promise<void> {
    super.firstUpdated(changedProperties);
    this.observeCardHeight();
    this.processedImage = await this.#processCoverImage();
  }

  updated(changedProperties) {
    if (changedProperties.has("coverImage")) {
      this.#processCoverImage().then((processedImage) => {
        this.processedImage = processedImage;
      });
    }
  }

  observeCardHeight() {
    const card = this.shadowRoot!.querySelector("ha-card")!;
    const resizeObserver = new ResizeObserver(() => {
      this.updateCondensedMode(card);
    });
    resizeObserver.observe(card);
  }

  updateCondensedMode(card) {
    if (card.offsetWidth < 400) {
      card.classList.add("condensed-mode");
    } else {
      card.classList.remove("condensed-mode");
    }
  }

  #clickEntity(key: string) {
    helpers.showEntityMoreInfo(this, this._deviceEntities[key]);
  }

  #clickButton(key: string) {
    helpers.clickButton(this._hass, this._deviceEntities[key]);
  }

  #state(key: string) {
    return helpers.getEntityState(this._hass, this._deviceEntities[key]);
  }

  #formattedState(key: string) {
    return helpers.getFormattedEntityState(this._hass, this._deviceEntities[key].entity_id);
  }

  #attribute(key: string, attribute: string) {
    return helpers.getEntityAttribute(this._hass, this._deviceEntities[key].entity_id, attribute);
  }

  #calculateProgress() {
    if (this._hass.states[this._deviceEntities["stage"].entity_id].state != "printing") {
      return "0%";
    }
    const currentLayer = helpers.getEntityState(this._hass, this._deviceEntities["current_layer"]);
    const totalLayers = helpers.getEntityState(this._hass, this._deviceEntities["total_layers"]);
    const percentage = Math.round((currentLayer / totalLayers) * 100);
    return `${percentage}%`;
  }

  #getRemainingTime() {
    if (this._hass.states[this._deviceEntities["stage"].entity_id].state == "printing") {
      const minutes = Number(this.#state("remaining_time"));
      return `~ ${helpers.formatTimeRemaining(minutes)} remaining`;
    } else {
      return nothing;
    }
  }

  #isPauseResumeDisabled(): boolean {
    const pauseDisabled = helpers.isEntityUnavailable(this._hass, this._deviceEntities["pause"]);
    const resumeDisabled = helpers.isEntityUnavailable(this._hass, this._deviceEntities["resume"]);
    return pauseDisabled && resumeDisabled;
  }

  #getPauseResumeIcon(): string {
    const pauseDisabled = helpers.isEntityUnavailable(this._hass, this._deviceEntities["pause"]);
    if (pauseDisabled) {
      return "mdi:play";
    } else {
      return "mdi:pause";
    }
  }

  #isStopButtonDisabled() {
    return helpers.isEntityUnavailable(this._hass, this._deviceEntities["stop"]);
  }

  #getPrintStatusText() {
    if (this._hass.states[this._deviceEntities["stage"].entity_id].state == "printing") {
      const current_layer =
        this._hass.states[this._deviceEntities["current_layer"].entity_id].state;
      const total_layers = this._hass.states[this._deviceEntities["total_layers"].entity_id].state;
      return `${current_layer}/${total_layers}`;
    } else {
      return helpers.getLocalizedEntityState(this._hass, this._deviceEntities["stage"]);
    }
  }

  #showConfirmation(action: Exclude<ConfirmationState["action"], null>) {
    const confirmationConfig = {
      stop: {
        title: "Stop Print",
        body: "Are you sure you want to stop the current print?",
      },
      pause: {
        title: "Pause Print",
        body: "Are you sure you want to pause the current print?",
      },
      resume: {
        title: "Resume Print",
        body: "Are you sure you want to resume printing?",
      },
    };

    this.confirmation = {
      show: true,
      action,
      ...confirmationConfig[action],
    };
  }

  #handleConfirm() {
    switch (this.confirmation.action) {
      case "stop":
        this.#clickButton("stop");
        break;
      case "pause":
        this.#clickButton("pause");
        break;
      case "resume":
        this.#clickButton("resume");
        break;
    }
    this.#handleDismiss();
  }

  #handleDismiss() {
    this.confirmation = { ...this.confirmation, show: false, action: null, title: "", body: "" };
  }

  #showSkipObjects() {
    console.log("#showSkipObjects")
    // Toggle this because light dimiss breaks the popup by leaving this boolean set to true.
    this.showSkipObjects = !this.showSkipObjects;
  }

  #handleSkipObjectsDismiss() {
    this.showSkipObjects = false;
  }

  render() {
    return html`
      ${this.confirmation.show
        ? html`
            <confirmation-prompt
              .title=${this.confirmation.title}
              .body=${this.confirmation.body}
              .primaryActionText="Confirm"
              .secondaryActionText="Cancel"
              .dangerous=${this.confirmation.action === "stop"}
              .primaryAction=${this.#handleConfirm.bind(this)}
              .secondaryAction=${this.#handleDismiss.bind(this)}
            ></confirmation-prompt>
          `
        : nothing}
      ${this.showSkipObjects
        ? html`<skip-objects
            secondaryAction=${this.#handleSkipObjectsDismiss.bind(this)}
            _device_id=${this._device_id}
          ></skip-objects>`
        : nothing}
      <ha-card class="ha-bambulab-ssc">
        <div class="ha-bambulab-ssc-screen-container">
          ${this.showFirstPage ? this.#renderFrontPage() : this.#renderSecondPage()}
        </div>
      </ha-card>
    `;
  }

  #togglePage() {
    this.showFirstPage = !this.showFirstPage;
  }

  #renderFrontPage() {
    return html`
      <div class="ha-bambulab-ssc-status-and-controls">
        <div class="ha-bambulab-ssc-status-content">
          <div class="ha-bambulab-ssc-status-icon">
            <img src="${this.processedImage || this.coverImage}" alt="Cover Image" />
          </div>
          <div class="ha-bambulab-ssc-status-info">
            <div class="ha-bambulab-ssc-status-time">${this.#getRemainingTime()}</div>
            <div class="ha-bambulab-ssc-progress-container">
              <div class="ha-bambulab-ssc-progress-bar">
                <div
                  class="ha-bambulab-ssc-progress"
                  style="width: ${this.#calculateProgress()}"
                ></div>
              </div>
              <div class="ha-bambulab-ssc-progress-text">${this.#getPrintStatusText()}</div>
            </div>
          </div>
        </div>

        <div class="ha-bambulab-ssc-control-buttons">
          <button class="ha-bambulab-ssc-control-button"
            @click="${this.#togglePage}"
          >
            <ha-icon icon="mdi:dots-horizontal"></ha-icon>
          </button>
          <button
            class="ha-bambulab-ssc-control-button ${this.#state("chamber_light")}"
            @click="${() =>
              helpers.toggleLight(this._hass, this._deviceEntities["chamber_light"])}"
          >
            <ha-icon icon="mdi:lightbulb"></ha-icon>
          </button>
          <button
            class="ha-bambulab-ssc-control-button"
            ?disabled="${!helpers.isSkipButtonEnabled(this._hass, this._deviceEntities)}"
            @click="${() => this.#showSkipObjects()}"
          >
            <ha-icon icon="mdi:debug-step-over"></ha-icon>
          </button>
          <button
            class="ha-bambulab-ssc-control-button"
            ?disabled="${this.#isPauseResumeDisabled()}"
            @click="${() =>
              this.#showConfirmation(
                helpers.isEntityUnavailable(this._hass, this._deviceEntities["pause"])
                  ? "resume"
                  : "pause"
              )}"
          >
            <ha-icon icon="${this.#getPauseResumeIcon()}"></ha-icon>
          </button>
          <button
            class="ha-bambulab-ssc-control-button ${this.#isStopButtonDisabled()
              ? ""
              : "warning"}"
            ?disabled="${this.#isStopButtonDisabled()}"
            @click="${() => this.#showConfirmation("stop")}"
          >
            <ha-icon icon="mdi:stop"></ha-icon>
          </button>
        </div>
      </div>

      <div class="ha-bambulab-ssc-sensors">
        <div class="sensor" @click="${() => this.#clickEntity("target_nozzle_temperature")}">
          <span class="icon-and-target">
            <ha-icon icon="mdi:printer-3d-nozzle-heat-outline"></ha-icon>
            <span class="sensor-target-value">
              ${this.#formattedState("target_nozzle_temp")}</span
            >
          </span>
          <span class="sensor-value">${this.#formattedState("nozzle_temp")}</span>
        </div>
        <div class="sensor" @click="${() => this.#clickEntity("target_bed_temperature")}">
          <span class="icon-and-target">
            <ha-icon icon="mdi:radiator"></ha-icon>
            <span class="sensor-target-value">${this.#formattedState("target_bed_temp")}</span>
          </span>
          <span class="sensor-value">${this.#formattedState("bed_temp")}</span>
        </div>
        <div class="sensor" @click="${() => this.#clickEntity("printing_speed")}">
          <ha-icon icon="mdi:speedometer"></ha-icon>
          <span class="sensor-value">${this.#attribute("speed_profile", "modifier")}%</span>
        </div>
        <div class="sensor" @click="${() => this.#clickEntity("aux_fan")}">
          <ha-icon icon="mdi:fan"></ha-icon>
          <span class="sensor-value">${this.#attribute("aux_fan", "percentage")}%</span>
        </div>
      </div>
  `
  }

  #renderSecondPage() {
    return html`
      <div class="ha-bambulab-ssc-status-and-controls">
        <div class="ha-bambulab-ssc-status-content">
          <div class="circle-container">
            ${this.#renderMoveAxis()}
          </div>
        </div>

        <div class="ha-bambulab-ssc-control-buttons">
          <button class="ha-bambulab-ssc-control-button"
            @click="${this.#togglePage}"
          >
            <ha-icon icon="mdi:dots-horizontal"></ha-icon>
          </button>
          <button
            class="ha-bambulab-ssc-control-button"
          >
            <ha-icon icon="mdi:excavator"></ha-icon>
          </button>
        </div>
      </div>
  `
  }

  #MoveAxisClick(axis: MoveAxis, distance: Number) {
    const data = { device_id: [this._device_id], axis: '', distance: distance }
    if (axis == MoveAxis.X) {
      data.axis = 'X'
    } else if (axis == MoveAxis.Y) {
      data.axis = 'Y'
    }
    this._hass
    .callService("bambu_lab", "move_axis", data)
    .then(() => {
      console.log(`Service called successfully`);
    })
    .catch((error) => {
      console.error(`Error calling service:`, error);
    });
  }

  #renderMoveAxis() {
    return html`

<div class="move-axis-container">
  <svg viewBox="0 0 200 200" width="200" height="200">
    <g fill="none" stroke="black" stroke-width="1">
  
      <!-- Inner Slice Left -->
      <path class="inner-slice" d="
        M 100 125
        L 100 160
        A60 60 0 0 1 40 100
        L 75 100
        A25 25 0 0 0 100 125
        Z"
        transform="rotate(45, 100, 100)" 
        @click=${() => this.#MoveAxisClick(MoveAxis.X, -1)} />

      <!-- Outer Slice Left -->
      <path class="outer-slice" d="
        M 100 160
        L 100 190
        A90 90 0 0 1 10 100
        L 40 100
        A60 60 0 0 0 100 160
        Z"
        transform="rotate(45, 100, 100)" 
        @click=${() => this.#MoveAxisClick(MoveAxis.X, -10)} />

      <!-- Inner Slice Right -->
      <path class="inner-slice" d="
        M 100 75
        L 100 40
        A60 60 0 0 1 160 100
        L 125 100
        A25 25 0 0 0 100 75
        Z"
        transform="rotate(45, 100, 100)" 
        @click=${() => this.#MoveAxisClick(MoveAxis.X, 1)} />

      <!-- Outer Slice Right -->
      <path class="outer-slice" d="
        M 100 40
        L 100 10
        A90 90 0 0 1 190 100
        L 160 100
        A60 60 0 0 0 100 40
        Z"
        transform="rotate(45, 100, 100)" 
        @click=${() => this.#MoveAxisClick(MoveAxis.X, 10)} />

      <!-- Inner Slice Top -->
      <path class="inner-slice" d="
        M 75 100
        L 40 100
        A60 60 0 0 1 100 40
        L 100 75
        A25 25 0 0 0 75 100
        Z"
        transform="rotate(45, 100, 100)" 
        @click=${() => this.#MoveAxisClick(MoveAxis.Y, 1)} />

      <!-- Outer Slice Top -->
      <path class="outer-slice" d="
        M 40 100
        L 10 100
        A90 90 0 0 1 100 10
        L 100 40
        A60 60 0 0 0 40 100
        Z"
        transform="rotate(45, 100, 100)" 
        @click=${() => this.#MoveAxisClick(MoveAxis.Y, 10)} />
        
      <!-- Inner Slice Bottom -->
      <path class="inner-slice" d="
        M 125 100
        L 160 100
        A60 60 0 0 1 100 160
        L 100 125
        A25 25 0 0 0 125 100
        Z"
        transform="rotate(45, 100, 100)" 
        @click=${() => this.#MoveAxisClick(MoveAxis.Y, -1)} />

      <!-- Outer Slice Bottom -->
      <path class="outer-slice" d="
        M 160 100
        L 190 100
        A90 90 0 0 1 100 190
        L 100 160
        A60 60 0 0 0 160 100
        Z"
        transform="rotate(45, 100, 100)" 
        @click=${() => this.#MoveAxisClick(MoveAxis.Y, -10)} />

    </g>
  </svg>

  <div class="label" style="left: 60px; top: 100px;">
    <ha-icon icon="mdi:chevron-left"></ha-icon>
  </div>

  <div class="label" style="left: 25px; top: 100px;">
    <ha-icon icon="mdi:chevron-double-left"></ha-icon>
  </div>

  <div class="label" style="left: 140px; top: 100px;">
    <ha-icon icon="mdi:chevron-right"></ha-icon>
  </div>

  <div class="label" style="left: 175px; top: 100px;">
    <ha-icon icon="mdi:chevron-double-right"></ha-icon>
  </div>

  <div class="label" style="left: 100px; top: 60px;">
    <ha-icon icon="mdi:chevron-up"></ha-icon>
  </div>

  <div class="label" style="left: 100px; top: 25px;">
    <ha-icon icon="mdi:chevron-double-up"></ha-icon>
  </div>

  <div class="label" style="left: 100px; top: 140px;">
    <ha-icon icon="mdi:chevron-down"></ha-icon>
  </div>

  <div class="label" style="left: 100px; top: 175px;">
    <ha-icon icon="mdi:chevron-double-down"></ha-icon>
  </div>
</div>

`
  }

}
