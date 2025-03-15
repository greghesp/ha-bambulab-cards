# BambuLab Cards Test Harness

This test harness allows you to test your Home Assistant BambuLab custom cards outside of Home Assistant with configurable dummy data.

## Getting Started

1. Open `test-harness.html` in your web browser
2. Use the controls to configure the dummy data
3. See the preview of your cards with the configured data

## Loading Your Custom Cards

To test your actual custom cards, you need to:

1. Include your card JavaScript files in the test harness
2. Update the card-loader.js file to recognize your card types

### Step 1: Include Your Card Files

Edit the `test-harness.html` file and add script tags to load your custom card JavaScript files:

```html
<!-- Add these before the closing </body> tag -->
<script src="card-loader.js"></script>
<script src="path/to/your/bambulab-printer-status-card.js"></script>
<script src="path/to/your/bambulab-print-progress-card.js"></script>
<script src="path/to/your/bambulab-temperature-card.js"></script>
```

### Step 2: Update the Card Preview Function

Edit the `updateCardPreview` function in `test-harness.html` to use the card loader:

```javascript
function updateCardPreview(cardType, entityData) {
  const cardContent = document.getElementById("card-content");

  // Clear the current content
  cardContent.innerHTML = "";

  // Update the hass object with the new entity data
  window.cardLoader.updateHassEntities(entityData);

  // Map the card type to the actual card element name
  let cardElementType;
  let cardConfig = {};

  if (cardType === "printer-status") {
    cardElementType = "bambulab-printer-status-card";
    cardConfig = {
      entity: "sensor.bambulab_printer_status",
      // Add any other config options your card needs
    };
  } else if (cardType === "print-progress") {
    cardElementType = "bambulab-print-progress-card";
    cardConfig = {
      entity: "sensor.bambulab_print_progress",
      // Add any other config options your card needs
    };
  } else if (cardType === "temperature") {
    cardElementType = "bambulab-temperature-card";
    cardConfig = {
      bed_entity: "sensor.bambulab_bed_temperature",
      nozzle_entity: "sensor.bambulab_nozzle_temperature",
      // Add any other config options your card needs
    };
  }

  // Render the card
  if (cardElementType) {
    const success = window.cardLoader.renderCustomCard(cardElementType, cardConfig, cardContent);

    if (!success) {
      // Fallback to the visual representation if the card fails to render
      // (Keep the existing visual representation code here)
    }
  }
}
```

## Customizing the Test Harness

You can customize the test harness to match your specific cards:

1. Add more card types to the dropdown in the HTML
2. Add corresponding control groups for each card type
3. Update the `generateEntityData` function to create the right entity data structure
4. Update the `updateCardPreview` function to render the card correctly

## Troubleshooting

If your cards don't render correctly:

1. Check the browser console for errors
2. Verify that your card files are loaded correctly
3. Make sure the entity data structure matches what your cards expect
4. Check that your cards don't have dependencies on other Home Assistant services

## Advanced: Mocking Home Assistant Services

If your cards use Home Assistant services, you can mock them in the `card-loader.js` file:

```javascript
// Example: Mock a specific service
window.hass.callService = function (domain, service, data) {
  console.log(`Service called: ${domain}.${service}`, data);

  if (domain === "bambulab" && service === "start_print") {
    // Update the printer status to simulate starting a print
    this.updateState("sensor.bambulab_printer_status", "printing", {
      friendly_name: "BambuLab Printer",
      online: true,
    });
  }

  // Add more service mocks as needed
};
```
