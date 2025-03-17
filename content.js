function scrollToNextShort() {
  const shorts = document.querySelectorAll('ytd-reel-video-renderer');
  const videos = document.querySelectorAll('video');

  let currentIndex = Array.from(videos).findIndex(video => !video.paused && video.duration > 0);

  if (currentIndex !== -1 && shorts[currentIndex + 1]) {
      console.log("✅ Instantly scrolling to next Short...");
      shorts[currentIndex + 1].scrollIntoView({ behavior: "instant" });

      // Ensure the next Short plays instantly
      setTimeout(() => {
          let newVideo = document.querySelector("video");
          if (newVideo && newVideo.currentTime === 0) {
              console.log("▶️ Forcing play on next Short...");
              newVideo.play();
          }
      }, 300);
  } else {
      console.warn("⚠️ No next Short found! Retrying...");
      setTimeout(scrollToNextShort, 500); // Retry after a short delay
  }
}

function monitorPlayback() {
  let scrollTriggered = false;

  setInterval(() => {
      let video = document.querySelector("video");
      if (!video) return;

      let currentTime = video.currentTime;
      let duration = video.duration;

      console.log(`⏳ Playing Short: ${currentTime.toFixed(2)}s / ${duration.toFixed(2)}s`);

      // If video is at the end and YouTube loops it, force scroll
      if (duration > 0 && (currentTime >= duration - 0.1 || currentTime < 0.1) && !scrollTriggered) {
          scrollTriggered = true;
          console.log("🎬 Short ended! Instantly scrolling...");
          scrollToNextShort();
      }

      // Reset trigger if user manually switches Shorts
      if (currentTime > 0.5) {
          scrollTriggered = false;
      }
  }, 50); // Faster check every 50ms for **near-instant** response
}

// Detect when new Shorts are loaded and restart monitoring
function observeShorts() {
  const observer = new MutationObserver(() => {
      console.log("🔄 Detected YouTube updates, re-initializing auto-scroll...");
      monitorPlayback();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Ensure the script runs only when Shorts are detected
function initAutoScroll() {
  if (document.querySelector('ytd-reel-video-renderer')) {
      console.log("✅ YouTube Shorts detected. Initializing auto-scroll...");
      monitorPlayback();
      observeShorts(); // Detect dynamic changes in Shorts
  } else {
      console.warn("⚠️ No Shorts found on this page.");
  }
}

// Run after page load
window.onload = () => setTimeout(initAutoScroll, 1000);
