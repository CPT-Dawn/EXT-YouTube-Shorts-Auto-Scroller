// to scroll to the next short

const shorts = document.querySelectorAll('ytd-reel-video-renderer');
let currentIndex = Array.from(shorts).findIndex(short => short.matches('[is-active]'));

if (currentIndex !== -1 && shorts[currentIndex + 1]) {
    shorts[currentIndex + 1].scrollIntoView({ behavior: "smooth" });
}


//  to detect the short postion

function logShortPlayback() {
    const video = document.querySelector("video");
    if (video) {
        console.log(`⏳ Playing Short: ${video.currentTime.toFixed(2)}s / ${video.duration.toFixed(2)}s`);
    } else {
        console.log("⚠️ No video found!");
    }
}

// Log the playback time every second
setInterval(logShortPlayback, 1000);
