// VARIABLES
const errMsg = document.querySelector("#error");
const toggleBtn = document.querySelector(".toggleBtn");

// INITIALIZE TOGGLE BUTTON STATE ON LOAD
chrome.storage.local.get(["applicationIsOn"], (result) => {
  if (result.applicationIsOn == null) {
    chrome.storage.local.set({ applicationIsOn: true });
    changeToggleButton(true);
  } else {
    changeToggleButton(result.applicationIsOn);
  }
});

// LISTEN TO STORAGE CHANGES TO UPDATE UI
chrome.storage.onChanged.addListener((changes) => {
  if (changes["applicationIsOn"]?.newValue !== undefined) {
    changeToggleButton(changes["applicationIsOn"].newValue);
  }
});

// TOGGLE BUTTON CLICK HANDLER
document.onclick = (e) => {
  if (e.target.classList.contains("toggleBtn")) {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const isYouTube = tabs[0]?.url?.toLowerCase().includes("youtube.com");

      if (isYouTube) {
        try {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { toggle: true },
            (response) => {
              if (!response?.success) {
                errMsg.innerText = "Please refresh the page and try again!";
              }
            }
          );
        } catch {}
      } else {
        chrome.storage.local.get(["applicationIsOn"], (result) => {
          const newValue = !result.applicationIsOn;
          chrome.storage.local.set({ applicationIsOn: newValue });
          changeToggleButton(newValue);
        });
      }
    });
  }
};

// UPDATE BUTTON TEXT + STYLE
function changeToggleButton(isOn) {
  toggleBtn.innerText = isOn ? "Stop" : "Start";
  toggleBtn.classList.remove(isOn ? "start" : "stop");
  toggleBtn.classList.add(isOn ? "stop" : "start");
}
