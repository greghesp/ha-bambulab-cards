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

@customElement("print-settings-popup")
export class PrintSettingsPopup extends LitElement {

  @property() public device_id: string = "";
  @property() public device_serial: string = "";
  @property() public selected_file: FileCacheFile | null = null;
  @property() public thumbnail: string = "";
  @property() public hass;
  
  @state() private _error: string | null = null;
  @state() private _sliceInfo: any = null;
  @state() private _sliceInfoLoading: boolean = false;
  @state() private _sliceInfoError: string | null = null;

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
  @state() private _selectedAmsFilament: number[] = [];
  @state() private _uploadingFile: boolean = false;
  @state() private _uploadProgress: number = 0;
  @state() private _dropdownOpen: number | null = null;
  @state() private _dropdownPosition: {left: number, top: number, width: number, height: number} | null = null;
  @state() private _amsAvailable: boolean = true;

  static styles = styles;

  private _unsubscribeUploadProgress: (() => void) | null = null;
  
  connectedCallback() {
    super.connectedCallback();
    this._setupUploadProgressSubscription();
  }

  disconnectedCallback() {
    this._unsubscribeUploadProgressSubscription();
    super.disconnectedCallback();
    window.removeEventListener('mousedown', this._dropdownLightDismissHandler, true);
  }
  
  updated(changedProps: Map<string, any>) {
    if (changedProps.has('selected_file')) {
      this._loadSliceInfo();
      this.requestUpdate();
    }
  }

  private async _setupUploadProgressSubscription() {
    this._unsubscribeUploadProgressSubscription();
    this._unsubscribeUploadProgress = await this.hass.connection.subscribeEvents(
      (event) => this._onUploadProgress(event),
      'bambu_upload_progress'
    );
  }  

  private async _unsubscribeUploadProgressSubscription() {
    // Clean up any existing subscription first
    if (this._unsubscribeUploadProgress) {
      this._unsubscribeUploadProgress();
      this._unsubscribeUploadProgress = null;
    }
  }

  _hidePrintDialog() {
      this.style.display = 'none';
  }

  // Returns a global index for an AMS tray
  getGlobalAMSSlotIndex(amsId, trayIndex) {
    if (amsId >= 128) {
      return amsId;
    }
    return amsId * 4 + trayIndex;
  }

  // Returns a sorted list of all available filaments from every AMS (by AMS index, then tray slot), ignoring empty slots
  getAvailableAMSFilaments() {
    if (!this.hass || !this.device_id) {
      console.log("Unknown device")
      return [];
    }
    // Only include AMS devices, not external spools
    const amsDeviceIds = helpers.getAttachedDeviceIds(this.hass, this.device_id)
      .filter(amsId => {
        const device = this.hass.devices[amsId];
        return device && device.model && device.model.toLowerCase().includes('ams');
      });
    let allFilaments: any[] = [];
    amsDeviceIds.forEach((amsId, amsIndex) => {
      // Get all tray entities for this AMS
      const entities = helpers.getBambuDeviceEntities(this.hass, amsId, ["tray_1", "tray_2", "tray_3", "tray_4"]);
      ["tray_1", "tray_2", "tray_3", "tray_4"].forEach((tray, trayIndex) => {
        const entity = entities[tray];
        if (entity) {
          const state = this.hass.states[entity.entity_id];
          if (state && !state.attributes.empty) {
            allFilaments.push({
              amsIndex: amsIndex,
              trayIndex: trayIndex,
              globalIndex: this.getGlobalAMSSlotIndex(amsIndex, trayIndex),
              amsId: amsId,
              tray: tray,
              entity: entity,
              state: state,
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
    if (!this.hass || !this.device_id) return [];
    // Only include external spool devices
    const extDeviceIds = helpers.getAttachedDeviceIds(this.hass, this.device_id)
      .filter(devId => {
        const device = this.hass.devices[devId];
        return device && device.model && device.model.toLowerCase().includes('external spool');
      });
    let allFilaments: any[] = [];
    extDeviceIds.forEach((extId, extIndex) => {
      // Get the external_spool entity for this device
      const entities = helpers.getBambuDeviceEntities(this.hass, extId, ["external_spool"]);
      const entity = entities["external_spool"];
      if (entity) {
        const state = this.hass.states[entity.entity_id];
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

  // Helper to auto-select AMS mapping based on scoring (id > type > color)
  private _autoSelectAmsMapping() {
    const amsFilaments = this.getAvailableAMSFilaments();
    if (amsFilaments.length == 0) {
      this._printSettings.use_ams = false;
      this._amsAvailable = false;
      return;
    }

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
      return amsFilaments[bestIdx] ? amsFilaments[bestIdx].globalIndex : null;
    });
  }

  private _getAmsMappingArray() {

    // The mapping array is a 1-based array of entries matched to the filament id list in the slice_info.
    // The filament id is a 1-base id of the set of filaments that were in the slicer when the slicing was done.
    // It has absolutely no relationship to filaments in the printer AMSs. It might happen to match if you 
    // religiously synchronize your printer filaments to the slicer (as overwrite) and every AMS slot is populated.
    // 
    // As an example, suppose I have a printer with an AMS and slots (0-base) 2 & 3 have filaments in them.
    // When I synchronize to the slicer I get just two filaments with ids (1-based) of 1 & 2.
    // Say I slice a print with the second filament (ams index = 0, slot = 3) then the slicer filament id will be 2.
    //
    // The ams mapping list maps each filament id (1-base) to the global AMS slot index. So in the above example,
    // the global AMS slot index will be 3. If I had second AMS and was printing from it's slot 3 then the global
    // index would be 4 + 3 = 7. I believe but have not yet confirmed that the global index for an AMS HT will just
    // be it's id and the AMS HT ids start at 128.
    //
    // Unused filament ids just have -1 in their corresponding entry. So the ams mapping for that single AMS example
    // above will be -1,3. Slicer filament id 1 doesn't exist so it gets -1. Slicer filament id 2 is mapped to AMS 0 
    // slot 3 for global index of 3.

    // So first we fill the way with -1 entries to match the max id seen of the slicer filament id list.
    
    // Determine the max id value in the _sliceInfo filament list
    let maxId = 0;
    if (this._sliceInfo && this._sliceInfo.length > 0) {
      maxId = Math.max(...this._sliceInfo.map(filament => Number(filament.id) || 0));
    }

    // Pre-initialize the result array to have -1 for every entry in the slice info filament list up to the max id.
    const resultArray = Array(maxId).fill(-1);

    // Now we populate the in-use slicer filaments entries to the AMS global indexes.
    if (this._sliceInfo) {
      this._sliceInfo.forEach((filament, idx) => {
        resultArray[filament.id - 1] = this._selectedAmsFilament[idx];
      });
    }

    return resultArray;
  }

  private _isAmsMappingValid() {
    const ams_mapping = this._getAmsMappingArray();
    if (!this._sliceInfo || !ams_mapping.length) {
      return false;
    }

    // Each filament id from the slice info must have a global filament index value assigned to it.

    // First get the list of ids
    const ids = this._sliceInfo.map(filament => Number(filament.id));

    // Filter out -1 entries. 
    const filteredMapping = ams_mapping.filter(v => v !== -1);

    // If the remaining entry list isn't the same size as our id list, one of them isn't assigned.
    if (filteredMapping.length !== ids.length) {
      return false;
    }

    // Now check that for every id, there is a value that is not -1
    return ids.every(id => ams_mapping[id-1] !== -1);
  }

  // Call this after loading slice info
  private async _loadSliceInfo() {
    if (!this.selected_file) return;

    this._selectedAmsFilament = [];
    this._sliceInfo = null;
    this._sliceInfoError = null;
    this._sliceInfoLoading = true;
    // Use the original file path and replace .3mf extension with .slice_info.config
    const configPath = this.selected_file!.path.slice(0, -4) + '.slice_info.config';
    const url = `/api/bambu_lab/file_cache/${configPath}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.hass.auth.data.access_token}`,
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

      // Find the plate index
      const metadata = xml.querySelector("plate > metadata[key='index']")!;
      this._printSettings.plate = parseInt(metadata.getAttribute("value")!, 10);

      this._autoSelectAmsMapping();
    } catch (error) {
      this._sliceInfoError = error instanceof Error ? error.message : String(error);
    } finally {
      this._sliceInfoLoading = false;
      this.requestUpdate();
    }
  }

  _updatePrintSetting(key: keyof PrintSettings, value: any) {
    this._printSettings = { ...this._printSettings, [key]: value };
  }

  async _startPrint() {
    if (!this.selected_file) return;

    this._printLoading = true;
    this.requestUpdate();

    try {
      // Use the full path (including serial) for ensure_cache_file
      const cache_path = this.selected_file.path;
      // Use the relative path under /prints/ for the print command
      let filepath = this.selected_file.path;
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
        expected_size: this.selected_file.size
      });
      const ensureResp = await fetch('/api/bambu_lab/ensure_cache_file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hass.auth.data.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serial: this.device_serial,
          cache_path,
          expected_size: this.selected_file.size
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

      // Update the AMS mapping. Take the list and remove all the -1 entries.
      this._printSettings.ams_mapping = this._getAmsMappingArray().join(",")

      // Now proceed to print
      await this.hass.callService(
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
    if (amsFilaments.length == 0)
    {
      return nothing;
    }
    const amsDevices = helpers.getAttachedDeviceIds(this.hass, this.device_id)
      .filter(amsId => {
        const device = this.hass.devices[amsId];
        return device && device.model && device.model.toLowerCase().includes('ams');
      })
      .map(amsId => this.hass.devices[amsId]);

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
      if (selectedGlobalIdx === null ||
          amsFilaments.findIndex(fil => fil.globalIndex === selectedGlobalIdx) === -1) {
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
        this._selectedAmsFilament[idx] = amsFilaments[selectedIdx].globalIndex;;
      } else {
        // Use the stored global index
        const foundIdx = amsFilaments.findIndex(fil => fil.globalIndex === selectedGlobalIdx);
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
              <div class="custom-dropdown-option${amsFil.globalIndex === this._selectedAmsFilament[idx] ? ' selected' : ''}"
                   @mousedown=${(e: Event) => {
                     e.stopPropagation();
                     const newSelected = [...this._selectedAmsFilament];
                     newSelected[idx] = amsFil.globalIndex;
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

    return html`
      ${this._sliceInfo.map((filament, idx) => {
        // Only use the stored global index
        let selectedGlobalIdx = this._selectedAmsFilament[idx];
        let selectedIdx = 0;
        const foundIdx = amsFilaments.findIndex(fil => fil.globalIndex === selectedGlobalIdx);
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

  // Helper to get the current printer's model
  private _getCurrentPrinterModel(): string | null {
    if (!this.hass || !this.device_id) return null;
    const device = (this.hass.devices as any)?.[this.device_id];
    return device?.model || null;
  }

  render() {
    return html`
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
            <div style="text-align:center;margin-bottom:16px;">
              <img
                src="${this.thumbnail}"
                alt="${this.selected_file?.filename}"
                style="max-width:200px; max-height:200px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);"
              />
            </div>
            <div class="print-settings-file">
              <strong>File:</strong> ${this.selected_file?.filename}
              ${this.selected_file?.printer_name ? html`<br><small>Printer: ${this.selected_file.printer_name}</small>` : nothing}
              ${(() => {
                // UX warning for incompatible or not-exact-match printer model
                if (this.selected_file) {
                  const fileModel = this.selected_file.printer_model;
                  const currentModel = this._getCurrentPrinterModel();
                  const eqSet = ["P1P", "P1S", "X1C", "X1E"];
                  const normFile = (fileModel || '').trim().toUpperCase();
                  const normCurrent = (currentModel || '').trim().toUpperCase();
                  if (fileModel && currentModel) {
                    if (!helpers.areModelsCompatible(fileModel, currentModel)) {
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
                      ?disabled=${!this._amsAvailable}
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
                      if (this.selected_file) {
                        const fileModel = this.selected_file.printer_model;
                        const currentModel = this._getCurrentPrinterModel();
                        if (fileModel && currentModel && !helpers.areModelsCompatible(fileModel, currentModel)) {
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
    `
  }
}