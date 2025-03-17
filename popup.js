document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("toggle");
  
    chrome.storage.sync.get("autoScroll", (data) => {
      toggle.checked = data.autoScroll ?? true;
    });
  
    toggle.addEventListener("change", () => {
      chrome.storage.sync.set({ autoScroll: toggle.checked }, () => {
        // Refresh the page when toggle is changed
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      });
    });
  });
  