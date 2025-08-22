// AudioCache.js - Intelligent Audio Caching System
// Advanced caching with preloading, memory management, and performance optimization

class AudioCache {
    constructor(options = {}) {
        this.options = {
            maxCacheSize: options.maxCacheSize || 200 * 1024 * 1024, // 200MB default
            preloadCount: options.preloadCount || 2, // Preload next 2 tracks
            maxConcurrentDownloads: options.maxConcurrentDownloads || 3,
            enableServiceWorker: options.enableServiceWorker !== false,
            enablePrefetch: options.enablePrefetch !== false,
            ...options
        };

        // Cache storage
        this.cache = new Map(); // URL -> AudioBuffer/Blob
        this.metadata = new Map(); // URL -> metadata
        this.downloadQueue = new Set();
        this.downloading = new Map(); // URL -> Promise
        this.preloadQueue = [];
        
        // Statistics
        this.stats = {
            hits: 0,
            misses: 0,
            downloads: 0,
            errors: 0,
            totalSize: 0,
            preloadsSuccessful: 0,
            preloadsFailed: 0
        };

        // Event system
        this.eventListeners = {
            cacheHit: [],
            cacheMiss: [],
            downloadStart: [],
            downloadComplete: [],
            downloadError: [],
            preloadComplete: [],
            cacheEviction: []
        };

        // Initialize
        this.init();
    }

    async init() {
        console.log('AudioCache: Initializing intelligent cache system...');
        
        // Setup service worker communication
        if (this.options.enableServiceWorker && 'serviceWorker' in navigator) {
            await this.setupServiceWorkerCommunication();
        }

        // Setup prefetch hints
        if (this.options.enablePrefetch) {
            this.setupPrefetchHints();
        }

        // Start cleanup interval
        this.startCleanupInterval();

        console.log('AudioCache: Initialization complete');
    }

    // Event system
    addEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }

    removeEventListener(event, callback) {
        if (this.eventListeners[event]) {
            const index = this.eventListeners[event].indexOf(callback);
            if (index > -1) {
                this.eventListeners[event].splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('AudioCache: Event listener error:', error);
                }
            });
        }
    }

    // Get audio from cache or download
    async getAudio(url, options = {}) {
        console.log('AudioCache: Requesting audio:', url);

        // Check cache first
        if (this.cache.has(url)) {
            this.stats.hits++;
            this.updateMetadata(url, { lastAccessed: Date.now() });
            this.emit('cacheHit', { url });
            
            const cachedData = this.cache.get(url);
            return cachedData;
        }

        // Cache miss
        this.stats.misses++;
        this.emit('cacheMiss', { url });

        // Check if already downloading
        if (this.downloading.has(url)) {
            console.log('AudioCache: Download in progress, waiting...', url);
            return await this.downloading.get(url);
        }

        // Start download
        return await this.downloadAudio(url, options);
    }

    // Download and cache audio
    async downloadAudio(url, options = {}) {
        console.log('AudioCache: Starting download:', url);
        
        const downloadPromise = this._performDownload(url, options);
        this.downloading.set(url, downloadPromise);
        
        try {
            const result = await downloadPromise;
            return result;
        } finally {
            this.downloading.delete(url);
        }
    }

    async _performDownload(url, options = {}) {
        this.stats.downloads++;
        this.emit('downloadStart', { url });

        try {
            // Use different strategies based on browser support
            const audioData = await this.fetchAudioData(url, options);
            
            // Cache the data
            await this.cacheAudio(url, audioData, options);
            
            this.emit('downloadComplete', { url, size: audioData.byteLength || audioData.size });
            
            return audioData;
        } catch (error) {
            this.stats.errors++;
            this.emit('downloadError', { url, error });
            console.error('AudioCache: Download failed:', url, error);
            throw error;
        }
    }

    // Fetch audio data with different strategies
    async fetchAudioData(url, options = {}) {
        const fetchOptions = {
            credentials: 'same-origin',
            cache: 'force-cache', // Try cache first
            ...options.fetchOptions
        };

        // Try Service Worker first if available
        if (this.options.enableServiceWorker && navigator.serviceWorker.controller) {
            try {
                const response = await fetch(url, fetchOptions);
                if (response.ok) {
                    return await response.arrayBuffer();
                }
            } catch (error) {
                console.warn('AudioCache: Service Worker fetch failed, trying direct:', error);
            }
        }

        // Direct fetch fallback
        const response = await fetch(url, {
            ...fetchOptions,
            cache: 'default' // Allow network
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Get data based on usage preference
        if (options.useBlob) {
            return await response.blob();
        } else {
            return await response.arrayBuffer();
        }
    }

    // Cache audio data
    async cacheAudio(url, audioData, options = {}) {
        const size = audioData.byteLength || audioData.size;
        
        // Check if we need to make space
        await this.ensureSpaceAvailable(size);

        // Store in cache
        this.cache.set(url, audioData);
        
        // Store metadata
        this.metadata.set(url, {
            size,
            cachedAt: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 1,
            format: this.detectAudioFormat(url),
            ...options.metadata
        });

        this.stats.totalSize += size;
        
        console.log(`AudioCache: Cached audio (${this.formatSize(size)}):`, url);
    }

    // Preload audio intelligently
    async preloadAudio(urls, options = {}) {
        if (!Array.isArray(urls)) {
            urls = [urls];
        }

        const preloadPromises = urls.slice(0, this.options.preloadCount).map(url => {
            if (this.cache.has(url) || this.downloading.has(url)) {
                return Promise.resolve(); // Already cached/downloading
            }

            return this.downloadAudio(url, { ...options, preload: true })
                .then(() => {
                    this.stats.preloadsSuccessful++;
                    this.emit('preloadComplete', { url, success: true });
                })
                .catch(error => {
                    this.stats.preloadsFailed++;
                    this.emit('preloadComplete', { url, success: false, error });
                    console.warn('AudioCache: Preload failed:', url, error);
                });
        });

        return Promise.allSettled(preloadPromises);
    }

    // Smart preloading based on session data
    async preloadForSession(sessionData, currentIndex = 0) {
        if (!sessionData || !sessionData.tracks) return;

        const preloadUrls = [];
        const startIndex = Math.max(0, currentIndex);
        const endIndex = Math.min(sessionData.tracks.length, startIndex + this.options.preloadCount);

        for (let i = startIndex; i < endIndex; i++) {
            const track = sessionData.tracks[i];
            if (track && track.audioUrl && track.audioUrl !== '#') {
                preloadUrls.push(track.audioUrl);
            }
        }

        if (preloadUrls.length > 0) {
            console.log('AudioCache: Preloading tracks for session:', preloadUrls);
            await this.preloadAudio(preloadUrls);
        }
    }

    // Ensure enough cache space is available
    async ensureSpaceAvailable(requiredSize) {
        if (this.stats.totalSize + requiredSize <= this.options.maxCacheSize) {
            return; // Enough space available
        }

        console.log('AudioCache: Cache full, evicting old entries...');
        
        // Get entries sorted by LRU (Least Recently Used)
        const entries = Array.from(this.metadata.entries())
            .map(([url, meta]) => ({ url, ...meta }))
            .sort((a, b) => a.lastAccessed - b.lastAccessed);

        let freedSpace = 0;
        const targetSpace = this.options.maxCacheSize * 0.8; // Free to 80%

        for (const entry of entries) {
            if (this.stats.totalSize - freedSpace <= targetSpace) {
                break;
            }

            this.evictFromCache(entry.url);
            freedSpace += entry.size;
            
            this.emit('cacheEviction', { url: entry.url, size: entry.size });
        }

        console.log(`AudioCache: Freed ${this.formatSize(freedSpace)} of cache space`);
    }

    // Evict entry from cache
    evictFromCache(url) {
        if (this.cache.has(url)) {
            const metadata = this.metadata.get(url);
            if (metadata) {
                this.stats.totalSize -= metadata.size;
            }
            
            this.cache.delete(url);
            this.metadata.delete(url);
            
            console.log('AudioCache: Evicted from cache:', url);
        }
    }

    // Clear entire cache
    clearCache() {
        console.log('AudioCache: Clearing entire cache...');
        
        this.cache.clear();
        this.metadata.clear();
        this.downloading.clear();
        this.downloadQueue.clear();
        
        this.stats.totalSize = 0;
        this.stats.hits = 0;
        this.stats.misses = 0;
        
        // Clear service worker cache too
        if (this.options.enableServiceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CLEAR_CACHE'
            });
        }
    }

    // Get cache statistics
    getStats() {
        return {
            ...this.stats,
            cacheEntries: this.cache.size,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100,
            totalSizeFormatted: this.formatSize(this.stats.totalSize),
            maxSizeFormatted: this.formatSize(this.options.maxCacheSize)
        };
    }

    // Service Worker communication
    async setupServiceWorkerCommunication() {
        if (!navigator.serviceWorker.controller) return;

        try {
            // Register message handler
            navigator.serviceWorker.addEventListener('message', event => {
                this.handleServiceWorkerMessage(event);
            });

            console.log('AudioCache: Service Worker communication established');
        } catch (error) {
            console.warn('AudioCache: Service Worker communication failed:', error);
        }
    }

    handleServiceWorkerMessage(event) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'CACHE_STATUS':
                console.log('AudioCache: Service Worker cache status:', data);
                break;
            default:
                console.log('AudioCache: Unknown SW message:', type, data);
        }
    }

    // Setup prefetch hints for browsers
    setupPrefetchHints() {
        // Add DNS prefetch for common audio domains
        this.addPrefetchHint('dns-prefetch', 'https://audio.example.com');
        
        // Add preconnect for critical resources
        this.addPrefetchHint('preconnect', window.location.origin);
    }

    addPrefetchHint(rel, href) {
        if (document.querySelector(`link[rel="${rel}"][href="${href}"]`)) {
            return; // Already exists
        }

        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        document.head.appendChild(link);
    }

    // Utility functions
    detectAudioFormat(url) {
        const extension = url.split('.').pop().toLowerCase();
        const formats = {
            mp3: 'audio/mpeg',
            flac: 'audio/flac',
            wav: 'audio/wav',
            ogg: 'audio/ogg',
            m4a: 'audio/mp4'
        };
        return formats[extension] || 'audio/unknown';
    }

    formatSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Cleanup interval for maintenance
    startCleanupInterval() {
        // Run cleanup every 5 minutes
        setInterval(() => {
            this.performMaintenance();
        }, 5 * 60 * 1000);
    }

    performMaintenance() {
        console.log('AudioCache: Performing maintenance...');
        
        // Clean up old downloads that failed
        this.downloadQueue.clear();
        
        // Update statistics
        const stats = this.getStats();
        console.log('AudioCache: Cache stats:', stats);
        
        // Optional: Report to analytics
        if (window.gtag) {
            window.gtag('event', 'cache_maintenance', {
                cache_hit_rate: stats.hitRate,
                cache_size: stats.totalSizeFormatted,
                cache_entries: stats.cacheEntries
            });
        }
    }

    // Check if audio is cached
    isCached(url) {
        return this.cache.has(url);
    }

    // Get cached audio without downloading
    getCachedAudio(url) {
        if (this.cache.has(url)) {
            this.updateMetadata(url, { lastAccessed: Date.now() });
            return this.cache.get(url);
        }
        return null;
    }

    // Update metadata for cached item
    updateMetadata(url, updates) {
        if (this.metadata.has(url)) {
            const existing = this.metadata.get(url);
            this.metadata.set(url, { ...existing, ...updates });
        }
    }
}

// Export for use in other modules
window.AudioCache = AudioCache;

// Auto-initialize if needed
if (typeof window !== 'undefined' && !window.audioCache) {
    window.audioCache = new AudioCache();
}

console.log('AudioCache: Module loaded successfully');