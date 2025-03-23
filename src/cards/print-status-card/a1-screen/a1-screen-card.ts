import * as helpers from "../../../utils/helpers";
import { customElement, property } from "lit/decorators.js";
import { html, LitElement, nothing, svg } from "lit";
import styles from "./a1-screen-styles";
import { entitiesContext } from "../../../utils/context";
import { consume } from "@lit/context";

@customElement("a1-screen-card")
export class A1ScreenCard extends LitElement {
  @property() public coverImage;

  @consume({ context: entitiesContext, subscribe: true })
  private _entities;

  static styles = styles;

  firstUpdated(changedProperties): void {
    super.firstUpdated(changedProperties);
    this.observeCardHeight();
  }

  observeCardHeight() {
    const card = this.shadowRoot!.querySelector("ha-card")!;
    const resizeObserver = new ResizeObserver(() => {
      this.updateCondensedMode(card);
    });
    resizeObserver.observe(card);
  }

  updateCondensedMode(card) {
    if (card.offsetWidth < 350) {
      card.classList.add("condensed-mode");
    } else {
      card.classList.remove("condensed-mode");
    }
  }

  render() {
    return html`
      <ha-card class="ha-bambulab-ssc">
        <div class="ha-bambulab-ssc-screen-container">

          <div class="ha-bambulab-ssc-status-and-controls">

            <div class="ha-bambulab-ssc-status-content">
              <div class="ha-bambulab-ssc-status-icon">
                <img src="${this.coverImage}" alt="Ice Bear" />
              </div>
              <div class="ha-bambulab-ssc-status-info">
                <div class="ha-bambulab-ssc-status-time">~4h22m</div>
                <div class="ha-bambulab-ssc-progress-container">
                  <div class="ha-bambulab-ssc-progress-bar">
                    <div class="ha-bambulab-ssc-progress" style="width: 50%"></div>
                  </div>
                  <div class="ha-bambulab-ssc-progress-text">282/600</div>
                </div>
              </div>
            </div>

            <div class="ha-bambulab-ssc-control-buttons">
              <button class="ha-bambulab-ssc-control-button">
                <ha-icon icon="mdi:lightbulb"></ha-icon>
              </button>
              <button class="ha-bambulab-ssc-control-button ">
                <ha-icon icon="mdi:debug-step-over"></ha-icon>
              </button>
              <button class="ha-bambulab-ssc-control-button">
                <ha-icon icon="mdi:pause"></ha-icon>
              </button>
              <button class="ha-bambulab-ssc-control-button warning">
                <ha-icon icon="mdi:stop"></ha-icon>
              </button>
            </div>
          
          </div>

          <div class="ha-bambulab-ssc-sensors">
            <div class="temp-item">
              <span class="icon-and-target">
                <span>
                  <ha-icon icon="mdi:printer-3d-nozzle-heat-outline"></ha-icon>
                  <span class="temp-target">250°</span>
                </span>
              </span>
              <span class="temp-value">220°C</span>
            </div>
            <div class="temp-item">
              <span class="icon-and-target">
                <span>
                  <ha-icon icon="mdi:radiator"></ha-icon>
                  <span class="temp-target">20°</span>
                </span>
              </span>
              <span class="temp-value">40°C</span>
            </div>
            <div class="temp-item">
              <span class="icon-and-value">
                <ha-icon icon="mdi:speedometer"></ha-icon>
                <span class="temp-value">100%</span>
              </span>
            </div>
            <div class="temp-item">
              <span class="icon-and-value">
                <ha-icon icon="mdi:fan"></ha-icon>
                <span class="temp-value">100%</span>
              </span>
            </div>
          </div>

        </div>
      </ha-card>
    `;
  }
}
