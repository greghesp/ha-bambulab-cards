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
    const infoSlots = this.renderRoot.querySelector(".extra-info");
    this._resizeObserver = new ResizeObserver(() => this._checkWidth());
    if (infoSlots) {
      this._resizeObserver.observe(infoSlots);
      this._checkWidth();
    }
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

  #isOn(entity): boolean {
    return !!entity?.entity_id && this.hass.states[entity.entity_id]?.state === "on";
  }

  // External AMS heater/dryer (SUNLU, EIBOS) switched through a smart plug.
  #renderHeater() {
    const drying = this._entities?.heaterDrying;
    const power = this._entities?.heaterPower;
    const target = drying?.entity_id ? drying : power;
    if (!target?.entity_id) return nothing;

    const heating = this.#isOn(power);
    const auto = this.#isOn(drying);
    const lockout = !!(drying?.entity_id && this.hass.states[drying.entity_id]?.attributes?.runtime_lockout);
    const icon = lockout ? "mdi:timer-alert-outline" : heating ? "mdi:heating-coil" : "mdi:radiator-off";
    const label = lockout ? "Limit" : auto ? (heating ? "Drying" : "Auto") : heating ? "On" : "Off";
    const color = lockout ? "#ffb300" : heating ? "#ff7800" : "white";
    return html`<div
      class="info"
      title="AMS heater"
      @click="${() => helpers.showEntityMoreInfo(this, target)}"
    >
      ${this._showIcons
        ? html`<span><ha-icon icon="${icon}" style="color: ${color}"></ha-icon></span>`
        : nothing}
      <span>${label}</span>
    </div>`;
  }

  /* One reading of an AMS 3H zone; nothing while its sensor has no value */
  #renderZoneReading(entity: helpers.Entity | undefined, icon: string, label: string) {
    const stateObj = entity ? this.hass.states[entity.entity_id] : undefined;
    if (!stateObj || ["unavailable", "unknown", ""].includes(stateObj.state)) return nothing;
    const value = this.hass.formatEntityState(stateObj);
    return html`<span
      class="zone-reading"
      title="${label}: ${value}"
      @click="${() => helpers.showEntityMoreInfo(this, entity!)}"
    >
      ${this._showIcons ? html`<ha-icon icon=${icon} />` : nothing}
      <span>${value}</span>
    </span>`;
  }

  /* The AMS 3H has no cabinet humidity or temperature, so each drying zone shows its own, plus
     the time left while it is drying. The tooltip says which trays the zone holds. */
  #renderZones() {
    return this._entities.zones.map((zone) => {
      const dryingState = zone.dryingTime ? this.hass.states[zone.dryingTime.entity_id]?.state : undefined;
      const name = `Zone ${zone.zone}`;
      const trays = zone.slots.length ? ` (trays ${zone.slots.join(", ")})` : "";
      return html`<div class="info zone" title="${name}${trays}">
        <span class="zone-name">Z${zone.zone}</span>
        ${this.#renderZoneReading(zone.humidity, "mdi:water", `${name} humidity`)}
        ${this.#renderZoneReading(zone.temperature, "mdi:thermometer", `${name} temperature`)}
        ${Number(dryingState) > 0
          ? this.#renderZoneReading(zone.dryingTime, "mdi:heat-wave", `${name} drying time left`)
          : nothing}
      </div>`;
    });
  }

  render() {
    if (!this._infoBar.active) return nothing;

    // If this is an AMS HT model, we need to hide the title (even if enabled) and give 100% width to the info slots
    const isAmsHtModel = this._entities?.spools?.length === 1;

    if (this._entities?.zones?.length) {
      return html`
        <div class="extra-info">
          <div class="title zones-title">${this._infoBar.title}</div>
          <div class="info-slots zones">${this.#renderZones()}</div>
        </div>
      `;
    }

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
          ${this.#renderHeater()}
        </div>
      </div>
    `;
  }
}
