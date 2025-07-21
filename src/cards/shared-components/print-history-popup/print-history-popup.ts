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
  size: number;
  size_human: string;
  modified: string;
  thumbnail_path?: string;
  printer_name: string;
  printer_serial: string;
  path: string;
  printer_model: string;
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
  @state() private _selectedPrinter: string = "all";
  @state() private _allFiles: FileCacheFile[] = []; // Store original unfiltered files
  @state() private _allTimelapseFiles: FileCacheFile[] = []; // Store original unfiltered timelapse files
  @state() private _uploadingFile: boolean = false;
  @state() private _uploadProgress: number = 0;

  // Add a private property to track the last logged AMS mapping
  private _lastLoggedAmsMapping: number[] = [];
  private _lastLoggedAmsMappingValid: { arr: number[]; ids: number[]; valid: boolean } | null = null;

  private _unsubscribeUploadProgress: (() => void) | null = null;

  static styles = styles;

  connectedCallback() {
    super.connectedCallback();
    this._updateContent();
    if (this._hass && this._hass.connection) {
      this._unsubscribeUploadProgress = this._hass.connection.subscribeEvents(
        (event) => this._onUploadProgress(event),
        'bambu_upload_progress'
      );
    }
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
    if (this._unsubscribeUploadProgress) {
      this._unsubscribeUploadProgress();
      this._unsubscribeUploadProgress = null;
    }
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
    this._thumbnailUrls.clear(); // Clear thumbnail cache
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
      console.log('[FileCachePopup] _refreshFiles() - API result:', result);
      
      if (result && result.files) {
        // Store all files unfiltered
        this._allFiles = result.files;
        // Filter by selected printer if not "all"
        let filteredFiles = result.files;
        if (this._selectedPrinter !== "all") {
          filteredFiles = result.files.filter((file: FileCacheFile) => 
            file.printer_serial === this._selectedPrinter
          );
        }
        this._files = filteredFiles.slice(0, this.max_files);
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
      console.log('[FileCachePopup] _refreshTimelapseFiles() - API result:', result);
      if (result && result.videos) {
        // Store all timelapse files unfiltered
        this._allTimelapseFiles = result.videos;
        // Filter by selected printer if not "all"
        let filteredFiles = result.videos;
        if (this._selectedPrinter !== "all") {
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

  _showPrintDialog(file: FileCacheFile) {
    this._selectedFile = file;
    this._showPrintSettings = true;
    this._sliceInfo = null;
    this._sliceInfoError = null;
    this._sliceInfoLoading = true;
    this._selectedAmsFilament = [];
    this._loadSliceInfo(file);
  }

  // Helper to auto-select AMS mapping based on scoring (id > type > color)
  private _autoSelectAmsMapping() {
    const amsFilaments = this.getAvailableAMSFilaments();
    if (!this._sliceInfo) return;
    const getGlobalAMSIndex = (fil: any) => {
      const amsDevices = helpers.getAttachedDeviceIds(this._hass, this.device_id)
        .filter(amsId => {
          const device = this._hass.devices[amsId];
          return device && device.model && device.model.toLowerCase().includes('ams');
        })
        .map(amsId => this._hass.devices[amsId]);
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
    this._selectedAmsFilament = this._sliceInfo.map(filament => {
      let bestIdx = 0;
      let bestScore = -1;
      amsFilaments.forEach((amsFil, i) => {
        let score = 0;
        if (filament.tray_info_idx && amsFil.filament_id && filament.tray_info_idx == amsFil.filament_id) score += 100;
        if (filament.type && amsFil.type && filament.type.toLowerCase() === amsFil.type.toLowerCase()) score += 10;
        if (filament.color && amsFil.color) {
          const fColor = filament.color.toLowerCase().replace(/ff$/, '');
          const aColor = amsFil.color.toLowerCase().replace(/ff$/, '');
          if (fColor === aColor) score += 1;
        }
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      });
      return amsFilaments[bestIdx] ? getGlobalAMSIndex(amsFilaments[bestIdx]) : null;
    });
  }

  // Call this after loading slice info
  async _loadSliceInfo(file: FileCacheFile) {
    this._sliceInfo = null;
    this._sliceInfoError = null;
    this._sliceInfoLoading = true;
    // Use the original file path and replace .3mf extension with .slice_info.config
    const configPath = file.path.slice(0, -4) + '.slice_info.config';
    const url = `/api/bambu_lab/file_cache/${configPath}`;
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
      this._autoSelectAmsMapping();
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
      // Use the full path (including serial) for ensure_cache_file
      const cache_path = this._selectedFile.path;
      // Use the relative path under /prints/ for the print command
      let filepath = this._selectedFile.path;
      const printsIdx = filepath.indexOf('/prints/');
      if (printsIdx !== -1) {
        filepath = filepath.substring(printsIdx + '/prints/'.length);
      }
      // Log and call ensure_cache_file
      this._uploadingFile = true;
      this._uploadProgress = 0;
      this.requestUpdate();
      console.log('Ensuring cache file:', {
        serial: this.device_serial,
        cache_path,
        expected_size: this._selectedFile.size
      });
      const ensureResp = await fetch('/api/bambu_lab/ensure_cache_file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this._hass.auth.data.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serial: this.device_serial,
          cache_path,
          expected_size: this._selectedFile.size
        })
      });
      this._uploadingFile = false;
      this._uploadProgress = 0;
      this.requestUpdate();
      const ensureRespText = await ensureResp.text();
      console.log('ensure_cache_file response:', ensureResp.status, ensureRespText);
      if (!ensureResp.ok) {
        this._error = `Failed to upload file: ${ensureRespText}`;
        this.requestUpdate();
        return;
      }
      // Now proceed to print
      await this._hass.callService(
        'bambu_lab',
        'print_project_file', 
        {
          device_id: [ this.device_id ],
          filepath, // relative path for print command
          ...this._printSettings
        }
      );
      this._hidePrintDialog();
      // Show success message or notification
    } catch (error) {
      this._uploadingFile = false;
      this._uploadProgress = 0;
      console.error('[FileCachePopup] _startPrint() - error:', error);
      this._error = error instanceof Error ? error.message : String(error);
      this.requestUpdate();
    } finally {
      this._printLoading = false;
      this.requestUpdate();
    }
  }

  _getThumbnailUrl(file: FileCacheFile) {
    const cacheKey = file.thumbnail_path ?? "";
    if (this._thumbnailUrls.has(cacheKey)) {
      return this._thumbnailUrls.get(cacheKey);
    }
    if (!file.thumbnail_path) {
      this._thumbnailUrls.set(cacheKey, null);
      return null;
    }
    
    // Start loading the thumbnail asynchronously
    this._loadThumbnail(file, cacheKey);
    
    // Return null initially, will be updated when loaded
    return null;
  }

  async _loadThumbnail(file: FileCacheFile, cacheKey: string) {
    try {
      // The thumbnail_path now contains the full path including printer serial
      const url = `/api/bambu_lab/file_cache/${file.thumbnail_path}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this._hass.auth.data.access_token}`,
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch thumbnail:', response.status);
        this._thumbnailUrls.set(cacheKey, null);
        return;
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      this._thumbnailUrls.set(cacheKey, blobUrl);
      this.requestUpdate();
    } catch (error) {
      console.error('Error fetching thumbnail:', error);
      this._thumbnailUrls.set(cacheKey, null);
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
        // Prefer id, then type, then color
        const scored = amsFilaments.map((amsFil, i) => {
          let score = 0;
          if (filament.tray_info_idx && amsFil.filament_id && filament.tray_info_idx == amsFil.filament_id) score += 100;
          if (filament.type && amsFil.type && filament.type.toLowerCase() === amsFil.type.toLowerCase()) score += 10;
          if (filament.color && amsFil.color) {
            // Compare ignoring alpha
            const fColor = filament.color.toLowerCase().replace(/ff$/, '');
            const aColor = amsFil.color.toLowerCase().replace(/ff$/, '');
            if (fColor === aColor) score += 1;
          }
          return { i, score };
        });
        scored.sort((a, b) => b.score - a.score);
        if (scored[0].score > 0) {
          selectedIdx = scored[0].i;
        }
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

    // Only log if the mapping changed
    if (JSON.stringify(resultArray) !== JSON.stringify(this._lastLoggedAmsMapping)) {
      console.log('AMS mapping array:', resultArray);
      this._lastLoggedAmsMapping = [...resultArray];
    }
    return html`
      ${this._sliceInfo.map((filament, idx) => {
        // Only use the stored global index
        let selectedGlobalIdx = this._selectedAmsFilament[idx];
        let selectedIdx = 0;
        const foundIdx = amsFilaments.findIndex(fil => getGlobalAMSIndex(fil) === selectedGlobalIdx);
        if (foundIdx !== -1) selectedIdx = foundIdx;
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
    if (!this._sliceInfo || !arr.length) {
      return false;
    }
    // Each filament id from the slice info must be present in the AMS mapping array exactly once
    const ids = this._sliceInfo.map(filament => Number(filament.id));
    // Filter out -1 entries for duplicate check
    const filteredArr = arr.filter(v => v !== -1);
    const arrSet = new Set(filteredArr);
    if (filteredArr.length !== arrSet.size) {
      return false;
    }
    // Check that every id is present exactly once
    const valid = ids.every(id => filteredArr.includes(id)) && filteredArr.length === ids.length;
    const logObj = { arr, ids, valid };
    if (!this._lastLoggedAmsMappingValid || JSON.stringify(this._lastLoggedAmsMappingValid) !== JSON.stringify(logObj)) {
      this._lastLoggedAmsMappingValid = logObj;
    }
    return valid;
  }

  private _onUploadProgress = (event: any) => {
    const data = event.data;
    if (!data) return;
    if (data.serial !== this.device_serial) return;
    if (!this._uploadingFile) return;
    if (typeof data.bytes_sent === 'number' && typeof data.total === 'number' && data.total > 0) {
      this._uploadProgress = Math.floor((data.bytes_sent / data.total) * 100);
      this.requestUpdate();
    }
  };

  // Helper to get the current printer's model
  private _getCurrentPrinterModel(): string | null {
    if (!this._hass || !this.device_id) return null;
    const device = (this._hass.devices as any)?.[this.device_id];
    return device?.model || null;
  }

  // Helper to check if two models are compatible (P1P, P1S, X1C, X1E are equivalent)
  private _areModelsCompatible(modelA: string | null, modelB: string | null): boolean {
    if (!modelA || !modelB) return false;
    const eqSet = ["P1P", "P1S", "X1C", "X1E"];
    const normA = modelA.trim().toUpperCase();
    const normB = modelB.trim().toUpperCase();
    if (eqSet.includes(normA) && eqSet.includes(normB)) return true;
    return normA === normB;
  }

  render() {
    if (!this._show) {
      return nothing;
    }

    // Get unique printers for filter dropdown from all unfiltered data
    const allPrinters = new Set<string>();
    this._allFiles.forEach(file => {
      if (file.printer_serial) allPrinters.add(file.printer_serial);
    });
    this._allTimelapseFiles.forEach(file => {
      if (file.printer_serial) allPrinters.add(file.printer_serial);
    });
    const printerOptions = Array.from(allPrinters).map(serial => ({
      serial,
      name: this._allFiles.find(f => f.printer_serial === serial)?.printer_name || 
            this._allTimelapseFiles.find(f => f.printer_serial === serial)?.printer_name || 
            serial
    }));

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
            <div class="print-history-controls">
              <div class="print-history-filters">
                <select class="printer-filter" @change=${(e) => { this._selectedPrinter = e.target.value; this._refreshFiles(); }}>
                  <option value="all">All Printers</option>
                  ${printerOptions.map(printer => html`
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
                      <div class="print-history-name">${file.filename}</div>
                      <div class="print-history-meta">
                        ${file.size_human} • ${this._formatDate(file.modified)}
                        ${file.printer_name ? html`<br><small>${file.printer_name}</small>` : nothing}
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
                        const cacheKey = this._selectedFile?.thumbnail_path ?? "";
                        const thumbnailUrl = this._thumbnailUrls.get(cacheKey);
                        if (thumbnailUrl) {
                          return html`<div style="text-align:center;margin-bottom:16px;"><img src="${thumbnailUrl}" alt="${this._selectedFile.filename}" style="max-width:200px;max-height:200px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" /></div>`;
                        }
                      }
                      return nothing;
                    })()}
                    <div class="print-settings-file">
                      <strong>File:</strong> ${this._selectedFile?.filename}
                      ${this._selectedFile?.printer_name ? html`<br><small>Printer: ${this._selectedFile.printer_name}</small>` : nothing}
                      ${(() => {
                        // UX warning for incompatible or not-exact-match printer model
                        if (this._selectedFile) {
                          const fileModel = this._selectedFile.printer_model;
                          const currentModel = this._getCurrentPrinterModel();
                          const eqSet = ["P1P", "P1S", "X1C", "X1E"];
                          const normFile = (fileModel || '').trim().toUpperCase();
                          const normCurrent = (currentModel || '').trim().toUpperCase();
                          if (fileModel && currentModel) {
                            if (!this._areModelsCompatible(fileModel, currentModel)) {
                              return html`<div style="color: var(--error-color, #f44336); margin-top: 8px; font-weight: bold;">This print is incompatible with the selected printer model (${fileModel} vs ${currentModel}).</div>`;
                            } else if (
                              eqSet.includes(normFile) && eqSet.includes(normCurrent) && normFile !== normCurrent
                            ) {
                              return html`<div style="color: #ff6f00; margin-top: 8px; font-weight: normal;">Warning: The file was created for a different printer model (${fileModel} vs ${currentModel}). Printing is allowed, but compatibility is not guaranteed.</div>`;
                            }
                          }
                        }
                        return nothing;
                      })()}
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
                            ?disabled=${this._printLoading || this._uploadingFile || !this._isAmsMappingValid() || (() => {
                              if (this._selectedFile) {
                                const fileModel = this._selectedFile.printer_model;
                                const currentModel = this._getCurrentPrinterModel();
                                if (fileModel && currentModel && !this._areModelsCompatible(fileModel, currentModel)) {
                                  return true;
                                }
                              }
                              return false;
                            })()}>
                      ${this._uploadingFile ? `Uploading file... ${this._uploadProgress}%` : (this._printLoading ? 'Starting Print...' : 'Start Print')}
                    </button>
                  </div>
                </div>
              </div>
            ` : nothing}
          ` : html`
            <div class="print-history-controls">
              <div class="print-history-filters">
                <select class="printer-filter" @change=${(e) => { this._selectedPrinter = e.target.value; this._refreshTimelapseFiles(); }}>
                  <option value="all">All Printers</option>
                  ${printerOptions.map(printer => html`
                    <option value="${printer.serial}" ?selected=${this._selectedPrinter === printer.serial}>
                      ${printer.name}
                    </option>
                  `)}
                </select>
              </div>
            </div>
            ${renderTimelapseGrid}
          `}
        </div>
      </div>
    `;
  }
}