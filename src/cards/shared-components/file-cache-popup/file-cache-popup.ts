import { customElement, property, state } from "lit/decorators.js";
import { html, LitElement, nothing } from "lit";
import { hassContext } from "../../../utils/context";
import { consume } from "@lit/context";
import styles from "./file-cache-popup.styles.js";

interface FileCacheFile {
  filename: string;
  type: string;
  size_human: string;
  modified: string;
  thumbnail_path?: string;
}

interface PrintSettings {
  plate: number;
  timelapse: boolean;
  bed_leveling: boolean;
  flow_cali: boolean;
  vibration_cali: boolean;
  layer_inspect: boolean;
  use_ams: boolean;
  ams_mapping: string;
}

@customElement("file-cache-popup")
export class FileCachePopup extends LitElement {
  @property() public device_serial: string = "";
  @property() public device_id: string = "";
  @property() public file_type: string = "";
  @property() public max_files: number = 20;

  @consume({ context: hassContext, subscribe: true })
  @state()
  public _hass;

  @state() private _files: FileCacheFile[] = [];
  @state() private _loading: boolean = false;
  @state() private _error: string | null = null;
  @state() private _show: boolean = false;
  @state() private _thumbnailUrls = new Map<string, string | null>();
  @state() private _showPrintSettings: boolean = false;
  @state() private _selectedFile: FileCacheFile | null = null;
  @state() private _printSettings: PrintSettings = {
    plate: 1,
    timelapse: false,
    bed_leveling: true,
    flow_cali: true,
    vibration_cali: true,
    layer_inspect: true,
    use_ams: true,
    ams_mapping: "0"
  };
  @state() private _printLoading: boolean = false;
  private _thumbnailCache = new Map<string, string | null>();
  private _scrollHandler: ((e: Event) => void) | null = null;

  static styles = styles;

  connectedCallback() {
    super.connectedCallback();
    this._updateContent();
  }

  updated(changedProperties) {
    if (changedProperties.has("device_serial")) {
      this._updateContent();
    }
  }

  show() {
    this._show = true;
    this._refreshFiles();
    this._preventBackgroundScroll();
  }

  hide() {
    this._show = false;
    this._showPrintSettings = false;
    this._selectedFile = null;
    this._restoreBackgroundScroll();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._restoreBackgroundScroll();
  }

  async _updateContent() {
    if (!this.device_serial) {
      return;
    }

    this.requestUpdate();
  }

  async _refreshFiles() {
    this._loading = true;
    this._error = null;
    this._thumbnailCache.clear(); // Clear thumbnail cache
    this.requestUpdate();

    try {
      // Use the API endpoint to get file cache data
      const url = `/api/bambu_lab/file_cache/${this.device_serial}?file_type=${this.file_type}`;
      
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
      console.log('[FileCachePopup] _refreshFiles() - API result:', result);
      
      if (result && result.files) {
        this._files = result.files.slice(0, this.max_files);
      }
    } catch (error) {
      console.error('[FileCachePopup] _refreshFiles() - error:', error);
      this._error = error instanceof Error ? error.message : String(error);
      this.requestUpdate();
    } finally {
      this._loading = false;
      this.requestUpdate();
    }
  }

  async _clearCache() {
    if (!confirm('Are you sure you want to clear the file cache?')) {
      return;
    }

    try {
      console.log('[FileCachePopup] _clearCache() - calling service');
      //await this._hass.callService('bambu_lab', 'clear_file_cache', {
      //  entity_id: this.entity_id,
      //  file_type: ''
      //});
      
      console.log('[FileCachePopup] _clearCache() - service call successful, refreshing files');
      // Refresh the file list
      await this._refreshFiles();
    } catch (error) {
      console.error('[FileCachePopup] _clearCache() - error:', error);
      this._error = error instanceof Error ? error.message : String(error);
      this.requestUpdate();
    }
  }

  _showPrintDialog(file: FileCacheFile) {
    this._selectedFile = file;
    this._showPrintSettings = true;
  }

  _hidePrintDialog() {
    this._showPrintSettings = false;
    this._selectedFile = null;
  }

  _updatePrintSetting(key: keyof PrintSettings, value: any) {
    this._printSettings = { ...this._printSettings, [key]: value };
  }

  async _startPrint() {
    if (!this._selectedFile) return;

    this._printLoading = true;
    this.requestUpdate();

    try {
      await this._hass.callService(
            'bambu_lab',
            'print_project_file', 
            {
                device_id: [ this.device_id ],
                filepath: this._selectedFile.filename,
                ...this._printSettings
            }
        );

      this._hidePrintDialog();
      // Show success message or notification
    } catch (error) {
      console.error('[FileCachePopup] _startPrint() - error:', error);
      this._error = error instanceof Error ? error.message : String(error);
      this.requestUpdate();
    } finally {
      this._printLoading = false;
      this.requestUpdate();
    }
  }

  _getThumbnailUrl(file: FileCacheFile) {
    const cacheKey = `${file.filename}-${file.thumbnail_path}`;
    if (this._thumbnailCache.has(cacheKey)) {
      return this._thumbnailCache.get(cacheKey);
    }
    if (!file.thumbnail_path) {
      this._thumbnailCache.set(cacheKey, null);
      return null;
    }
    
    // Start loading the thumbnail asynchronously
    this._loadThumbnail(file, cacheKey);
    
    // Return null initially, will be updated when loaded
    return null;
  }

  async _loadThumbnail(file: FileCacheFile, cacheKey: string) {
    try {
      const url = `/api/bambu_lab/file_cache/${this.device_serial}/media/${this.file_type}/${file.thumbnail_path}`;
      console.log("Fetching thumbnail:", url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this._hass.auth.data.access_token}`,
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch thumbnail:', response.status);
        this._thumbnailCache.set(cacheKey, null);
        return;
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      console.log("Created blob URL:", blobUrl);
      
      this._thumbnailCache.set(cacheKey, blobUrl);
      this._thumbnailUrls.set(cacheKey, blobUrl);
      this.requestUpdate();
    } catch (error) {
      console.error('Error fetching thumbnail:', error);
      this._thumbnailCache.set(cacheKey, null);
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

  _preventBackgroundScroll() {
    // Prevent scroll events from reaching the background
    const preventScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Store the handler so we can remove it later
    this._scrollHandler = preventScroll;

    // Add event listeners to prevent scrolling
    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown' || e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
      }
    });
  }

  _restoreBackgroundScroll() {
    if (this._scrollHandler) {
      document.removeEventListener('wheel', this._scrollHandler);
      document.removeEventListener('touchmove', this._scrollHandler);
      this._scrollHandler = null;
    }
  }

  render() {
    if (!this._show) {
      return nothing;
    }

    return html`
      <div class="file-cache-overlay" @click=${this.hide}>
        <div class="file-cache-popup" @click=${(e) => e.stopPropagation()}>
          <div class="file-cache-header">
            <div class="file-cache-title">Print History</div>
            <button class="file-cache-close" @click=${this.hide}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>

          <div class="file-cache-controls">
            <button class="file-cache-btn secondary" @click=${this._clearCache}>
              Clear Cache
            </button>
          </div>

          ${this._error ? html`
            <div class="file-cache-error">${this._error}</div>
          ` : nothing}

          ${this._loading ? html`
            <div class="file-cache-loading">Loading files...</div>
          ` : this._files.length === 0 ? html`
            <div class="file-cache-empty">
              <div class="file-cache-empty-icon">📁</div>
              <div>No cached files found</div>
              <div class="file-cache-empty-subtitle">
                Enable file cache in your Bambu Lab integration settings
              </div>
            </div>
          ` : html`
            <div class="file-cache-grid">
              ${this._files.map(file => html`
                <div class="file-cache-card">
                    <div class="file-cache-thumbnail">
                      ${(() => {
                        const cacheKey = `${file.filename}-${file.thumbnail_path}`;
                        const thumbnailUrl = this._thumbnailUrls.get(cacheKey);
                        if (thumbnailUrl) {
                            return html`<img src="${thumbnailUrl}" 
                                            alt="${file.filename}" 
                                            @error=${(e) => e.target.style.display = 'none'}>`;
                        } else {
                            this._getThumbnailUrl(file); // Start loading
                            return html`<div class="file-cache-placeholder">
                            ${this._getFileIcon(file.type)}
                            </div>`;
                        }
                      })()}
                  </div>
                  <div class="file-cache-info">
                    <div class="file-cache-name">${file.filename}</div>
                    <div class="file-cache-meta">
                      ${file.size_human} • ${this._formatDate(file.modified)}
                    </div>
                    <button class="file-cache-print-btn" @click=${() => this._showPrintDialog(file)}>
                      <ha-icon icon="mdi:printer-3d"></ha-icon>
                      Print Again
                    </button>
                  </div>
                </div>
              `)}
            </div>
          `}

          ${this._showPrintSettings ? html`
            <div class="print-settings-overlay" @click=${this._hidePrintDialog}>
              <div class="print-settings-popup" @click=${(e) => e.stopPropagation()}>
                <div class="print-settings-header">
                  <div class="print-settings-title">Print Settings</div>
                  <button class="print-settings-close" @click=${this._hidePrintDialog}>
                    <ha-icon icon="mdi:close"></ha-icon>
                  </button>
                </div>
                
                <div class="print-settings-content">
                  <div class="print-settings-file">
                    <strong>File:</strong> ${this._selectedFile?.filename}
                  </div>
                  
                  <div class="print-settings-group">
                    <label class="print-settings-label">
                      <span>Plate Number:</span>
                      <input type="number" 
                             min="1" 
                             max="4" 
                             value=${this._printSettings.plate}
                             @change=${(e) => this._updatePrintSetting('plate', parseInt(e.target.value))}>
                    </label>
                  </div>

                  <div class="print-settings-group">
                    <label class="print-settings-checkbox">
                      <input type="checkbox" 
                             ?checked=${this._printSettings.timelapse}
                             @change=${(e) => this._updatePrintSetting('timelapse', e.target.checked)}>
                      <span>Timelapse</span>
                    </label>
                  </div>

                  <div class="print-settings-group">
                    <label class="print-settings-checkbox">
                      <input type="checkbox" 
                             ?checked=${this._printSettings.bed_leveling}
                             @change=${(e) => this._updatePrintSetting('bed_leveling', e.target.checked)}>
                      <span>Bed Leveling</span>
                    </label>
                  </div>

                  <div class="print-settings-group">
                    <label class="print-settings-checkbox">
                      <input type="checkbox" 
                             ?checked=${this._printSettings.flow_cali}
                             @change=${(e) => this._updatePrintSetting('flow_cali', e.target.checked)}>
                      <span>Flow Calibration</span>
                    </label>
                  </div>

                  <div class="print-settings-group">
                    <label class="print-settings-checkbox">
                      <input type="checkbox" 
                             ?checked=${this._printSettings.vibration_cali}
                             @change=${(e) => this._updatePrintSetting('vibration_cali', e.target.checked)}>
                      <span>Vibration Calibration</span>
                    </label>
                  </div>

                  <div class="print-settings-group">
                    <label class="print-settings-checkbox">
                      <input type="checkbox" 
                             ?checked=${this._printSettings.layer_inspect}
                             @change=${(e) => this._updatePrintSetting('layer_inspect', e.target.checked)}>
                      <span>Layer Inspection</span>
                    </label>
                  </div>

                  <div class="print-settings-group">
                    <label class="print-settings-checkbox">
                      <input type="checkbox" 
                             ?checked=${this._printSettings.use_ams}
                             @change=${(e) => this._updatePrintSetting('use_ams', e.target.checked)}>
                      <span>Use AMS</span>
                    </label>
                  </div>
                </div>

                <div class="print-settings-actions">
                  <button class="print-settings-btn secondary" @click=${this._hidePrintDialog}>
                    Cancel
                  </button>
                  <button class="print-settings-btn primary" 
                          @click=${this._startPrint}
                          ?disabled=${this._printLoading}>
                    ${this._printLoading ? 'Starting Print...' : 'Start Print'}
                  </button>
                </div>
              </div>
            </div>
          ` : nothing}
        </div>
      </div>
    `;
  }
} 