const allStorageKeys = [
  "applicationIsOn",
];
  chrome.storage.local.get("applicationIsOn", (result) => {
      if (result.applicationIsOn == undefined) {
          chrome.storage.local.set({ applicationIsOn: true });
      }
  });
chrome.runtime.onUpdateAvailable.addListener(() => {
  chrome.runtime.reload();
});