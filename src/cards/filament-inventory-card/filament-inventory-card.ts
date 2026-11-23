import { html, LitElement, nothing } from "lit";
import { state } from "lit/decorators.js";
import { customElement } from "../../utils/custom-element";
import { registerCustomCard } from "../../utils/custom-cards";
import { FILAMENT_INVENTORY_CARD_EDITOR_NAME, FILAMENT_INVENTORY_CARD_NAME } from "./const";
import { styles } from "./card.styles";
import { getSpoolLocations, InventorySpool, spoolLocations, SpoolLocation, weight } from "./inventory";

registerCustomCard({
  type: FILAMENT_INVENTORY_CARD_NAME,
  name: "Bambu Lab Filament Inventory Card",
  description: "Browse and filter your filament inventory",
});

@customElement(FILAMENT_INVENTORY_CARD_NAME)
export class FilamentInventoryCard extends LitElement {
  static styles = styles;
  @state() private _config: any = {};
  @state() private _hass: any;
  @state() private _spools: InventorySpool[] = [];
  @state() private _loading = false;
  @state() private _error = "";
  @state() private _search = "";
  @state() private _printer = "";
  @state() private _brand = "";
  @state() private _type = "";
  @state() private _collapsed = new Set<string>();
  private _sensorVersion = "";
  private _request = 0;
  private _timer?: ReturnType<typeof setInterval>;

  static async getConfigElement() {
    await import("./filament-inventory-card-editor");
    return document.createElement(FILAMENT_INVENTORY_CARD_EDITOR_NAME);
  }

  static getStubConfig() { return {}; }

  getCardSize() { return 6; }

  public setConfig(config: any): void {
    const changed = config.inventory !== this._config.inventory;
    this._config = config;
    if (changed) {
      this._request++;
      this._spools = [];
      this._error = "";
      this._loading = false;
      this._sensorVersion = "";
      this._printer = this._brand = this._type = "";
      if (this.isConnected && this._hass && config.inventory) this._refresh();
    }
  }

  set hass(hass: any) {
    this._hass = hass;
    const sensor = (Object.values(hass?.entities || {}) as any[]).find((entity) =>
      entity.device_id === this._config.inventory && entity.platform === "bambu_lab" && entity.translation_key === "filament_inventory"
    );
    const version = sensor ? JSON.stringify(hass.states?.[sensor.entity_id]?.attributes?.spools) : "";
    if (version && version !== this._sensorVersion) {
      this._sensorVersion = version;
      if (this.isConnected && this._config.inventory) this._refresh();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this._hass && this._config.inventory) this._refresh();
    this._timer = setInterval(() => { if (this._hass && this._config.inventory) this._refresh(); }, 60000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this._timer);
    this._request++;
  }

  private async _refresh(): Promise<void> {
    const request = ++this._request;
    this._loading = true;
    try {
      const result = await this._hass.callService("bambu_lab", "get_filament_inventory", {
        device_id: this._config.inventory,
      }, undefined, true, true);
      if (request !== this._request) return;
      const response = result?.response;
      if (response?.error) throw new Error(response.error);
      if (!Array.isArray(response?.hits)) throw new Error("Invalid inventory response");
      this._spools = response.hits.filter((hit) => hit && typeof hit === "object" && !Array.isArray(hit));
      this._error = "";
    } catch (error) {
      if (request !== this._request) return;
      this._error = error instanceof Error ? error.message : "Unable to load filament inventory";
    } finally {
      if (request === this._request) this._loading = false;
    }
  }

  private _options(values: string[]) {
    return [...new Set(values.filter(Boolean))].sort((first, second) => first.localeCompare(second));
  }

  private _spoolName(spool: InventorySpool): string {
    return [spool.filamentVendor, spool.filamentName || spool.filamentType].filter(Boolean).join(" ") || "Unnamed filament";
  }

  private _renderSpool(spool: InventorySpool, locations: SpoolLocation[]) {
    const color = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(spool.color || "") ? spool.color!.slice(0, 7) : "transparent";
    const colorLabel = /^#[0-9a-f]{6}ff$/i.test(spool.color || "") ? spool.color!.slice(0, 7) : spool.color;
    const remaining = weight(spool.netWeight);
    const total = weight(spool.totalNetWeight);
    const weightLabel = `${remaining === undefined ? "Unknown" : remaining}${total !== undefined ? `/${total}g` : remaining !== undefined ? "g" : ""}`;
    const location = locations.map((item) => [item.printerName, item.deviceName, item.slot == null ? "" : item.slot].filter(Boolean).join(" · ")).join(", ");
    const meta = [spool.displayName, spool.filamentType, colorLabel, location, spool.note].filter(Boolean).join(" · ");
    return html`<div class="row" style=${`--weight-label-space: ${Math.max(10, weightLabel.length)}ch`}>
      <div class="swatch" style=${`background-color: ${color}`} aria-label=${`Color ${colorLabel || "unknown"}`}></div>
      <div class="name">${this._spoolName(spool)}</div>
      <div class="meta">${meta}</div>
      <div class="remaining">${remaining === undefined ? "Unknown" : remaining}${total !== undefined ? html`<small>/${total}g</small>` : remaining !== undefined ? "g" : nothing}
        ${remaining !== undefined && total !== undefined && total > 0 ? html`<div class="bar" role="progressbar" aria-label="Filament remaining" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(Math.min(100, remaining / total * 100))}><div class="bar-fill" style=${`width: ${Math.min(100, remaining / total * 100)}%`}></div></div>` : nothing}
      </div>
    </div>`;
  }

  render() {
    const locations = getSpoolLocations(this._hass);
    const printers = new Map<string, string>();
    for (const spool of this._spools) for (const location of spoolLocations(spool, locations)) printers.set(location.printerId, location.printerName);
    const brands = this._options(this._spools.map((spool) => spool.filamentVendor || ""));
    const types = this._options(this._spools.map((spool) => spool.filamentType || ""));
    const search = this._search.trim().toLocaleLowerCase();
    const filtered = this._spools.filter((spool) => {
      const spoolLocation = spoolLocations(spool, locations);
      return (!this._printer || (this._printer === "__loaded__" ? spoolLocation.length > 0 : spoolLocation.some((item) => item.printerId === this._printer))) &&
        (!this._brand || spool.filamentVendor === this._brand) && (!this._type || spool.filamentType === this._type) &&
        (!search || [spool.filamentVendor, spool.filamentName, spool.displayName, spool.filamentType, spool.filamentId, spool.color, spool.trayIdName, spool.note, ...spoolLocation.map((item) => item.printerName)].some((value) => String(value || "").toLocaleLowerCase().includes(search)));
    });
    const groups = new Map<string, InventorySpool[]>();
    for (const spool of filtered) {
      const key = this._spoolName(spool);
      groups.set(key, [...(groups.get(key) || []), spool]);
    }
    return html`<ha-card>
      <div class="header"><h2>Filament Inventory</h2><span class="count">${filtered.length} ${filtered.length === 1 ? "spool" : "spools"}</span></div>
      <div class="toolbar">
        <input type="search" aria-label="Search filament" placeholder="Search filament" .value=${this._search} @input=${(event) => this._search = event.target.value}>
        <select aria-label="Filter by printer" .value=${this._printer} @change=${(event) => this._printer = event.target.value}>
          <option value="">All locations</option><option value="__loaded__">In a printer</option>
          ${[...printers].sort((first, second) => first[1].localeCompare(second[1])).map(([id, name]) => html`<option value=${id}>${name}</option>`)}
        </select>
        <select aria-label="Filter by brand" .value=${this._brand} @change=${(event) => this._brand = event.target.value}><option value="">All brands</option>${brands.map((brand) => html`<option value=${brand}>${brand}</option>`)}</select>
        <select aria-label="Filter by material type" .value=${this._type} @change=${(event) => this._type = event.target.value}><option value="">All materials</option>${types.map((type) => html`<option value=${type}>${type}</option>`)}</select>
        <button class="icon-button" title="Refresh inventory" aria-label="Refresh inventory" @click=${this._refresh} ?disabled=${this._loading || !this._config.inventory}><ha-icon icon="mdi:refresh"></ha-icon></button>
      </div>
      ${!this._config.inventory ? html`<div class="message">Select a filament inventory device in the card editor.</div>` : nothing}
      ${this._error ? html`<div class="message error" role="alert">${this._error}</div>` : nothing}
      ${this._config.inventory && this._loading && !this._spools.length ? html`<div class="message">Loading inventory...</div>` : nothing}
      ${this._config.inventory && !this._loading && !this._error && !filtered.length ? html`<div class="message">${this._spools.length ? "No filaments match the selected filters." : "No filaments in this inventory."}</div>` : nothing}
      ${[...groups].sort((first, second) => first[0].localeCompare(second[0])).map(([name, spools]) => {
        const collapsed = this._collapsed.has(name);
        const weights = spools.map((spool) => weight(spool.netWeight)).filter((value): value is number => value !== undefined);
        const total = weights.reduce((sum, value) => sum + value, 0);
        return html`<div class="group"><button class="group-heading" aria-expanded=${!collapsed} @click=${() => { const next = new Set(this._collapsed); collapsed ? next.delete(name) : next.add(name); this._collapsed = next; }}>
          <ha-icon icon=${collapsed ? "mdi:chevron-right" : "mdi:chevron-down"}></ha-icon><span class="group-name">${name}</span><span class="group-meta">${spools.length} · ${weights.length ? `${total.toLocaleString()} g${weights.length < spools.length ? " + unknown" : ""}` : "Unknown weight"}</span>
        </button>${collapsed ? nothing : spools.map((spool) => this._renderSpool(spool, spoolLocations(spool, locations)))}</div>`;
      })}
    </ha-card>`;
  }
}