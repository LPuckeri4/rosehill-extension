function displayGooglePrice() {
  const modelNumberElement = Array.from(
    document.querySelectorAll(".detail__field-name")
  ).find((label) => label.textContent.includes("Model Number"));

  if (!modelNumberElement) return;

  const modelNumber = modelNumberElement.parentElement.nextElementSibling
    .querySelector(".detail__field-value")
    .textContent.trim();

  // Retrieve the price specific to this model
  chrome.storage.local.get(modelNumber, (result) => {
    const modelData = result[modelNumber];
    if (modelData && modelData.googlePrice) {
      const googlePrice = modelData.googlePrice;

      // Check if the price element already exists
      let googlePriceDiv = document.querySelector("#google-price-display");
      if (!googlePriceDiv) {
        // Create and append the Google price element if it doesn't exist
        const quickBidButton = document.querySelector("#PlaceQuickBid");
        if (quickBidButton) {
          googlePriceDiv = document.createElement("div");
          googlePriceDiv.id = "google-price-display"; // Unique ID to prevent duplicates
          googlePriceDiv.style.color = "green";
          googlePriceDiv.style.fontWeight = "bold";
          googlePriceDiv.style.marginTop = "10px";
          quickBidButton.parentNode.appendChild(googlePriceDiv);
        }
      }

      // Update the content of the Google price display
      if (googlePriceDiv) {
        googlePriceDiv.textContent = `Google Price: $${googlePrice.toFixed(2)}`;
      }
    }
  });
}

function applyPricesWhere() {
  document.querySelectorAll("a").forEach((priceElement) => {
    const priceText = priceElement.textContent.trim();
    const price = parseFloat(priceText);

    if (!isNaN(price)) {
      const updatedPrice = price * 1.3;

      const updatedPriceElement = document.createElement("span");
      updatedPriceElement.textContent = ` ($${formatPrice(updatedPrice)})`;
      updatedPriceElement.style.color = "blue";
      updatedPriceElement.style.marginLeft = "5px";
      updatedPriceElement.style.fontWeight = "bold";

      priceElement.parentNode.insertBefore(
        updatedPriceElement,
        priceElement.nextSibling.nextSibling
      );
    }
  });
}
