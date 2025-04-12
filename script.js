// VARIBLES
const errMsg = document.querySelector("#error");
const toggleBtn = document.querySelector(".toggleBtn");
const pageList = document.querySelector(".pageList");
// Call Functions
getAllSettingsForPopup();
pageNavigation("settings");
pageNavigation("filter");
// Listens to toggle button click
document.onclick = (e) => {
    if (e.target.classList.contains("toggleBtn"))
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]?.url?.toLowerCase().includes("youtube.com")) {
                try {
                    chrome.tabs.sendMessage(tabs[0].id, { toggle: true }, (response) => {
                        if (!response?.success)
                            errMsg.innerText = "Please refresh the page and try again!";
                    });
                }
                catch { }
            }
            else {
                // get applicationIsOn from chrome storage
                chrome.storage.local.get(["applicationIsOn"], (result) => {
                    if (!result.applicationIsOn) {
                        chrome.storage.local.set({ applicationIsOn: true });
                        changeToggleButton(true);
                    }
                    else {
                        chrome.storage.local.set({ applicationIsOn: false });
                        changeToggleButton(false);
                    }
                });
            }
        });
};
function changeToggleButton(result) {
    toggleBtn.innerText = result ? "Stop" : "Start";
    toggleBtn.classList.remove(result ? "start" : "stop");
    toggleBtn.classList.add(result ? "stop" : "start");
}
function pageNavigation(pageType) {
    let page = pageType.charAt(0).toUpperCase() + pageType.slice(1);
    const nextButton = document.getElementById(`next${page}`);
    const backButton = document.getElementById(`back${page}`);
    nextButton.onclick = () => {
        changePage(pageType, 1);
    };
    backButton.onclick = () => {
        changePage(pageType, -1);
    };
    if (pageType == "settings") {
        pageList.onclick = (e) => {
            const ele = e.target;
            if (ele?.tagName?.toLowerCase() == "a") {
                changePage("settings", 0, parseInt(e.target.dataset["pageindex"]));
            }
        };
        document
            .querySelectorAll(".configureTags")
            .forEach((ele) => {
            ele.addEventListener("click", () => {
                console.log(ele.dataset["gotopageindex"]);
                changePage("settings", 0, parseInt(ele.dataset["gotopageindex"]));
            });
        });
    }
}
function changePage(page, direction, index) {
    let pageIndex = index + 1;
    let pages;
    const pageNumber = document.querySelector(`#${page}PageNumber`);
    if (page == "settings") {
        pages = document.querySelectorAll(".settingsPage");
    }
    if (page == "filter") {
        pages = document.querySelectorAll(".filterPage");
    }
    let newPage;
    const active = [...pages].find((page) => page.classList.contains("active"));
    if (index == null) {
        newPage = (() => {
            const changeIndex = parseInt(active.dataset["pageindex"]) + direction;
            if (changeIndex >= pages.length)
                return pages[0];
            if (changeIndex < 0)
                return pages[pages.length - 1];
            return pages[changeIndex];
        })();
        pageIndex = parseInt(newPage.dataset["pageindex"]) + 1;
    }
    else {
        newPage = pages[index];
    }
    pageNumber.innerText = `${pageIndex}/${pages.length}`;
    active.classList.remove("active");
    newPage.classList.add("active");
    if (page == "settings") {
        let oldActive = pageList.querySelector(".active");
        let newActive = pageList.querySelector(`[data-pageindex="${newPage.dataset["pageindex"]}"]`);
        oldActive?.classList.remove("active");
        newActive?.classList.add("active");
    }
}
function getAllSettingsForPopup() {
    // Get Settings and show them on the popup (and check for updates and reflect them)
    chrome.storage.local.get(["shortCutKeys", "shortCutInteractKeys"], async ({ shortCutKeys, shortCutInteractKeys }) => {
        if (shortCutKeys == undefined) {
            await chrome.storage.local.set({
                shortCutKeys: ["shift", "d"],
            });
            shortCutInput.value = "shift+d";
        }
        else {
            shortCutInput.value = shortCutKeys.join("+");
        }
        shortCutInput.addEventListener("change", () => {
            const value = shortCutInput.value.trim().split(/\s*\+\s*/);
            if (!value.length)
                return;
            chrome.storage.local.set({
                shortCutKeys: value,
            });
            shortCutInput.value = value.join("+");
        });
        if (shortCutInteractKeys == undefined) {
            await chrome.storage.local.set({
                shortCutInteractKeys: ["shift", "g"],
            });
            shortCutInteractInput.value = "shift+g";
        }
        else {
            shortCutInteractInput.value = shortCutInteractKeys.join("+");
        }
        shortCutInteractInput.addEventListener("change", (e) => {
            const value = e.target.value
                .trim()
                .split(/\s*\+\s*/);
            if (!value.length)
                return;
            chrome.storage.local.set({
                shortCutInteractKeys: value,
            });
            shortCutInteractInput.value = value.join("+");
        });
    });
    chrome.storage.onChanged.addListener((result) => {
        if (result["applicationIsOn"]?.newValue != undefined)
            changeToggleButton(result["applicationIsOn"].newValue);
    });
    chrome.storage.local.get(["applicationIsOn"], (result) => {
        if (result["applicationIsOn"] == null) {
            changeToggleButton(true);
        }
        else
            changeToggleButton(result["applicationIsOn"]);
    });
}