chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get("autoScroll", (data) => {
      if (data.autoScroll === undefined) {
        chrome.storage.sync.set({ autoScroll: true });
      }
    });
  });
  