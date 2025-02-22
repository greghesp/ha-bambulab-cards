import * as helpers from "../../../../utils/helpers"
import { customElement, property } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import styles from "./info-bar.styles";

@customElement("info-bar")
export class InfoBar extends LitElement {
  @property({ type: Object }) public hass;
  @property({ type: String }) public subtitle;
  @property({ type: Object }) public humidity;
  @property({ type: Object }) public temperature;

  static styles = styles;

  private getHumidityColor(): String {
    const state = this.hass.states[this.humidity.entity_id];
    switch (state.state) {
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

  private getTemperatureColor(): String {
    // Ensure temperature is within 0–30 if you want to clamp out-of-range values:
    const state = this.hass.states[this.temperature.entity_id];
    let temp = parseFloat(state.state);
    const unit = state.attributes.unit_of_measurement;

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

  private getHumidity(): String {
    const state = this.hass.states[this.humidity.entity_id];
    let value = state.state;
    if (this.humidity.display_precision != undefined) {
      value = Number(value).toFixed(this.humidity.display_precision);
    }
    if (this.humidity.translation_key != 'humidity_index') {
      value += '%'
    }
    return value
  }


  private getTemperature(): String {
    const state = this.hass.states[this.temperature.entity_id];
    let value = state.state;
    if (this.temperature.display_precision != undefined) {
      value = Number(value).toFixed(this.temperature.display_precision);
    }
    return `${value}${state.attributes.unit_of_measurement}`
  }

  render() {
    return html`
      <div class="extra-info">
        <div class="subtitle">${this.subtitle}</div>
        <div class="info-slots">
          ${this.humidity
            ? html`
              <div class="info" @click="${() => helpers.showEntityMoreInfo(this, this.humidity)}">
                <span><ha-icon icon="mdi:water" style="color: ${this.getHumidityColor()}" /></span>
                <span>
                  ${this.getHumidity()}
                </span>
              </div>`
            : nothing}
          ${this.temperature
            ? html`
                <div class="info" @click="${() => helpers.showEntityMoreInfo(this, this.temperature)}">
                  <span>
                    <ha-icon icon="mdi:thermometer" style="color: ${this.getTemperatureColor()}"></ha-icon>
                  </span>
                  <span>
                    ${this.getTemperature()}
                  </span>
                </div>
              `
            : nothing}
        </div>
      </div>
    `;
  }
}
