import { customElement, property, state } from "lit/decorators.js";
import { html, LitElement, nothing, TemplateResult } from "lit";
import { hassContext } from "../../../utils/context";
import { consume } from "@lit/context";
import styles from "./print-history-popup.styles.js";
import * as helpers from "../../../utils/helpers";
import { css } from "lit";

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

@customElement("print-history-popup")
export class PrintHistoryPopup extends LitElement {
  @property() public device_serial: string = "";
  @property() public device_id: string = "";
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
    bed_leveling: false,
    flow_cali: false,
    vibration_cali: false,
    layer_inspect: true,
    use_ams: true,
    ams_mapping: "0"
  };
  @state() private _printLoading: boolean = false;
  private _thumbnailCache = new Map<string, string | null>();
  private _scrollHandler: ((e: Event) => void) | null = null;
  @state() private _searchQuery: string = "";
  @state() private _sliceInfo: any = null;
  @state() private _sliceInfoLoading: boolean = false;
  @state() private _sliceInfoError: string | null = null;
  @state() private _selectedAmsFilament: number[] = [];
  @state() private _dropdownOpen: number | null = null;
  @state() private _dropdownPosition: {left: number, top: number, width: number, height: number} | null = null;
  @state() private _activeTab: number = 0;
  @state() private _timelapseFiles: FileCacheFile[] = [];
  @state() private _timelapseLoading: boolean = false;
  @state() private _timelapseError: string | null = null;
  @state() private _openTimelapseVideo: string | null = null;

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
    this._refreshTimelapseFiles();
    this._preventBackgroundScroll();
  }

  hide() {
    this._show = false;
    this._showPrintSettings = false;
    this._selectedFile = null;
    this._openTimelapseVideo = null;
    this._restoreBackgroundScroll();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._restoreBackgroundScroll();
    window.removeEventListener('mousedown', this._dropdownLightDismissHandler, true);
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
      const url = `/api/bambu_lab/file_cache/${this.device_serial}?file_type=3mf`;
      
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

  async _refreshTimelapseFiles() {
    this._timelapseLoading = true;
    this._timelapseError = null;
    try {
      const url = `/api/bambu_lab/file_cache/${this.device_serial}?file_type=timelapse`;
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
      if (result && result.files) {
        this._timelapseFiles = result.files;
      }
    } catch (error) {
      this._timelapseError = error instanceof Error ? error.message : String(error);
    } finally {
      this._timelapseLoading = false;
      this.requestUpdate();
    }
  }

  _showPrintDialog(file: FileCacheFile) {
    this._selectedFile = file;
    this._showPrintSettings = true;
    this._loadSliceInfo(file);
  }

  async _loadSliceInfo(file: FileCacheFile) {
    this._sliceInfo = null;
    this._sliceInfoError = null;
    this._sliceInfoLoading = true;
    // Remove .3mf extension if present
    let baseName = file.filename;
    if (baseName.toLowerCase().endsWith('.3mf')) {
        baseName = baseName.slice(0, -4);
    }
    const configFilename = baseName + ".slice_info.config";
    const url = `/api/bambu_lab/file_cache/${this.device_serial}/3mf/${configFilename}`;
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this._hass.auth.data.access_token}`,
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        // Parse XML and extract <filament/> entries
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "application/xml");
        const filaments = Array.from(xml.getElementsByTagName("filament"));
        this._sliceInfo = filaments.map(filament => {
            const attrs = {};
            for (const attr of filament.attributes) {
                attrs[attr.name] = attr.value;
            }
            return attrs;
        });
    } catch (error) {
        this._sliceInfoError = error instanceof Error ? error.message : String(error);
    } finally {
        this._sliceInfoLoading = false;
        this.requestUpdate();
    }
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

  _getThumbnailUrl(file: FileCacheFile, fileType: string) {
    const cacheKey = `${file.filename}-${file.thumbnail_path}`;
    if (this._thumbnailCache.has(cacheKey)) {
      return this._thumbnailCache.get(cacheKey);
    }
    if (!file.thumbnail_path) {
      this._thumbnailCache.set(cacheKey, null);
      return null;
    }
    
    // Start loading the thumbnail asynchronously
    this._loadThumbnail(file, cacheKey, fileType);
    
    // Return null initially, will be updated when loaded
    return null;
  }

  async _loadThumbnail(file: FileCacheFile, cacheKey: string, fileType: string) {
    try {
      const url = `/api/bambu_lab/file_cache/${this.device_serial}/${fileType}/${file.thumbnail_path}`;
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

  // Returns a sorted list of all available filaments from every AMS (by AMS index, then tray slot), ignoring empty slots
  getAvailableAMSFilaments() {
    if (!this._hass || !this.device_id) return [];
    // Only include AMS devices, not external spools
    const amsDeviceIds = helpers.getAttachedDeviceIds(this._hass, this.device_id)
      .filter(amsId => {
        const device = this._hass.devices[amsId];
        return device && device.model && device.model.toLowerCase().includes('ams');
      });
    let allFilaments: any[] = [];
    amsDeviceIds.forEach((amsId, amsIndex) => {
      // Get all tray entities for this AMS
      const entities = helpers.getBambuDeviceEntities(this._hass, amsId, ["tray_1", "tray_2", "tray_3", "tray_4"]);
      ["tray_1", "tray_2", "tray_3", "tray_4"].forEach((tray, trayIndex) => {
        const entity = entities[tray];
        if (entity) {
          const state = this._hass.states[entity.entity_id];
          if (state && !state.attributes.empty) {
            allFilaments.push({
              amsIndex,
              trayIndex,
              amsId,
              tray,
              entity,
              state,
              color: state.attributes.color,
              type: state.attributes.type,
              name: state.attributes.name,
              filament_id: state.attributes.filament_id,
              // add more attributes as needed
            });
          }
        }
      });
    });
    // Sort by AMS index, then tray index
    allFilaments.sort((a, b) => a.amsIndex - b.amsIndex || a.trayIndex - b.trayIndex);
    return allFilaments;
  }

  getExternalSpoolFilaments() {
    if (!this._hass || !this.device_id) return [];
    // Only include external spool devices
    const extDeviceIds = helpers.getAttachedDeviceIds(this._hass, this.device_id)
      .filter(devId => {
        const device = this._hass.devices[devId];
        return device && device.model && device.model.toLowerCase().includes('external spool');
      });
    let allFilaments: any[] = [];
    extDeviceIds.forEach((extId, extIndex) => {
      // Get the external_spool entity for this device
      const entities = helpers.getBambuDeviceEntities(this._hass, extId, ["external_spool"]);
      const entity = entities["external_spool"];
      if (entity) {
        const state = this._hass.states[entity.entity_id];
        if (state && !state.attributes.empty) {
          allFilaments.push({
            extIndex,
            extId,
            entity,
            state,
            color: state.attributes.color,
            type: state.attributes.type,
            name: state.attributes.name,
            filament_id: state.attributes.filament_id,
          });
        }
      }
    });
    return allFilaments;
  }

  private _dropdownLightDismissHandler = (e: MouseEvent) => {
    // Only close if click is outside the dropdown list
    const dropdown = this.renderRoot.querySelector('.custom-dropdown-portal');
    if (dropdown && !dropdown.contains(e.target as Node)) {
      this._dropdownOpen = null;
      this._dropdownPosition = null;
      this.requestUpdate();
    }
  };

  private _openDropdown(idx: number, event: Event) {
    event.stopPropagation();
    // Get bounding rect for positioning
    const trigger = (event.currentTarget as HTMLElement);
    const rect = trigger.getBoundingClientRect();
    this._dropdownOpen = idx;
    this._dropdownPosition = {
      left: rect.left,
      top: rect.top + rect.height / 2, // vertical center of trigger
      width: rect.width,
      height: rect.height
    };
    window.addEventListener('mousedown', this._dropdownLightDismissHandler, true);
    this.requestUpdate();
  }

  private _closeDropdown() {
    this._dropdownOpen = null;
    this._dropdownPosition = null;
    window.removeEventListener('mousedown', this._dropdownLightDismissHandler, true);
    this.requestUpdate();
  }

  renderFilamentComboBoxes() {
    const amsFilaments = this.getAvailableAMSFilaments();
    const amsDevices = helpers.getAttachedDeviceIds(this._hass, this.device_id)
      .filter(amsId => {
        const device = this._hass.devices[amsId];
        return device && device.model && device.model.toLowerCase().includes('ams');
      })
      .map(amsId => this._hass.devices[amsId]);

    const getGlobalAMSIndex = (fil: any) => {
      const amsModel = fil.amsId && fil.amsId in this._hass.devices ? this._hass.devices[fil.amsId].model.toLowerCase() : '';
      if (amsModel.includes('ht')) {
        const amsHTDevices = amsDevices.filter((d: any) => d.model.toLowerCase().includes('ht'));
        const amsHTIndex = amsHTDevices.findIndex((d: any) => d.id === fil.amsId);
        const regularAMSCount = amsDevices.filter((d: any) => !d.model.toLowerCase().includes('ht')).length;
        return regularAMSCount * 4 + amsHTIndex;
      } else {
        const amsIndex = amsDevices.filter((d: any) => !d.model.toLowerCase().includes('ht')).findIndex((d: any) => d.id === fil.amsId);
        return amsIndex * 4 + fil.trayIndex;
      }
    };

    // Ensure _selectedAmsFilament is initialized to global AMS indices
    if (this._selectedAmsFilament.length !== this._sliceInfo.length) {
      this._selectedAmsFilament = Array(this._sliceInfo.length).fill(null);
    }

    let dropdownOverlays: TemplateResult | typeof nothing = nothing;
    if (this._dropdownOpen !== null && this._dropdownPosition) {
      const idx = this._dropdownOpen;
      const filament = this._sliceInfo[idx];
      // Find the selected AMS filament by global index
      let selectedGlobalIdx = this._selectedAmsFilament[idx];
      let selectedIdx = 0;
      if (
        selectedGlobalIdx === null ||
        amsFilaments.findIndex(fil => getGlobalAMSIndex(fil) === selectedGlobalIdx) === -1
      ) {
        // Matching logic from previous implementation
        const matches = amsFilaments.filter(amsFil => {
          const colorMatch = (filament.color && amsFil.color && `${filament.color.toLowerCase()}ff` === amsFil.color.toLowerCase());
          const idMatch = (filament.tray_info_idx == amsFil.filament_id);
          const typeMatch = (filament.type && amsFil.type && filament.type.toLowerCase() === amsFil.type.toLowerCase());
          return colorMatch && idMatch && typeMatch;
        });
        if (matches.length > 0) {
          const matchByIndex = matches.find(m => getGlobalAMSIndex(m) === Number(filament.id));
          selectedIdx = matchByIndex ? amsFilaments.indexOf(matchByIndex) : amsFilaments.indexOf(matches[0]);
        }
        // Set the global index for this filament
        selectedGlobalIdx = getGlobalAMSIndex(amsFilaments[selectedIdx]);
        this._selectedAmsFilament[idx] = selectedGlobalIdx;
      } else {
        // Use the stored global index
        const foundIdx = amsFilaments.findIndex(fil => getGlobalAMSIndex(fil) === selectedGlobalIdx);
        if (foundIdx !== -1) selectedIdx = foundIdx;
      }
      const selected = amsFilaments[selectedIdx];
      const { left, top, width, height } = this._dropdownPosition;
      const dropdownListStyle = `
        position:fixed;
        left:${left}px;
        top:${top}px;
        width:${width}px;
        transform: translateY(-50%);
        min-width:320px;
        max-width:90vw;
        z-index:3100;
      `;
      dropdownOverlays = html`
        <div class="custom-dropdown-portal" style="position:fixed;z-index:3000;left:0;top:0;width:100vw;height:100vh;">
          <div class="custom-dropdown-list" style="${dropdownListStyle}">
            ${amsFilaments.map((amsFil, _) => html`
              <div class="custom-dropdown-option${getGlobalAMSIndex(amsFil) === this._selectedAmsFilament[idx] ? ' selected' : ''}"
                   @mousedown=${(e: Event) => {
                     e.stopPropagation();
                     const newSelected = [...this._selectedAmsFilament];
                     newSelected[idx] = getGlobalAMSIndex(amsFil);
                     this._selectedAmsFilament = newSelected;
                     this._closeDropdown();
                   }}>
                <span style="display:inline-block;width:1em;height:1em;background:${amsFil.color};border-radius:50%;vertical-align:middle;margin-right:4px;"></span>
                AMS ${amsFil.amsIndex + 1}, Tray ${amsFil.trayIndex + 1}
                - ${amsFil.type || ''} ${amsFil.name || ''}
              </div>
            `)}
          </div>
        </div>
      `;
    }

    // Compute the result array for the read-only text box
    // The array length is the number of non-empty AMS filaments
    const resultArray = Array(amsFilaments.length).fill(-1);
    if (this._sliceInfo) {
      this._sliceInfo.forEach((filament, idx) => {
        const selectedGlobalAMSIndex = this._selectedAmsFilament[idx];
        const foundIdx = amsFilaments.findIndex(fil => getGlobalAMSIndex(fil) === selectedGlobalAMSIndex);
        if (
          foundIdx !== -1 &&
          foundIdx < resultArray.length
        ) {
          resultArray[foundIdx] = Number(filament.id);
        }
      });
    }

    return html`
      ${this._sliceInfo.map((filament, idx) => {
        // Find the selected AMS filament by global index
        let selectedGlobalIdx = this._selectedAmsFilament[idx];
        // If not set or not found, run matching logic to pick the best AMS filament
        let selectedIdx = 0;
        if (
          selectedGlobalIdx === null ||
          amsFilaments.findIndex(fil => getGlobalAMSIndex(fil) === selectedGlobalIdx) === -1
        ) {
          // Matching logic from previous implementation
          const matches = amsFilaments.filter(amsFil => {
            const colorMatch = (filament.color && amsFil.color && `${filament.color.toLowerCase()}ff` === amsFil.color.toLowerCase());
            const idMatch = (filament.tray_info_idx == amsFil.filament_id);
            const typeMatch = (filament.type && amsFil.type && filament.type.toLowerCase() === amsFil.type.toLowerCase());
            return colorMatch && idMatch && typeMatch;
          });
          if (matches.length > 0) {
            const matchByIndex = matches.find(m => getGlobalAMSIndex(m) === Number(filament.id));
            selectedIdx = matchByIndex ? amsFilaments.indexOf(matchByIndex) : amsFilaments.indexOf(matches[0]);
          }
          // Set the global index for this filament
          selectedGlobalIdx = getGlobalAMSIndex(amsFilaments[selectedIdx]);
          this._selectedAmsFilament[idx] = selectedGlobalIdx;
        } else {
          // Use the stored global index
          const foundIdx = amsFilaments.findIndex(fil => getGlobalAMSIndex(fil) === selectedGlobalIdx);
          if (foundIdx !== -1) selectedIdx = foundIdx;
        }
        const selected = amsFilaments[selectedIdx];
        return html`
          <div class="print-settings-group filament-mapping-row">
            <label>
              ${filament.id ? `Filament ${filament.id}` : ''}:
              <span style="display:inline-block;width:1em;height:1em;background:${filament.color || '#ccc'};border-radius:50%;vertical-align:middle;margin-right:4px;"></span>
              ${filament.type || ''} ${filament.name || ''}
            </label>
            <div class="custom-dropdown" @click=${(e: Event) => this._openDropdown(idx, e)}>
              <div class="custom-dropdown-selected">
                <span class="dropdown-label-content">
                  <span style="display:inline-block;width:1em;height:1em;background:${selected.color};border-radius:50%;vertical-align:middle;"></span>
                  <span class="dropdown-label-text">
                    AMS ${selected.amsIndex + 1}, Tray ${selected.trayIndex + 1} - ${selected.type || ''} ${selected.name || ''}
                  </span>
                </span>
                <span class="dropdown-arrow">▼</span>
              </div>
            </div>
          </div>
        `;
      })}
      ${(amsFilaments.length > 0 && this._sliceInfo && this._sliceInfo.length > 0)
        ? html`<input type="text" readonly value="${resultArray.join(',')}" style="width:100%;margin-top:8px;" />`
        : nothing}
      ${dropdownOverlays}
    `;
  }

  private _getAmsMappingArray() {
    const amsFilaments = this.getAvailableAMSFilaments();
    const amsDevices = helpers.getAttachedDeviceIds(this._hass, this.device_id)
      .filter(amsId => {
        const device = this._hass.devices[amsId];
        return device && device.model && device.model.toLowerCase().includes('ams');
      })
      .map(amsId => this._hass.devices[amsId]);
    const getGlobalAMSIndex = (fil: any) => {
      const amsModel = this._hass.devices[fil.amsId].model.toLowerCase();
      if (amsModel.includes('ht')) {
        const amsHTDevices = amsDevices.filter((d: any) => d.model.toLowerCase().includes('ht'));
        const amsHTIndex = amsHTDevices.findIndex((d: any) => d.id === fil.amsId);
        const regularAMSCount = amsDevices.filter((d: any) => !d.model.toLowerCase().includes('ht')).length;
        return regularAMSCount * 4 + amsHTIndex;
      } else {
        const amsIndex = amsDevices.filter((d: any) => !d.model.toLowerCase().includes('ht')).findIndex((d: any) => d.id === fil.amsId);
        return amsIndex * 4 + fil.trayIndex;
      }
    };
    const resultArray = Array(amsFilaments.length).fill(-1);
    if (this._sliceInfo) {
      this._sliceInfo.forEach((filament, idx) => {
        const selectedGlobalAMSIndex = this._selectedAmsFilament[idx];
        const foundIdx = amsFilaments.findIndex(fil => getGlobalAMSIndex(fil) === selectedGlobalAMSIndex);
        if (foundIdx !== -1 && foundIdx < resultArray.length) {
          resultArray[foundIdx] = Number(filament.id);
        }
      });
    }
    return resultArray;
  }

  private _isAmsMappingValid() {
    const arr = this._getAmsMappingArray();
    if (!this._sliceInfo || !arr.length) return false;
    // All 3MF filament ids must be present in the array (not -1)
    return this._sliceInfo.every(filament => arr.includes(Number(filament.id)));
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
               @click=${() => { this._activeTab = i; this._openTimelapseVideo = null; this.requestUpdate(); }}>
            ${label}
          </div>
        `)}
      </div>
    `;

    // Print History Tab
    const filteredFiles = this._files.filter(file =>
      file.filename.toLowerCase().includes(this._searchQuery.toLowerCase())
    );

    // Timelapse Tab
    const renderTimelapseGrid = html`
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
              const videoUrl = `/local/media/ha-bambulab/00M09A391501288/timelapse/video_2025-01-20_16-48-34.mp4`;
              return html`
                <div class="print-history-card">
                  <div class="print-history-thumbnail" style="position:relative;">
                    ${isOpen
                      ? html`<video controls autoplay width="100%" src="${videoUrl}" style="border-radius:8px;max-width:100%;max-height:210px;background:#000;"></video>`
                      : html`
                          ${(() => {
                            const cacheKey = `${file.filename}-${file.thumbnail_path}`;
                            const thumbnailUrl = this._thumbnailUrls.get(cacheKey);
                            if (thumbnailUrl) {
                              return html`<img src="${thumbnailUrl}" alt="${file.filename}" style="cursor:pointer;" @click=${() => { this._openTimelapseVideo = file.filename; this.requestUpdate(); }} @error=${(e) => e.target.style.display = 'none'}>`;
                            } else {
                              this._getThumbnailUrl(file, 'timelapse'); // Start loading
                              return html`<div class="print-history-placeholder" style="cursor:pointer;" @click=${() => { this._openTimelapseVideo = file.filename; this.requestUpdate(); }}>${this._getFileIcon(file.type)}</div>`;
                            }
                          })()}
                          <div class="timelapse-overlay">
                            ${this._formatDate(file.modified)}
                          </div>
                        `
                    }
                  </div>
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
            <div class="print-history-controls">
              <input
                type="text"
                class="print-history-search"
                placeholder="Search by filename..."
                .value=${this._searchQuery}
                @input=${(e: any) => { this._searchQuery = e.target.value; }}
              />
              <button class="print-history-btn secondary" @click=${this._clearCache}>
                Clear Cache
              </button>
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
                          const cacheKey = `${file.filename}-${file.thumbnail_path}`;
                          const thumbnailUrl = this._thumbnailUrls.get(cacheKey);
                          if (thumbnailUrl) {
                              return html`<img src="${thumbnailUrl}" 
                                              alt="${file.filename}" 
                                              @error=${(e) => e.target.style.display = 'none'}>`;
                          } else {
                              this._getThumbnailUrl(file, '3mf'); // Start loading
                              return html`<div class="print-history-placeholder">
                              ${this._getFileIcon(file.type)}
                              </div>`;
                          }
                        })()}
                    </div>
                    <div class="print-history-info">
                      <div class="print-history-name">${file.filename}</div>
                      <div class="print-history-meta">
                        ${file.size_human} • ${this._formatDate(file.modified)}
                      </div>
                      <button class="print-history-print-btn" @click=${() => this._showPrintDialog(file)}>
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
                    <!-- Cover image for the selected file -->
                    ${(() => {
                      if (this._selectedFile) {
                        const cacheKey = `${this._selectedFile.filename}-${this._selectedFile.thumbnail_path}`;
                        const thumbnailUrl = this._thumbnailUrls.get(cacheKey);
                        if (thumbnailUrl) {
                          return html`<div style="text-align:center;margin-bottom:16px;"><img src="${thumbnailUrl}" alt="${this._selectedFile.filename}" style="max-width:200px;max-height:200px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" /></div>`;
                        }
                      }
                      return nothing;
                    })()}
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
                               ?checked=${this._printSettings.use_ams}
                               @change=${(e) => this._updatePrintSetting('use_ams', e.target.checked)}>
                        <span>Use AMS</span>
                      </label>
                    </div>

                    ${this._sliceInfoLoading ? html`<div>Loading filament info...</div>` : nothing}
                    ${this._sliceInfoError ? html`<div style="color:red;">${this._sliceInfoError}</div>` : nothing}

                    ${this._printSettings.use_ams && this._sliceInfo && this._sliceInfo.length > 0 ? html`
                      <div class="print-settings-group">
                        ${this.renderFilamentComboBoxes()}
                      </div>
                    ` : nothing}

                    ${this._printSettings.use_ams
                      ? nothing
                      : html`
                          <div class="print-settings-group">
                            <strong>Available External Spool Filaments:</strong>
                            <ul>
                              ${this.getExternalSpoolFilaments().map(fil => html`
                                <li>
                                  External Spool ${fil.extIndex + 1}: 
                                  <span style="display:inline-block;width:1em;height:1em;background:${fil.color};border-radius:50%;vertical-align:middle;margin-right:4px;"></span>
                                  ${fil.type || ''} ${fil.name || ''} (${fil.filament_id ?? 'N/A'})
                                </li>
                              `)}
                            </ul>
                          </div>
                        `
                      }

                  </div>

                  <div class="print-settings-actions">
                    <button class="print-settings-btn secondary" @click=${this._hidePrintDialog}>
                      Cancel
                    </button>
                    <button class="print-settings-btn primary" 
                            @click=${this._startPrint}
                            ?disabled=${this._printLoading || !this._isAmsMappingValid()}>
                      ${this._printLoading ? 'Starting Print...' : 'Start Print'}
                    </button>
                  </div>
                </div>
              </div>
            ` : nothing}
          ` : renderTimelapseGrid}
        </div>
      </div>
    `;
  }
} 