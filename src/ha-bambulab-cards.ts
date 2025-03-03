import { registerCustomCard } from "./utils/custom-cards";
import { AMSCard } from "./cards/ams-card";
import { AMS_CARD_NAME } from "./cards/ams-card/const";
import { PrintControlCard } from "./cards/print-control-card";
import { PRINT_CONTROL_CARD_NAME } from "./cards/print-control-card/const";
import { PrintStatusCard } from "./cards/print-status-card";
import { PRINT_STATUS_CARD_NAME } from "./cards/print-status-card/const";
import { SpoolCard } from "./cards/spool-card";
import { SPOOL_CARD_NAME } from "./cards/spool-card/const";

const version = "0.2.5";

// Register all custom cards
registerCustomCard({
  type: SPOOL_CARD_NAME,
  name: "Bambu Lab Spool Card",
  description: "Card for displaying spool information",
  component: SpoolCard
});

registerCustomCard({
  type: AMS_CARD_NAME,
  name: "Bambu Lab AMS Card",
  description: "Card for displaying AMS information",
  component: AMSCard
});

registerCustomCard({
  type: PRINT_CONTROL_CARD_NAME,
  name: "Bambu Lab Print Control Card",
  description: "Card for controlling print operations",
  component: PrintControlCard
});

registerCustomCard({
  type: PRINT_STATUS_CARD_NAME,
  name: "Bambu Lab Print Status Card",
  description: "Card for displaying print status",
  component: PrintStatusCard
});

console.info("🐼 Loaded: AMS Card");
console.info("🐼 Loaded: Print Control Card");
console.info("🐼 Loaded: Print Status Card");
console.info("🐼 Loaded: Spool Card");
// import "./cards/example-card/example-card";

console.info(`%c🐼 Bambu Lab 🐼 %c ${version}`, 'color: #ffffff; background:rgb(109, 109, 109); padding: 5px; font-size: 1.2em;','color:rgb(255, 255, 255); background: #22A041; font-size: 1.2em; padding: 5px')

