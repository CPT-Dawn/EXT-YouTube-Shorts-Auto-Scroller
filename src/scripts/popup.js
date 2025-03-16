document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("autoReelsToggle");
    const injectToggle = document.getElementById("injectReelsButtonToggle");

    // Load stored values
    chrome.storage.sync.get(["autoReelsStart", "injectReelsButton"], (data) => {
        toggle.checked = data.autoReelsStart || false;
        injectToggle.checked = data.injectReelsButton || false;
    });

    // ✅ Auto Scroll Toggle
    toggle.addEventListener("change", () => {
        chrome.storage.sync.set({ autoReelsStart: toggle.checked }, () => {
            chrome.runtime.sendMessage({ event: "toggleAutoReels" });
        });
    });

    // ✅ Inject Button Toggle (Refresh Fix)
    injectToggle.addEventListener("change", () => {
        chrome.storage.sync.set({ injectReelsButton: injectToggle.checked }, () => {
            chrome.runtime.sendMessage({ event: "toggleInjectButton" });
            setTimeout(() => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]?.id) chrome.tabs.reload(tabs[0].id);
                });
            }, 200); // ✅ Ensures refresh applies properly
        });
    });
});
