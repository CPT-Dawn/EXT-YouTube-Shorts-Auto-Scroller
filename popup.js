document.addEventListener('DOMContentLoaded', async () => {
    const autoScrollToggle = document.getElementById('autoScrollToggle');
    const hoverButtonToggle = document.getElementById('hoverButtonToggle');
    const status = document.getElementById('status');
    
    // Load saved settings
    const settings = await chrome.storage.sync.get({
        autoScrollEnabled: true,
        hoverButtonEnabled: true
    });
    
    // Update UI based on saved settings
    updateToggleUI(autoScrollToggle, settings.autoScrollEnabled);
    updateToggleUI(hoverButtonToggle, settings.hoverButtonEnabled);
    
    status.textContent = 'Settings loaded successfully';
    
    // Add event listeners
    autoScrollToggle.addEventListener('click', async () => {
        const newState = !autoScrollToggle.classList.contains('active');
        updateToggleUI(autoScrollToggle, newState);
        
        await chrome.storage.sync.set({ autoScrollEnabled: newState });
        
        // Send message to content script
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url.includes('youtube.com')) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateAutoScroll',
                    enabled: newState
                });
            }
        } catch (error) {
            console.log('Tab not ready for messaging');
        }
        
        status.textContent = `Auto scroll ${newState ? 'enabled' : 'disabled'}`;
    });
    
    hoverButtonToggle.addEventListener('click', async () => {
        const newState = !hoverButtonToggle.classList.contains('active');
        updateToggleUI(hoverButtonToggle, newState);
        
        await chrome.storage.sync.set({ hoverButtonEnabled: newState });
        
        // Send message to content script
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url.includes('youtube.com')) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateHoverButton',
                    enabled: newState
                });
            }
        } catch (error) {
            console.log('Tab not ready for messaging');
        }
        
        status.textContent = `Hover button ${newState ? 'enabled' : 'disabled'}`;
    });
    
    function updateToggleUI(toggle, isActive) {
        if (isActive) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    }
});