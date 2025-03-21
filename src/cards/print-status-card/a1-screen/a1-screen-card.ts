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
    const card = this.shadowRoot!.querySelector('ha-card')!;
    const resizeObserver = new ResizeObserver(() => {
      this.updateCondensedMode(card);
    });
    resizeObserver.observe(card);
  }

  updateCondensedMode(card) {
    // Check if the height of the ha-card is below 2000px
    if (card.offsetHeight < 250) {
      card.classList.add('condensed-mode');
    } else {
      card.classList.remove('condensed-mode');
    }
  }
  
  // Custom robot icon SVG
  private robotIcon() {
    return svg`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <!-- Robot body/frame -->
        <rect x="4" y="4" width="16" height="14" rx="2" fill="none" stroke="#aaa" stroke-width="1.5" />
        <!-- Screen/display -->
        <rect x="6" y="6" width="12" height="8" rx="1" fill="#2a2a2a" />
        <!-- OK text on screen -->
        <text x="7.5" y="12" font-family="Arial" font-size="6" font-weight="bold" fill="#4caf50">OK</text>
        <!-- Antenna -->
        <line x1="12" y1="4" x2="12" y2="2" stroke="#aaa" stroke-width="1.5" />
        <circle cx="12" cy="1.5" r="0.5" fill="#aaa" />
        <!-- Bottom connectors -->
        <rect x="7" y="18" width="2" height="2" fill="#aaa" />
        <rect x="15" y="18" width="2" height="2" fill="#aaa" />
      </svg>
    `;
  }

  render() {
    console.log(this._entities);
    return html`
      <ha-card>
        <div class="scale-container">
        <div class="screen-container">
          <div class="main-content">
            <div class="status-content">
              <div class="status-icon">
                <img src="${this.coverImage}" alt="Ice Bear" />
              </div>
              <div class="status-info">
                <div class="status-time">~4h22m</div>
                <div class="progress-container">
                  <div class="progress-bar">
                    <div class="progress" style="width: 50%"></div>
                  </div>
                  <div class="progress-text">282/600</div>
                </div>
              </div>
            </div>

            <div class="side-panel">
              <div class="side-column controls">
                <button class="control-button robot-icon">${this.robotIcon()}</button>
                <button class="control-button">
                  <ha-icon icon="mdi:lightbulb"></ha-icon>
                </button>
                <button class="control-button">
                  <ha-icon icon="mdi:pause"></ha-icon>
                </button>
                <button class="control-button warning">
                  <ha-icon icon="mdi:stop"></ha-icon>
                </button>
              </div>

              <div class="side-column">
                <div class="temp-indicators">
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
                        <ha-icon icon="mdi:bed-queen"></ha-icon>
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
            </div>
          </div>
        </div>
        </div>
      </ha-card>
    `;
  }
}
