function displayCustomPrice() {
  const lotNumberElement = Array.from(
    document.querySelectorAll(".detail__next-prev-lot span")
  ).find((span) => span.textContent.includes("Lot"));

  const lotNum = lotNumberElement ? lotNumberElement.textContent.trim() : null;

  const lotNumberOnly = lotNum ? lotNum.match(/\d+/)[0] : null;

  const goodLot = `lot${lotNumberOnly}`;

  console.log(goodLot);

  // Retrieve the saved price specific to this model
  chrome.storage.local.get(goodLot, (result) => {
    const lotData = result[goodLot];
    const savedPrice = lotData?.customPrice || "";

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
        saveButton.textContent = "Save Price";
        saveButton.style.cursor = "pointer";

        // Create the display for the saved price
        const savedPriceDisplay = document.createElement("div");
        savedPriceDisplay.id = "saved-price-display";
        savedPriceDisplay.style.marginTop = "10px";
        savedPriceDisplay.style.color = "red"; // Make the text red
        savedPriceDisplay.style.fontWeight = "bold"; // Optional: Make the text bold
        savedPriceDisplay.textContent = savedPrice
          ? `Saved Price: $${savedPrice}`
          : "No price saved yet";

        // Append input, button, and display to the div
        priceInputDiv.appendChild(priceInput);
        priceInputDiv.appendChild(saveButton);
        priceInputDiv.appendChild(savedPriceDisplay);

        // Append the div to the parent
        quickBidButton.parentNode.appendChild(priceInputDiv);

        // Save the price when the save button is clicked
        saveButton.addEventListener("click", () => {
          const customPrice = parseFloat(priceInput.value) || "";
          chrome.storage.local.set(
            {
              [goodLot]: {
                ...lotData,
                customPrice: customPrice,
              },
            },
            () => {
              // Update the display with the newly saved price
              savedPriceDisplay.textContent = `Saved Price: $${customPrice}`;
              alert(`Price saved: $${customPrice}`);
            }
          );
        });
      }
    }
  });
}

displayCustomPrice();
