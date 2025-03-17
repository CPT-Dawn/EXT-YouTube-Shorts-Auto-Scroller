document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggleAutoScroll");

  // Load stored setting
  chrome.storage.sync.get("autoScroll", (data) => {
    toggle.checked = data.autoScroll ?? true;
  });

  // Save toggle state and refresh Shorts page
  toggle.addEventListener("change", () => {
    chrome.storage.sync.set({ autoScroll: toggle.checked });
  });
});
