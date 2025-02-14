import { version } from "../package.json";
import "./cards/ams-card/ams-card";
console.info("🐼 Loaded: AMS Card");
import "./cards/print-control-card/print-control-card";
console.info("🐼 Loaded: Print Control Card");
import "./cards/print-status-card/print-status-card";
console.info("🐼 Loaded: Print Status Card");
import "./cards/spool-card/spool-card";
console.info("🐼 Loaded: Spool Card");
// import "./cards/example-card/example-card";

console.info(`%c🐼 Bambu Lab 🐼 - ${version}`, "color: #ef5350; font-weight: 700;");
