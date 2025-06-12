// Simple and reliable YouTube Shorts controller
console.log('YouTube Shorts Extension loaded');

class SimpleShortsController {
    constructor() {
        this.settings = {
            autoScrollEnabled: true,
            hoverButtonEnabled: true
        };
        this.currentVideo = null;
        this.observer = null;
        this.hoverButton = null;
        this.checkInterval = null;
        
        this.init();
    }
    
    async init() {
        console.log('Initializing YouTube Shorts Controller');
        
        // Load settings
        try {
            const stored = await chrome.storage.sync.get({
                autoScrollEnabled: true,
                hoverButtonEnabled: true
            });
            this.settings = stored;
            console.log('Settings loaded:', this.settings);
        } catch (e) {
            console.log('Using default settings');
        }
        
        // Start checking for shorts
        this.startChecking();
        
        // Create hover button
        this.createHoverButton();
    }
    
    startChecking() {
        // Clear existing interval
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        // Check every 2 seconds for shorts and video changes
        this.checkInterval = setInterval(() => {
            this.checkForShorts();
            this.skipAds();
        }, 2000);
        
        // Also check immediately
        this.checkForShorts();
    }
    
    checkForShorts() {
        // Check if we're on shorts page
        const isShorts = window.location.pathname.includes('/shorts/') || 
                         document.querySelector('ytd-shorts') !== null ||
                         document.querySelector('#shorts-container') !== null;
        
        if (!isShorts) return;
        
        // Find video element
        const video = this.findVideo();
        if (!video) return;
        
        // If this is a new video, set up listeners
        if (video !== this.currentVideo) {
            console.log('New video detected');
            this.currentVideo = video;
            this.setupVideoListener(video);
        }
        
        // Update hover button visibility
        this.updateHoverButtonVisibility(isShorts);
    }
    
    findVideo() {
        // Try different selectors to find the current video
        const selectors = [
            'ytd-shorts video',
            'ytd-reel-video-renderer video', 
            '#shorts-player video',
            'video'
        ];
        
        for (const selector of selectors) {
            const videos = document.querySelectorAll(selector);
            for (const video of videos) {
                // Check if video is visible and has a source
                if (video.offsetParent !== null && (video.src || video.currentSrc)) {
                    return video;
                }
            }
        }
        return null;
    }
    
    setupVideoListener(video) {
        // Remove old listeners
        if (video._shortsListener) {
            video.removeEventListener('ended', video._shortsListener);
        }
        
        // Add new listener
        const listener = () => {
            console.log('Video ended, auto scroll enabled:', this.settings.autoScrollEnabled);
            if (this.settings.autoScrollEnabled) {
                setTimeout(() => this.scrollToNext(), 500);
            }
        };
        
        video.addEventListener('ended', listener);
        video._shortsListener = listener;
    }
    
    scrollToNext() {
        console.log('Attempting to scroll to next short');
        
        // Method 1: Try arrow down key
        const keyEvent = new KeyboardEvent('keydown', {
            key: 'ArrowDown',
            keyCode: 40,
            which: 40,
            bubbles: true
        });
        document.dispatchEvent(keyEvent);
        
        // Method 2: Try clicking next button (backup)
        setTimeout(() => {
            const nextButtons = document.querySelectorAll('button[aria-label*="Next"], button[aria-label*="next"]');
            for (const btn of nextButtons) {
                if (btn.offsetParent !== null) {
                    console.log('Clicking next button');
                    btn.click();
                    break;
                }
            }
        }, 100);
        
        // Method 3: Try scrolling (backup)
        setTimeout(() => {
            window.scrollBy({
                top: window.innerHeight,
                behavior: 'smooth'
            });
        }, 200);
    }
    
    skipAds() {
        // Skip video ads
        const skipSelectors = [
            '.ytp-ad-skip-button',
            '.ytp-skip-ad-button', 
            'button[class*="skip"]',
            '.ytp-ad-skip-button-modern'
        ];
        
        for (const selector of skipSelectors) {
            const button = document.querySelector(selector);
            if (button && button.offsetParent !== null) {
                console.log('Skipping ad');
                button.click();
                break;
            }
        }
        
        // Close overlay ads
        const overlayAds = document.querySelectorAll('.ytp-ad-overlay-close-button');
        overlayAds.forEach(ad => {
            if (ad.offsetParent !== null) {
                ad.click();
            }
        });
    }
    
    createHoverButton() {
        if (this.hoverButton) {
            this.hoverButton.remove();
        }
        
        this.hoverButton = document.createElement('div');
        this.hoverButton.id = 'shorts-hover-button';
        this.hoverButton.innerHTML = `
            <div style="font-size: 24px;">${this.settings.autoScrollEnabled ? '⏸️' : '▶️'}</div>
        `;
        
        this.hoverButton.addEventListener('click', () => {
            this.toggleAutoScroll();
        });
        
        document.body.appendChild(this.hoverButton);
        this.updateHoverButtonVisibility(false);
    }
    
    updateHoverButtonVisibility(isShorts) {
        if (!this.hoverButton) return;
        
        if (this.settings.hoverButtonEnabled && isShorts) {
            this.hoverButton.style.display = 'flex';
        } else {
            this.hoverButton.style.display = 'none';
        }
    }
    
    async toggleAutoScroll() {
        this.settings.autoScrollEnabled = !this.settings.autoScrollEnabled;
        console.log('Auto scroll toggled:', this.settings.autoScrollEnabled);
        
        // Update storage
        try {
            await chrome.storage.sync.set({ autoScrollEnabled: this.settings.autoScrollEnabled });
        } catch (e) {
            console.log('Failed to save setting');
        }
        
        // Update button
        if (this.hoverButton) {
            this.hoverButton.innerHTML = `
                <div style="font-size: 24px;">${this.settings.autoScrollEnabled ? '⏸️' : '▶️'}</div>
            `;
        }
    }
    
    updateSettings(newSettings) {
        console.log('Updating settings:', newSettings);
        this.settings = { ...this.settings, ...newSettings };
        
        if (this.hoverButton) {
            this.hoverButton.innerHTML = `
                <div style="font-size: 24px;">${this.settings.autoScrollEnabled ? '⏸️' : '▶️'}</div>
            `;
            this.updateHoverButtonVisibility(window.location.pathname.includes('/shorts/'));
        }
    }
}

// Initialize controller
let controller = new SimpleShortsController();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);
    
    if (request.action === 'updateAutoScroll') {
        controller.updateSettings({ autoScrollEnabled: request.enabled });
    } else if (request.action === 'updateHoverButton') {
        controller.updateSettings({ hoverButtonEnabled: request.enabled });
    }
    
    sendResponse({ success: true });
});

// Handle page navigation
let lastUrl = location.href;
const navObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log('Navigation detected, restarting controller');
        setTimeout(() => {
            controller.startChecking();
        }, 1000);
    }
});
navObserver.observe(document.body, { childList: true, subtree: true });