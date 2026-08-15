function displayCustomPrice() {
  const lotNumberElement = Array.from(
    document.querySelectorAll("b")
  ).find((b) => b.textContent.includes("Lot #"));

  const lotNum = lotNumberElement ? lotNumberElement.textContent.trim() : null;

  if (!lotNum) {
    console.log("No lot number found");
    return;
  }

  const lotNumberMatch = lotNum.match(/\d+/);
  const lotNumberOnly = lotNumberMatch ? lotNumberMatch[0] : null;

  if (!lotNumberOnly) {
    console.log("Could not extract lot number");
    return;
  }

  const goodLot = `lot${lotNumberOnly}`;

  console.log(goodLot);

  // Retrieve the saved price specific to this model
  chrome.storage.local.get(goodLot, (result) => {
    const lotData = result[goodLot];
    // Use ?? rather than || so a legitimately saved price of 0 isn't dropped
    const savedPrice = lotData?.customPrice ?? "";

    // Check if the price input element already exists
    let priceInputDiv = document.querySelector("#google-price-input");
    if (!priceInputDiv) {
      // Create and append the input field and save button if they don't exist
      const quickBidButton = document.querySelector("#PlaceQuickBid");
      if (quickBidButton) {
        priceInputDiv = document.createElement("div");
        priceInputDiv.id = "google-price-input"; // Unique ID to prevent duplicates
        priceInputDiv.style.marginTop = "10px";

        // Create the input field
        const priceInput = document.createElement("input");
        priceInput.type = "number";
        priceInput.id = "custom-price-input";
        priceInput.placeholder = "Enter custom price";
        priceInput.value = savedPrice; // Pre-fill with saved price if available
        priceInput.style.marginRight = "10px";

        // Create the save button
        const saveButton = document.createElement("button");
        saveButton.type = "button"; // IMPORTANT: Prevent form submission
        saveButton.textContent = "Save Price";
        saveButton.style.cursor = "pointer";
        saveButton.style.backgroundColor = "#28a745";
        saveButton.style.color = "white";
        saveButton.style.border = "none";
        saveButton.style.padding = "5px 10px";
        saveButton.style.borderRadius = "3px";

        // Create the display for the saved price
        const savedPriceDisplay = document.createElement("div");
        savedPriceDisplay.id = "saved-price-display";
        savedPriceDisplay.style.marginTop = "10px";
        savedPriceDisplay.style.color = "red"; // Make the text red
        savedPriceDisplay.style.fontWeight = "bold"; // Optional: Make the text bold
        savedPriceDisplay.textContent = savedPrice !== ""
          ? `Saved Price: $${savedPrice}`
          : "No price saved yet";

        // Append input, button, and display to the div
        priceInputDiv.appendChild(priceInput);
        priceInputDiv.appendChild(saveButton);
        priceInputDiv.appendChild(savedPriceDisplay);

        // Append the div to the parent
        quickBidButton.parentNode.appendChild(priceInputDiv);

        // Save the price when the save button is clicked
        saveButton.addEventListener("click", (e) => {
          e.preventDefault(); // Prevent any default behavior
          e.stopPropagation(); // Stop event from bubbling up

          // Parsed separately from the fallback so a legitimately entered 0 is kept
          const parsedPrice = parseFloat(priceInput.value);
          const customPrice = isNaN(parsedPrice) ? "" : parsedPrice;
          chrome.storage.local.set(
            {
              [goodLot]: {
                ...lotData,
                customPrice: customPrice,
              },
            },
            () => {
              // Update the display with the newly saved price
              savedPriceDisplay.textContent = customPrice !== ""
                ? `Saved Price: $${customPrice}`
                : "No price saved yet";
              alert(customPrice !== "" ? `Price saved: $${customPrice}` : "Enter a valid price before saving");
            }
          );
        });
      }
    }
  });
}

// Checks whether the elements displayCustomPrice() needs are on the page yet
function isLotDetailUiReady() {
  const lotNumberElement = Array.from(
    document.querySelectorAll("b")
  ).find((b) => b.textContent.includes("Lot #"));
  return Boolean(lotNumberElement && document.querySelector("#PlaceQuickBid"));
}

// Unlike price-calculator.js (which waits for window "load"), this script
// used to run immediately at document_idle, so on pages that finish
// rendering #PlaceQuickBid after that point, the custom price widget would
// silently never appear. Wait for "load", then fall back to a short-lived
// observer for pages that render later still.
function initCustomPriceInput() {
  if (isLotDetailUiReady()) {
    displayCustomPrice();
    return;
  }

  const observer = new MutationObserver(() => {
    if (isLotDetailUiReady()) {
      observer.disconnect();
      displayCustomPrice();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

window.addEventListener("load", initCustomPriceInput);
