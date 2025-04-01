import { customElement, state } from "lit/decorators.js";
import { registerCustomCard } from "../../utils/custom-cards";
import { EXAMPLE_CARD_EDITOR_NAME, EXAMPLE_CARD_NAME } from "./const";
import { html, nothing } from "lit";
import EntityProvider from "../shared-components/entity-provider";

registerCustomCard({
  type: EXAMPLE_CARD_NAME,
  name: "Bambu Lab Example Card",
  description: "Card for Example",
});

@customElement(EXAMPLE_CARD_NAME)
export class ExampleCard extends EntityProvider {
  @state() private _config?;

  public getLayoutOptions() {
    return {
      grid_rows: 2,
      grid_columns: 2,
      grid_min_rows: 2,
      grid_min_columns: 2,
    };
  }

  public static async getConfigElement() {
    await import("./example-card-editor");
    return document.createElement(EXAMPLE_CARD_EDITOR_NAME);
  }

  static getStubConfig() {
    return { header: "Header Text", subtitle: "Subtitle Text", show_header: true };
  }

  setConfig(config) {
    if (!config.printer) {
      throw new Error("You need to define a device_id");
    }
    this._config = config;
    this._device_id = config.printer;
  }

  render() {
    return html`
      <ha-card>
        <div class="card-content">
          ${this._config?.show_header ? html`<h1>${this._config.header}</h1>` : nothing}
          <p>Subtitle: ${this._config?.subtitle}</p>
        </div>
      </ha-card>
    `;
  }
}
