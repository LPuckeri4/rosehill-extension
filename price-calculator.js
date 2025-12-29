function formatPrice(price) {
  return price.toFixed(2);
}

// Function to multiply and display prices next to original prices
function applyPriceMultiplier() {
  document.querySelectorAll(".NumberPart").forEach((priceElement) => {
    // Check if we've already processed this price element
    if (priceElement.nextSibling &&
        priceElement.nextSibling.textContent &&
        priceElement.nextSibling.textContent.includes("($")) {
      return; // Already processed, skip
    }

    const priceText = priceElement.textContent.trim().replace(/,/g, ""); // Remove commas
    const price = parseFloat(priceText);

    if (!isNaN(price)) {
      const updatedPrice = price * 1.310796;

      const updatedPriceElement = document.createElement("span");
      updatedPriceElement.textContent = ` ($${formatPrice(updatedPrice)})`;
      updatedPriceElement.style.color = "blue";
      updatedPriceElement.style.marginLeft = "5px";
      updatedPriceElement.style.fontWeight = "bold";

      // Insert after the next sibling if it exists, otherwise append to parent
      const nextSibling = priceElement.nextSibling;
      const targetSibling = nextSibling ? nextSibling.nextSibling : null;

      if (targetSibling) {
        priceElement.parentNode.insertBefore(updatedPriceElement, targetSibling);
      } else {
        priceElement.parentNode.appendChild(updatedPriceElement);
      }
    }
  });
}

// Function to get product identifier (model number or title)
function getProductIdentifier() {
  // First try to get model number
  const modelNumberLabel = Array.from(
    document.querySelectorAll(".detail__cfName")
  ).find((label) => label.textContent.includes("Model Number"));

  if (modelNumberLabel) {
    const modelNumberElement = modelNumberLabel.parentElement.querySelector(".detail__cfValue");
    if (modelNumberElement) {
      const modelNumber = modelNumberElement.textContent.trim();
      if (modelNumber) {
        return {
          identifier: modelNumber,
          type: "model",
          element: modelNumberElement
        };
      }
    }
  }

  // Fallback to product title
  const titleElement = document.querySelector(".detail__title strong");
  if (titleElement) {
    const title = titleElement.textContent.trim();
    if (title) {
      return {
        identifier: title,
        type: "title",
        element: titleElement
      };
    }
  }

  return null;
}

// Function to add Google search button
function addGoogleSearchButton(lotNumber) {
  const productInfo = getProductIdentifier();

  if (!productInfo) return;

  const searchButton = document.createElement("button");
  searchButton.textContent = productInfo.type === "model"
    ? "Search Model on Google"
    : "Search Product on Google";
  searchButton.style.marginLeft = "10px";
  searchButton.style.padding = "5px";
  searchButton.style.backgroundColor = "#4285F4";
  searchButton.style.color = "#fff";
  searchButton.style.border = "none";
  searchButton.style.cursor = "pointer";

  searchButton.addEventListener("click", () => {
    chrome.storage.local.set(
      { currentModel: productInfo.identifier, currentLot: lotNumber },
      () => {
        const searchQuery = encodeURIComponent(productInfo.identifier);
        const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;
        window.open(googleSearchUrl, "_blank");
      }
    );
  });

  productInfo.element.parentNode.appendChild(searchButton);
}

// Function to retrieve and display the Google price only if it exists
function displayGooglePrice() {
  const productInfo = getProductIdentifier();

  if (!productInfo) return;

  const identifier = productInfo.identifier;

  // Retrieve the price specific to this product (by model number or title)
  chrome.storage.local.get(identifier, (result) => {
    const productData = result[identifier];

    // Check if the price element already exists
    let googlePriceDiv = document.querySelector("#google-price-display");

    if (productData && productData.searchAttempted) {
      // A search was attempted
      if (!googlePriceDiv) {
        // Create and append the Google price element if it doesn't exist
        const quickBidButton = document.querySelector("#PlaceQuickBid");
        if (quickBidButton) {
          googlePriceDiv = document.createElement("div");
          googlePriceDiv.id = "google-price-display"; // Unique ID to prevent duplicates
          googlePriceDiv.style.fontWeight = "bold";
          googlePriceDiv.style.marginTop = "10px";
          quickBidButton.parentNode.appendChild(googlePriceDiv);
        }
      }

      // Update the content based on whether a price was found
      if (googlePriceDiv) {
        if (productData.googlePrice) {
          googlePriceDiv.style.color = "green";
          googlePriceDiv.textContent = `Google Price: $${productData.googlePrice.toFixed(2)}`;
        } else {
          googlePriceDiv.style.color = "orange";
          googlePriceDiv.textContent = "No valid price found on Google";
        }
      }
    }
  });
}

// Function to process the lot details and apply multiplier
function processLotDetails() {
  const lotNumberElement = Array.from(
    document.querySelectorAll("b")
  ).find((b) => b.textContent.includes("Lot #"));
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
window.addEventListener("load", () => {
  // Check if we're on a listings page or a detail page
  const isListingsPage = document.querySelector(".eventDetails__container");

  if (isListingsPage) {
    // Listings/catalog page - set up observer for infinite scroll
    setupDynamicListingsObserver();
  } else {
    // Individual lot detail page - process lot details
    processLotDetails();
  }
});

// Update Google prices when returning to the tab
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    displayGooglePrice();
  }
});

// MutationObserver to handle dynamically loaded listings (infinite scroll)
function setupDynamicListingsObserver() {
  const listingsContainer = document.querySelector(".eventDetails__container");

  if (!listingsContainer) {
    return; // Not on a listings page, exit
  }

  // Apply price multiplier to existing listings on page load
  applyPriceMultiplier();

  // Create observer to watch for new listings being added
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Check if new nodes were added
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          // Check if the added node is a listing section or contains listings
          if (node.nodeType === 1) { // Element node
            // If it's a section with data-listingid, process it
            if (node.tagName === "SECTION" && node.hasAttribute("data-listingid")) {
              applyPriceMultiplierToElement(node);
            }
            // If it contains listing sections, process all of them
            else if (node.querySelectorAll) {
              const newListings = node.querySelectorAll("section[data-listingid]");
              newListings.forEach((listing) => {
                applyPriceMultiplierToElement(listing);
              });
            }
          }
        });
      }
    });
  });

  // Start observing the container for child additions
  observer.observe(listingsContainer, {
    childList: true,
    subtree: true
  });

  console.log("Rosehill price multiplier: Observing for dynamically loaded listings");
}

// Apply price multiplier to a specific element (for dynamically loaded content)
function applyPriceMultiplierToElement(element) {
  element.querySelectorAll(".NumberPart").forEach((priceElement) => {
    // Check if we've already processed this price element
    if (priceElement.nextSibling &&
        priceElement.nextSibling.textContent &&
        priceElement.nextSibling.textContent.includes("($")) {
      return; // Already processed
    }

    const priceText = priceElement.textContent.trim().replace(/,/g, "");
    const price = parseFloat(priceText);

    if (!isNaN(price)) {
      const updatedPrice = price * 1.310796;

      const updatedPriceElement = document.createElement("span");
      updatedPriceElement.textContent = ` ($${formatPrice(updatedPrice)})`;
      updatedPriceElement.style.color = "blue";
      updatedPriceElement.style.marginLeft = "5px";
      updatedPriceElement.style.fontWeight = "bold";

      const nextSibling = priceElement.nextSibling;
      const targetSibling = nextSibling ? nextSibling.nextSibling : null;

      if (targetSibling) {
        priceElement.parentNode.insertBefore(updatedPriceElement, targetSibling);
      } else {
        priceElement.parentNode.appendChild(updatedPriceElement);
      }
    }
  });
}
