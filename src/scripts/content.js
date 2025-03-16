let isOnReels = false;
let appIsRunning = false;

// ✅ Function to start or stop auto-scrolling
function toggleAutoScrolling(state, shouldRefresh = true) {
  appIsRunning = state; // Set the application state to the provided state
  chrome.storage.sync.set({ autoReelsStart: state }, () => {
    updateToggleState(state); // Update the visual state of the toggle
    if (shouldRefresh) location.reload(); // Reload the page if shouldRefresh is true
  });

  state ? startAutoScrolling() : stopAutoScrolling(); // Start or stop auto-scrolling based on the state
}

// ✅ Check if we are on the Reels page and apply changes
function checkURLAndManageApp() {
  const isOnReelsPage = window.location.href.startsWith("https://www.instagram.com/reels/");

  if (isOnReelsPage && !isOnReels) {
    isOnReels = true; // Update the state to indicate we are on the Reels page
    chrome.storage.sync.get(["autoReelsStart", "injectReelsButton"], (result) => {
      if (result.autoReelsStart) toggleAutoScrolling(true, false); // Start auto-scrolling if enabled
      if (result.injectReelsButton) injectToggle(result.autoReelsStart); // Inject toggle button if enabled
    });
  } else if (!isOnReelsPage && isOnReels) {
    isOnReels = false; // Update the state to indicate we are leaving the Reels page
    toggleAutoScrolling(false, false); // Stop auto-scrolling
    removeToggle(); // Remove the toggle button
  }
}

// ✅ Function to inject a toggle button in Reels
function injectToggle(isEnabled) {
  removeToggle(); // Prevent duplicates

  const toggleWrapper = document.createElement("div");
  toggleWrapper.id = "myInjectedToggleWrapper";
  toggleWrapper.style.position = "fixed";
  toggleWrapper.style.right = "20px";
  toggleWrapper.style.bottom = "80px";
  toggleWrapper.style.zIndex = "1000";
  toggleWrapper.style.padding = "13px";
  toggleWrapper.style.background = "#111827";
  toggleWrapper.style.borderRadius = "50px";
  toggleWrapper.style.display = "flex";
  toggleWrapper.style.alignItems = "center";
  toggleWrapper.style.gap = "10px";
  toggleWrapper.style.cursor = "pointer";
  toggleWrapper.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.1)";
  toggleWrapper.style.transition = "background 0.3s ease";

  const label = document.createElement("p");
  label.innerText = "Auto-Scroll";
  label.style.color = "#FFF";
  label.style.fontSize = "14px";
  label.style.margin = "0";

  const toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.id = "myInjectedToggle";
  toggle.style.display = "none";
  toggle.checked = isEnabled;

  const slider = document.createElement("span");
  slider.className = "slider";
  slider.style.width = "40px";
  slider.style.height = "20px";
  slider.style.borderRadius = "50px";
  slider.style.position = "relative";
  slider.style.transition = "background 0.3s";
  slider.style.background = isEnabled
    ? "radial-gradient(61.46% 59.09% at 36.25% 96.55%, #FFD600 0%, #FF6930 48.44%, #FE3B36 73.44%, rgba(254, 59, 54, 0.00) 100%)"
    : "radial-gradient(61.46% 59.09% at 36.25% 96.55%, rgba(255, 214, 0, 0.10) 0%, rgba(255, 105, 48, 0.10) 48.44%, rgba(254, 59, 54, 0.10) 73.44%, rgba(254, 59, 54, 0.00) 100%)";

  const circle = document.createElement("span");
  circle.style.position = "absolute";
  circle.style.width = "18px";
  circle.style.height = "18px";
  circle.style.background = "white";
  circle.style.borderRadius = "50%";
  circle.style.top = "1px";
  circle.style.left = isEnabled ? "20px" : "2px";
  circle.style.transition = "left 0.3s";

  slider.appendChild(circle);
  toggleWrapper.appendChild(label);
  toggleWrapper.appendChild(slider);

  toggleWrapper.addEventListener("click", () => {
    chrome.storage.sync.get("autoReelsStart", (data) => {
      const newState = !data.autoReelsStart; // Toggle the state
      chrome.storage.sync.set({ autoReelsStart: newState }, () => {
        toggleAutoScrolling(newState); // Start or stop auto-scrolling based on the new state
      });
    });
  });

  document.body.appendChild(toggleWrapper); // Append the toggle button to the body
}

// ✅ Function to update the toggle state visually
function updateToggleState(isEnabled) {
  const slider = document.querySelector("#myInjectedToggleWrapper .slider");
  const circle = slider?.querySelector("span");

  if (slider && circle) {
    slider.style.background = isEnabled
      ? "radial-gradient(61.46% 59.09% at 36.25% 96.55%, #FFD600 0%, #FF6930 48.44%, #FE3B36 73.44%, rgba(254, 59, 54, 0.00) 100%), radial-gradient(202.83% 136.37% at 84.5% 113.5%, #FF1B90 24.39%, #F80261 43.67%, #ED00C0 68.85%, #C500E9 77.68%, #7017FF 89.32%)"
      : "radial-gradient(61.46% 59.09% at 36.25% 96.55%, rgba(255, 214, 0, 0.10) 0%, rgba(255, 105, 48, 0.10) 48.44%, rgba(254, 59, 54, 0.10) 73.44%, rgba(254, 59, 54, 0.00) 100%), radial-gradient(202.83% 136.37% at 84.5% 113.5%, rgba(255, 27, 144, 0.10) 24.39%, rgba(248, 2, 97, 0.10) 43.67%, rgba(237, 0, 192, 0.10) 68.85%, rgba(197, 0, 233, 0.10) 77.68%, rgba(112, 23, 255, 0.10) 89.32%)";

    circle.style.left = isEnabled ? "20px" : "2px"; // Move the circle based on the toggle state
  }
}

// ✅ Function to remove toggle when leaving Reels
function removeToggle() {
  const toggleWrapper = document.querySelector("#myInjectedToggleWrapper");
  if (toggleWrapper) toggleWrapper.remove(); // Remove the toggle button if it exists
}

// ✅ Start Auto-Scrolling
function startAutoScrolling() {
  console.log("Auto-scrolling enabled"); // Log the action
  setInterval(() => {
    if (!appIsRunning) return; // Exit if the app is not running
    const currentVideo = getCurrentVideo(); // Get the current video
    if (currentVideo) {
      currentVideo.removeAttribute("loop"); // Remove loop attribute from the video
      currentVideo.addEventListener("ended", onVideoEnd); // Add event listener for when the video ends
    }
  }, 100); // Check every 100 milliseconds
}

// ✅ Stop Auto-Scrolling
function stopAutoScrolling() {
  console.log("Auto-scrolling disabled"); // Log the action
}

// ✅ Handle video end event
function onVideoEnd() {
  if (!appIsRunning) return; // Exit if the app is not running
  const nextVideo = getNextVideo(); // Get the next video
  if (nextVideo) scrollToNextVideo(nextVideo); // Scroll to the next video if it exists
}

// ✅ Utility functions
function getCurrentVideo() {
  return [...document.querySelectorAll("main video")].find((video) => {
    const rect = video.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight; // Check if the video is in the viewport
  });
}

function getNextVideo() {
  const videos = document.querySelectorAll("main video");
  const currentIndex = [...videos].findIndex(
    (video) => video === getCurrentVideo() // Find the index of the current video
  );
  return videos[currentIndex + 1] || null; // Return the next video or null if it doesn't exist
}

function scrollToNextVideo(video) {
  video.scrollIntoView({ behavior: "smooth", block: "center" }); // Scroll to the next video smoothly
}

// ✅ Listen for URL changes
new MutationObserver(checkURLAndManageApp).observe(document.body, {
  childList: true,
  subtree: true,
});
window.addEventListener("popstate", checkURLAndManageApp); // Listen for popstate events
checkURLAndManageApp(); // Initial check for URL

// ✅ Listen for popup toggle events
chrome.runtime.onMessage.addListener((message) => {
  if (message.event === "toggleAutoReels") {
    toggleAutoScrolling(message.state); // Toggle auto-scrolling based on the message state
  }
  if (message.event === "toggleInjectButton") {
    chrome.storage.sync.set({ injectReelsButton: message.state }, () => {
      injectToggle(message.state); // Inject toggle button based on the message state
    });
  }
});
