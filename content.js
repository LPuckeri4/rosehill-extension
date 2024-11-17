function formatPrice(price) {
  return price.toFixed(2);
}

// Function to multiply and display prices next to original prices
function applyPriceMultiplier() {
  document.querySelectorAll(".NumberPart").forEach((priceElement) => {
    const priceText = priceElement.textContent.trim().replace(/,/g, ""); // Remove commas
    const price = parseFloat(priceText);

    if (!isNaN(price)) {
      const updatedPrice = price * 1.310796;

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

// Function to add Google search button for the model number
function addGoogleSearchButton(lotNumber) {
  const modelNumberLabel = Array.from(
    document.querySelectorAll(".detail__field-name")
  ).find((label) => label.textContent.includes("Model Number"));
  let modelNumberElement = null;

  if (modelNumberLabel) {
    modelNumberElement =
      modelNumberLabel.parentElement.nextElementSibling.querySelector(
        ".detail__field-value"
      );
  }

  const modelNumber = modelNumberElement
    ? modelNumberElement.textContent.trim()
    : null;

  if (modelNumber) {
    const searchButton = document.createElement("button");
    searchButton.textContent = "Search Model on Google";
    searchButton.style.marginLeft = "10px";
    searchButton.style.padding = "5px";
    searchButton.style.backgroundColor = "#4285F4";
    searchButton.style.color = "#fff";
    searchButton.style.border = "none";
    searchButton.style.cursor = "pointer";

    searchButton.addEventListener("click", () => {
      chrome.storage.local.set(
        { currentModel: modelNumber, currentLot: lotNumber },
        () => {
          const searchQuery = encodeURIComponent(modelNumber);
          const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;
          window.open(googleSearchUrl, "_blank");
        }
      );
    });

    modelNumberElement.parentNode.appendChild(searchButton);
  }
}

// Function to retrieve and display the Google price only if it exists
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

// Function to process the lot details and apply multiplier
function processLotDetails() {
  const lotNumberElement = Array.from(
    document.querySelectorAll(".detail__field-name")
  ).find((label) => label.textContent.includes("Lot #"));
  if (lotNumberElement) {
    const lotNumber = lotNumberElement.textContent.trim().replace("Lot # ", "");
    applyPriceMultiplier();
    addGoogleSearchButton(lotNumber);
    displayGooglePrice();
  } else {
    applyPriceMultiplier();
  }
}

// Run the function on page load
window.addEventListener("load", processLotDetails);

// Update Google prices when returning to the tab
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    displayGooglePrice();
  }
});
