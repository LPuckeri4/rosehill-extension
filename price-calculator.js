function formatPrice(price) {
  return price.toFixed(2);
}

// Confirmed against Rosehill's Terms & Conditions and real paid invoices
// (both Burlington and Fort Erie): 16% buyer's premium, taxable, plus 13% HST.
const BUYER_PREMIUM = 1.16;
const HST = 1.13;

// Whether the displayed price includes HST on top of the buyer's premium.
// Populated from chrome.storage.local before the first render; defaults to
// true (matches the extension's original always-tax-included behavior).
let includeTax = true;

function getMultiplier() {
  return includeTax ? BUYER_PREMIUM * HST : BUYER_PREMIUM;
}

// Tracks the annotation span already created for a given .NumberPart element,
// so re-processing (e.g. after a live SignalR bid update) updates it in place
// instead of relying on fragile sibling-text sniffing that misses the actual
// insertion point and would otherwise stack duplicate annotations.
const priceAnnotations = new WeakMap();

// Computes and displays/updates the multiplied price for a single .NumberPart element
function processPriceElement(priceElement) {
  const priceText = priceElement.textContent.trim().replace(/,/g, ""); // Remove commas
  const price = parseFloat(priceText);

  if (isNaN(price)) return;

  const updatedPrice = price * getMultiplier();
  const formatted = ` ($${formatPrice(updatedPrice)})`;

  const existingSpan = priceAnnotations.get(priceElement);
  if (existingSpan && existingSpan.isConnected) {
    if (existingSpan.textContent !== formatted) {
      existingSpan.textContent = formatted;
    }
    return;
  }

  const updatedPriceElement = document.createElement("span");
  updatedPriceElement.textContent = formatted;
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

  priceAnnotations.set(priceElement, updatedPriceElement);
}

// Function to multiply and display prices next to original prices
function applyPriceMultiplier() {
  document.querySelectorAll(".NumberPart").forEach(processPriceElement);
}

// Function to get the product identifier to search for (the listing title).
// Rosehill's "Model Number" custom field is their own internal SKU rather
// than the manufacturer's real part number, so searching it on Google
// returns irrelevant results (e.g. "0822DS-03" instead of "SURGE Charger
// Stand for Xbox Series X/S"). The title reliably finds the right product.
function getProductIdentifier() {
  const titleElement = document.querySelector(".detail__title strong");
  if (titleElement) {
    const title = titleElement.textContent.trim();
    if (title) {
      return {
        identifier: title,
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
  searchButton.textContent = "Search Product on Google";
  searchButton.style.marginLeft = "10px";
  searchButton.style.padding = "5px";
  searchButton.style.backgroundColor = "#4285F4";
  searchButton.style.color = "#fff";
  searchButton.style.border = "none";
  searchButton.style.cursor = "pointer";

  searchButton.addEventListener("click", () => {
    // Pass the identifier via URL params (instead of a shared storage key) so
    // that searching multiple lots in parallel tabs can't clobber each other.
    const searchQuery = encodeURIComponent(productInfo.identifier);
    const googleSearchUrl =
      `https://www.google.com/search?q=${searchQuery}` +
      `&rhIdentifier=${searchQuery}` +
      `&rhLot=${encodeURIComponent(lotNumber)}`;
    window.open(googleSearchUrl, "_blank");
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

// Function to process the lot-detail-page-only additions (search button, Google price)
function processLotDetails() {
  const lotNumberElement = Array.from(
    document.querySelectorAll("b")
  ).find((b) => b.textContent.includes("Lot #"));
  if (lotNumberElement) {
    const lotNumber = lotNumberElement.textContent.trim().replace("Lot # ", "");
    addGoogleSearchButton(lotNumber);
    displayGooglePrice();
  }
}

// Run the function on page load
window.addEventListener("load", () => {
  chrome.storage.local.get({ rhSettings: { includeTax: true } }, (result) => {
    includeTax = result.rhSettings.includeTax;

    applyPriceMultiplier();
    setupPriceObserver();

    // Individual lot detail page - add the search button / Google price display
    const isListingsPage = document.querySelector(".eventDetails__container");
    if (!isListingsPage) {
      processLotDetails();
    }
  });
});

// Re-render already-displayed prices immediately when the tax toggle is
// changed from the popup, without requiring a page reload.
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.rhSettings) {
    includeTax = changes.rhSettings.newValue.includeTax;
    applyPriceMultiplier();
  }
});

// Update Google prices when returning to the tab
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    displayGooglePrice();
  }
});

// MutationObserver that keeps calculated prices in sync with both newly
// loaded listings (infinite scroll) and live price updates pushed via
// SignalR, which replace a .NumberPart element's text in place rather than
// adding new listing sections.
function setupPriceObserver() {
  const observer = new MutationObserver((mutations) => {
    const affected = new Set();

    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        const target = mutation.target;
        if (target.nodeType === 1 && target.classList && target.classList.contains("NumberPart")) {
          affected.add(target);
        }
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return; // Element nodes only
          if (node.classList && node.classList.contains("NumberPart")) {
            affected.add(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll(".NumberPart").forEach((el) => affected.add(el));
          }
        });
      } else if (mutation.type === "characterData") {
        const parent = mutation.target.parentElement;
        if (parent && parent.classList && parent.classList.contains("NumberPart")) {
          affected.add(parent);
        }
      }
    });

    affected.forEach(processPriceElement);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}
