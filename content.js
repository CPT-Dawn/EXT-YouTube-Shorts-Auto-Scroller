function scrollToNextShort() {
  const shorts = document.querySelectorAll('ytd-reel-video-renderer');
  const videos = document.querySelectorAll('video');

  let currentIndex = Array.from(videos).findIndex(video => !video.paused && video.duration > 0);

  if (currentIndex !== -1 && shorts[currentIndex + 1]) {
      console.log("✅ Instantly scrolling to next Short...");
      shorts[currentIndex + 1].scrollIntoView({ behavior: "smooth" });

      // Ensure YouTube properly loads the next Short
      setTimeout(() => {
          if (!document.querySelector("video") || document.querySelector("video").currentTime === 0) {
              console.log("🔄 Forcing another scroll due to YouTube lag...");
              shorts[currentIndex + 1].scrollIntoView({ behavior: "smooth" });
          }
      }, 500);
  } else {
      console.warn("⚠️ No next Short found! Trying again...");
      setTimeout(scrollToNextShort, 500); // Retry scrolling after a short delay
  }
}

function monitorPlayback() {
  const video = document.querySelector("video");
  if (!video) {
      console.error("⚠️ No video element found!");
      return;
  }

  let lastTime = 0;
  let scrollTriggered = false;

  setInterval(() => {
      if (!video) return;

      let currentTime = video.currentTime;
      let duration = video.duration;

      console.log(`⏳ Playing Short: ${currentTime.toFixed(2)}s / ${duration.toFixed(2)}s`);

      // If video reaches the exact end, trigger instant scroll
      if (currentTime >= duration - 0.05 && !scrollTriggered) {
          scrollTriggered = true;
          console.log("🎬 Short ended! Instantly scrolling...");
          scrollToNextShort();
      }

      // Reset trigger if user manually switches Shorts
      if (currentTime < lastTime) {
          scrollTriggered = false;
      }

      lastTime = currentTime;
  }, 100); // Faster check every 100ms for instant response
}

// Ensure the script runs only when Shorts are detected
function initAutoScroll() {
  if (document.querySelector('ytd-reel-video-renderer')) {
      console.log("✅ YouTube Shorts detected. Initializing auto-scroll...");
      monitorPlayback();
  } else {
      console.warn("⚠️ No Shorts found on this page.");
  }
}

// Run after page load
window.onload = () => setTimeout(initAutoScroll, 1000);
