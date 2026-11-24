import { PRINT_STATUS_CARD_EDITOR_NAME } from "./const";
import { MANUFACTURER, PRINTER_MODELS } from "../../const";
import { state } from "lit/decorators.js";
import { customElement } from "../../utils/custom-element";
import { LitElement, html } from "lit";

const filterCombinations = PRINTER_MODELS.map((model) => ({
  manufacturer: MANUFACTURER,
  model: model,
}));


@customElement(PRINT_STATUS_CARD_EDITOR_NAME)
export class PrintControlCardEditor extends LitElement {
  @state() private _config?;
  @state() private hass: any;

  public setConfig(config): void {
    this._config = config;
  }

  // This method dynamically builds the schema based on current config
  _buildSchema() {
    const schema: any[] = [
      {
        name: "style",
        label: "Card Style",
        selector: {
          select: {
            options: [
              { label: "Simple", value: "simple" },
              { label: "Minimal", value: "minimal" },
              { label: "Graphic", value: "graphic" },
            ],
          },
        },
      },
      {
        name: "printer",
        label: "Printer",
        selector: { device: { filter: filterCombinations } },
      },
      {
        name: "custom_humidity",
        label: "Custom humidity sensor",
        selector: { entity: { domain: "sensor" } },
      },
      {
        name: "custom_temperature",
        label: "Custom temperature Sensor",
        selector: { entity: { domain: "sensor" } },
      },
      {
        name: "custom_light",
        label: "Custom light",
        selector: { entity: { domain: "light" } },
      },
      {
        name: "custom_power",
        label: "Power switch",
        selector: { entity: { domain: "switch" } },
      },
    ];

    // The minimal style has no room for these
    if (this._config?.style !== "minimal") {
      schema.push({
        name: "custom_light_2",
        label: "Second light",
        selector: { entity: { domain: ["light", "switch"] } },
      });
      schema.push({
        name: "custom_power_usage",
        label: "Power usage sensor",
        selector: { entity: { domain: "sensor", device_class: "power" } },
      });
    }

    schema.push({
      name: "show_end_time",
      label: "Show end time",
      selector: { boolean: true },
    });

    // The graphic style always shows it
    if (this._config?.style === "simple" || this._config?.style === "minimal") {
      schema.push({
        name: "show_percentage",
        label: "Show progress percentage",
        selector: { boolean: true },
      });
    }

    const coverProgress = {
      name: "cover_progress",
      label: "Fill cover image with print progress",
      selector: { boolean: true },
    };

    // ✅ Conditionally add checkbox
    if (this._config?.style === "simple") {
      schema.push(coverProgress);
      schema.push({
        name: "custom_camera",
        label: "Custom camera",
        selector: { entity: { domain: "camera" } },
      });
      schema.push({
        name: "hide_controls",
        label: "Hide controls",
        selector: { boolean: true },
      });
    }

    if (this._config?.style === "minimal") {
      schema.push({
        name: "show_printer_name",
        label: "Show printer name",
        selector: { boolean: true },
      });

      schema.push({
        name: "show_cover",
        label: "Show cover",
        selector: { boolean: true },
      });

      if (this._config?.show_cover) {
        schema.push(coverProgress);
        schema.push({
          name: "cover_position",
          label: "Cover position",
          selector: {
            select: {
              options: [
                { label: "Left", value: "left" },
                { label: "Right", value: "right" },
              ],
            },
          },
        });
      }

      schema.push({
        name: "show_camera_feed",
        label: "Show camera feed",
        selector: { boolean: true },
      });

      if (this._config?.show_camera_feed) {
        schema.push({
          name: "camera_position",
          label: "Camera position",
          selector: {
            select: {
              options: [
                { label: "Right", value: "right" },
                { label: "Left", value: "left" },
              ],
            },
          },
        });
      }
    }

    return schema;
  }

  _handleValueChanged(ev) {
    const messageEvent = new CustomEvent("config-changed", {
      detail: { config: ev.detail.value },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(messageEvent);
  }

  render() {
    const schema = this._buildSchema();
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${schema}
        .computeLabel=${(s) => s.label}
        @value-changed=${this._handleValueChanged}
      ></ha-form>
    `;
  }
}
