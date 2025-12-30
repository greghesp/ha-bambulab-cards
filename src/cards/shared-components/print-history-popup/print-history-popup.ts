import { customElement, property, state, query } from "lit/decorators.js";
import { html, LitElement, nothing, TemplateResult } from "lit";
import { hassContext } from "../../../utils/context";
import { consume } from "@lit/context";
import styles from "./print-history-popup.styles.js";
import * as helpers from "../../../utils/helpers";
import { css } from "lit";
import { PrintSettingsPopup } from './print-settings-popup';

interface FileCacheFile {
  filename: string;
  type: string;
  size: number;
  size_human: string;
  modified: string;
  thumbnail_path?: string;
  printer_name: string;
  printer_serial: string;
  path: string;
  printer_model: string;
}

interface PrinterOption {
  serial: string;
  name: string;
}

@customElement("print-history-popup")
export class PrintHistoryPopup extends LitElement {
  @property() public device_serial: string = "";
  @property() public device_id: string = "";
  @property({ type: Boolean }) public controlBlocked: boolean = true;

  @consume({ context: hassContext, subscribe: true })
  @state() public _hass;

  @state() private _files: FileCacheFile[] = [];
  @state() private _loading: boolean = false;
  @state() private _error: string | null = null;
  @state() private _show: boolean = false;
  private _scrollHandler: ((e: Event) => void) | null = null;
  @state() private _searchQuery: string = "";
  @state() private _activeTab: number = 0;
  @state() private _timelapseFiles: FileCacheFile[] = [];
  @state() private _timelapseLoading: boolean = false;
  @state() private _timelapseError: string | null = null;
  @state() private _openTimelapseVideo: string | null = null;
  @state() private _selectedPrinter: string = "compatible";
  @state() private _allFiles: FileCacheFile[] = [];
  @state() private _allFilesSizeBytes: number = 0;
  @state() private _allTimelapseFiles: FileCacheFile[] = [];
  @state() private _allTimelapseFilesSizeBytes: number = 0;

  private _allPrinters = new Set<string>();
  private _compatiblePrinters = new Set<string>();
  private _printerOptions: PrinterOption[] = [];

  @query('print-settings-popup') private _overlay!: PrintSettingsPopup;

  private _model: string = "";

  private _thumbnailUrls = new Map<string, string | null>();
  private _thumbnailLoading: Map<string, Promise<string | null>> = new Map();

  static styles = styles;

  static _thumbRequests = 0;

  connectedCallback() {
    super.connectedCallback();
    this.#initializeModel();
    this._updateContent();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.body.style.overflow = '';
  }

  updated(changedProperties) {
    if (changedProperties.has("device_serial")) {
      this._updateContent();
    }
  }

  show() {
    this._selectedPrinter = this.device_serial;
    this.#changeTab(0);
    this._show = true;
    document.body.style.overflow = 'hidden';
  }

  hide() {
    this._show = false;
    this._openTimelapseVideo = null;
    document.body.style.overflow = '';
  }

  async _updateContent() {
    if (!this.device_serial) {
      return;
    }

    this.requestUpdate();
  }

  #initializeModel() {
    if (!this._model) {
      this._model = this._hass.devices[this.device_id!]?.model?.toUpperCase() || "";
      if (this._model == "A1 MINI") {
        this._model = "A1MINI";
      }
    }
  }

  #formatBytesRounded(bytes: number): string {
    if (bytes === 0) return "None";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = Math.round(bytes / Math.pow(k, i));

    return `${value} ${sizes[i]}`;
  }

  async _refreshFiles() {
    this._loading = true;
    this._error = null;
    this.requestUpdate();

    try {
      // Use the new print history API endpoint
      const url = `/api/bambu_lab/print_history`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this._hass.auth.data.access_token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      //console.log('[FileCachePopup] _refreshFiles() - API result:', result);

      if (result && result.files) {
        // Store all files unfiltered
        this._allFiles = result.files;
        this._allFilesSizeBytes = result.total_size_bytes;
        // Filter by selected printer if not "all"
        let filteredFiles = result.files;
        if (this._selectedPrinter === "all") {
          // Leave all entries in the list.
        } else if (this._selectedPrinter === "compatible") {
          filteredFiles = result.files.filter((file: FileCacheFile) =>
            helpers.areModelsCompatible(this._model, file.printer_model)
          );
        } else {
          filteredFiles = result.files.filter((file: FileCacheFile) =>
            file.printer_serial === this._selectedPrinter
          );
        }
        this._files = filteredFiles;
      }
    } catch (error) {
      console.error('[FileCachePopup] _refreshFiles() - error:', error);
      this._error = error instanceof Error ? error.message : String(error);
    }
    
    // Get unique printers for filter dropdown from all unfiltered data
    this._allPrinters = new Set<string>();
    this._compatiblePrinters = new Set<string>();
    this._allFiles.forEach(file => {
      this._allPrinters.add(file.printer_serial);
      if (helpers.areModelsCompatible(this._model, file.printer_model)) {
        this._compatiblePrinters.add(file.printer_serial)
      }
    });
    this._allTimelapseFiles.forEach(file => {
      this._allPrinters.add(file.printer_serial);
      if (helpers.areModelsCompatible(this._model, file.printer_model)) {
        this._compatiblePrinters.add(file.printer_serial)
      }
    });

    this._printerOptions = Array.from(this._allPrinters).map(serial => ({
      serial,
      name: this._allFiles.find(f => f.printer_serial === serial)?.printer_name ||
            this._allTimelapseFiles.find(f => f.printer_serial === serial)?.printer_name ||
            serial
    }));

    this._loading = false;
    this.requestUpdate();
  }

  async _refreshTimelapseFiles() {
    this._timelapseLoading = true;
    this._timelapseError = null;
    try {
      // Use the new videos API endpoint
      const url = `/api/bambu_lab/videos`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this._hass.auth.data.access_token}`,
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      //console.log('[FileCachePopup] _refreshTimelapseFiles() - API result:', result);
      if (result && result.videos) {
        // Store all timelapse files unfiltered
        this._allTimelapseFiles = result.videos;
        this._allTimelapseFilesSizeBytes = result.total_size_bytes;
        // Filter by selected printer if not "all"
        let filteredFiles = result.videos;
        if ((this._selectedPrinter !== "all") && (this._selectedPrinter !== "compatible")) {
          filteredFiles = result.videos.filter((file: FileCacheFile) =>
            file.printer_serial === this._selectedPrinter
          );
        }
        this._timelapseFiles = filteredFiles;
      }
    } catch (error) {
      this._timelapseError = error instanceof Error ? error.message : String(error);
    } finally {
      this._timelapseLoading = false;
      this.requestUpdate();
    }
  }

  async #showPrintDialog(file: FileCacheFile) {
    this._overlay.selected_file = file;
    this._overlay.thumbnail = this._getThumbnailUrl(file)!
    this._overlay.style.display = 'block';
  }

  _getThumbnailUrl(file: FileCacheFile) {
    const cacheKey = file.thumbnail_path ?? "";

    if (!file.thumbnail_path) {
      this._thumbnailUrls.set(cacheKey, null);
      return null;
    }

    // Already loaded
    if (this._thumbnailUrls.has(cacheKey)) {
      return this._thumbnailUrls.get(cacheKey);
    }

    // Already loading
    if (this._thumbnailLoading.has(cacheKey)) {
      // attach a “then” to re-render when the in-flight request finishes
      this._thumbnailLoading.get(cacheKey)!.then(() => this.requestUpdate());
      return null;
    }

    // Not loaded and not loading → start fetch
    const fetchPromise = this._loadThumbnail(file, cacheKey);
    this._thumbnailLoading.set(cacheKey, fetchPromise);

    // ensure UI updates when done
    fetchPromise.then(() => this.requestUpdate());

    return null;
  }

  async _loadThumbnail(file: FileCacheFile, cacheKey: string): Promise<string | null> {
    try {
      const url = `/api/bambu_lab/file_cache/${file.thumbnail_path}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this._hass.auth.data.access_token}`,
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch thumbnail:', response.status);
        this._thumbnailUrls.set(cacheKey, null);
        return null;
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      this._thumbnailUrls.set(cacheKey, blobUrl);
      return blobUrl;
    } catch (e) {
      console.error('Error fetching thumbnail:', e);
      this._thumbnailUrls.set(cacheKey, null);
      return null;
    } finally {
      this._thumbnailLoading.delete(cacheKey);
    }
  }

  _getFileIcon(type: string) {
    const icons = {
      '3mf': '📦',
      'gcode': '⚙️',
      'timelapse': '🎬',
      'unknown': '📄'
    };
    const icon = icons[type] || icons.unknown;
    return icon;
  }

  _formatDate(dateString: string) {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString();
    return formatted;
  }

  #changeTab(index) {
    this._activeTab = index;
    this._openTimelapseVideo = null;
    if (index == 0) {
      this._refreshFiles();
    } else if (index == 1) {
      this._refreshTimelapseFiles();
    }
    this.requestUpdate();
  }

  render() {
    if (!this._show) {
      return nothing;
    }

    // Tab bar
    const tabLabels = ["Print History", "Timelapse Videos"];
    const renderTabs = html`
      <div class="print-history-tabs">
        ${tabLabels.map((label, i) => html`
          <div class="print-history-tab${this._activeTab === i ? ' active' : ''}"
               @click=${() => { this.#changeTab(i) }}>
            ${label}
          </div>
        `)}
      </div>
    `;

    // Print History Tab
    const filteredFiles = this._files.filter(file =>
      file.filename.toLowerCase().includes(this._searchQuery.toLowerCase())
    );

    const renderPrintHistoryGrid = html`
      <div class="print-history-controls">
        <div class="print-history-filters">
          <select class="printer-filter" @change=${(e) => { this._selectedPrinter = e.target.value; this._refreshFiles(); }}>
            <option value="all" ?selected=${this._selectedPrinter === "all"}>All Prints</option>
            <option value="compatible" ?selected=${this._selectedPrinter === "compatible"}>Compatible Prints</option>
            ${this._printerOptions.map(printer => html`
              <option value="${printer.serial}" ?selected=${this._selectedPrinter === printer.serial}>
                ${printer.name}
              </option>
            `)}
          </select>
          <input
            type="text"
            class="print-history-search"
            placeholder="Search by filename..."
            .value=${this._searchQuery}
            @input=${(e: any) => { this._searchQuery = e.target.value; }}
          />
        </div>
        <div>
          Cache size: ${this.#formatBytesRounded(this._allFilesSizeBytes)}
        </div>
      </div>
      ${this._error ? html`
        <div class="print-history-error">${this._error}</div>
      ` : nothing}
      ${this._loading ? html`
        <div class="print-history-loading">Loading files...</div>
      ` : filteredFiles.length === 0 ? html`
        <div class="print-history-empty">
          <div class="print-history-empty-icon">📁</div>
          <div>No cached files found</div>
          <div class="print-history-empty-subtitle">
            Enable file cache in your Bambu Lab integration settings
          </div>
        </div>
      ` : html`
        <div class="print-history-grid">
          ${filteredFiles.map(file => html`
            <div class="print-history-card">
                <div class="print-history-thumbnail">
                  ${(() => {
                    const cacheKey = file.thumbnail_path ?? "";
                    const thumbnailUrl = this._thumbnailUrls.get(cacheKey);
                    if (thumbnailUrl) {
                        return html`<img src="${thumbnailUrl}"
                                        alt="${file.filename}"
                                        @error=${(e) => e.target.style.display = 'none'}>`;
                    } else {
                        this._getThumbnailUrl(file); // Start loading
                        return html`<div class="print-history-placeholder">
                        ${this._getFileIcon(file.type)}
                        </div>`;
                    }
                  })()}
              </div>
              <div class="print-history-info">
                <div class="print-history-content">
                  <div class="print-history-name">${file.filename}</div>
                  <div class="print-history-meta">
                    ${file.size_human} • ${this._formatDate(file.modified)}
                    ${file.printer_name ? html`<br><small>${file.printer_name}</small>` : nothing}
                  </div>
                </div>
                
                <button
                    class="print-history-print-btn"
                    @click=${() => this.#showPrintDialog(file)}
                    ?disabled=${this.controlBlocked}>
                  <ha-icon icon="mdi:printer-3d"></ha-icon>
                  Print Again
                </button>
              </div>
            </div>
          `)}
        </div>
      `}`;

    // Timelapse Tab
    const renderTimelapseGrid = html`
      <div class="print-history-controls">
        <div class="print-history-filters">
          <select class="printer-filter" @change=${(e) => { this._selectedPrinter = e.target.value; this._refreshTimelapseFiles(); }}>
            <option value="all">All Printers</option>
            ${this._printerOptions.map(printer => html`
              <option value="${printer.serial}" ?selected=${this._selectedPrinter === printer.serial}>
                ${printer.name}
              </option>
            `)}
          </select>
        </div>
        <div class="print-history-cache-size">
          Cache size: ${this.#formatBytesRounded(this._allTimelapseFilesSizeBytes)}
        </div>
      </div>
      ${this._timelapseError ? html`<div class="print-history-error">${this._timelapseError}</div>` : nothing}
      ${this._timelapseLoading ? html`<div class="print-history-loading">Loading timelapse videos...</div>` :
        this._timelapseFiles.length === 0 ? html`
          <div class="print-history-empty">
            <div class="print-history-empty-icon">🎬</div>
            <div>No timelapse videos found</div>
          </div>
        ` : html`
          <div class="print-history-grid">
            ${this._timelapseFiles.map(file => {
              const isOpen = this._openTimelapseVideo === file.filename;
              const isAvi = file.filename.toLowerCase().endsWith('.avi');
              const videoUrl = `/local/media/ha-bambulab/${file.path}`;
              return html`
                <div class="print-history-card" style="position:relative;">
                  <div class="print-history-thumbnail" style="position:relative;">
                    ${isAvi
                      ? html`
                          ${(() => {
                            const cacheKey = file.thumbnail_path ?? "";
                            const thumbnailUrl = this._thumbnailUrls.get(cacheKey);
                            if (thumbnailUrl) {
                              return html`<img src="${thumbnailUrl}" alt="${file.filename}">`;
                            } else {
                              this._getThumbnailUrl(file); // Start loading
                              return html`<div class="print-history-placeholder">${this._getFileIcon(file.type)}</div>`;
                            }
                          })()}
                          <div class="timelapse-overlay">
                            ${this._formatDate(file.modified)}
                          </div>
                        `
                      : isOpen
                        ? html`<video controls width="100%" src="${videoUrl}" style="border-radius:8px;max-width:100%;max-height:210px;background:#000;"></video>`
                        : html`
                            ${(() => {
                              const cacheKey = file.thumbnail_path ?? "";
                              const thumbnailUrl = this._thumbnailUrls.get(cacheKey);
                              if (thumbnailUrl) {
                                return html`<img src="${thumbnailUrl}" alt="${file.filename}" style="cursor:pointer;" @click=${() => { this._openTimelapseVideo = file.filename; this.requestUpdate(); }} @error=${(e) => e.target.style.display = 'none'}>`;
                              } else {
                                this._getThumbnailUrl(file); // Start loading
                                return html`<div class="print-history-placeholder" style="cursor:pointer;" @click=${() => { this._openTimelapseVideo = file.filename; this.requestUpdate(); }}>${this._getFileIcon(file.type)}</div>`;
                              }
                            })()}
                            <div class="timelapse-overlay">
                              ${this._formatDate(file.modified)}
                            </div>
                          `
                    }
                  </div>
                  <a class="timelapse-download-btn" href="${videoUrl}" download target="_blank" title="Download video">
                    ⬇ Download
                  </a>
                  ${file.printer_name ? html`<div class="printer-info">${file.printer_name}</div>` : nothing}
                </div>
              `;
            })}
          </div>
        `
      }
    `;

    return html`
      <div class="print-history-overlay" @click=${this.hide}>
        <div class="print-history-popup" @click=${(e) => e.stopPropagation()}>
          <div class="print-history-header">
            ${renderTabs}
            <button class="print-history-close" @click=${this.hide}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          ${this._activeTab === 0 ? html`
            ${renderPrintHistoryGrid}
          ` : html`
            ${renderTimelapseGrid}
          `}
        </div>
      </div>    
      <print-settings-popup
        style="display: none;"
        .hass=${this._hass} 
        .device_serial=${this.device_serial} 
        .device_id=${this.device_id} 
        @close=${this.hide}>
      </print-settings-popup>
    `;
  }
}