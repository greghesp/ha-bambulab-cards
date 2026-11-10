![GitHub issue custom search in repo](https://img.shields.io/github/issues-search/greghesp/ha-bambulab?query=label%3Afrontend&style=for-the-badge&label=Open%20Issues)
[![Discord](https://img.shields.io/discord/1337028866643857429?style=for-the-badge&logo=discord&logoColor=white&label=Discord&color=7289da)](https://discord.gg/rsUHAW3DKz)

![GitHub Release Date](https://img.shields.io/github/release-date/greghesp/ha-bambulab-cards?style=for-the-badge&label=Latest%20Release) [![GitHub Release](https://img.shields.io/github/v/release/greghesp/ha-bambulab-cards?style=for-the-badge)](https://github.com/greghesp/ha-bambulab-cards/releases)

# Bambu Lab Cards

> Home Assistant dashboard cards for **Bambu Lab** 3D printers: a live
> picture of your printer, AMS units and spools, and print controls. Built
> for the [ha-bambulab](https://github.com/greghesp/ha-bambulab) integration.

![Bambu Lab dashboard cards: print status, AMS, AMS 2 Pro and external spool](https://raw.githubusercontent.com/greghesp/ha-bambulab/main/docs/images/readme/overview.png)

<sub>The cards rendered with sample data. Your cards show your printer's real
values and print preview.</sub>

> [!IMPORTANT]
> **You don't need to install this repository.** The cards ship with the
> [ha-bambulab](https://github.com/greghesp/ha-bambulab) integration, which
> registers them for you. This repository is their source code. Use it to
> report card issues, contribute, or try a change before it's released.

Integration docs are at **[docs.page/greghesp/ha-bambulab](https://docs.page/greghesp/ha-bambulab)**.
For questions and help, join us on [Discord](https://discord.gg/rsUHAW3DKz).

## Contents

- [The cards](#the-cards)
- [Using the cards](#using-the-cards)
- [Development](#development)
- [Releases](#releases)
- [Contributing](#contributing)

---

## The cards

| Card | Type | What it shows |
|---|---|---|
| [Print Status](#print-status-card) | `custom:ha-bambulab-print_status-card` | Your printer with live values, in a graphic, simple or minimal style |
| [AMS](#ams-card) | `custom:ha-bambulab-ams-card` | One AMS unit's spools, humidity and temperature, including the H3C's nine-spool AMS 3H |
| [AMS Graphic](#ams-graphic-card) | `custom:ha-bambulab-ams-graphic-card` | The AMS drawn with fill levels and labels |
| [Spool](#spool-card) | `custom:ha-bambulab-spool-card` | A single spool: the external spool or one AMS slot |
| [Print Control](#print-control-card) | `custom:ha-bambulab-print_control-card` | Speed, pause, resume, stop and skip objects |

Every option is in the card's visual editor. The YAML below is for reference.

### Print Status card

Three styles:

- **Graphic**: a picture of your printer model with live values laid over
  it. You get progress and time left, nozzle, bed and chamber temperatures,
  fans, the light, the door, humidity, and the print preview on the bed.
  Tap a value to open it.
- **Simple**: a touchscreen-style card with the cover image or camera
  feed, progress, temperatures and pages for controls and the AMS.
- **Minimal**: one compact row with progress, status and time left, and
  optionally the printer name, cover image and camera.

| Light theme | Dark theme |
|---|---|
| ![Print Status card, graphic style, light theme](https://raw.githubusercontent.com/greghesp/ha-bambulab/main/docs/images/readme/print-status-light.png) | ![Print Status card, graphic style, dark theme](https://raw.githubusercontent.com/greghesp/ha-bambulab/main/docs/images/readme/print-status-dark.png) |

```yaml
type: custom:ha-bambulab-print_status-card
printer: <printer device id>
style: graphic            # graphic, simple or minimal
# Optional: use your own entities instead of the printer's
custom_temperature: sensor.my_chamber_temperature
custom_humidity: sensor.my_chamber_humidity
custom_light: light.my_printer_light
custom_power: switch.my_printer_plug
custom_camera: camera.my_printer_camera
# Minimal style only
show_printer_name: true
show_cover: true
cover_position: left      # left or right
show_camera_feed: false
camera_position: right    # left or right
```

### AMS card

One AMS unit. The active slot is highlighted and animated, and remaining
filament shows when it's enabled in the slicer for a Bambu spool. Tap a
spool to see its details or change its filament.

**AMS 3H (H3C).** The same card lays the AMS 3H out like the unit. The back
row has two spools beside the **dry box**, outlined with its two spools, and
the five front spools are below. The dry box shows its temperature and
humidity above its spools, plus the time left while it's drying, when its
outline turns orange. The AMS 3H has no single humidity or temperature
reading, so the info bar shows the other zone's instead. Tap a reading to
open it. The AMS 3H always uses the vector style.

![AMS card in vector style with info bar](https://raw.githubusercontent.com/greghesp/ha-bambulab/main/docs/images/readme/ams-card-vector.png)

| AMS 3H, dry box drying | AMS 3H, dry box idle |
|---|---|
| ![AMS 3H in the AMS card while its dry box is drying](https://raw.githubusercontent.com/greghesp/ha-bambulab/main/docs/images/readme/ams-card-ams3h-drying.png) | ![AMS 3H in the AMS card with its dry box idle](https://raw.githubusercontent.com/greghesp/ha-bambulab/main/docs/images/readme/ams-card-ams3h-idle.png) |

```yaml
type: custom:ha-bambulab-ams-card
ams: <AMS device id>
style: vector             # vector or graphic
show_info_bar: true       # humidity and temperature bar
subtitle: AMS 1
show_type: true           # filament type on each spool
spool_anim_reflection: true
spool_anim_wiggle: true
# Optional overrides
custom_humidity: sensor.my_ams_humidity
custom_temperature: sensor.my_ams_temperature
custom_remaining_1: sensor.tray_1_remaining   # one per tray: _1 to _4, or _1 to _9 on an AMS 3H
```

### AMS Graphic card

Draws the unit itself (AMS, AMS 2 Pro, AMS HT) with spool fill levels and
optional labels. There's no drawing of the AMS 3H yet, so use the
[AMS card](#ams-card) for it.

![AMS Graphic card for an AMS 2 Pro](https://raw.githubusercontent.com/greghesp/ha-bambulab/main/docs/images/readme/ams-card-graphic.png)

```yaml
type: custom:ha-bambulab-ams-graphic-card
ams: <AMS device id>
show_info_bar: true
show_title: true
subtitle: AMS 2 Pro
show_labels: true
label_mode: type          # type (e.g. PLA) or name (spool name)
show_empty_label: false
custom_temperature: sensor.my_ams_temperature
custom_humidity: sensor.my_ams_humidity
```

### Spool card

One spool: the external spool, or a single slot of an AMS.

![Spool card showing the external spool](https://raw.githubusercontent.com/greghesp/ha-bambulab/main/docs/images/readme/spool-card.png)

```yaml
type: custom:ha-bambulab-spool-card
spool: <external spool or AMS device id>
tray: 1                   # 1 to 4 for an AMS, 1 to 9 for an AMS 3H
show_info_bar: true
subtitle: External spool
show_type: true
spool_anim_reflection: true
spool_anim_wiggle: true
```

### Print Control card

Printing speed plus Pause, Resume and Stop, and **skip objects** on the
plate mid-print.

![Print Control card with speed, pause, resume and stop](https://raw.githubusercontent.com/greghesp/ha-bambulab/main/docs/images/readme/print-control-card.png)

```yaml
type: custom:ha-bambulab-print_control-card
printer: <printer device id>
```

---

## Using the cards

With [ha-bambulab](https://github.com/greghesp/ha-bambulab) installed:
**Edit dashboard → Add card → search "Bambu Lab"**.

The integration registers the cards automatically when your dashboards are
UI-managed. For YAML-mode dashboards, add the resource yourself:

```yaml
lovelace:
  mode: yaml
  resources:
    - url: /bambu_lab/ha-bambulab-cards.js
      type: module
```

If the cards don't appear in the card picker after an update, hard-refresh
the browser (Ctrl+Shift+R).

The cards read the integration's entities and load their printer and AMS
images from the integration (`/bambu_lab/images/`), so they need
ha-bambulab installed. They also work with printers set up through
Node-RED, mapping its MQTT entity names onto the same features.

---

## Development

You need Node.js 20 or later.

```bash
npm ci
npm start
```

`npm start` rebuilds on every change and serves `dist/` on port 4000. It
listens on all interfaces, with CORS open, so you can point a test Home
Assistant at your machine. Add a dashboard resource of type
**JavaScript module** with the URL
`http://<your-machine>:4000/ha-bambulab-cards.js`, and remove it when you're
done.

| Command | What it does |
|---|---|
| `npm start` | Watch, rebuild and serve on port 4000 |
| `npm run build` | Production build into `dist/`, ignoring type errors |
| `npm run build:strict` | Production build that fails on type errors. CI runs this on every push and PR |
| `npm run format` | Format the code with Prettier |

### Layout

```text
src/
├── ha-bambulab-cards.ts      # Entry point: loads every card
├── const.ts                  # Supported printer and AMS models
├── cards/
│   ├── print-status-card/    # Graphic, simple (a1-screen) and minimal styles
│   ├── ams-card/             # Vector and graphic AMS styles, info bar, AMS 3H zones
│   ├── ams-graphic-card/     # SVG AMS rendering
│   ├── spool-card/
│   ├── print-control-card/
│   └── shared-components/    # Spool, popups, skip objects, entity lookup
├── images/                   # Printer and AMS renders
└── utils/                    # Helpers, Lit contexts, card registration
```

Cards are [Lit](https://lit.dev) elements written in TypeScript and bundled
with Rollup. They find a device's entities by the integration's
**translation keys** (`getBambuDeviceEntities` in `src/utils/helpers.ts`),
so an entity renamed by the user still works. Each card has a matching
`*-editor.ts` that defines its visual editor.

Images over 4 KB are written to `dist/images/` with a content hash in the
name and loaded from `/bambu_lab/images/`. Smaller ones, such as the SVG
icons, are inlined into the bundle.

---

## Releases

Publishing a GitHub release here:

1. Sets `package.json` to the release version, builds the cards, and attaches
   `ha-bambulab-cards.js` and the images to the release.
2. Opens a pull request on
   [ha-bambulab](https://github.com/greghesp/ha-bambulab). That PR copies
   the build into the integration's `frontend/` folder and bumps the card
   version there, so browsers pick up the new cards.

Card changes reach users with the next ha-bambulab release after that pull
request is merged.

---

## Contributing

Report card problems on
[ha-bambulab's issues](https://github.com/greghesp/ha-bambulab/issues?q=label%3Afrontend)
with the **frontend** label. Read the
[contributing guide](https://docs.page/greghesp/ha-bambulab/misc/contributing),
open PRs against `main`, and make sure `npm run build:strict` passes.

If you feel these custom cards are valuable and want to support them in other ways, you can [buy Greg a coffee](https://Ko-fi.com/greghesp).
