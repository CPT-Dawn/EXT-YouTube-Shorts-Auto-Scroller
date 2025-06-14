chrome.runtime.onInstalled.addListener((details) => {
  // Initialize default settings on first install
  chrome.storage.local.get(
    ["applicationIsOn", "scrollOnComments"],
    (result) => {
      if (result.applicationIsOn === undefined) {
        chrome.storage.local.set({ applicationIsOn: true });
      }
      if (result.scrollOnComments === undefined) {
        chrome.storage.local.set({ scrollOnComments: false });
      }
    }
  );

  console.log("[YouTube Shorts Auto Scroller] Extension installed/updated");
});

// Auto-reload on update
chrome.runtime.onUpdateAvailable.addListener(() => {
  chrome.runtime.reload();
});
