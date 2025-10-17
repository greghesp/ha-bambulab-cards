import * as helpers from "../../../../utils/helpers"
import { customElement, property, state } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import styles from "./info-bar.styles";
import { consume } from "@lit/context";
import { showInfoBarContext, hassContext, entitiesContext } from "../../../../utils/context";

@customElement("info-bar")
export class InfoBar extends LitElement {
  @consume({ context: showInfoBarContext, subscribe: true })
  private _infoBar;

  @consume({ context: hassContext, subscribe: true })
  private hass;

  @consume({ context: entitiesContext, subscribe: true })
  private _entities;

  static styles = styles;

  @state()
  private _showIcons = true;

  private _resizeObserver?: ResizeObserver;

  firstUpdated() {
    const infoSlots = this.renderRoot.querySelector(".extra-info")!;
    this._resizeObserver = new ResizeObserver(() => this._checkWidth());
    this._resizeObserver.observe(infoSlots);
    this._checkWidth();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = undefined;
    }
  }

  private _checkWidth() {
    const infoSlots = this.renderRoot.querySelector(".extra-info");
    if (infoSlots) {
      this._showIcons = infoSlots.clientWidth > 108;
    }
  }

  getHumidityColor() {
    switch (this.hass.states[this._entities.humidity.entity_id].state) {
      case "1":
        return "#e0f7fa"; // very light blue
      case "2":
        return "#81d4fa"; // light blue
      case "3":
        return "#29b6f6"; // medium blue
      case "4":
        return "#0288d1"; // deeper blue
      case "5":
        return "#01579b"; // darkest blue
      default:
        return "white"; // fallback if index is outside 1-5
    }
  }

  getTemperatureColor() {
    // Ensure temperature is within 0–30 if you want to clamp out-of-range values:
    let temp = parseFloat(this.hass.states[this._entities.temperature.entity_id].state);
    const unit =
      this.hass.states[this._entities.temperature.entity_id].attributes.unit_of_measurement;

    if (unit !== "°C") {
      temp = ((temp - 32) * 5) / 9;
    }

    if (temp < 0) return "red";

    switch (true) {
      case temp >= 0 && temp <= 5:
        return "#0000ff"; // coldest shade (blue)
      case temp <= 10:
        return "#0084ff";
      case temp <= 15:
        return "#47baa5";
      case temp <= 20:
        return "#48af1c";
      case temp <= 25:
        return "#ffa500";
      case temp >= 30:
        return "#ff4500"; // hottest shade (orange/red)
      default:
        return "white";
    }
  }

  render() {
    if (!this._infoBar.active) return nothing;

    // If this is an AMS HT model, we need to hide the title (even if enabled) and give 100% width to the info slots
    const isAmsHtModel = this._entities?.spools?.length === 1;

    return html`
      <div class="extra-info">
        ${!isAmsHtModel ? html`<div class="title">${this._infoBar.title}</div>` : nothing}
        <div class="info-slots" style="${isAmsHtModel ? 'width: 100%' : ''}">
          ${this._entities?.humidity
            ? html`<div class="info" @click="${() => helpers.showEntityMoreInfo(this, this._entities.humidity)}">
                ${this._showIcons
                  ? html`<span>
                           <ha-icon icon="mdi:water" style="color: ${this.getHumidityColor()}" />
                         </span>`
                  : nothing}
                <span>
                  ${this.hass.formatEntityState(this.hass.states[this._entities.humidity.entity_id])}
                </span>
              </div>`
            : nothing}
          ${this._entities?.temperature
            ? html`<div class="info" @click="${() => helpers.showEntityMoreInfo(this, this._entities.temperature)}">
                ${this._showIcons
                  ? html`<span>
                           <ha-icon icon="mdi:thermometer" style="color: ${this.getTemperatureColor()}" />
                         </span>`
                  : nothing}
                <span>
                  ${helpers.getFormattedEntityState(this.hass, this._entities.temperature.entity_id)}
                </span>
              </div>`
            : nothing}
        </div>
      </div>
    `;
  }
}
