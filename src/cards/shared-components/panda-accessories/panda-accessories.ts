import * as helpers from "~/utils/helpers";
import { customElement, property } from "lit/decorators.js";
import { html, LitElement, nothing, TemplateResult } from "lit";
import { consume } from "@lit/context";
import { hassContext } from "~/utils/context";
import styles from "./panda-accessories.styles";

// BIQU Panda devices the integration links to a printer (each is a device "via" the printer).
export const PANDA_BREATH_MODEL = "Panda Breath";
export const PANDA_PWR_MODEL = "Panda PWR";
export const PANDA_STATUS_MODEL = "Panda Status";

const PANDA_ENTITY_KEYS: { [model: string]: string[] } = {
  [PANDA_BREATH_MODEL]: [
    "panda_breath_chamber_temperature",
    "panda_breath_power",
    "panda_breath_drying",
    "panda_breath_drying_remaining_time",
  ],
  [PANDA_PWR_MODEL]: ["panda_pwr_power_output", "panda_pwr_power"],
  [PANDA_STATUS_MODEL]: ["panda_status_idle_light"],
};

type Entities = { [key: string]: helpers.Entity };

/** Devices attached to the printer that are linked BIQU Panda devices, with their entities. */
export function getPandaDevices(hass, printerDeviceId): { model: string; entities: Entities }[] {
  if (!hass || !printerDeviceId) return [];
  return helpers
    .getAttachedDeviceIds(hass, printerDeviceId)
    .map((id) => ({ id, model: hass.devices[id]?.model }))
    .filter(({ model }) => model in PANDA_ENTITY_KEYS)
    .map(({ id, model }) => ({
      model,
      entities: helpers.getBambuDeviceEntities(hass, id, PANDA_ENTITY_KEYS[model]),
    }));
}

@customElement("panda-accessories")
export class PandaAccessories extends LitElement {
  @consume({ context: hassContext, subscribe: true })
  private hass;

  @property() public printerDeviceId: string | undefined;

  static styles = styles;

  #state(entity?: helpers.Entity): string | undefined {
    if (!entity?.entity_id) return undefined;
    return this.hass.states[entity.entity_id]?.state;
  }

  #formatted(entity?: helpers.Entity): string {
    const state = this.#state(entity);
    if (state === undefined || state === "unavailable" || state === "unknown") return "—";
    return this.hass.formatEntityState(this.hass.states[entity!.entity_id]);
  }

  #chip(options: {
    icon: string;
    text?: string;
    title: string;
    entity?: helpers.Entity;
    active?: boolean;
    activeClass?: string;
    onClick?: () => void;
  }): TemplateResult | typeof nothing {
    if (!options.entity?.entity_id) return nothing;
    const unavailable = helpers.isEntityUnavailable(this.hass, options.entity);
    const classes = [
      "chip",
      unavailable ? "unavailable" : "",
      options.active && !unavailable ? options.activeClass ?? "active" : "",
    ].join(" ");
    const click = options.onClick ?? (() => helpers.showEntityMoreInfo(this, options.entity!));
    return html`
      <button class="${classes}" title="${options.title}" @click="${click}">
        <ha-icon icon="${options.icon}"></ha-icon>
        ${options.text ? html`<span>${options.text}</span>` : nothing}
      </button>
    `;
  }

  #renderBreath(entities: Entities) {
    const drying = this.#state(entities.panda_breath_drying) === "on";
    return html`
      ${this.#chip({
        icon: "mdi:heat-wave",
        text: this.#formatted(entities.panda_breath_chamber_temperature),
        title: "Panda Breath chamber heater",
        entity: entities.panda_breath_power,
        active: this.#state(entities.panda_breath_power) === "on",
        activeClass: "heating",
      })}
      ${drying
        ? this.#chip({
            icon: "mdi:hair-dryer",
            text: this.#formatted(entities.panda_breath_drying_remaining_time),
            title: "Panda Breath filament drying",
            entity: entities.panda_breath_drying,
            active: true,
            activeClass: "heating",
          })
        : nothing}
    `;
  }

  #renderPwr(entities: Entities) {
    // Opens the more-info dialog rather than toggling: the outlet usually powers the printer.
    return this.#chip({
      icon: "mdi:power-plug",
      text: this.#formatted(entities.panda_pwr_power),
      title: "Panda PWR power output",
      entity: entities.panda_pwr_power_output,
      active: this.#state(entities.panda_pwr_power_output) === "on",
      activeClass: "powered",
    });
  }

  #renderStatus(entities: Entities) {
    const light = entities.panda_status_idle_light;
    const on = this.#state(light) === "on";
    return this.#chip({
      icon: on ? "mdi:lightbulb-on-outline" : "mdi:lightbulb-outline",
      title: "Panda Status idle light",
      entity: light,
      active: on,
      activeClass: "lit",
      onClick: () =>
        this.hass.callService("switch", on ? "turn_off" : "turn_on", { entity_id: light!.entity_id }),
    });
  }

  render() {
    const devices = getPandaDevices(this.hass, this.printerDeviceId);
    if (devices.length === 0) return nothing;
    return html`
      <div class="panda-accessories">
        ${devices.map(({ model, entities }) => {
          if (model === PANDA_BREATH_MODEL) return this.#renderBreath(entities);
          if (model === PANDA_PWR_MODEL) return this.#renderPwr(entities);
          if (model === PANDA_STATUS_MODEL) return this.#renderStatus(entities);
          return nothing;
        })}
      </div>
    `;
  }
}
