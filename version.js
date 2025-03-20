/**
 * Version control system for cache busting
 * This file manages the website version and handles cache clearing when updates are detected
 */

// Current version of the website - update this when making changes to force cache refresh
const SITE_VERSION = '1.0.0';

// Key used for storing the version in localStorage
const VERSION_STORAGE_KEY = 'site_version';

/**
 * Checks if the site version has changed and handles cache clearing if needed
 * Should be called early in the page load process
 */
function checkVersion() {
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    
    // If no version is stored or version is different, clear caches
    if (!storedVersion || storedVersion !== SITE_VERSION) {
        console.log(`Version changed from ${storedVersion || 'none'} to ${SITE_VERSION}. Clearing caches...`);
        
        // Clear localStorage (except language and theme preferences)
        const language = localStorage.getItem('language');
        const theme = localStorage.getItem('theme');
        localStorage.clear();
        
        // Restore user preferences
        if (language) localStorage.setItem('language', language);
        if (theme) localStorage.setItem('theme', theme);
        
        // Store the new version
        localStorage.setItem(VERSION_STORAGE_KEY, SITE_VERSION);
        
        // Clear session storage
        sessionStorage.clear();
        
        // Attempt to clear cache using Cache API if available
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    caches.delete(cacheName);
                });
            });
        }
        
        // Force reload if this isn't the initial page load
        if (storedVersion) {
            window.location.reload(true);
        }
    }
}

// Export the version and check function
export { SITE_VERSION, checkVersion };