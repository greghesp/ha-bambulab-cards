import { registerCustomCard } from "../../utils/custom-cards";

import { AMSCard } from "./ams-card";
import { AMSCardEditor } from "./ams-card-editor";
import { AMS_CARD_NAME } from "./const";

// Re-export the components so they can be imported from the index
export { AMSCard, AMSCardEditor };

try {
  registerCustomCard(AMS_CARD_NAME, {
    card: AMSCard,
    editor: AMSCardEditor,
    getLayoutOptions: () => ({
      grid_columns: 2,
      grid_min_columns: 2,
    }),
    name: "AMS Card",
    description: "AMS Card",
  });
} catch (e) {
  console.warn(`Failed to register ${AMS_CARD_NAME}`, e);
}
