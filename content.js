// CONSTANT SELECTORS VARIBLES
const VIDEOS_LIST_SELECTOR = ".reel-video-in-sequence";
const NEXT_VIDEO_BUTTON_SELECTOR = "#navigation-button-down > ytd-button-renderer > yt-button-shape > button";
const LIKE_BUTTON_SELECTOR = "ytd-reel-video-renderer[is-active] #like-button > yt-button-shape > label > button";
const DISLIKE_BUTTON_SELECTOR = "ytd-reel-video-renderer[is-active] #dislike-button > yt-button-shape > label > button";
const COMMENTS_SELECTOR = "#anchored-panel > ytd-engagement-panel-section-list-renderer:nth-child(1)";
const LIKES_COUNT_SELECTOR = "ytd-reel-video-renderer[is-active] #factoids > factoid-renderer:nth-child(1) > div > span.YtwFactoidRendererValue > span";
const VIEW_COUNT_SELECTOR = "ytd-reel-video-renderer[is-active] #factoids > view-count-factoid-renderer > factoid-renderer > div > span.YtwFactoidRendererValue > span";
const COMMENTS_COUNT_SELECTOR = "ytd-reel-video-renderer[is-active] #comments-button > ytd-button-renderer > yt-button-shape > label > div > span";
// APP VARIABLES
let shortCutToggleKeys = [];
let shortCutInteractKeys = [];
let scrollOnCommentsCheck = false;
let scrollDirection = 1;
let amountOfPlays = 0;
let amountOfPlaysToSkip = 1;
let filterMinLength = "none";
let filterMaxLength = "none";
let filterMinViews = "none";
let filterMaxViews = "none";
let filterMinLikes = "none";
let filterMaxLikes = "none";
let filterMinComments = "none";
let filterMaxComments = "none";
let blockedCreators = [];
let whitelistedCreators = [];
let blockedTags = [];
let scrollOnNoTags = false;
let additionalScrollDelay = 0;
// STATE VARIABLES
let currentVideoIndex = null;
let applicationIsOn = false;
let scrollingIsDone = true;
let lastVideo = null;
// -------
function startAutoScrolling() {
    if (!applicationIsOn) {
        applicationIsOn = true;
        // Save state to chrome storage so it will be on next time on page load
        chrome.storage.local.set({ applicationIsOn: true });
        if (window.location.href.includes("hashtag/shorts")) {
            // If on hashtag page, click on a shorts video to start the auto scrolling (WHEN THIS FUNCTION CALLED)
            document
                .querySelector("#thumbnail [aria-label='Shorts']")
                .parentElement.parentElement.parentElement.click();
        }
    }
}
function stopAutoScrolling() {
    if (applicationIsOn) {
        applicationIsOn = false;
        // Save state to chrome storage so it will be off next time on page load
        chrome.storage.local.set({ applicationIsOn: false });
    }
    const currentVideo = document.querySelector("#shorts-container video[tabindex='-1']");
    // Lets the video loop again
    if (currentVideo)
        currentVideo.setAttribute("loop", "");
}
function checkForNewShort() {
    const currentVideo = document.querySelector("#shorts-container video[tabindex='-1']");
    // Check to see if the video has loaded
    if (isNaN(currentVideo?.duration) || currentVideo?.duration == null)
        return;
    // Checks if the appliaction is on. If not, lets the video loop again
    if (!applicationIsOn)
        return currentVideo.setAttribute("loop", "");
    else
        currentVideo.removeAttribute("loop");
    const newCurrentShortsIndex = Array.from(document.querySelectorAll(VIDEOS_LIST_SELECTOR)).findIndex((e) => e.hasAttribute("is-active"));
    if (scrollingIsDone /*to prevent double scrolls*/) {
        if (newCurrentShortsIndex !== currentVideoIndex) {
            //lastVideo?.removeEventListener("ended", videoFinished);
            lastVideo = currentVideo;
            currentVideoIndex = newCurrentShortsIndex;
            amountOfPlays = 0;
        }
        if (!checkIfVaildVideo()) {
            scrollToNextShort();
            return;
        }
    }
    if (currentVideo) {
        currentVideo.addEventListener("ended", videoFinished);
    }
}
function videoFinished() {
    console.log("video finished");
    const currentVideo = document.querySelector("#shorts-container video[tabindex='-1']");
    if (!applicationIsOn)
        return currentVideo.setAttribute("loop", "");
    amountOfPlays++;
    if (amountOfPlays >= amountOfPlaysToSkip) {
        // If the video is finished and is equal to the amount of plays needed to skip,
        // check if the comments are open.
        const comments = document.querySelector(COMMENTS_SELECTOR);
        const commentsActive = comments?.clientWidth > 0;
        if (scrollOnCommentsCheck || !commentsActive) {
            // take into account additional scroll delay
            return setTimeout(() => {
                if (currentVideo.duration !=
                    document.querySelector("#shorts-container video[tabindex='-1']").duration)
                    return; // if the video is not the same as the one that finished, don't scroll
                scrollToNextShort();
            }, additionalScrollDelay);
        }
        else if (comments.getAttribute("visibility") ===
            "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN" ||
            comments.clientWidth <= 0) {
            return setTimeout(() => {
                if (currentVideo.duration !=
                    document.querySelector("#shorts-container video[tabindex='-1']").duration)
                    return; // if the video is not the same as the one that finished, don't scroll
                scrollToNextShort();
            }, additionalScrollDelay);
        }
        // If the comments are open, wait for them to close
        let intervalComments = setInterval(() => {
            if (comments.getAttribute("visibility") ===
                "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN" ||
                comments.clientWidth <= 0) {
                scrollToNextShort();
                clearInterval(intervalComments);
            }
        }, 100);
    }
    else {
        // If the video hasn't been played enough times, play it again
        currentVideo?.play();
    }
}
async function scrollToNextShort() {
    const currentVideoParent = getParentVideo();
    if (!currentVideoParent)
        return;
    const currentVideo = currentVideoParent.querySelector("video");
    if (!applicationIsOn)
        return currentVideo?.setAttribute("loop", "");
    amountOfPlays = 0;
    scrollingIsDone = false;
    const nextVideoParent = document.getElementById(`${Number(currentVideoParent?.id) + scrollDirection}`);
    if (nextVideoParent) {
        nextVideoParent.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }
    else {
        currentVideo?.play();
    }
    setTimeout(() => {
        // Hardcoded timeout to make sure the video is scrolled before other scrolls are allowed
        scrollingIsDone = true;
    }, 700);
}
function checkIfVaildVideo() {
    const currentVideoParent = getParentVideo();
    const currentVideo = currentVideoParent?.querySelector("video");
    if (!currentVideo)
        return false;
    if (!applicationIsOn) {
        currentVideo.setAttribute("loop", "");
        return false;
    }
    // Check If Advertisement
    if (currentVideoParent?.querySelector("ad-badge-view-model > badge-shape > div")?.innerText &&
        currentVideoParent?.querySelector("ad-badge-view-model > badge-shape > div")?.innerText?.toLowerCase() === "sponsored") {
        return false;
    }
    // Check if the video is from a blocked creator and if it is, skip it (FROM SETTINGS)
    const authorOfVideo = currentVideoParent?.querySelector("#metapanel > yt-reel-metapanel-view-model > div:nth-child(2) > yt-reel-channel-bar-view-model > span > a")?.innerText
        ?.toLowerCase()
        .replace("@", "");
    let tagsOfVideo = [
        ...currentVideoParent?.querySelectorAll("#metapanel > yt-reel-metapanel-view-model > div:nth-child(3) > yt-shorts-video-title-view-model > h2 > span > span > a"),
    ].map((src) => src?.innerText?.toLowerCase()?.replaceAll("#", ""));
    if (!currentVideoParent?.querySelector("#metapanel > yt-reel-metapanel-view-model > div:nth-child(3) > yt-shorts-video-title-view-model > h2 > span")?.innerText) {
        tagsOfVideo = ["tagsLoading..."];
    }
    if (authorOfVideo &&
        blockedCreators
            .map((c) => c?.toLowerCase()?.replace("@", ""))
            .includes(authorOfVideo)) {
        return false;
    }
    else if (tagsOfVideo &&
        tagsOfVideo
            .map((tag) => tag?.replaceAll("#", "")?.toLowerCase())
            .some((tag) => blockedTags
            .map((tag) => tag?.toLowerCase())
            .map((tag) => tag?.replace("#", ""))
            .includes(tag)) &&
        !whitelistedCreators
            .map((c) => c?.toLowerCase()?.replace("@", ""))
            .includes(authorOfVideo)) {
        return false;
    }
    else if (scrollOnNoTags &&
        tagsOfVideo.length === 0 &&
        !whitelistedCreators
            .map((c) => c?.toLowerCase()?.replace("@", ""))
            .includes(authorOfVideo)) {
        return false;
    }
    return true;
}
// Helper function to get the parent of the current short playing/played
function getParentVideo() {
    const VIDEOS_LIST = [
        ...document.querySelectorAll(VIDEOS_LIST_SELECTOR),
    ];
    const currentVideoParent = VIDEOS_LIST.find((e) => {
        return (e.hasAttribute("is-active") &&
            e.querySelector("#shorts-container video[tabindex='-1']"));
    });
    return currentVideoParent;
}
// Sets up the application with the settings from chrome storage
// Checks if the application is on and if it is, starts the application
// Creates a Interval to check for new shorts every 100ms
(function initiate() {
    chrome.storage.local.get(["applicationIsOn"], (result) => {
        if (result["applicationIsOn"] == null) {
            return startAutoScrolling();
        }
        if (result["applicationIsOn"])
            startAutoScrolling();
    });
    checkForNewShort();
    checkApplicationState();
    setInterval(checkForNewShort, 100);
    setInterval(() => {
        checkApplicationState();
    }, 10000);
    function checkApplicationState() {
        chrome.storage.local.get(["applicationIsOn"], (result) => {
            if (applicationIsOn && result["applicationIsOn"] == false) {
                if (!result["applicationIsOn"])
                    stopAutoScrolling();
            }
            else if (result["applicationIsOn"] == true) {
                startAutoScrolling();
            }
        });
    };
})();

// Listens for toggle application from the popup
chrome.runtime.onMessage.addListener(({ toggle }, _, sendResponse) => {
    if (toggle) {
        chrome.storage.local.get(["applicationIsOn"], async (result) => {
            if (!result["applicationIsOn"])
                startAutoScrolling();
            if (result["applicationIsOn"])
                stopAutoScrolling();
            sendResponse({ success: true });
        });
    }
    return true;
});