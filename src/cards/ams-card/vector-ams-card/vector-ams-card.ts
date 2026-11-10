import * as helpers from "../../../utils/helpers";
import { customElement, property } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import styles from "./vector-ams-card.styles";
import "../components/info-bar/info-bar";
import { entitiesContext, hassContext } from "../../../utils/context";
import { consume } from "@lit/context";

@customElement("vector-ams-card")
export class VectorAmsCard extends LitElement {
  @property() public showType;
  @property() public spoolAnimReflection;
  @property() public spoolAnimWiggle;
  @property() public customRemaining: { [entity_id: string]: string } = {};

  @consume({ context: entitiesContext, subscribe: true })
  private _entities;

  @consume({ context: hassContext, subscribe: true })
  private hass;

  static styles = styles;

  #renderSpool(spool: { entity_id: string }, classType: string) {
    return html`
      <ha-bambulab-spool
        class="${classType}"
        .key="${spool.entity_id}"
        .entity_id="${spool.entity_id}"
        .remaining_entity=${this.customRemaining?.[spool.entity_id]}
        .show_type=${this.showType}
        .spool_anim_reflection=${this.spoolAnimReflection}
        .spool_anim_wiggle=${this.spoolAnimWiggle}
      ></ha-bambulab-spool>
    `;
  }

  /* One dry box reading; nothing while its sensor has no value */
  #renderDryBoxReading(entity: helpers.Entity | undefined, icon: string, label: string) {
    const stateObj = entity ? this.hass?.states?.[entity.entity_id] : undefined;
    if (!stateObj || ["unavailable", "unknown", ""].includes(stateObj.state)) return nothing;
    const value = this.hass.formatEntityState(stateObj);
    return html`<span
      class="dry-box-reading"
      title="${label}: ${value}"
      @click=${() => helpers.showEntityMoreInfo(this, entity!)}
    >
      <ha-icon icon=${icon}></ha-icon><span>${value}</span>
    </span>`;
  }

  /* AMS 3H: the back row of two spools beside the dry box, whose drying time left, temperature
     and humidity sit above its two spools, then the front row of five */
  #renderAms3h(layout) {
    const zone = layout.dryBox.zone;
    const drying = Number(this.hass?.states?.[zone.dryingTime?.entity_id]?.state) > 0;
    const spoolClass = "ha-bambulab-spool ams3h";
    return html`
      <div class="ams3h">
        <div class="ams3h-row back">
          ${layout.back.map((spool) => this.#renderSpool(spool, spoolClass))}
          <div class="dry-box ${drying ? "drying" : ""}" title="Dry box (zone ${zone.zone})">
            <div class="dry-box-head">
              ${drying
                ? this.#renderDryBoxReading(zone.dryingTime, "mdi:heat-wave", "Drying time left")
                : html`<span class="dry-box-name">Dry box</span>`}
              <span class="dry-box-readings">
                ${this.#renderDryBoxReading(zone.temperature, "mdi:thermometer", "Dry box temperature")}
                ${this.#renderDryBoxReading(zone.humidity, "mdi:water", "Dry box humidity")}
              </span>
            </div>
            <div class="dry-box-spools">
              ${layout.dryBox.spools.map((spool) => this.#renderSpool(spool, spoolClass))}
            </div>
          </div>
        </div>
        <div class="ams3h-row front">
          ${layout.front.map((spool) => this.#renderSpool(spool, spoolClass))}
        </div>
      </div>
    `;
  }

  render() {
    if (this._entities?.ams3hLayout) {
      return html`
        <ha-card class="ha-bambulab-vector-ams-card">
          <div class="v-wrapper">
            <info-bar></info-bar>
            <div class="v-ams-container">${this.#renderAms3h(this._entities.ams3hLayout)}</div>
          </div>
        </ha-card>
      `;
    }

    const spoolCount = this._entities?.spools?.length ?? 4;
    // More than four spools (the AMS 3H's nine) are laid out in two rows
    const twoRows = spoolCount > 4;
    const classType = (spoolCount === 1) ? "ha-bambulab-spool ht"
      : twoRows ? "ha-bambulab-spool two-rows"
      : "ha-bambulab-spool";

    return html`
      <ha-card class="ha-bambulab-vector-ams-card">
        <div class="v-wrapper">
          <info-bar></info-bar>
          <div class="v-ams-container">
            <div class="v-spools-wrapper ${twoRows ? "two-rows" : ""}">
              ${this._entities?.spools?.map(
                (spool: { entity_id: string }) => html`
                  <ha-bambulab-spool
                    class="${classType}"
                    .key="${spool.entity_id}"
                    .entity_id="${spool.entity_id}"
                    .remaining_entity=${this.customRemaining?.[spool.entity_id]}
                    .show_type=${this.showType}
                    .spool_anim_reflection=${this.spoolAnimReflection}
                    .spool_anim_wiggle=${this.spoolAnimWiggle}
                  ></ha-bambulab-spool>
                `
              )}
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }
}
