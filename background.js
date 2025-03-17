chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ autoScroll: true });
});
