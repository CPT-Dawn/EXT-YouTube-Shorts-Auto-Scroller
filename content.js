(function() {
  console.log("🔄 YouTube Shorts Auto-Scroll Loaded...");

  function scrollToNextShort() {
      const shorts = document.querySelectorAll('ytd-reel-video-renderer');
      let currentIndex = Array.from(shorts).findIndex(short => short.matches('[is-active]'));

      if (currentIndex !== -1 && shorts[currentIndex + 1]) {
          console.log("🎯 Scrolling to next Short...");
          
          // Ensure scrolling does not trigger a URL change
          let nextShort = shorts[currentIndex + 1];
          let scrollOptions = { behavior: "smooth", block: "center" };
          
          nextShort.scrollIntoView(scrollOptions);
      } else {
          console.warn("⚠️ No next Short found.");
      }
  }

  function monitorShorts() {
      let lastCheckedShort = null;

      setInterval(() => {
          let video = document.querySelector("video");
          if (!video) return;

          let currentTime = video.currentTime;
          let duration = video.duration;
          let activeShort = document.querySelector('ytd-reel-video-renderer[is-active]');

          // Scroll only once per Short
          if (duration > 0 && currentTime >= duration - 0.1 && activeShort !== lastCheckedShort) {
              lastCheckedShort = activeShort;
              console.log("🎬 Short ended, scrolling now...");
              scrollToNextShort();
          }
      }, 100);
  }

  function observeShorts() {
      const observer = new MutationObserver(() => {
          console.log("🔄 YouTube page updated, restarting auto-scroll...");
          monitorShorts();
      });

      observer.observe(document.body, { childList: true, subtree: true });
  }

  function startAutoScroll() {
      let firstShort = document.querySelector('ytd-reel-video-renderer');
      if (firstShort) {
          console.log("✅ Shorts detected. Auto-scroll is active.");
          monitorShorts();
          observeShorts();
      } else {
          console.warn("⚠️ No Shorts found.");
      }
  }

  // Run after page load
  window.onload = () => setTimeout(startAutoScroll, 1000);
})();
