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

@customElement("file-cache-popup")
export class FileCachePopup extends LitElement {
  @property() public device_serial: string = "";
  @property() public file_type: string = "";
  @property() public show_thumbnails: boolean = true;
  @property() public max_files: number = 20;
  @property() public show_controls: boolean = true;

  @consume({ context: hassContext, subscribe: true })
  @state()
  public _hass;

  @state() private _files: FileCacheFile[] = [];
  @state() private _loading: boolean = false;
  @state() private _error: string | null = null;
  @state() private _show: boolean = false;
  @state() private _thumbnailUrls = new Map<string, string | null>();
  private _thumbnailCache = new Map<string, string | null>();

  static styles = styles;

  connectedCallback() {
    console.log('[FileCachePopup] connectedCallback() called');
    super.connectedCallback();
    this._updateContent();
  }

  updated(changedProperties) {
    if (changedProperties.has("device_serial")) {
      console.log('[FileCachePopup] device_serial changed, calling _updateContent()');
      this._updateContent();
    }
  }

  show() {
    console.log('[FileCachePopup] show() called');
    this._show = true;
    this._refreshFiles();
  }

  hide() {
    console.log('[FileCachePopup] hide() called');
    this._show = false;
  }

  async _updateContent() {
    console.log('[FileCachePopup] _updateContent() called');
    if (!this.device_serial) {
      console.log('[FileCachePopup] _updateContent() - no device_serial, returning');
      return;
    }

    this.requestUpdate();
  }

  async _refreshFiles() {
    console.log('[FileCachePopup] _refreshFiles() called');
    
    this._loading = true;
    this._error = null;
    this._thumbnailCache.clear(); // Clear thumbnail cache
    this.requestUpdate();

    try {
      // Use the API endpoint to get file cache data
      const url = `/api/bambu_lab/file_cache/${this.device_serial}?file_type=${this.file_type}`;
      console.log('[FileCachePopup] _refreshFiles() - fetching from URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this._hass.auth.data.access_token}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('[FileCachePopup] _refreshFiles() - response status:', response.status);

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
      console.log('[FileCachePopup] _refreshFiles() - finished, setting loading to false');
      this._loading = false;
      this.requestUpdate();
    }
  }

  async _clearCache() {
    console.log('[FileCachePopup] _clearCache() called');

    if (!confirm('Are you sure you want to clear the file cache?')) {
      console.log('[FileCachePopup] _clearCache() - user cancelled');
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

  render() {
    if (!this._show) {
      return nothing;
    }

    return html`
      <div class="file-cache-overlay" @click=${this.hide}>
        <div class="file-cache-popup" @click=${(e) => e.stopPropagation()}>
          <div class="file-cache-header">
            <div class="file-cache-title">Bambu Lab File Cache</div>
            <button class="file-cache-close" @click=${this.hide}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>

          ${this.show_controls ? html`
            <div class="file-cache-controls">
              <button class="file-cache-btn secondary" @click=${this._refreshFiles} ?disabled=${this._loading}>
                ${this._loading ? 'Loading...' : 'Refresh'}
              </button>
              <button class="file-cache-btn secondary" @click=${this._clearCache}>
                Clear Cache
              </button>
            </div>
          ` : nothing}

          ${this._error ? html`
            <div class="file-cache-error">${this._error}</div>
          ` : nothing}

          ${this._files.length > 0 ? html`
            <div class="file-cache-stats">
              <span class="file-cache-count">${this._files.length} files</span>
              <span>Filter: ${this.file_type}</span>
            </div>
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
                  ${this.show_thumbnails ? html`
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
                  ` : nothing}
                  <div class="file-cache-info">
                    <div class="file-cache-type ${file.type}">${file.type}</div>
                    <div class="file-cache-name">${file.filename}</div>
                    <div class="file-cache-meta">
                      ${file.size_human} • ${this._formatDate(file.modified)}
                    </div>
                  </div>
                </div>
              `)}
            </div>
          `}
        </div>
      </div>
    `;
  }
} 