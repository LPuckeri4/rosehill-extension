# Rosehill Auction Price Extension

A Chrome extension for Rosehill Online Auctions that displays calculated final prices including fees and taxes, retrieves retail prices from Google, and allows custom price tracking.

## Features

### Price Calculation
- Automatically applies Rosehill's 16% buyer's premium (and, by default, 13% HST) to show the final price
- Whether HST is included is configurable from the extension popup
- Displays calculated prices in blue text next to original prices
- Works on both listing pages and individual lot detail pages
- Supports infinite scroll on listing pages, and updates live as bid amounts change

### Google Price Lookup
- Searches Google for retail prices based on the listing title (Rosehill's "Model Number" field is their own internal SKU, not the manufacturer's part number, so it isn't used for search)
- Extracts prices from Google Shopping results and Amazon listings
- Caches prices for quick retrieval
- Displays "No valid price found on Google" when no price data is available

### Custom Price Tracking
- Allows manual entry and storage of custom prices per lot
- Persists custom prices in local storage
- Displays saved prices in red for easy identification

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the extension directory

## Usage

### Viewing Calculated Prices
Calculated prices appear automatically in blue text next to all price elements on Rosehill auction pages.

### Looking Up Google Prices
1. Navigate to a product detail page
2. Click the "Search Product on Google" button
3. The extension will open a Google search tab
4. Return to the product page to see the retrieved price displayed in green
5. If no price is found, an orange message will indicate this

### Setting Custom Prices
1. Navigate to a product detail page
2. Enter a price in the custom price input field
3. Click "Save Price"
4. The saved price will be displayed in red and persist across sessions

### Extension Settings
Click the extension icon in the Chrome toolbar to open the settings popup:
- **Include HST in calculated price** — toggle whether the 13% HST is added on top of the 16% buyer's premium. Takes effect immediately on any open Rosehill tabs.
- **Clear** (Google prices) — removes only cached Google search results, leaving custom prices untouched.
- **Clear** (Custom prices) — removes only your saved custom prices, leaving Google prices untouched.

## Technical Details

### Price Multiplier
Confirmed against Rosehill's Terms & Conditions and real paid invoices from both the Burlington and Fort Erie locations (both charge identical fees):
- 16% buyer's premium, always applied
- 13% HST, applied on top of the premium-inclusive price — optional via the popup toggle (on by default)

### Price Detection
The extension uses a MutationObserver to detect dynamically loaded content on listing pages, ensuring prices are calculated even when new listings are loaded via infinite scroll.

### Storage
All data is stored locally using Chrome's storage API. This includes:
- Retrieved Google prices (keyed by listing title) and search attempt markers
- Custom user-entered prices (keyed by lot number, e.g. `lot123`)
- The `rhSettings` object (currently just `includeTax`)

## File Structure

```
rosehill/
├── manifest.json              # Extension configuration
├── README.md                  # Documentation
├── .gitignore                 # Git ignore rules
├── price-calculator.js        # Main price calculation and Google integration
├── custom-price-input.js      # Custom price input functionality
├── google-price-scraper.js    # Google search result price extraction
├── popup.html                 # Extension popup interface
├── popup.js                   # Popup functionality
├── icon16.png                 # Extension icon (16x16)
├── icon48.png                 # Extension icon (48x48)
└── icon128.png                # Extension icon (128x128)
```

## Browser Compatibility

This extension is designed for Chrome and browsers based on Chromium using Manifest V3.

## Permissions

The extension requires the following permissions:
- `storage`: To cache Google prices and custom prices
- `https://*.rosehillonline.ca/*`: To modify Rosehill auction pages
- `https://www.google.com/search*`: To extract prices from Google search results

## Development

### Modifying the Price Multiplier

To change the fee rates, edit the constants in `price-calculator.js`:

```javascript
const BUYER_PREMIUM = 1.16; // 16% buyer's premium
const HST = 1.13;           // 13% HST
```

### Adjusting Price Extraction

Google's HTML structure may change over time. If price extraction stops working, update the selectors in `google-price-scraper.js`.

## Known Issues

- Google's search result structure changes periodically and may require selector updates
- Search relies on the listing title, so it works best for items with a clear brand/product name in the title

## License

This project is provided as-is for personal use.
