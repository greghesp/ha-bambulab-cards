import { HomeAssistant } from "../types/homeassistant";

interface CardConfig {
  type: string;
  [key: string]: any;
}

interface CardInstance {
  hass: HomeAssistant;
  config: CardConfig;
  [key: string]: any;
}

interface CardSelector {
  querySelector: (selector: string) => Element | null;
  [key: string]: any;
}

interface RegisterCardParams {
  type: string;
  name: string;
  description: string;
  component?: React.ComponentType<any>;
}

export function registerCustomCard(params: RegisterCardParams) {
  const windowWithCards = window as unknown as Window & {
    customCards: Array<{ type: string; name: string; description: string }>;
  };

  if (!windowWithCards.customCards) {
    windowWithCards.customCards = [];
  }

  windowWithCards.customCards.push({
    type: params.type,
    name: params.name,
    description: params.description,
  });
}

export async function createCard(
  config: CardConfig,
  selector: CardSelector,
  instance: CardInstance
) {
  const cardHelpers = await (window as any).loadCardHelpers();

  if (!cardHelpers) {
    throw new Error("Card helpers not found");
  }

  const card = await cardHelpers.createCardElement(config);
  card.hass = instance.hass;
  
  const container = selector.querySelector("div");
  if (container) {
    container.appendChild(card);
  }
}

export async function updateCard(
  changedProperties: Map<string, any>,
  selector: CardSelector,
  instance: CardInstance
) {
  if (changedProperties.has("hass")) {
    const container = selector.querySelector("div");
    if (container) {
      const card = container.firstElementChild;
      if (card) {
        (card as any).hass = instance.hass;
      }
    }
  }
}
