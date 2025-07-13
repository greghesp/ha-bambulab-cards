# File Cache Popup Component

A reusable popup component for displaying Bambu Lab file cache data. This component can be used in any card that needs to show cached files from a Bambu Lab printer.

## Usage

### Basic Usage

```typescript
import "~/cards/shared-components/file-cache-popup";

// In your component template:
html`
  <file-cache-popup
    .device_id=${deviceId}
    .entity_id=${fileCacheEntityId}
    .file_type=${"all"}
    .show_thumbnails=${true}
    .max_files=${20}
    .show_controls=${true}
  ></file-cache-popup>
`
```

### Properties

- `device_id` (string): The Bambu Lab device ID
- `entity_id` (string): The file cache entity ID (e.g., `sensor.bambu_lab_x1c_SERIAL_file_cache`)
- `file_type` (string): Filter for specific file types (`"all"`, `"3mf"`, `"gcode"`, `"timelapse"`, `"thumbnail"`)
- `show_thumbnails` (boolean): Whether to show file thumbnails (default: `true`)
- `max_files` (number): Maximum number of files to display (default: `20`)
- `show_controls` (boolean): Whether to show refresh and clear cache controls (default: `true`)

### Methods

- `show()`: Display the popup
- `hide()`: Hide the popup

### Example Integration

```typescript
// In your component class:
@customElement("my-card")
export class MyCard extends LitElement {
  @property() public device_id: string = "";

  #showFileCache() {
    const fileCachePopup = this.querySelector('file-cache-popup');
    if (fileCachePopup) {
      (fileCachePopup as any).show();
    }
  }

  #getFileCacheEntityId() {
    if (!this.device_id) return "";
    
    // Extract serial from device_id (format: bambu_lab_x1c_SERIAL)
    const deviceParts = this.device_id.split('_');
    const serial = deviceParts[deviceParts.length - 1];
    
    return `sensor.bambu_lab_x1c_${serial}_file_cache`;
  }

  render() {
    return html`
      <ha-card>
        <!-- Your card content -->
        <button @click=${this.#showFileCache}>Show Files</button>
      </ha-card>
      
      <file-cache-popup
        .device_id=${this.device_id}
        .entity_id=${this.#getFileCacheEntityId()}
        .file_type=${"all"}
        .show_thumbnails=${true}
        .max_files=${20}
        .show_controls=${true}
      ></file-cache-popup>
    `;
  }
}
```

## Features

- **File Grid Display**: Shows files in a responsive grid layout
- **Thumbnail Support**: Displays file thumbnails when available
- **File Type Filtering**: Filter by file type (3MF, GCODE, timelapse, etc.)
- **File Information**: Shows file size, modification date, and type
- **Refresh Control**: Manually refresh the file cache
- **Clear Cache**: Clear the entire file cache
- **Responsive Design**: Works on different screen sizes
- **Error Handling**: Displays error messages when API calls fail

## Styling

The component uses CSS custom properties for theming and integrates with Home Assistant's design system. It automatically adapts to light/dark themes and uses the standard HA card styling.

## API Requirements

This component requires the Bambu Lab integration's file cache API endpoints:

- `GET /api/bambu_lab/file_cache/{serial}?file_type={type}` - Get cached files
- `POST /api/bambu_lab/clear_file_cache` - Clear file cache

Make sure your Bambu Lab integration has file cache enabled and the API endpoints are available. 