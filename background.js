// Background script for YouTube Shorts Auto Scroll Extension

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Set default settings on first install
        chrome.storage.sync.set({
            autoScrollEnabled: true,
            hoverButtonEnabled: true
        });
        
        console.log('YouTube Shorts Auto Scroll Extension installed');
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // This will open the popup automatically
    // No additional code needed as popup is defined in manifest
});

// Listen for tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
        // Ensure content script is injected
        chrome.tabs.sendMessage(tabId, { action: 'ping' }).catch(() => {
            // Content script not ready, which is normal
        });
    }
});

// Handle storage changes and broadcast to all YouTube tabs
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
        // Broadcast changes to all YouTube tabs
        chrome.tabs.query({ url: 'https://www.youtube.com/*' }, (tabs) => {
            tabs.forEach(tab => {
                if (changes.autoScrollEnabled) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'updateAutoScroll',
                        enabled: changes.autoScrollEnabled.newValue
                    }).catch(() => {
                        // Tab not ready for messaging
                    });
                }
                
                if (changes.hoverButtonEnabled) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'updateHoverButton',
                        enabled: changes.hoverButtonEnabled.newValue
                    }).catch(() => {
                        // Tab not ready for messaging
                    });
                }
            });
        });
    }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSettings') {
        chrome.storage.sync.get({
            autoScrollEnabled: true,
            hoverButtonEnabled: true
        }).then(settings => {
            sendResponse(settings);
        });
        return true; // Will respond asynchronously
    }
});