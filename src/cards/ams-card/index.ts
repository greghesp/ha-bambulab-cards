import { registerCustomCard } from "../../utils/custom-cards";

import { AMSCard } from "./ams-card";
import { AMSCardEditor } from "./ams-card-editor";
import { AMS_CARD_NAME } from "./const";

// Re-export the components so they can be imported from the index
export { AMSCard, AMSCardEditor };

// Register the custom card
registerCustomCard({
  type: AMS_CARD_NAME,
  name: "Bambu Lab AMS Card",
  description: "AMS card for Bambu Lab Printers",
  component: AMSCard
});
