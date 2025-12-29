// google_content.js

// Function to extract prices from Google search results
function extractPrices() {
  const prices = [];
  let amazonPrice = null;

  document.querySelectorAll('[role="listitem"]').forEach((listItem) => {
    // Find the element with aria-label containing "Current price" inside each list item
    const outerPriceElement = listItem.querySelector(
      '[aria-label*="Current price"]'
    );

    if (outerPriceElement) {
      // Select the inner span where the price text is located
      const priceElement = outerPriceElement.querySelector("span");

      if (priceElement) {
        const priceText = priceElement.textContent.trim();
        const priceMatch = priceText.match(/\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/); // Match prices like $1,999.99

        if (priceMatch) {
          const price = parseFloat(priceMatch[0].replace(/[$,]/g, "")); // Remove $ and commas, parse as float
          prices.push(price);
          console.log(`Found price: $${price}`);
        }
      }
    }
  });

  function getMostCommonPrice(prices) {
    const frequencyMap = prices.reduce((acc, price) => {
      acc[price] = (acc[price] || 0) + 1;
      return acc;
    }, {});

    // Find the price with the highest frequency
    let mostCommonPrice = null;
    let maxCount = 0;

    for (const price in frequencyMap) {
      if (frequencyMap[price] > maxCount) {
        mostCommonPrice = parseFloat(price); // Convert back to number
        maxCount = frequencyMap[price];
      }
    }

    return mostCommonPrice;
  }

  let finalRightPrice = null;

  // Only run getMostCommonPrice if prices array is non-empty
  if (prices && prices.length > 0) {
    finalRightPrice = getMostCommonPrice(prices);
  }
  // If no price was found in the listings, check the first 5 Amazon links as a fallback
  if (prices.length === 0) {
    const listings = document.querySelectorAll('[lang="en"]');
    let listingCount = 0;

    for (const listing of listings) {
      const listLink = listing.querySelector("a");

      if (listLink && listLink.href.includes("amazon")) {
        // Perform your desired action here
        let outerDiv = listing.querySelector('[data-sncf="2"]');
        if (!outerDiv) {
          outerDiv = listing.querySelector('[data-sncf="3"]');
        }

        if (outerDiv && outerDiv.innerText) {
          console.log(outerDiv.innerText);
          const priceMatch = outerDiv.innerText.match(
            /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/
          );
          if (priceMatch) {
            console.log(priceMatch[0]);
            amazonPrice = parseFloat(priceMatch[0].replace(/[$,]/g, ""));
            break; // Stop as soon as we find an Amazon price
          }
        }
      }

      // if (listing.href.includes("amazon")) {
      //   console.log(listing);
      //   const outerDiv = listing.querySelector('[data-sncf="2"]');
      //   console.log(outerDiv);
      //   const priceMatch = outerDiv.innerText.match(
      //     /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/
      //   );
      //   if (priceMatch) {
      //     amazonPrice = parseFloat(priceMatch[0].replace(/[$,]/g, ""));
      //     break; // Stop as soon as we find an Amazon price
      //   }
      //   listingCount++;
      // }
    }
  }

  // Choose the price to store
  let finalPrice = amazonPrice || finalRightPrice || null;

  // Save the price with the unique model key (or mark as searched with no price)
  chrome.storage.local.get("currentModel", (data) => {
    const modelNumber = data.currentModel;
    if (modelNumber) {
      if (finalPrice !== null) {
        chrome.storage.local.set(
          { [modelNumber]: { googlePrice: finalPrice, searchAttempted: true } },
          () => {
            console.log(`Price for model ${modelNumber} saved: $${finalPrice}`);
          }
        );
      } else {
        // No price found, but mark that we attempted a search
        chrome.storage.local.set(
          { [modelNumber]: { googlePrice: null, searchAttempted: true } },
          () => {
            console.log(`No price found for model ${modelNumber}, marked as searched`);
          }
        );
      }
    }
  });
}

// Run the price extraction function when the page loads
window.addEventListener("load", extractPrices);
