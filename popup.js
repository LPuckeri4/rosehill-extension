// popup.js

const BUYER_PREMIUM = 1.16;
const HST = 1.13;

const includeTaxToggle = document.getElementById("includeTaxToggle");
const formulaPreview = document.getElementById("formulaPreview");
const status = document.getElementById("status");

function updateFormulaPreview(includeTax) {
  const multiplier = includeTax ? BUYER_PREMIUM * HST : BUYER_PREMIUM;
  const example = (100 * multiplier).toFixed(2);
  const explanation = includeTax ? "16% premium + 13% HST" : "16% premium only, no HST";
  formulaPreview.innerHTML = `$100.00 &rarr; <strong>$${example}</strong> (${explanation})`;
}

function showStatus(message) {
  status.textContent = message;
  status.classList.add("success");
  setTimeout(() => {
    status.textContent = "";
    status.classList.remove("success");
  }, 2000);
}

// Load the current setting (default: tax included, matching original behavior)
chrome.storage.local.get({ rhSettings: { includeTax: true } }, (result) => {
  includeTaxToggle.checked = result.rhSettings.includeTax;
  updateFormulaPreview(result.rhSettings.includeTax);
});

includeTaxToggle.addEventListener("change", () => {
  const includeTax = includeTaxToggle.checked;
  updateFormulaPreview(includeTax);
  chrome.storage.local.set({ rhSettings: { includeTax } }, () => {
    showStatus("Setting saved");
  });
});

// Removes only entries matching `predicate`, leaving settings and the other
// price category untouched (unlike the old single "Clear Prices" button,
// which wiped everything in storage.local).
function clearMatching(predicate, label) {
  chrome.storage.local.get(null, (all) => {
    const keysToRemove = Object.keys(all).filter((key) => predicate(key, all[key]));
    chrome.storage.local.remove(keysToRemove, () => {
      showStatus(`${label} cleared (${keysToRemove.length})`);
    });
  });
}

document.getElementById("clearGoogleButton").addEventListener("click", () => {
  clearMatching((key, value) => value && typeof value === "object" && "searchAttempted" in value, "Google prices");
});

document.getElementById("clearCustomButton").addEventListener("click", () => {
  clearMatching((key) => /^lot\d+$/.test(key), "Custom prices");
});
