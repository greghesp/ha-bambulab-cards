// Import all card components
import "./cards/ams-card/ams-card";
import "./cards/print-control-card/print-control-card";
import "./cards/print-status-card/print-status-card";
import "./cards/spool-card/spool-card";

const version = "0.2.5";

// Log loaded components
console.info(
  `%c🐼 Bambu Lab Cards %c ${version}`,
  "color: #ffffff; background:rgb(109, 109, 109); padding: 5px; font-size: 1.2em;",
  "color:rgb(255, 255, 255); background: #22A041; font-size: 1.2em; padding: 5px"
);

console.info("Loaded cards:");
console.info("  • AMS Card");
console.info("  • Print Control Card");
console.info("  • Print Status Card");
console.info("  • Spool Card");
