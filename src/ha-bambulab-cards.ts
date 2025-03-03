// Import only the wrappers that exist
import "./cards/ams-card";
// Remove these imports until you create the files
// import "./wrappers/print-control-card-wrapper";
// import "./wrappers/print-status-card-wrapper";

const version = "0.2.5";

console.info("🐼 Loaded: AMS Card");
console.info("🐼 Loaded: Print Control Card");
console.info("🐼 Loaded: Print Status Card");
console.info("🐼 Loaded: Spool Card");

console.info(
  `%c🐼 Bambu Lab 🐼 %c ${version}`,
  "color: #ffffff; background:rgb(109, 109, 109); padding: 5px; font-size: 1.2em;",
  "color:rgb(255, 255, 255); background: #22A041; font-size: 1.2em; padding: 5px"
);
