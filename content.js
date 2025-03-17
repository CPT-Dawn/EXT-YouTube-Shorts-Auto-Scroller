let autoScrollEnabled = true;

// Load setting from storage
chrome.storage.sync.get("autoScroll", (data) => {
  if (data.autoScroll !== undefined) {
    autoScrollEnabled = data.autoScroll;
  }
});

// Listen for storage changes (toggle switch)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.autoScroll) {
    autoScrollEnabled = changes.autoScroll.newValue;
  }
});

// Function to play the first Short by clicking the play button
function playFirstShort() {
  const video = document.querySelector("video");
  if (!video) {
    console.log("⚠️ No video found!");
    return;
  }

  if (!video.paused) {
    console.log("✅ First Short is already playing.");
    return;
  }

  // Try clicking the play button in the YouTube UI
  const playButton = document.querySelector(".ytp-play-button");
  if (playButton) {
    playButton.click();
    console.log("▶️ Clicked play button to start first Short!");
  } else {
    console.log("⚠️ Play button not found! Trying direct play...");
    video.play().catch(() => {
      console.log("❌ Autoplay blocked by browser.");
    });
  }
}

// Function to scroll to the next YouTube Short
function goToNextShort() {
  if (!autoScrollEnabled) return;

  const shorts = document.querySelectorAll("ytd-reel-video-renderer");
  const activeShort = document.querySelector("ytd-reel-video-renderer[is-active]");
  const activeIndex = Array.from(shorts).indexOf(activeShort);

  if (activeIndex !== -1 && shorts[activeIndex + 1]) {
    shorts[activeIndex + 1].scrollIntoView({ behavior: "smooth" });
    console.log("✅ Scrolled to the next Short!");
  } else {
    console.log("⚠️ Next Short not found!");
  }
}

// Function to check if the video has ended
function checkVideoEnd() {
  const video = document.querySelector("video");

  if (video) {
    video.addEventListener("ended", () => {
      console.log("🎥 Video ended, moving to next...");
      goToNextShort();
    });
  }
}

// Run after page loads
window.addEventListener("load", () => {
  setTimeout(playFirstShort, 1500); // Clicks play button if needed
  setInterval(checkVideoEnd, 1000); // Continuously check if video ends
});
