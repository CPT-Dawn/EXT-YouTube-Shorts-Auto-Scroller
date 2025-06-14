document.addEventListener("DOMContentLoaded", async () => {
  // Get DOM elements
  const statusToggle = document.getElementById("status-toggle");
  const scrollOnCommentsInput = document.getElementById(
    "scrollOnCommentsInput"
  );
  const onScreenButtonInput = document.getElementById("onScreenButtonInput");
  const errorMessage = document.getElementById("error-message");

  // Status elements
  const statusCard = document.getElementById("status-card");
  const statusDot = document.getElementById("status-dot");
  const statusTitle = document.getElementById("status-title");
  const statusDescription = document.getElementById("status-description");
  // Setting cards for click handlers
  const mainSettingCard = document.getElementById("main-setting-card");
  const commentsSettingCard = document.getElementById("comments-setting-card");
  const onScreenButtonSettingCard = document.getElementById(
    "onscreen-button-setting-card"
  );

  // Load settings on startup
  await loadAllSettings();

  // Set up event listeners
  setupEventListeners();

  // Check current tab and show appropriate status
  await checkCurrentTab();

  async function loadAllSettings() {
    try {
      const result = await chrome.storage.local.get([
        "applicationIsOn",
        "scrollOnComments",
        "showOnScreenButton",
      ]); // Set toggle states
      statusToggle.checked = result.applicationIsOn !== false; // Default to true
      scrollOnCommentsInput.checked = result.scrollOnComments === true; // Default to false
      onScreenButtonInput.checked = result.showOnScreenButton !== false; // Default to true

      // Update UI status
      updateStatus(statusToggle.checked);

      console.log("[Popup] Settings loaded:", result);
    } catch (error) {
      console.error("[Popup] Error loading settings:", error);
      showError("Failed to load settings");
    }
  }

  function setupEventListeners() {
    // Main toggle change
    statusToggle.addEventListener("change", handleMainToggle); // Comments setting change
    scrollOnCommentsInput.addEventListener("change", handleCommentsToggle);

    // On-screen button setting change
    onScreenButtonInput.addEventListener("change", handleOnScreenButtonToggle);

    // Click handlers for setting cards (makes entire card clickable)
    mainSettingCard.addEventListener("click", (e) => {
      if (e.target !== statusToggle && !e.target.closest(".toggle-switch")) {
        statusToggle.checked = !statusToggle.checked;
        handleMainToggle();
      }
    });
    commentsSettingCard.addEventListener("click", (e) => {
      if (
        e.target !== scrollOnCommentsInput &&
        !e.target.closest(".toggle-switch")
      ) {
        scrollOnCommentsInput.checked = !scrollOnCommentsInput.checked;
        handleCommentsToggle();
      }
    });

    onScreenButtonSettingCard.addEventListener("click", (e) => {
      if (
        e.target !== onScreenButtonInput &&
        !e.target.closest(".toggle-switch")
      ) {
        onScreenButtonInput.checked = !onScreenButtonInput.checked;
        handleOnScreenButtonToggle();
      }
    });

    // Listen for storage changes from other sources
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.applicationIsOn) {
        statusToggle.checked = changes.applicationIsOn.newValue;
        updateStatus(changes.applicationIsOn.newValue);
      }
      if (changes.scrollOnComments) {
        scrollOnCommentsInput.checked = changes.scrollOnComments.newValue;
      }
      if (changes.showOnScreenButton) {
        onScreenButtonInput.checked = changes.showOnScreenButton.newValue;
      }
    });
  }

  async function handleMainToggle() {
    try {
      const isEnabled = statusToggle.checked;

      // Update status immediately for better UX
      updateStatus(isEnabled);

      // Check if on YouTube
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0] && !tabs[0].url.includes("youtube.com")) {
        showError("Extension only works on YouTube!");
        return;
      }

      // Save setting
      await chrome.storage.local.set({ applicationIsOn: isEnabled });

      console.log("[Popup] Extension toggled:", isEnabled);
      hideError();
    } catch (error) {
      console.error("[Popup] Error toggling extension:", error);
      showError("Failed to toggle extension");
    }
  }
  async function handleCommentsToggle() {
    try {
      const scrollOnComments = scrollOnCommentsInput.checked;

      // Save setting
      await chrome.storage.local.set({ scrollOnComments });

      console.log("[Popup] Comments setting updated:", scrollOnComments);
    } catch (error) {
      console.error("[Popup] Error updating comments setting:", error);
      showError("Failed to update setting");
    }
  }

  async function handleOnScreenButtonToggle() {
    try {
      const showOnScreenButton = onScreenButtonInput.checked;

      // Save setting
      await chrome.storage.local.set({ showOnScreenButton });

      console.log(
        "[Popup] On-screen button setting updated:",
        showOnScreenButton
      );
    } catch (error) {
      console.error("[Popup] Error updating on-screen button setting:", error);
      showError("Failed to update setting");
    }
  }

  async function checkCurrentTab() {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]) {
        const url = tabs[0].url;
        const isYouTube = url.includes("youtube.com");
        const isShorts = url.includes("/shorts");

        if (!isYouTube) {
          updateStatus(
            false,
            "Not on YouTube",
            "Navigate to YouTube Shorts to use this extension",
            "warning"
          );
        } else if (!isShorts && statusToggle.checked) {
          updateStatus(
            true,
            "Ready for Shorts",
            "Navigate to YouTube Shorts to start auto-scrolling",
            "warning"
          );
        } else if (isShorts && statusToggle.checked) {
          updateStatus(
            true,
            "Active on Shorts",
            "Auto-scrolling YouTube Shorts",
            "active"
          );
        }
      }
    } catch (error) {
      console.error("[Popup] Error checking current tab:", error);
    }
  }

  function updateStatus(isActive, title, description, statusType) {
    // Update status card class
    statusCard.className = "status-card";
    if (statusType) {
      statusCard.classList.add(statusType);
    } else {
      statusCard.classList.add(isActive ? "active" : "inactive");
    }

    // Update status dot
    statusDot.className = "status-dot";
    if (statusType === "warning") {
      statusDot.classList.add("warning");
    } else if (!isActive) {
      statusDot.classList.add("inactive");
    }

    // Update text
    statusTitle.textContent =
      title || (isActive ? "Extension Active" : "Extension Disabled");
    statusDescription.textContent =
      description ||
      (isActive
        ? "Auto-scrolling YouTube Shorts"
        : "Toggle to enable auto-scrolling");
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add("show");

    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideError();
    }, 5000);
  }

  function hideError() {
    errorMessage.classList.remove("show");
  }
});
