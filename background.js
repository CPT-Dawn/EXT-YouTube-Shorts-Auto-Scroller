chrome.runtime.onInstalled.addListener(() => {
    // Set default toggle state to true when installed
    chrome.storage.local.set({ applicationIsOn: true });
  });
  
  // Listen for messages from popup or content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.getApplicationStatus) {
      chrome.storage.local.get(["applicationIsOn"], (result) => {
        sendResponse({ applicationIsOn: result.applicationIsOn ?? true });
      });
      return true; // Indicates async response
    }
  
    if (message.setApplicationStatus !== undefined) {
      chrome.storage.local.set({ applicationIsOn: message.setApplicationStatus });
    }
  });
  