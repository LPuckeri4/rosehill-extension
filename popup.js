// popup.js

document.getElementById("clearPricesButton").addEventListener("click", () => {
  chrome.storage.local.clear(() => {
    const status = document.getElementById("status");
    status.textContent = "All stored prices have been cleared.";
    status.style.color = "green";

    // Clear the status message after 2 seconds
    setTimeout(() => {
      status.textContent = "";
    }, 2000);
  });
});
