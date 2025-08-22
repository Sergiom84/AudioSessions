// AudioSessions Service Worker - Advanced Caching Strategy
// Version 1.0.0

const CACHE_NAME = 'audiosessions-v1.0.0';
const AUDIO_CACHE_NAME = 'audiosessions-audio-v1.0.0';

// Assets to cache immediately (Critical resources)
const CRITICAL_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/global-player.js',
    '/global-player-simple.js',
    '/player.html',
    '/house.html',
    '/techno.html',
    '/progressive.html',
    '/remember.html'
];

// Assets to cache on first visit (Non-critical resources)
const NON_CRITICAL_ASSETS = [
    '/private.html',
    '/attached_assets/Fondo_ppal.png'
];

// Network timeout for fetch requests (ms)
const NETWORK_TIMEOUT = 3000;

// Cache strategies
const CACHE_STRATEGIES = {
    // HTML files: Network first, cache fallback
    html: 'networkFirst',
    // CSS/JS: Cache first, network fallback
    static: 'cacheFirst',
    // Audio files: Cache first with intelligent preloading
    audio: 'cacheFirstAudio',
    // Images: Cache first
    images: 'cacheFirst',
    // API calls: Network first
    api: 'networkFirst'
};

// Install event - Cache critical assets
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then(cache => {
                console.log('Service Worker: Caching critical assets');
                return cache.addAll(CRITICAL_ASSETS);
            }),
            caches.open(AUDIO_CACHE_NAME).then(cache => {
                console.log('Service Worker: Audio cache initialized');
                return cache;
            })
        ]).then(() => {
            console.log('Service Worker: Installation complete');
            // Skip waiting to activate immediately
            return self.skipWaiting();
        })
    );
});

// Activate event - Clean old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => 
                        cacheName !== CACHE_NAME && 
                        cacheName !== AUDIO_CACHE_NAME
                    )
                    .map(cacheName => {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        }).then(() => {
            console.log('Service Worker: Activation complete');
            // Take control of all clients immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - Implement caching strategies
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Determine strategy based on request type
    const strategy = getStrategyForRequest(request);
    
    event.respondWith(
        executeStrategy(request, strategy)
    );
});

// Determine caching strategy for request
function getStrategyForRequest(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // HTML files
    if (pathname.endsWith('.html') || pathname === '/') {
        return CACHE_STRATEGIES.html;
    }
    
    // Static assets (CSS, JS)
    if (pathname.endsWith('.css') || pathname.endsWith('.js')) {
        return CACHE_STRATEGIES.static;
    }
    
    // Audio files
    if (pathname.match(/\.(mp3|flac|wav|ogg|m4a)$/i)) {
        return CACHE_STRATEGIES.audio;
    }
    
    // Images
    if (pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
        return CACHE_STRATEGIES.images;
    }
    
    // API calls
    if (pathname.startsWith('/api/')) {
        return CACHE_STRATEGIES.api;
    }
    
    // Default to network first
    return CACHE_STRATEGIES.html;
}

// Execute caching strategy
async function executeStrategy(request, strategy) {
    switch (strategy) {
        case 'networkFirst':
            return networkFirst(request);
        case 'cacheFirst':
            return cacheFirst(request);
        case 'cacheFirstAudio':
            return cacheFirstAudio(request);
        default:
            return networkFirst(request);
    }
}

// Network first strategy (with timeout)
async function networkFirst(request) {
    const cacheName = isAudioRequest(request) ? AUDIO_CACHE_NAME : CACHE_NAME;
    
    try {
        // Try network with timeout
        const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
        
        // Cache successful response
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Fallback to cache
        console.log('Service Worker: Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If no cache available, return error response
        return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Cache first strategy
async function cacheFirst(request) {
    const cacheName = isAudioRequest(request) ? AUDIO_CACHE_NAME : CACHE_NAME;
    
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Fallback to network
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Both cache and network failed:', error);
        return new Response('Resource not available', {
            status: 404,
            statusText: 'Not Found'
        });
    }
}

// Cache first strategy for audio (with intelligent management)
async function cacheFirstAudio(request) {
    // Check if audio is already cached
    const cachedResponse = await caches.match(request, {
        cacheName: AUDIO_CACHE_NAME
    });
    
    if (cachedResponse) {
        console.log('Service Worker: Serving audio from cache:', request.url);
        return cachedResponse;
    }
    
    // Not cached, fetch from network
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.status === 200) {
            // Cache audio file
            const cache = await caches.open(AUDIO_CACHE_NAME);
            
            // Check cache size and manage storage
            await manageAudioCacheSize(cache);
            
            // Cache the audio
            cache.put(request, networkResponse.clone());
            console.log('Service Worker: Cached audio file:', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Audio fetch failed:', error);
        return new Response('Audio not available', {
            status: 404,
            statusText: 'Audio Not Found'
        });
    }
}

// Fetch with timeout
function fetchWithTimeout(request, timeout) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Network timeout'));
        }, timeout);
        
        fetch(request)
            .then(response => {
                clearTimeout(timeoutId);
                resolve(response);
            })
            .catch(error => {
                clearTimeout(timeoutId);
                reject(error);
            });
    });
}

// Check if request is for audio
function isAudioRequest(request) {
    const url = new URL(request.url);
    return url.pathname.match(/\.(mp3|flac|wav|ogg|m4a)$/i);
}

// Manage audio cache size (LRU eviction)
async function manageAudioCacheSize(cache) {
    const MAX_AUDIO_CACHE_SIZE = 500 * 1024 * 1024; // 500MB
    
    try {
        const keys = await cache.keys();
        let totalSize = 0;
        const sizeMap = new Map();
        
        // Calculate current cache size
        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                const size = parseInt(response.headers.get('content-length')) || 0;
                totalSize += size;
                sizeMap.set(request.url, {
                    request,
                    size,
                    lastUsed: new Date(response.headers.get('date') || Date.now())
                });
            }
        }
        
        // If over limit, remove oldest files
        if (totalSize > MAX_AUDIO_CACHE_SIZE) {
            console.log('Service Worker: Audio cache over limit, cleaning up...');
            
            const sortedEntries = Array.from(sizeMap.values())
                .sort((a, b) => a.lastUsed - b.lastUsed);
            
            let removedSize = 0;
            const targetSize = MAX_AUDIO_CACHE_SIZE * 0.8; // Remove to 80% of limit
            
            for (const entry of sortedEntries) {
                if (totalSize - removedSize <= targetSize) break;
                
                await cache.delete(entry.request);
                removedSize += entry.size;
                console.log('Service Worker: Removed cached audio:', entry.request.url);
            }
        }
    } catch (error) {
        console.error('Service Worker: Cache management error:', error);
    }
}

// Message handling for communication with main thread
self.addEventListener('message', event => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_AUDIO':
            if (data && data.url) {
                cacheAudioFile(data.url);
            }
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches();
            break;
            
        case 'GET_CACHE_STATUS':
            getCacheStatus().then(status => {
                event.ports[0].postMessage(status);
            });
            break;
            
        default:
            console.log('Service Worker: Unknown message type:', type);
    }
});

// Preemptively cache audio file
async function cacheAudioFile(url) {
    try {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        const response = await fetch(url);
        
        if (response && response.status === 200) {
            await cache.put(url, response);
            console.log('Service Worker: Preemptively cached audio:', url);
        }
    } catch (error) {
        console.error('Service Worker: Failed to preemptively cache audio:', error);
    }
}

// Clear all caches
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Service Worker: All caches cleared');
    } catch (error) {
        console.error('Service Worker: Failed to clear caches:', error);
    }
}

// Get cache status
async function getCacheStatus() {
    try {
        const [mainCache, audioCache] = await Promise.all([
            caches.open(CACHE_NAME),
            caches.open(AUDIO_CACHE_NAME)
        ]);
        
        const [mainKeys, audioKeys] = await Promise.all([
            mainCache.keys(),
            audioCache.keys()
        ]);
        
        return {
            mainCacheEntries: mainKeys.length,
            audioCacheEntries: audioKeys.length,
            cacheNames: {
                main: CACHE_NAME,
                audio: AUDIO_CACHE_NAME
            }
        };
    } catch (error) {
        console.error('Service Worker: Failed to get cache status:', error);
        return null;
    }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync triggered:', event.tag);
    
    switch (event.tag) {
        case 'background-sync-audio':
            event.waitUntil(syncAudioData());
            break;
        default:
            console.log('Service Worker: Unknown sync tag:', event.tag);
    }
});

// Sync audio data when back online
async function syncAudioData() {
    try {
        // Get pending sync data from IndexedDB
        // This would integrate with sessionStorage.js
        console.log('Service Worker: Syncing audio data...');
        
        // Implementation would go here for syncing play counts,
        // session data, user preferences, etc.
        
    } catch (error) {
        console.error('Service Worker: Sync failed:', error);
    }
}

console.log('Service Worker: Script loaded successfully');