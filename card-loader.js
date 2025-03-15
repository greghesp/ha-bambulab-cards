/**
 * BambuLab Cards Loader
 *
 * This script helps load your custom Home Assistant cards into the test harness.
 * It provides a mock Home Assistant environment for testing.
 */

// Mock Home Assistant environment
class MockHomeAssistant {
  constructor() {
    this.states = {};
    this.listeners = {};
    this.panelUrl = "test-harness";
  }

  // Add or update a state
  updateState(entityId, state, attributes = {}) {
    this.states[entityId] = {
      entity_id: entityId,
      state: state,
      attributes: attributes,
      last_changed: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    // Notify listeners
    if (this.listeners[entityId]) {
      this.listeners[entityId].forEach((callback) => {
        callback(this.states[entityId]);
      });
    }
  }

  // Get a state
  callService(domain, service, data) {
    console.log(`Service called: ${domain}.${service}`, data);
    // You can implement specific service behaviors here
  }

  // Subscribe to state changes
  subscribeEntities(callback) {
    // Return an object with all states
    callback(this.states);

    // Return an unsubscribe function
    return () => {
      console.log("Unsubscribed from entities");
    };
  }

  // Subscribe to a specific entity
  subscribeEntity(entityId, callback) {
    if (!this.listeners[entityId]) {
      this.listeners[entityId] = [];
    }

    this.listeners[entityId].push(callback);

    // If we have a state for this entity, call the callback immediately
    if (this.states[entityId]) {
      callback(this.states[entityId]);
    }

    // Return an unsubscribe function
    return () => {
      this.listeners[entityId] = this.listeners[entityId].filter((cb) => cb !== callback);
    };
  }
}

// Create a global hass object
window.hass = new MockHomeAssistant();

// Function to load a custom card script
function loadCardScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptPath;
    script.onload = () => resolve();
    script.onerror = (error) => reject(new Error(`Failed to load script: ${scriptPath}`));
    document.head.appendChild(script);
  });
}

// Function to update the hass object with new entity data
function updateHassEntities(entityData) {
  // Clear existing states
  window.hass.states = {};

  // Add new states based on the entity data
  if (Array.isArray(entityData)) {
    // If it's an array of entities
    entityData.forEach((entity) => {
      window.hass.updateState(entity.entity_id, entity.state, entity.attributes);
    });
  } else if (typeof entityData === "object") {
    // If it's a single entity or an object with multiple entities
    if (entityData.entity_id) {
      // Single entity
      window.hass.updateState(entityData.entity_id, entityData.state, entityData.attributes);
    } else {
      // Object with multiple entities
      Object.keys(entityData).forEach((key) => {
        const entity = entityData[key];
        if (entity.entity_id) {
          window.hass.updateState(entity.entity_id, entity.state, entity.attributes);
        }
      });
    }
  }

  // Trigger a custom event to notify that hass has been updated
  window.dispatchEvent(new CustomEvent("hass-updated"));
}

// Function to render a custom card in the container
function renderCustomCard(cardType, config, container) {
  // Clear the container
  container.innerHTML = "";

  // Create the card element based on the card type
  let cardElement;

  try {
    // Try to create the card element
    switch (cardType) {
      case "bambulab-printer-status-card":
        cardElement = document.createElement("bambulab-printer-status-card");
        break;
      case "bambulab-print-progress-card":
        cardElement = document.createElement("bambulab-print-progress-card");
        break;
      case "bambulab-temperature-card":
        cardElement = document.createElement("bambulab-temperature-card");
        break;
      // Add more card types as needed
      default:
        throw new Error(`Unknown card type: ${cardType}`);
    }

    // Set the hass object and config
    cardElement.hass = window.hass;
    cardElement.setConfig(config);

    // Append the card to the container
    container.appendChild(cardElement);

    return true;
  } catch (error) {
    console.error("Error rendering card:", error);
    container.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red; border-radius: 4px;">
            <strong>Error rendering card:</strong><br>
            ${error.message}
        </div>`;

    return false;
  }
}

// Export functions for use in the test harness
window.cardLoader = {
  loadCardScript,
  updateHassEntities,
  renderCustomCard,
};
