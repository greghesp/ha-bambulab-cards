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
// console.info("🐼 Loaded: Example Card");

console.info(
  `%c🐼 Bambu Lab 🐼 %c ${version}`,
  "color: #ffffff; background:rgb(109, 109, 109); padding: 5px; font-size: 1.2em;",
  "color:rgb(255, 255, 255); background: #22A041; font-size: 1.2em; padding: 5px"
);
