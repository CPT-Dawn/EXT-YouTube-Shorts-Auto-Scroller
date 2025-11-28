// ------------------------------
// CONSTANT SELECTORS VARIABLES
// ------------------------------
const VIDEOS_LIST_SELECTORS = [
  ".reel-video-in-sequence",
  ".reel-video-in-sequence-new",
];
const CURRENT_SHORT_SELECTOR = "ytd-reel-video-renderer";
const LIKE_BUTTON_SELECTOR = "like-button-view-model button, #like-button button, [aria-label*='like' i] button";
const COMMENTS_SELECTOR =
  "ytd-engagement-panel-section-list-renderer[target-id='engagement-panel-comments-section']";
const AUTHOUR_NAME_SELECTOR =
  "#metapanel > yt-reel-metapanel-view-model > div:nth-child(2) > yt-reel-channel-bar-view-model > span > a";
// ------------------------------
// APP VARIABLES
// ------------------------------
let scrollOnCommentsCheck = false;
let showOnScreenButton = true;
// ------------------------------
// STATE VARIABLES
// ------------------------------
let currentShortId = null;
let currentVideoElement = null;
let applicationIsOn = false;
let onScreenToggleButton = null;
let buttonObserver = null; // Observer for the button container
let scrollTimeout;
const MAX_RETRIES = 15;
const RETRY_DELAY_MS = 500;
// ------------------------------
// MAIN FUNCTIONS
// ------------------------------
function startAutoScrolling() {
  if (!applicationIsOn) {
    applicationIsOn = true;
    currentShortId = null;
    currentVideoElement = null;
  }
  checkForNewShort();
  updateOnScreenButtonState();
}
function stopAutoScrolling() {
  applicationIsOn = false;
  if (currentVideoElement) {
    currentVideoElement.setAttribute("loop", "true");
    currentVideoElement.removeEventListener("ended", shortEnded);
    currentVideoElement._hasEndEvent = false;
  }
  updateOnScreenButtonState();
}
async function checkForNewShort() {
  if (!applicationIsOn || !isShortsPage()) return;

  checkAndManageOnScreenButton();

  const currentShort = findShortContainer();
  if (!currentShort) return;
  // Checks if the current short is the same as the last one
  if (currentShort?.id != currentShortId) {
    // Prevent scrolling from previous short ending
    if (scrollTimeout) clearTimeout(scrollTimeout);
    
    // Remove the old button from the previous short's action bar
    // This ensures a new button is created for the current short
    removeOnScreenToggleButton();
    
    // Remove event listener from the previous video element
    const previousShort = currentVideoElement;
    if (previousShort) {
      previousShort.removeEventListener("ended", shortEnded);
      previousShort._hasEndEvent = false;
    }
    // Set the new current short id and video element
    currentShortId = currentShort.id; // Store as string to preserve exact ID
    currentVideoElement = currentShort.querySelector("video");
    // Looping check if the current short has a video element
    if (currentVideoElement == null) {
      let l = 0;
      while (currentVideoElement == null) {
        currentVideoElement = currentShort.querySelector("video");
        if (l > MAX_RETRIES) {
          // If the video element is not found, scroll to the next short
          let prevShortId = currentShortId;
          currentShortId = null;
          console.log(
            "[Auto Youtube Shorts Scroller] Video element not found, scrolling to next short..."
          );
          return scrollToNextShort(prevShortId);
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        l++;
      }
    }
    // Check if the current short is an ad
    if (
      currentShort.querySelector("ytd-ad-slot-renderer") ||
      currentShort.querySelector("ad-button-view-model")
    ) {
      console.log(
        "[Auto Youtube Shorts Scroller] Ad detected..., scrolling to next short..."
      );
      // Make sure to remove any existing button before skipping
      removeOnScreenToggleButton();
      return scrollToNextShort(currentShortId, false);
    }
    // Log the current short id
    console.log(
      "[Auto Youtube Shorts Scroller] Current ID of Short: ",
      currentShortId
    );
    // Add event listener to the current video element
    console.log(
      "[Auto Youtube Shorts Scroller] Adding event listener to video element...",
      currentVideoElement
    );
    if (currentVideoElement) {
      currentVideoElement.addEventListener("ended", shortEnded);
      currentVideoElement._hasEndEvent = true;
    }
    // Check if the current short has metadata
    const isMetaDataHydrated = (selector) => {
      return currentShort.querySelector(selector) != null;
    };
    if (!isMetaDataHydrated(AUTHOUR_NAME_SELECTOR)) {
      let l = 0;
      // If the creator name is not found, wait for it to load (A long with other data)
      while (!isMetaDataHydrated(AUTHOUR_NAME_SELECTOR)) {
        if (l > MAX_RETRIES) {
          // If after time not found, scroll to next short
          let prevShortId = currentShortId;
          currentShortId = null;
          console.log(
            "[Auto Youtube Shorts Scroller] Metadata not hydrated, scrolling to next short..."
          );
          return scrollToNextShort(prevShortId, false);
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        l++;
      }
    }

  }
  // Force removal of the loop attribute if it exists
  if (currentVideoElement?.hasAttribute("loop") && applicationIsOn) {
    currentVideoElement.removeAttribute("loop");
  }
}
function shortEnded(e) {
  e.preventDefault();
  if (!applicationIsOn) return stopAutoScrolling();
  console.log(
    "[Auto Youtube Shorts Scroller] Short ended, scrolling to next short..."
  );
  scrollToNextShort(currentShortId);
}
async function scrollToNextShort(
  prevShortId = null,
  useDelayAndCheckComments = true
) {
  if (!applicationIsOn) return stopAutoScrolling();
  const comments = document.querySelector(COMMENTS_SELECTOR);
  const isCommentsOpen = () => {
    const visibilityOfComments = comments?.attributes["VISIBILITY"]?.value;
    return visibilityOfComments === "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED";
  };
  // Check if comments is open, and settings are set to scroll on comments
  if (comments && useDelayAndCheckComments) {
    if (isCommentsOpen() && !scrollOnCommentsCheck) {
      useDelayAndCheckComments = false; // If the comments are open, don't wait for the additional scroll delay when scrolling
      // If the comments are open, wait till they are closed (if the setting is set to scroll on comments)
      while (
        isCommentsOpen() && // Waits till the comments are closed
        !scrollOnCommentsCheck && // Stops if the setting is changed
        prevShortId == currentShortId // Stops if the short changes
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }
  if (scrollTimeout) clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(
    async () => {
      if (prevShortId != null && currentShortId != prevShortId) return; // If the short changed, don't scroll
      const nextShortContainer = await waitForNextShort();
      if (nextShortContainer == null && isShortsPage())
        return window.location.reload(); // If no next short is found, reload the page (Last resort)
      // If next short container is found, remove the current video element end event listener
      if (currentVideoElement) {
        currentVideoElement.removeEventListener("ended", shortEnded);
        currentVideoElement._hasEndEvent = false;
      }
      // Scroll to the next short container
      nextShortContainer.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });

      // Then check the new short
      checkForNewShort();

      // Ensure the button is properly managed after scrolling
      setTimeout(() => {
        checkAndManageOnScreenButton();
      }, 500); // Small delay to ensure DOM is updated
    },
    0
  );
}
function findShortContainer(id = null) {
  let shorts = [];
  // Finds the short container by the selector (Incase of updates)
  for (let i = 0; i < VIDEOS_LIST_SELECTORS.length; i++) {
    const shortList = [...document.querySelectorAll(VIDEOS_LIST_SELECTORS[i])];
    if (shortList.length > 0) {
      shorts = [...shortList];
      break;
    }
  }
  // If an id is provided, find the short with that id
  if (id != null) {
    if (shorts.length === 0) return document.getElementById(id); // Short container should always contain id of the short order.
    const short = shorts.find((short) => short.id == id.toString());
    if (short) return short;
  }
  // If no shorts are found, return the first short with the id of 0
  if (shorts.length === 0) return document.getElementById(currentShortId || 0);
  
  // If no id is provided, find the first short with the is-active attribute
  return shorts.find(
        (short) =>
          // Active short either has the is-active attribute or a hydrated HTML of short.
          short.hasAttribute("is-active") ||
          short.querySelector(CURRENT_SHORT_SELECTOR) ||
          short.querySelector("[is-active]")
      ) || shorts[0] /*If no short found, return first short */;
}

async function waitForNextShort(retries = 5, delay = 500) {
  if (!isShortsPage()) return null;
  
  // First, try to find the next sibling of the current short
  // This is the most reliable way as it doesn't depend on IDs being sequential
  const currentShort = findShortContainer(currentShortId);
  
  for (let i = 0; i < retries; i++) {
    let nextShort = null;

    // Strategy 1: Check next sibling
    if (currentShort && currentShort.nextElementSibling) {
      const sibling = currentShort.nextElementSibling;
      // Verify it matches one of our expected selectors or is a valid container
      if (VIDEOS_LIST_SELECTORS.some(selector => sibling.matches(selector)) || sibling.tagName.toLowerCase() === 'ytd-reel-video-renderer') {
        nextShort = sibling;
      }
    }

    // Strategy 2: Fallback to ID + 1 (only if sibling check failed or currentShort wasn't found)
    if (!nextShort) {
      const currentIdNum = parseInt(currentShortId);
      if (!isNaN(currentIdNum)) {
        const nextId = currentIdNum + 1;
        const potentialNext = findShortContainer(nextId);
        // STRICT CHECK: Only accept if the ID actually matches what we asked for.
        if (potentialNext && potentialNext.id == nextId.toString()) {
          nextShort = potentialNext;
        }
      }
    }

    if (nextShort) return nextShort;

    // If none found, little slight screen shake to trigger hydration of new shorts
    window.scrollBy(0, 100);
    await new Promise((r) => setTimeout(r, delay));
    window.scrollBy(0, -100);
    await new Promise((r) => setTimeout(r, delay));
  }
  console.log(
    "[Auto Youtube Shorts Scroller] The next short has not loaded in, reloading page..."
  );
  return null;
}

function createOnScreenToggleButton() {
  if (onScreenToggleButton || !showOnScreenButton) return;

  const likeButton = document.querySelector(LIKE_BUTTON_SELECTOR);
  if (!likeButton) {
    console.log("[Auto Youtube Shorts Scroller] Like button not found with selector:", LIKE_BUTTON_SELECTOR);
    return;
  }
  console.log("[Auto Youtube Shorts Scroller] Like button found:", likeButton);

  // Find the button container (the view-model wrapper or traditional container)
  const buttonContainer =
    likeButton.closest("like-button-view-model") ||
    likeButton.closest("button-view-model") ||
    likeButton.closest("#like-button") ||
    likeButton.closest('[role="button"]') ||
    likeButton.closest("ytd-toggle-button-renderer") ||
    likeButton.parentElement;
  
  if (!buttonContainer) {
    console.log("[Auto Youtube Shorts Scroller] Button container not found");
    return;
  }

  // Find the action bar (where we'll insert our button)
  const actionBar = 
    buttonContainer.closest("reel-action-bar-view-model") ||
    buttonContainer.closest("#button-bar") ||
    buttonContainer.closest("#actions") ||
    buttonContainer.parentElement;
  
  if (!actionBar) {
    console.log("[Auto Youtube Shorts Scroller] Action bar not found");
    return;
  }
  
  console.log("[Auto Youtube Shorts Scroller] Found action bar:", actionBar.tagName);

  const toggleButton = document.createElement("div");
  toggleButton.id = "yt-shorts-auto-scroll-toggle";
  toggleButton.innerHTML = `
        <div style="
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: transparent;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            margin: 0 auto 7px auto;
            transition: all 0.2s ease;
            position: relative;
            ${
              applicationIsOn
                ? "box-shadow: 0 0 10px 2px rgba(255, 0, 0, 0.2);"
                : ""
            }
        " title="${
          applicationIsOn
            ? "Auto-scroll ON - Click to disable"
            : "Auto-scroll OFF - Click to enable"
        }">
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                position: relative;
            ">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="
                    color: ${applicationIsOn ? "#FF0000" : "#AAAAAA"};
                    transition: color 0.2s ease, transform 0.2s ease;
                    filter: ${
                      applicationIsOn
                        ? "drop-shadow(0 0 3px rgba(255, 0, 0, 0.5))"
                        : "none"
                    };
                    margin-bottom: 2px;
                ">
                    <path d="M7 10l5 5 5-5H7z" fill="currentColor"/>
                    <path d="M7 14l5 5 5-5H7z" fill="currentColor"/>
                </svg>
                <span style="
                    font-size: 11px;
                    line-height: 1;
                    color: ${applicationIsOn ? "#FF0000" : "#AAAAAA"};
                    font-family: 'Roboto', 'Arial', sans-serif;
                    font-weight: ${applicationIsOn ? "500" : "400"};
                    transition: color 0.2s ease;
                    ${
                      applicationIsOn
                        ? "text-shadow: 0 0 5px rgba(255, 0, 0, 0.3);"
                        : ""
                    }
                ">
                    ${applicationIsOn ? "ON" : "OFF"}
                </span>
            </div>
        </div>
        </div>
    `;

  // Add hover effect with JavaScript
  const buttonDiv = toggleButton.querySelector("div");
  buttonDiv.addEventListener("mouseenter", () => {
    const innerDiv = buttonDiv.querySelector("div");
    const svgElement = innerDiv.querySelector("svg");
    const textElement = innerDiv.querySelector("span");

    if (applicationIsOn) {
      buttonDiv.style.background = "rgba(255, 0, 0, 0.1)";
      svgElement.style.transform = "scale(1.1)";
    } else {
      buttonDiv.style.background = "rgba(255, 255, 255, 0.1)";
      svgElement.style.color = "#FFFFFF";
      textElement.style.color = "#FFFFFF";
    }
  });

  buttonDiv.addEventListener("mouseleave", () => {
    const innerDiv = buttonDiv.querySelector("div");
    const svgElement = innerDiv.querySelector("svg");
    const textElement = innerDiv.querySelector("span");

    buttonDiv.style.background = "transparent";
    svgElement.style.transform = "scale(1)";

    if (!applicationIsOn) {
      svgElement.style.color = "#AAAAAA";
      textElement.style.color = "#AAAAAA";
    }
  });

  toggleButton.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (applicationIsOn) {
      stopAutoScrolling();
      chrome.storage.local.set({ applicationIsOn: false });
    } else {
      startAutoScrolling();
      chrome.storage.local.set({ applicationIsOn: true });
    }

    updateOnScreenButtonState();
  });

  actionBar.insertBefore(toggleButton, buttonContainer);
  onScreenToggleButton = toggleButton;
  console.log("[Auto Youtube Shorts Scroller] On-screen toggle button created");
  
  // Setup observer to ensure button stays in DOM
  setupButtonObserver(actionBar);
}

function setupButtonObserver(targetNode) {
  // Disconnect existing observer if any
  if (buttonObserver) {
    buttonObserver.disconnect();
  }

  // Create a new observer instance
  buttonObserver = new MutationObserver((mutations) => {
    // Check if our button is still in the DOM
    if (onScreenToggleButton && !document.body.contains(onScreenToggleButton)) {
      console.log("[Auto Youtube Shorts Scroller] Button removed by external change, re-injecting...");
      onScreenToggleButton = null;
      createOnScreenToggleButton();
    }
  });

  // Start observing the target node for configured mutations
  buttonObserver.observe(targetNode, { childList: true, subtree: true });
}

function updateOnScreenButtonState() {
  if (!onScreenToggleButton) return;

  const buttonElement = onScreenToggleButton.querySelector("div");
  const innerDiv = buttonElement?.querySelector("div");
  const svgElement = innerDiv?.querySelector("svg");
  const textElement = innerDiv?.querySelector("span");

  if (buttonElement) {
    buttonElement.title = applicationIsOn
      ? "Auto-scroll ON - Click to disable"
      : "Auto-scroll OFF - Click to enable";

    // Add or remove glow effect
    if (applicationIsOn) {
      buttonElement.style.boxShadow = "0 0 10px 2px rgba(255, 0, 0, 0.2)";
    } else {
      buttonElement.style.boxShadow = "none";
      buttonElement.style.background = "transparent";
    }

    if (svgElement) {
      svgElement.style.color = applicationIsOn ? "#FF0000" : "#AAAAAA";
      svgElement.style.filter = applicationIsOn
        ? "drop-shadow(0 0 3px rgba(255, 0, 0, 0.5))"
        : "none";
      svgElement.style.transform = "scale(1)";
    }

    if (textElement) {
      textElement.textContent = applicationIsOn ? "ON" : "OFF";
      textElement.style.color = applicationIsOn ? "#FF0000" : "#AAAAAA";
      textElement.style.fontWeight = applicationIsOn ? "500" : "400";
      textElement.style.textShadow = applicationIsOn
        ? "0 0 5px rgba(255, 0, 0, 0.3)"
        : "none";
    }
  }
}

function removeOnScreenToggleButton() {
  if (buttonObserver) {
    buttonObserver.disconnect();
    buttonObserver = null;
  }
  if (onScreenToggleButton) {
    onScreenToggleButton.remove();
    onScreenToggleButton = null;
    console.log(
      "[Auto Youtube Shorts Scroller] On-screen toggle button removed"
    );
  }
}

function checkAndManageOnScreenButton() {
  if (showOnScreenButton && isShortsPage()) {
    // Check if the button is still in the DOM
    if (onScreenToggleButton && !document.body.contains(onScreenToggleButton)) {
      onScreenToggleButton = null; // Reset if removed from DOM
    }

    if (!onScreenToggleButton) {
      createOnScreenToggleButton();
    } else {
      updateOnScreenButtonState();
    }
  } else {
    removeOnScreenToggleButton();
  }
}
// ------------------------------
// INITIATION AND SETTINGS FETCH
// ------------------------------
(function initiate() {
  chrome.storage.local.get(["applicationIsOn"], (result) => {
    if (result["applicationIsOn"] == null) return startAutoScrolling();
    if (result["applicationIsOn"]) startAutoScrolling();
  });
  checkForNewShort();
  checkApplicationState();
  // Set up intervals for periodic checks
  setInterval(checkForNewShort, RETRY_DELAY_MS);
  setInterval(checkAndManageOnScreenButton, 1000); // Reduced from 2000ms to 1000ms for more responsive button appearance
  function checkApplicationState() {
    chrome.storage.local.get(["applicationIsOn"], (result) => {
      if (applicationIsOn && result["applicationIsOn"] === false) {
        stopAutoScrolling();
      } else if (result["applicationIsOn"] === true) {
        startAutoScrolling();
      }
    });
  }
  (function onApplicationChange() {
    chrome.storage.local.onChanged.addListener((changes) => {
      if (changes["applicationIsOn"]?.newValue) {
        startAutoScrolling();
      } else if (changes["applicationIsOn"]?.newValue === false) {
        stopAutoScrolling();
      }
    });
  })();
  (function getAllSettings() {
    chrome.storage.local.get(
      ["scrollOnComments", "showOnScreenButton"],
      (result) => {
        console.log("[Auto Youtube Shorts Scroller]", {
          AutoYTScrollerSettings: result,
        });
        if (result["scrollOnComments"])
          scrollOnCommentsCheck = result["scrollOnComments"];
        if (result["showOnScreenButton"] !== undefined)
          showOnScreenButton = result["showOnScreenButton"];
      }
    );
    chrome.storage.onChanged.addListener((result) => {
      let newScrollOnComments = result["scrollOnComments"]?.newValue;
      if (newScrollOnComments !== undefined) {
        scrollOnCommentsCheck = newScrollOnComments;
      }
      let newShowOnScreenButton = result["showOnScreenButton"]?.newValue;
      if (newShowOnScreenButton !== undefined) {
        showOnScreenButton = newShowOnScreenButton;
        checkAndManageOnScreenButton();
      }
    });
  })();
})();
function isShortsPage() {
  let containsShortElements = false;
  const doesPageHaveAShort = document.querySelector(
    VIDEOS_LIST_SELECTORS.join(",")
  );
  if (doesPageHaveAShort) containsShortElements = true;
  return containsShortElements;
}
