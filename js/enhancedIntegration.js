// Enhanced Integration Layer - Connects new modules with existing global player
// This provides backward compatibility while enabling new features

class EnhancedAudioIntegration {
    constructor() {
        this.globalPlayer = null;
        this.enhancedPlayer = null;
        this.audioCache = null;
        this.playerState = null;
        this.sessionStorage = null;
        
        this.isEnhancedMode = false;
        this.initializationPromise = null;
        
        console.log('EnhancedAudioIntegration: Starting integration...');
        this.init();
    }

    async init() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._performInit();
        return this.initializationPromise;
    }

    async _performInit() {
        try {
            // Wait for required modules to load
            await this.waitForModules();
            
            // Initialize enhanced modules
            await this.initializeEnhancedModules();
            
            // Setup integration with existing global player
            await this.setupGlobalPlayerIntegration();
            
            // Enable enhanced features
            this.enableEnhancedFeatures();
            
            this.isEnhancedMode = true;
            console.log('EnhancedAudioIntegration: Enhanced mode enabled');
            
        } catch (error) {
            console.warn('EnhancedAudioIntegration: Falling back to standard mode:', error);
            this.enableFallbackMode();
        }
    }

    async waitForModules() {
        const maxWaitTime = 10000; // 10 seconds
        const checkInterval = 100;
        let waited = 0;

        return new Promise((resolve, reject) => {
            const checkModules = () => {
                const modulesReady = 
                    window.PlayerState && 
                    window.AudioCache && 
                    window.EnhancedAudioPlayer && 
                    window.SessionStorage;

                if (modulesReady) {
                    resolve();
                } else if (waited >= maxWaitTime) {
                    reject(new Error('Modules failed to load within timeout'));
                } else {
                    waited += checkInterval;
                    setTimeout(checkModules, checkInterval);
                }
            };
            checkModules();
        });
    }

    async initializeEnhancedModules() {
        // Initialize state management
        if (!window.playerState) {
            this.playerState = new window.PlayerState({
                enablePersistence: true,
                enableSync: true
            });
            window.playerState = this.playerState;
        } else {
            this.playerState = window.playerState;
        }

        // Initialize session storage
        if (!window.sessionStorageDB) {
            this.sessionStorage = new window.SessionStorage({
                enableOfflineSync: true,
                maxHistoryEntries: 500
            });
            window.sessionStorageDB = this.sessionStorage;
        } else {
            this.sessionStorage = window.sessionStorageDB;
        }

        // Initialize audio cache
        if (!window.audioCache) {
            this.audioCache = new window.AudioCache({
                enableServiceWorker: true,
                maxCacheSize: 250 * 1024 * 1024, // 250MB
                preloadCount: 2
            });
            window.audioCache = this.audioCache;
        } else {
            this.audioCache = window.audioCache;
        }

        // Initialize enhanced player
        this.enhancedPlayer = new window.EnhancedAudioPlayer({
            enableSpectrum: true,
            enableEqualizer: false, // Start with basic features
            enableVisualization: true
        });

        console.log('EnhancedAudioIntegration: Enhanced modules initialized');
    }

    async setupGlobalPlayerIntegration() {
        // Wait for global player to be available
        await this.waitForGlobalPlayer();

        // Enhance existing global player with new capabilities
        this.enhanceGlobalPlayer();

        // Setup state synchronization
        this.setupStateSynchronization();

        // Setup cache integration
        this.setupCacheIntegration();
    }

    async waitForGlobalPlayer() {
        const maxWaitTime = 5000;
        const checkInterval = 100;
        let waited = 0;

        return new Promise((resolve) => {
            const checkGlobalPlayer = () => {
                if (window.globalAudioPlayer) {
                    this.globalPlayer = window.globalAudioPlayer;
                    resolve();
                } else if (waited >= maxWaitTime) {
                    // Create integration-compatible player
                    this.createCompatiblePlayer();
                    resolve();
                } else {
                    waited += checkInterval;
                    setTimeout(checkGlobalPlayer, checkInterval);
                }
            };
            checkGlobalPlayer();
        });
    }

    createCompatiblePlayer() {
        // Create a simplified global player that works with our integration
        this.globalPlayer = {
            audio: null,
            currentSession: null,
            isPlaying: false,
            setAudioElement: (audio) => { this.globalPlayer.audio = audio; },
            loadSession: (session) => this.loadSessionEnhanced(session),
            play: () => this.playEnhanced(),
            pause: () => this.pauseEnhanced(),
            stop: () => this.stopEnhanced()
        };
        
        window.globalAudioPlayer = this.globalPlayer;
        console.log('EnhancedAudioIntegration: Created compatible global player');
    }

    enhanceGlobalPlayer() {
        if (!this.globalPlayer) return;

        // Store original methods
        const original = {
            loadSession: this.globalPlayer.loadSession?.bind(this.globalPlayer),
            play: this.globalPlayer.play?.bind(this.globalPlayer),
            pause: this.globalPlayer.pause?.bind(this.globalPlayer),
            stop: this.globalPlayer.stop?.bind(this.globalPlayer)
        };

        // Enhanced loadSession method
        this.globalPlayer.loadSessionEnhanced = async (sessionData) => {
            try {
                console.log('EnhancedAudioIntegration: Loading session with enhancements:', sessionData?.id);
                
                // Update state
                this.playerState.update({
                    'player.isLoading': true,
                    'player.error': null,
                    'player.currentSession': sessionData
                });

                // Check cache first
                if (sessionData.audioUrl && this.audioCache.isCached(sessionData.audioUrl)) {
                    console.log('EnhancedAudioIntegration: Using cached audio');
                    const cachedAudio = this.audioCache.getCachedAudio(sessionData.audioUrl);
                    await this.loadCachedAudio(cachedAudio, sessionData);
                } else {
                    // Load with enhanced player
                    await this.enhancedPlayer.loadAndPlay(sessionData.audioUrl, {
                        autoplay: false
                    });
                    
                    // Cache for future use
                    this.audioCache.preloadAudio([sessionData.audioUrl]);
                }

                // Update global player state
                this.globalPlayer.currentSession = sessionData;
                this.globalPlayer.audio = this.enhancedPlayer.audioElement;

                // Record in session storage
                await this.sessionStorage.recordPlayback(sessionData.id, {
                    started: true,
                    timestamp: Date.now()
                });

                this.playerState.set('player.isLoading', false);
                
                return true;
            } catch (error) {
                console.error('EnhancedAudioIntegration: Session load failed:', error);
                this.playerState.update({
                    'player.error': error,
                    'player.isLoading': false
                });
                
                // Fallback to original method if available
                if (original.loadSession) {
                    return original.loadSession(sessionData);
                }
                throw error;
            }
        };

        // Enhanced play method
        this.globalPlayer.playEnhanced = async () => {
            try {
                await this.enhancedPlayer.play();
                this.globalPlayer.isPlaying = true;
                this.playerState.set('player.isPlaying', true);
                
                // Start spectrum analysis if available
                if (this.enhancedPlayer.analyserNode) {
                    this.startSpectrumVisualization();
                }
                
                return true;
            } catch (error) {
                console.error('EnhancedAudioIntegration: Play failed:', error);
                if (original.play) {
                    return original.play();
                }
                throw error;
            }
        };

        // Enhanced pause method
        this.globalPlayer.pauseEnhanced = () => {
            this.enhancedPlayer.pause();
            this.globalPlayer.isPlaying = false;
            this.playerState.set('player.isPlaying', false);
            this.stopSpectrumVisualization();
        };

        // Enhanced stop method
        this.globalPlayer.stopEnhanced = () => {
            this.enhancedPlayer.stop();
            this.globalPlayer.isPlaying = false;
            this.playerState.update({
                'player.isPlaying': false,
                'player.currentTime': 0
            });
            this.stopSpectrumVisualization();
        };

        // Replace methods with enhanced versions
        this.globalPlayer.loadSession = this.globalPlayer.loadSessionEnhanced;
        this.globalPlayer.play = this.globalPlayer.playEnhanced;
        this.globalPlayer.pause = this.globalPlayer.pauseEnhanced;
        this.globalPlayer.stop = this.globalPlayer.stopEnhanced;

        console.log('EnhancedAudioIntegration: Global player enhanced');
    }

    async loadCachedAudio(cachedAudio, sessionData) {
        // Create blob URL from cached data
        const blob = new Blob([cachedAudio], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(blob);
        
        // Load in enhanced player
        await this.enhancedPlayer.loadAndPlay(blobUrl, { autoplay: false });
        
        // Clean up blob URL after loading
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }

    setupStateSynchronization() {
        // Sync enhanced player state with global state
        this.enhancedPlayer.addEventListener('timeupdate', (data) => {
            this.playerState.update({
                'player.currentTime': data.currentTime,
                'player.duration': data.duration
            });

            // Save position for persistence
            if (this.globalPlayer.currentSession) {
                this.sessionStorage.setPreference(
                    `position_${this.globalPlayer.currentSession.id}`,
                    data.currentTime
                );
            }
        });

        this.enhancedPlayer.addEventListener('ended', () => {
            this.playerState.set('player.isPlaying', false);
            this.stopSpectrumVisualization();
        });

        this.enhancedPlayer.addEventListener('error', (error) => {
            this.playerState.set('player.error', error);
            console.error('EnhancedAudioIntegration: Player error:', error);
        });

        // Watch state changes and update UI
        this.playerState.watch('player.volume', (volume) => {
            this.enhancedPlayer.setVolume(volume);
        });

        console.log('EnhancedAudioIntegration: State synchronization setup complete');
    }

    setupCacheIntegration() {
        // Listen for cache events
        this.audioCache.addEventListener('cacheHit', (data) => {
            console.log('EnhancedAudioIntegration: Cache hit for:', data.url);
        });

        this.audioCache.addEventListener('downloadComplete', (data) => {
            console.log('EnhancedAudioIntegration: Download complete:', data.url);
        });

        this.audioCache.addEventListener('preloadComplete', (data) => {
            if (data.success) {
                console.log('EnhancedAudioIntegration: Preload successful:', data.url);
            }
        });

        console.log('EnhancedAudioIntegration: Cache integration setup complete');
    }

    enableEnhancedFeatures() {
        // Enable spectrum visualization
        this.setupSpectrumVisualization();
        
        // Enable keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Enable media session
        this.setupMediaSession();
        
        // Enable offline support
        this.setupOfflineSupport();

        console.log('EnhancedAudioIntegration: Enhanced features enabled');
    }

    setupSpectrumVisualization() {
        // Find or create spectrum canvas
        let canvas = document.getElementById('spectrumCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'spectrumCanvas';
            canvas.style.display = 'none'; // Hidden by default
            document.body.appendChild(canvas);
        }

        this.enhancedPlayer.setupSpectrumCanvas(canvas);
    }

    startSpectrumVisualization() {
        if (this.enhancedPlayer && this.enhancedPlayer.startSpectrum) {
            this.enhancedPlayer.startSpectrum();
        }
    }

    stopSpectrumVisualization() {
        if (this.enhancedPlayer && this.enhancedPlayer.stopSpectrum) {
            this.enhancedPlayer.stopSpectrum();
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Only handle if not typing in an input
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    if (this.globalPlayer.isPlaying) {
                        this.globalPlayer.pause();
                    } else {
                        this.globalPlayer.play();
                    }
                    break;
                
                case 'ArrowLeft':
                    event.preventDefault();
                    this.enhancedPlayer.seekRelative(-10);
                    break;
                
                case 'ArrowRight':
                    event.preventDefault();
                    this.enhancedPlayer.seekRelative(10);
                    break;
                
                case 'ArrowUp':
                    event.preventDefault();
                    const currentVolume = this.playerState.get('player.volume') || 1;
                    this.playerState.actions.setVolume(Math.min(1, currentVolume + 0.1));
                    break;
                
                case 'ArrowDown':
                    event.preventDefault();
                    const volume = this.playerState.get('player.volume') || 1;
                    this.playerState.actions.setVolume(Math.max(0, volume - 0.1));
                    break;
            }
        });
    }

    setupMediaSession() {
        if (!('mediaSession' in navigator)) return;

        this.enhancedPlayer.addEventListener('loadeddata', () => {
            const session = this.globalPlayer.currentSession;
            if (!session) return;

            navigator.mediaSession.metadata = new MediaMetadata({
                title: session.title || 'Unknown Title',
                artist: session.artist || 'AudioSessions',
                album: session.subtitle || '',
                artwork: session.cover ? [{ src: session.cover }] : []
            });

            // Set up action handlers
            navigator.mediaSession.setActionHandler('play', () => {
                this.globalPlayer.play();
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                this.globalPlayer.pause();
            });

            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                this.enhancedPlayer.seekRelative(-(details.seekOffset || 10));
            });

            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                this.enhancedPlayer.seekRelative(details.seekOffset || 10);
            });
        });
    }

    setupOfflineSupport() {
        // Handle offline/online events
        window.addEventListener('offline', () => {
            this.playerState.set('network.isOnline', false);
            this.playerState.actions.showNotification({
                title: 'Offline Mode',
                message: 'You are now offline. Playing cached content only.',
                type: 'warning'
            });
        });

        window.addEventListener('online', () => {
            this.playerState.set('network.isOnline', true);
            this.playerState.actions.showNotification({
                title: 'Back Online',
                message: 'Internet connection restored.',
                type: 'success',
                timeout: 3000
            });
        });
    }

    enableFallbackMode() {
        console.log('EnhancedAudioIntegration: Running in fallback mode');
        this.isEnhancedMode = false;
        
        // Ensure basic functionality still works
        if (window.globalAudioPlayer) {
            this.globalPlayer = window.globalAudioPlayer;
        }
    }

    // Public API methods
    isEnhanced() {
        return this.isEnhancedMode;
    }

    getEnhancedPlayer() {
        return this.enhancedPlayer;
    }

    getPlayerState() {
        return this.playerState;
    }

    getAudioCache() {
        return this.audioCache;
    }

    getSessionStorage() {
        return this.sessionStorage;
    }

    // Cleanup
    destroy() {
        console.log('EnhancedAudioIntegration: Cleaning up...');
        
        this.stopSpectrumVisualization();
        
        if (this.enhancedPlayer) {
            this.enhancedPlayer.destroy();
        }
        
        if (this.playerState) {
            this.playerState.destroy();
        }
    }
}

// Auto-initialize integration
window.addEventListener('DOMContentLoaded', () => {
    if (!window.enhancedAudioIntegration) {
        window.enhancedAudioIntegration = new EnhancedAudioIntegration();
    }
});

// Export for manual initialization
window.EnhancedAudioIntegration = EnhancedAudioIntegration;

console.log('EnhancedAudioIntegration: Module loaded successfully');