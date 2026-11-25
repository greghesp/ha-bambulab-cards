import { property, state, query } from "lit/decorators.js";
import { customElement } from "../../../utils/custom-element";
import { html, LitElement, nothing, TemplateResult } from "lit";
import { hassContext } from "../../../utils/context";
import { consume } from "@lit/context";
import styles from "./print-history-popup.styles.js";
import * as helpers from "../../../utils/helpers";
import { css } from "lit";
import { PrintSettingsPopup } from './print-settings-popup';
import "../confirmation-prompt/confirmation-prompt";

// How long a signed timelapse URL stays valid. Long enough to watch or download one video.
const SIGNED_PATH_EXPIRY_SECONDS = 3600;

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
  printer_device_id: string;
}

interface PrinterOption {
  serial: string;
  name: string;
  device_id: string;
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
  @state() private _openTimelapseVideoUrl: string | null = null;
  @state() private _selectedPrinter: string = "compatible";
  @state() private _allFiles: FileCacheFile[] = [];
  @state() private _allFilesSizeBytes: number = 0;
  @state() private _deletingFiles = new Set<string>();
  @state() private _allTimelapseFiles: FileCacheFile[] = [];
  @state() private _allTimelapseFilesSizeBytes: number = 0;
  @state() private _pendingCacheClear: "all" | "prints" | "timelapse" | null = null;
  @state() private _clearingCache: boolean = false;
  private _pendingCacheClearDeviceIds: string[] = [];

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
    this.#closeTimelapse();
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

  #formatMegabytes(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  #countModels(files: FileCacheFile[]): number {
    return files.filter((file) => file.filename.toLowerCase().endsWith(".3mf")).length;
  }

  #countTimelapses(files: FileCacheFile[]): number {
    return files.filter((file) => /\.(mp4|avi|mov)$/i.test(file.filename)).length;
  }

  #sumFileSizes(files: FileCacheFile[]): number {
    return files.reduce((total, file) => total + file.size, 0);
  }

  #updatePrinterOptions() {
    this._allPrinters = new Set<string>();
    this._compatiblePrinters = new Set<string>();
    const files = [...this._allFiles, ...this._allTimelapseFiles];

    files.forEach(file => {
      this._allPrinters.add(file.printer_serial);
      if (helpers.areModelsCompatible(this._model, file.printer_model)) {
        this._compatiblePrinters.add(file.printer_serial);
      }
    });

    this._printerOptions = Array.from(this._allPrinters).map(serial => {
      const printFile = this._allFiles.find(file => file.printer_serial === serial);
      const timelapseFile = this._allTimelapseFiles.find(file => file.printer_serial === serial);
      return {
        serial,
        name: printFile?.printer_name || timelapseFile?.printer_name || serial,
        device_id: printFile?.printer_device_id || timelapseFile?.printer_device_id || "",
      };
    });
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
    
    this.#updatePrinterOptions();

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
      this.#updatePrinterOptions();
      this.requestUpdate();
    }
  }

  async #deleteFile(file: FileCacheFile) {
    const isTimelapse = this._allTimelapseFiles.some((entry) => entry.path === file.path);
    this._deletingFiles = new Set(this._deletingFiles).add(file.path);
    if (isTimelapse) {
      this._timelapseError = null;
    } else {
      this._error = null;
    }

    try {
      await this._hass.callService("bambu_lab", "delete_cached_file", {
        device_id: file.printer_device_id,
        path: file.path.slice(file.printer_serial.length + 1),
      });

      if (isTimelapse) {
        this._allTimelapseFiles = this._allTimelapseFiles.filter((entry) => entry.path !== file.path);
        this._timelapseFiles = this._timelapseFiles.filter((entry) => entry.path !== file.path);
        this._allTimelapseFilesSizeBytes = Math.max(0, this._allTimelapseFilesSizeBytes - file.size);
        if (this._openTimelapseVideo === file.filename) this.#closeTimelapse();
      } else {
        this._allFiles = this._allFiles.filter((entry) => entry.path !== file.path);
        this._files = this._files.filter((entry) => entry.path !== file.path);
        this._allFilesSizeBytes = Math.max(0, this._allFilesSizeBytes - file.size);
      }

      if (file.thumbnail_path) {
        const thumbnailUrl = this._thumbnailUrls.get(file.thumbnail_path);
        if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
        this._thumbnailUrls.delete(file.thumbnail_path);
      }

      if (isTimelapse) {
        await this._refreshTimelapseFiles();
      } else {
        await this._refreshFiles();
      }
    } catch (error) {
      console.error('[FileCachePopup] Failed to delete cached file:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (isTimelapse) {
        this._timelapseError = message;
      } else {
        this._error = message;
      }
    } finally {
      const deletingFiles = new Set(this._deletingFiles);
      deletingFiles.delete(file.path);
      this._deletingFiles = deletingFiles;
    }
  }

  #requestCacheClear(fileType: "all" | "prints" | "timelapse") {
    const files = fileType === "prints"
      ? this._files
      : fileType === "timelapse"
        ? this._timelapseFiles
        : [...this._files, ...this._timelapseFiles];

    if (this._selectedPrinter === "all" || this._selectedPrinter === "compatible") {
      this._pendingCacheClearDeviceIds = [...new Set(files.map(file => file.printer_device_id).filter(Boolean))];
    } else {
      const selectedOption = this._printerOptions.find(option => option.serial === this._selectedPrinter);
      const selectedFile = files.find(file => file.printer_serial === this._selectedPrinter);
      const deviceId = selectedOption?.device_id || selectedFile?.printer_device_id ||
        (this._selectedPrinter === this.device_serial ? this.device_id : "");
      this._pendingCacheClearDeviceIds = deviceId ? [deviceId] : [];
    }

    this._pendingCacheClear = fileType;
  }

  #dismissCacheClear() {
    this._pendingCacheClear = null;
  }

  async #confirmCacheClear() {
    const fileType = this._pendingCacheClear;
    if (!fileType || this._clearingCache) return;

    this._pendingCacheClear = null;
    this._clearingCache = true;
    if (fileType !== "timelapse") this._error = null;
    if (fileType !== "prints") this._timelapseError = null;

    try {
      if (this._pendingCacheClearDeviceIds.length === 0) {
        throw new Error("No printer device found for the current selection");
      }

      await Promise.all(this._pendingCacheClearDeviceIds.map(device_id =>
        this._hass.callService("bambu_lab", "clear_file_cache", {
          device_id,
          file_type: fileType,
        })
      ));

      if (fileType === "all" || fileType === "prints") {
        await this._refreshFiles();
      }
      if (fileType === "all" || fileType === "timelapse") {
        await this._refreshTimelapseFiles();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (fileType !== "timelapse") this._error = message;
      if (fileType !== "prints") this._timelapseError = message;
    } finally {
      this._clearingCache = false;
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

  // Cached files are only served by the authenticated file_cache API. A <video> or
  // download link can't send an Authorization header, so give it a signed path.
  async #signFileCachePath(file: FileCacheFile): Promise<string> {
    const path = file.path.split('/').map(encodeURIComponent).join('/');
    const result = await this._hass.callWS({
      type: 'auth/sign_path',
      path: `/api/bambu_lab/file_cache/${path}`,
      expires: SIGNED_PATH_EXPIRY_SECONDS,
    });
    return result.path;
  }

  #closeTimelapse() {
    this._openTimelapseVideo = null;
    this._openTimelapseVideoUrl = null;
  }

  async #openTimelapse(file: FileCacheFile) {
    this._openTimelapseVideo = file.filename;
    this._openTimelapseVideoUrl = null;
    try {
      const url = await this.#signFileCachePath(file);
      if (this._openTimelapseVideo === file.filename) {
        this._openTimelapseVideoUrl = url;
      }
    } catch (e) {
      console.error('Error signing timelapse path:', e);
      this._timelapseError = 'Failed to load timelapse video';
      this.#closeTimelapse();
    }
  }

  async #downloadTimelapse(file: FileCacheFile) {
    try {
      const link = document.createElement('a');
      link.href = await this.#signFileCachePath(file);
      link.download = file.filename;
      link.click();
    } catch (e) {
      console.error('Error signing timelapse path:', e);
      this._timelapseError = 'Failed to download timelapse video';
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
    this.#closeTimelapse();
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
        <div class="print-history-cache-size">
          <span>${this.#countModels(filteredFiles)} models / ${this.#formatMegabytes(this.#sumFileSizes(filteredFiles))}</span>
          <button
            class="print-history-clear-btn"
            type="button"
            @click=${() => this.#requestCacheClear("prints")}
            ?disabled=${this._clearingCache}>
            Clear Cache
          </button>
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
                  <button
                    class="print-history-delete-btn"
                    title=${this._deletingFiles.has(file.path) ? 'Deleting' : 'Delete'}
                    aria-label=${this._deletingFiles.has(file.path) ? 'Deleting print' : 'Delete print'}
                    @click=${() => this.#deleteFile(file)}
                    ?disabled=${this._deletingFiles.has(file.path)}>
                    <ha-icon icon="mdi:delete"></ha-icon>
                  </button>
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
          <span>${this.#countTimelapses(this._timelapseFiles)} timelapses / ${this.#formatMegabytes(this.#sumFileSizes(this._timelapseFiles))}</span>
          <button
            class="print-history-clear-btn"
            type="button"
            @click=${() => this.#requestCacheClear("timelapse")}
            ?disabled=${this._clearingCache}>
            Clear Cache
          </button>
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
          <div class="print-history-grid timelapse-grid">
            ${this._timelapseFiles.map(file => {
              const isOpen = this._openTimelapseVideo === file.filename;
              const isAvi = file.filename.toLowerCase().endsWith('.avi');
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
                        `
                      : isOpen
                        ? this._openTimelapseVideoUrl
                          ? html`<video controls width="100%" src="${this._openTimelapseVideoUrl}" style="border-radius:8px;max-width:100%;max-height:210px;background:#000;"></video>`
                          : html`<div class="print-history-loading">Loading video...</div>`
                        : html`
                            ${(() => {
                              const cacheKey = file.thumbnail_path ?? "";
                              const thumbnailUrl = this._thumbnailUrls.get(cacheKey);
                              if (thumbnailUrl) {
                                return html`<img src="${thumbnailUrl}" alt="${file.filename}" style="cursor:pointer;" @click=${() => this.#openTimelapse(file)} @error=${(e) => e.target.style.display = 'none'}>`;
                              } else {
                                this._getThumbnailUrl(file); // Start loading
                                return html`<div class="print-history-placeholder" style="cursor:pointer;" @click=${() => this.#openTimelapse(file)}>${this._getFileIcon(file.type)}</div>`;
                              }
                            })()}
                          `
                    }
                    <button
                      class="timelapse-download-btn"
                      type="button"
                      title="Download video"
                      aria-label="Download video"
                      @click=${() => this.#downloadTimelapse(file)}>
                      <ha-icon icon="mdi:download"></ha-icon>
                    </button>
                    <button
                      class="print-history-delete-btn"
                      type="button"
                      title=${this._deletingFiles.has(file.path) ? 'Deleting' : 'Delete timelapse'}
                      aria-label=${this._deletingFiles.has(file.path) ? 'Deleting timelapse' : 'Delete timelapse'}
                      ?disabled=${this._deletingFiles.has(file.path)}
                      @click=${() => this.#deleteFile(file)}>
                      <ha-icon icon="mdi:delete"></ha-icon>
                    </button>
                  </div>
                  <div class="timelapse-info">
                    ${file.printer_name ? html`<span class="timelapse-printer-name">${file.printer_name}</span>` : nothing}
                    <span class="timelapse-date">${this._formatDate(file.modified)}</span>
                  </div>
                </div>
              `;
            })}
          </div>
        `
      }
    `;

    return html`
      ${this._pendingCacheClear ? html`
        <confirmation-prompt
          .title=${"Warning"}
          .body=${this._pendingCacheClear === "timelapse"
            ? html`This will permanently delete all cached timelapse videos. Continue?`
            : this._pendingCacheClear === "prints"
              ? html`This will permanently delete all cached print models. Continue?`
              : html`This will permanently delete all cached files. Continue?`}
          .primaryActionText=${"Clear Cache"}
          .secondaryActionText=${"Cancel"}
          .primaryAction=${this.#confirmCacheClear.bind(this)}
          .secondaryAction=${this.#dismissCacheClear.bind(this)}
          .onClose=${this.#dismissCacheClear.bind(this)}>
        </confirmation-prompt>
      ` : nothing}
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
