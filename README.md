# Rosehill Auction Price Extension

A Chrome extension for Rosehill Online Auctions that displays calculated final prices including fees and taxes, retrieves retail prices from Google, and allows custom price tracking.

## Features

### Price Calculation
- Automatically multiplies displayed prices by 1.310796 to show the final price including buyer's premium and taxes
- Displays calculated prices in blue text next to original prices
- Works on both listing pages and individual lot detail pages
- Supports infinite scroll on listing pages

### Google Price Lookup
- Searches Google for retail prices based on product model numbers
- Falls back to product title search if no model number is available
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
2. Click the "Search Model on Google" or "Search Product on Google" button
3. The extension will open a Google search tab
4. Return to the product page to see the retrieved price displayed in green
5. If no price is found, an orange message will indicate this

### Setting Custom Prices
1. Navigate to a product detail page
2. Enter a price in the custom price input field
3. Click "Save Price"
4. The saved price will be displayed in red and persist across sessions

### Clearing Stored Data
1. Click the extension icon in the Chrome toolbar
2. Click "Clear Prices" to remove all stored Google prices and custom prices

## Technical Details

### Price Multiplier
The multiplier value of 1.310796 accounts for:
- 16% buyer's premium
- Applicable taxes

### Price Detection
The extension uses a MutationObserver to detect dynamically loaded content on listing pages, ensuring prices are calculated even when new listings are loaded via infinite scroll.

### Storage
All data is stored locally using Chrome's storage API. This includes:
- Retrieved Google prices
- Custom user-entered prices
- Search attempt markers

## File Structure

```
rosehill/
├── manifest.json           # Extension configuration
├── content.js             # Main content script for price calculation and Google integration
├── content2.js            # Custom price input functionality
├── google_content.js      # Google search result price extraction
├── popup.html             # Extension popup interface
├── popup.js              # Popup functionality
├── icon16.png            # Extension icon (16x16)
├── icon48.png            # Extension icon (48x48)
└── icon128.png           # Extension icon (128x128)
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

To change the multiplier, edit the value in `content.js`:

```javascript
const updatedPrice = price * 1.310796; // Change this value
```

### Adjusting Price Extraction

Google's HTML structure may change over time. If price extraction stops working, update the selectors in `google_content.js`.

## Known Issues

- Google's search result structure changes periodically and may require selector updates
- Price extraction works best for products with clear model numbers

## License

This project is provided as-is for personal use.
