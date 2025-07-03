import * as helpers from "../../../utils/helpers";
import { customElement, property, state } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import styles from "./a1-screen-styles";
import { hassContext, entitiesContext } from "../../../utils/context";
import { consume } from "@lit/context";
import "~/cards/shared-components/confirmation-prompt/confirmation-prompt";
import "~/cards/shared-components/skip-objects";
import "~/cards/ams-card/vector-ams-card/vector-ams-card";

type ConfirmationState = {
  show: boolean;
  action: "stop" | "pause" | "resume" | "home" | null;
  title: string;
  body: string;
};

enum MoveAxis {
  X,
  Y,
  Z,
  HOME
}

enum Extruder {
  Retract,
  Extrude
}

enum Page {
  Main,
  Controls,
  Ams,
}

interface AMS {
  device_id: string;
  active: boolean;
  spools: string[];
}

@customElement("a1-screen-card")
export class A1ScreenCard extends LitElement {
  @property() public coverImage;
  @property() public _device_id;
  @state() private processedImage: string | null = null;
  @state() private showExtraControls = false;
  @state() private showVideoFeed = false;
  @state() private videoMaximized = false;
  
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

  @state() private page = Page.Main;

  @state() private _amsList: AMS[] = [];
  @state() private _selectedAmsIndex: number = 0;

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

        // Calculate the trimmed content dimensions
        const trimmedWidth = maxX - minX;
        const trimmedHeight = maxY - minY;

        // Create new canvas matching the cropped image size.
        const croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = trimmedWidth;
        croppedCanvas.height = trimmedHeight;

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

    this.#getAMSList();
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

  #clickEntity(key: string, force: boolean = false) {
    if (!force && this.#isBambuBlockingWrites()) return;
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

  #formattedTemperatureState(key: string) {
    return html`${Math.floor(this.#state(key))}&degC`;
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
      return `${this.#formattedState('remaining_time')} remaining`;
    } else {
      return nothing;
    }
  }

  #isPauseResumeDisabled(): boolean {
    const pauseDisabled = helpers.isEntityUnavailable(this._hass, this._deviceEntities["pause"]);
    const resumeDisabled = helpers.isEntityUnavailable(this._hass, this._deviceEntities["resume"]);
    return this.#isBambuBlockingWrites() || (pauseDisabled && resumeDisabled);
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
    return this.#isBambuBlockingWrites() || helpers.isEntityUnavailable(this._hass, this._deviceEntities["stop"]);
  }

  #isSkipObjectsButtonDisabled() {
    return this.#isBambuBlockingWrites() ||
           this.#isStopButtonDisabled() ||
           helpers.isEntityUnavailable(this._hass, this._deviceEntities["printable_objects"]) ||
           this._hass.states[this._deviceEntities.printable_objects.entity_id].state <= 1;
  }

  #isControlsPageDisabled() {
    return this.#isBambuBlockingWrites();
  }
  
  #isBambuBlockingWrites() {
    return this._hass.states[this._deviceEntities.mqtt_encryption.entity_id].state == "on" &&
           this._hass.states[this._deviceEntities.developer_lan_mode.entity_id].state == "off";
  }

  #getPrintStatusText() {
    if (this._hass.states[this._deviceEntities["print_status"].entity_id].state == "running") {
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
      home: {
        title: "Home Printer",
        body: "This will bring the heat bed to the nozzle. If there is a model on the heat bed it will collide possibly resulting in damage to the model or the printer.",
      }
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
      case "home":
        this.#moveAxis(MoveAxis.HOME, 0);
        break;
    }
    this.#handleDismiss();
  }

  #handleDismiss() {
    this.confirmation = { ...this.confirmation, show: false, action: null, title: "", body: "" };
  }

  #showSkipObjects() {
    this.showSkipObjects = true;
  }

  #handleSkipObjectsDismiss() {
    this.showSkipObjects = false;
  }

  #toggleExtraControls() {
    this.showExtraControls = !this.showExtraControls;
  }

  #toggleVideoFeed() {
    this.showVideoFeed = !this.showVideoFeed;
  }

  #toggleVideoMaximized() {
    this.videoMaximized = !this.videoMaximized;
  }

  #openDevicePage() {
    if (!this._device_id) return;
    const url = `/config/devices/device/${this._device_id}`;
    window.location.href = url;
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
              .onClose=${this.#handleDismiss.bind(this)}
            ></confirmation-prompt>
          `
        : nothing}
      ${this.showSkipObjects
        ? html`<skip-objects
            secondaryAction=${this.#handleSkipObjectsDismiss.bind(this)}
            onClose=${this.#handleSkipObjectsDismiss.bind(this)}
            _device_id=${this._device_id}
          ></skip-objects>`
        : nothing}
      <ha-card class="ha-bambulab-ssc"> 
        <div class="ha-bambulab-ssc-screen-container">
          ${this.page === Page.Main ? this.#renderFrontPage() :
            this.page === Page.Controls ? this.#renderControlsPage() :
            this.page === Page.Ams ? this.#renderAmsPage() : ''}
        </div>
      </ha-card>
    `;
  }

  #showMainPage() {
    this.page = Page.Main;
    
    // Reset selected AMS to the active one, or default to first if none are active
    const activeIndex = this._amsList.findIndex(ams => ams.active);
    this._selectedAmsIndex = activeIndex >= 0 ? activeIndex : 0;
  }

  #showControlsPage() {
    this.page = Page.Controls
  }

  #showAmsPage() {
    this.page = Page.Ams
  }

  #renderFrontPage() {

    let videoHtml: any = nothing
    if (this._deviceEntities['camera'] && !helpers.isEntityUnavailable(this._hass, this._deviceEntities['camera'])) {
      videoHtml = html`
        <ha-camera-stream
          .hass=${this._hass}
          .stateObj=${this._hass.states[this._deviceEntities['camera'].entity_id]}>
        </ha-camera-stream>
      `
    } else {
      videoHtml = html`
        <img src="${helpers.getImageUrl(this._hass, this._deviceEntities['p1p_camera'])}"/>
      `
    }
    
    return html`
      <div class="ha-bambulab-ssc-status-and-controls${this.videoMaximized ? ' video-maximized' : ''}">
        ${this.videoMaximized
          ? html`
              <div class="video-maximized-container">
                ${videoHtml}
                <button class="video-maximize-btn" @click="${this.#toggleVideoMaximized}" title="Restore video">
                  <ha-icon icon="mdi:arrow-collapse" class="mirrored"></ha-icon>
                </button>
              </div>
            `
          : html`
              <div class="ha-bambulab-ssc-status-content">
                <div class="ha-bambulab-ssc-status-icon" style="position: relative;">
                  ${this.showVideoFeed
                    ? html `
                        ${videoHtml}
                        <button class="video-maximize-btn" @click="${this.#toggleVideoMaximized}" title="Maximize video">
                          <ha-icon icon="mdi:arrow-expand" class="mirrored"></ha-icon>
                        </button>
                      `
                    : html`
                        <img src="${this.processedImage || this.coverImage}" alt="Cover Image" />
                      `}
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
              ${this.showExtraControls ? this.#renderExtraControlsColumn() : this.#renderMainControlsColumn()}
            `}
      </div>
      ${this.showExtraControls ? this.#renderExtraSensorColumn() : this.#renderMainSensorColumn()}
    `;
  }

  #renderMainControlsColumn() {

    return html`
      <div class="ha-bambulab-ssc-control-buttons">
        <button class="ha-bambulab-ssc-control-button" @click="${this.#toggleExtraControls}">
          <ha-icon icon="mdi:swap-horizontal"></ha-icon>
        </button>
        <button class="ha-bambulab-ssc-control-button ${this.#state("chamber_light")}" 
          @click="${() => helpers.toggleLight(this._hass, this._deviceEntities["chamber_light"])}">
          <ha-icon icon="mdi:lightbulb"></ha-icon>
        </button>
        <button class="ha-bambulab-ssc-control-button" @click="${this.#toggleVideoFeed}" title="Toggle video feed">
          <ha-icon icon="${this.showVideoFeed ? 'mdi:camera' : 'mdi:video'}"></ha-icon>
        </button>
        <button
          class="ha-bambulab-ssc-control-button"
          ?disabled="${this.#isPauseResumeDisabled()}"
          @click="${() =>
            this.#showConfirmation(
              helpers.isEntityUnavailable(this._hass, this._deviceEntities["pause"])
                ? "resume"
                : "pause"
            )}">
          <ha-icon icon="${this.#getPauseResumeIcon()}"></ha-icon>
        </button>
        <button
          class="ha-bambulab-ssc-control-button ${this.#isStopButtonDisabled()
            ? ""
            : "warning"}"
          ?disabled="${this.#isStopButtonDisabled()}"
          @click="${() => this.#showConfirmation("stop")}">
          <ha-icon icon="mdi:stop"></ha-icon>
        </button>
      </div>
    `
  }

  #renderExtraControlsColumn() {
    const hasPower = !!this._deviceEntities["power"]?.entity_id;
    return html`
      <div class="ha-bambulab-ssc-control-buttons">
        <button class="ha-bambulab-ssc-control-button" @click="${this.#toggleExtraControls}">
          <ha-icon icon="mdi:swap-horizontal"></ha-icon>
        </button>
        <button class="ha-bambulab-ssc-control-button" ?disabled="${this.#isControlsPageDisabled()}" @click="${this.#showControlsPage}" title="Show control page">
          <ha-icon icon="mdi:camera-control"></ha-icon>
        </button>
        <button
          class="ha-bambulab-ssc-control-button"
          ?disabled="${this.#isSkipObjectsButtonDisabled()}"
          @click="${() => this.#showSkipObjects()}">
          <ha-icon icon="mdi:debug-step-over"></ha-icon>
        </button>
        <button class="ha-bambulab-ssc-control-button" @click="${this.#openDevicePage}" title="Open device page">
          <ha-icon icon="mdi:dots-horizontal"></ha-icon>
        </button>
        ${hasPower ? html`
          <button class="ha-bambulab-ssc-control-button power-button ${this.#state('power') === 'on' ? 'on' : 'off'}" @click=${() => this.#clickEntity("power", true)}
            title="Power">
            <ha-icon icon="mdi:power" class="power-icon"></ha-icon>
          </button>
        ` : html`
          <button class="ha-bambulab-ssc-control-button invisible-placeholder" aria-hidden="true" tabindex="-1"></button>
        `}
      </div>
    `;
  }

  #renderMainSensorColumn() {
    return html`
      <div class="ha-bambulab-ssc-sensors">
        <div class="sensor" @click="${() => this.#clickEntity("target_nozzle_temperature")}">
          <span class="icon-and-target">
            <ha-icon icon="mdi:printer-3d-nozzle-heat-outline"></ha-icon>
            <span class="sensor-target-value">
              ${this.#formattedTemperatureState("target_nozzle_temp")}
            </span>
          </span>
          <span class="sensor-value">${this.#formattedTemperatureState("nozzle_temp")}</span>
        </div>
        <div class="sensor" @click="${() => this.#clickEntity("target_bed_temperature")}">
          <span class="icon-and-target">
            <ha-icon icon="mdi:radiator"></ha-icon>
            <span class="sensor-target-value">${this.#formattedTemperatureState("target_bed_temp")}</span>
          </span>
          <span class="sensor-value">${this.#formattedTemperatureState("bed_temp")}</span>
        </div>
        <div class="sensor" @click="${() => this.#clickEntity("printing_speed")}">
          <ha-icon icon="mdi:speedometer"></ha-icon>
          <span class="sensor-value">${this.#attribute("speed_profile", "modifier")}%</span>
        </div>
        ${(this._deviceEntities["aux_fan_speed"] && !helpers.isEntityUnavailable(this._hass, this._deviceEntities["aux_fan_speed"])) ? html`
          <div class="sensor" @click="${() => this.#clickEntity("aux_fan")}">
            <div class="twoicons">
              <ha-icon icon="mdi:fan"></ha-icon>
              <ha-icon icon="mdi:chevron-right"></ha-icon>
            </div>
            <span class="sensor-value">${this.#state("aux_fan_speed")}%</span>
          </div>
        ` : html`<div class="sensor invisible-placeholder" aria-hidden="true"></div>`}
        <div class="ams-divider"></div>
        <div class="ams" @click="${this.#showAmsPage}">
          ${this.#renderAMSSvg(this._selectedAmsIndex, false)}
        </div>
      </div>
    `;
  }

  #renderExtraSensorColumn() {
    // Count visible sensors (excluding AMS)
    let count = 0;
    if (this._deviceEntities["chamber_temp"]) count++;
    if (this._deviceEntities["humidity"]) count++;
    if (this._deviceEntities["chamber_fan"]) count++;
    count++; // cooling fan always present
    // Main sensor column: nozzle, bed, speed, aux fan (optional)
    let mainCount = 3; // nozzle, bed, speed always present
    if (this._deviceEntities["aux_fan_speed"]) mainCount++;
    const placeholders = Array.from({ length: mainCount - count });
    return html`
      <div class="ha-bambulab-ssc-sensors">
        ${this._deviceEntities["chamber_temp"] ? html`
          <div class="sensor">
            <div class="twoicons">
              <ha-icon icon="mdi:mirror-rectangle"></ha-icon>
              <ha-icon icon="mdi:thermometer"></ha-icon>
            </div>
            <span class="sensor-value">
              ${this.#state("chamber_temp") === 'unavailable'
                ? html`<ha-icon icon="mdi:alert-outline"></ha-icon>`
                : this.#formattedTemperatureState("chamber_temp")}
            </span>
          </div>
        ` : nothing}
        ${this._deviceEntities["humidity"] ? html`
          <div class="sensor">
            <div class="twoicons">
              <ha-icon icon="mdi:mirror-rectangle"></ha-icon>
              <ha-icon icon="mdi:water-percent"></ha-icon>
            </div>
            <span class="sensor-value">
              ${this.#state("humidity") === 'unavailable'
                ? html`<ha-icon icon="mdi:alert-outline"></ha-icon>`
                : this.#formattedState("humidity")}
            </span>
          </div>
        ` : nothing}
        ${this._deviceEntities["chamber_fan"] ? html`
          <div class="sensor" @click="${() => this.#clickEntity("chamber_fan")}">
            <div class="twoicons">
              <ha-icon icon="mdi:mirror-rectangle"></ha-icon>
              <ha-icon icon="mdi:fan"></ha-icon>
            </div>
            <span class="sensor-value">${this.#state("chamber_fan_speed") ?? '--'}%</span>
          </div>
        ` : nothing}
        <div class="sensor" @click="${() => this.#clickEntity("cooling_fan")}">
          <div class="twoicons">
            <ha-icon icon="mdi:printer-3d"></ha-icon>
            <ha-icon icon="mdi:fan"></ha-icon>
          </div>
          <span class="sensor-value">${this.#state("cooling_fan_speed") ?? '--'}%</span>
        </div>
        ${placeholders.map(() => html`
          <div class="sensor invisible-placeholder" aria-hidden="true"></div>
        `)}
        <div class="ams-divider"></div>
        <div class="ams" @click="${this.#showAmsPage}">
          ${this.#renderAMSSvg(this._selectedAmsIndex, false)}
        </div>
      </div>
    `;
  }

  #renderControlsPage() {
    return html`
      <button class="close-button" @click=${this.#showMainPage}>
        <ha-icon icon="mdi:close"></ha-icon>
      </button>
      <div class="controls-page-container">
        <div class="ha-bambulab-controls-content">
          ${this.#renderMoveAxis()}
          ${this.#renderBedMoveControls()}
          ${this.#renderExtruderControls()}
        </div>
      </div>
    `
  }

  #renderAmsPage() {
    return html`
    <div class="ams-page-container">
      <button class="close-button" @click=${this.#showMainPage}>
        <ha-icon icon="mdi:close"></ha-icon>
      </button>

      <div class="ams-selector-wrapper">
        <div class="ams-selector">
          ${this._amsList.map((_, index) => html`
            <div class="ams-selector-item ${index === this._selectedAmsIndex ? 'selected' : ''}"
                 @click=${() => this._selectedAmsIndex = index}>
              ${this.#renderAMSSvg(index)}
            </div>
          `)}
        </div>
      </div>

      <div class="spool-container">
        ${this._amsList[this._selectedAmsIndex]?.spools.map(
          spool => html`
            <ha-bambulab-spool
              .key="${spool}"
              .entity_id="${spool}"
              .tag_uid=${0}
              .show_type=${true}
              .spool_anim_reflection=${false}
              .spool_anim_wiggle=${false}
              .developer_lan_mode=${!this.#isBambuBlockingWrites()}
            ></ha-bambulab-spool>
          `
        )}
      </div>
    </div>
    `
  }

  #renderAMSSvg(amsIndex: number, show_active: boolean = true) {
    const ams = this._amsList[amsIndex];
    if (!ams || !ams.spools) {
      console.log('No AMS or spools provided');
      return html``;
    }

    const spools = ams.spools;
    const active = show_active && ams.active;
    const spoolWidth = 10;
    const gap = 4;
    const totalWidth = (spoolWidth * spools.length) + (gap * (spools.length - 1)) + 4;

    const svgString = `
      <svg viewBox="0 0 ${totalWidth} 20" width="${totalWidth}" height="20">
        ${active ? `
          <rect 
            x="0" y="0" 
            width="${totalWidth}" height="20"
            fill="none"
            stroke="green"
            stroke-width="2"
            rx="1" ry="1"/>
        ` : ''}
        ${spools.map((spool, i) => {
          const color = this._hass.states[spool].attributes.color;
          const isEmpty = this._hass.states[spool].attributes.empty;
          const x = 2 + (i * (spoolWidth + gap));
          return `
            <rect
              x="${x}" y="2"
              width="${spoolWidth}" height="16"
              fill="${color}"
              stroke="#808080"
              stroke-width="1"/>
            ${isEmpty ? `
              <line
                x1="${x + 1}" y1="3"
                x2="${x + spoolWidth - 1}" y2="18"
                stroke="#808080"
                stroke-width="1"/>
              <line
                x1="${x + 1}" y1="18"
                x2="${x + spoolWidth - 1}" y2="3"
                stroke="#808080"
                stroke-width="1"/>
            ` : ''}`;
        }).join('')}
      </svg>
    `;

    return html`${unsafeHTML(svgString)}`;
  }

  #getAMSList() {
    const ENTITYLIST: string[] = [
      "active_ams",
      "ams_temp",
      "temp",             // Node-RED only
      "custom_humidity",
      "humidity_index",
      "humidity_level",   // Node-RED only
      "tray_0",           // Node-RED only
      "tray_1",
      "tray_2",
      "tray_3",
      "tray_4",
      "external_spool",
    ];

    const amsList: string[] = helpers.getAttachedDeviceIds(this._hass, this._device_id);
    const externalSpools: AMS[] = [];

    amsList.forEach(ams_device_id => {
      var device = this._hass.devices[ams_device_id];
      var entities = helpers.getBambuDeviceEntities(this._hass, ams_device_id, ENTITYLIST);
      var spools: string[] = [];

      const active = this._hass.states[entities["active_ams"].entity_id].state == "on";

      if (device.model === "External Spool") {
        if (entities["external_spool"]?.entity_id) {
          spools.push(entities["external_spool"].entity_id);
          externalSpools.push({
            device_id: ams_device_id,
            active: active,
            spools: spools,
          });
        }
      } else {
        if (entities["tray_1"]?.entity_id) spools.push(entities["tray_1"].entity_id);
        if (entities["tray_2"]?.entity_id) spools.push(entities["tray_2"].entity_id);
        if (entities["tray_3"]?.entity_id) spools.push(entities["tray_3"].entity_id);
        if (entities["tray_4"]?.entity_id) spools.push(entities["tray_4"].entity_id);

        this._amsList.push({
          device_id: ams_device_id,
          active: active,
          spools: spools,
        });
      }
    });

    // Add external spools at the end
    this._amsList.push(...externalSpools);
    
    // Set selected AMS to the active one, or default to first if none are active
    const activeIndex = this._amsList.findIndex(ams => ams.active);
    this._selectedAmsIndex = activeIndex >= 0 ? activeIndex : 0;
    
    return amsList;
  }

  #moveAxis(axis: MoveAxis, distance: Number) {
    const data = { device_id: [this._device_id], axis: '', distance: distance }
    if (axis == MoveAxis.X) {
      data.axis = 'X'
    } else if (axis == MoveAxis.Y) {
      data.axis = 'Y'
    } else if (axis == MoveAxis.Z) {
      data.axis = 'Z'
    } else if (axis == MoveAxis.HOME) {
      data.axis = 'HOME'
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
<div class="circle-container">
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
          @click=${() => this.#moveAxis(MoveAxis.X, -1)} />

        <!-- Outer Slice Left -->
        <path class="outer-slice" d="
          M 100 160
          L 100 190
          A90 90 0 0 1 10 100
          L 40 100
          A60 60 0 0 0 100 160
          Z"
          transform="rotate(45, 100, 100)" 
          @click=${() => this.#moveAxis(MoveAxis.X, -10)} />

        <!-- Inner Slice Right -->
        <path class="inner-slice" d="
          M 100 75
          L 100 40
          A60 60 0 0 1 160 100
          L 125 100
          A25 25 0 0 0 100 75
          Z"
          transform="rotate(45, 100, 100)" 
          @click=${() => this.#moveAxis(MoveAxis.X, 1)} />

        <!-- Outer Slice Right -->
        <path class="outer-slice" d="
          M 100 40
          L 100 10
          A90 90 0 0 1 190 100
          L 160 100
          A60 60 0 0 0 100 40
          Z"
          transform="rotate(45, 100, 100)" 
          @click=${() => this.#moveAxis(MoveAxis.X, 10)} />

        <!-- Inner Slice Top -->
        <path class="inner-slice" d="
          M 75 100
          L 40 100
          A60 60 0 0 1 100 40
          L 100 75
          A25 25 0 0 0 75 100
          Z"
          transform="rotate(45, 100, 100)" 
          @click=${() => this.#moveAxis(MoveAxis.Y, 1)} />

        <!-- Outer Slice Top -->
        <path class="outer-slice" d="
          M 40 100
          L 10 100
          A90 90 0 0 1 100 10
          L 100 40
          A60 60 0 0 0 40 100
          Z"
          transform="rotate(45, 100, 100)" 
          @click=${() => this.#moveAxis(MoveAxis.Y, 10)} />
          
        <!-- Inner Slice Bottom -->
        <path class="inner-slice" d="
          M 125 100
          L 160 100
          A60 60 0 0 1 100 160
          L 100 125
          A25 25 0 0 0 125 100
          Z"
          transform="rotate(45, 100, 100)" 
          @click=${() => this.#moveAxis(MoveAxis.Y, -1)} />

        <!-- Outer Slice Bottom -->
        <path class="outer-slice" d="
          M 160 100
          L 190 100
          A90 90 0 0 1 100 190
          L 100 160
          A60 60 0 0 0 160 100
          Z"
          transform="rotate(45, 100, 100)" 
          @click=${() => this.#moveAxis(MoveAxis.Y, -10)} />
      </g>

      <!-- Middle circle -->
      <circle class="middle"
        cx="100" cy="100" r="25"
        stroke="black"
        stroke-width="1"
        fill="none"
        @click=${() => this.#showConfirmation("home")}
      />
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

    <div class="label" style="left: 100px; top: 100px;">
      <ha-icon icon="mdi:home"></ha-icon>
    </div>

  </div>
</div>
`
  }

  #renderBedMoveControls() {
    return html`
      <div class="bed-move-controls-container">
        <button class="bed-move-control-button" @click=${() => this.#moveAxis(MoveAxis.Z, -10)}>
          <ha-icon icon="mdi:chevron-double-up"></ha-icon>
        </button>
        <button class="bed-move-control-button" @click=${() => this.#moveAxis(MoveAxis.Z, -1)}>
          <ha-icon icon="mdi:chevron-up"></ha-icon>
        </button>
        <ha-icon icon="mdi:train-car-flatbed"></ha-icon>
        <button class="bed-move-control-button" @click=${() => this.#moveAxis(MoveAxis.Z, 1)}>
          <ha-icon icon="mdi:chevron-down"></ha-icon>
        </button>
        <button class="bed-move-control-button" @click=${() => this.#moveAxis(MoveAxis.Z, 10)}>
          <ha-icon icon="mdi:chevron-double-down"></ha-icon>
        </button>
      </div>
    `
  }

  async #moveExtruder(direction: Extruder) {
    const action = direction == Extruder.Retract ? "retract" : "extrude";
    const callResult = await this._hass.callService(
      "bambu_lab",
      "extrude_retract",
      { device_id: [this._device_id], type: action },
      undefined,
      true,
      true);

    console.log("CallResult:", callResult)
    
    if (callResult.response.Error) {
      this.confirmation = {
        show: true,
        action: null,
        title: "Error",
        body: callResult.response.Error
      };
    }
  }

  #renderExtruderControls() {
    return html`
      <div class="bed-move-controls-container">
        <button class="bed-move-control-button" @click=${() => this.#moveExtruder(Extruder.Retract)}>
          <ha-icon icon="mdi:chevron-up"></ha-icon>
        </button>
        <ha-icon icon="mdi:printer-3d-nozzle-outline"></ha-icon>
        <button class="bed-move-control-button" @click=${() => this.#moveExtruder(Extruder.Extrude)}>
          <ha-icon icon="mdi:chevron-down"></ha-icon>
        </button>
      </div>
    `
  }
}
