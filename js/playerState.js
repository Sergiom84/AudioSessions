// PlayerState.js - Reactive State Management System
// Manages application state with reactivity and synchronization

class PlayerState {
    constructor(options = {}) {
        this.options = {
            enablePersistence: options.enablePersistence !== false,
            persistenceKey: options.persistenceKey || 'audioSessionsState',
            enableSync: options.enableSync !== false,
            syncInterval: options.syncInterval || 5000,
            enableDebug: options.enableDebug || false,
            ...options
        };

        // State storage
        this.state = {
            // Player state
            player: {
                isPlaying: false,
                currentSession: null,
                currentTrack: null,
                currentTime: 0,
                duration: 0,
                volume: 1.0,
                isLoading: false,
                error: null,
                playbackRate: 1.0,
                shuffle: false,
                repeat: 'none' // 'none', 'one', 'all'
            },
            
            // Session state
            sessions: {
                available: new Map(),
                loaded: new Map(),
                downloading: new Set(),
                favorites: new Set(),
                recent: []
            },
            
            // UI state
            ui: {
                theme: 'dark',
                showSpectrum: true,
                showEqualizer: false,
                showPlaylist: false,
                sidebarOpen: false,
                notifications: [],
                isFullscreen: false
            },
            
            // User state
            user: {
                preferences: {},
                history: [],
                analytics: {
                    totalPlaytime: 0,
                    sessionsPlayed: 0,
                    favoriteGenre: null
                }
            },
            
            // Network state
            network: {
                isOnline: navigator.onLine,
                connectionType: this.getConnectionType(),
                bandwidth: null,
                latency: null
            },
            
            // Cache state
            cache: {
                size: 0,
                hitRate: 0,
                entries: 0,
                isOptimizing: false
            }
        };

        // Reactive system
        this.observers = new Map(); // path -> Set of callbacks
        this.computedCache = new Map();
        this.mutations = [];
        this.syncTimer = null;

        // Event system
        this.eventListeners = {
            stateChange: [],
            mutation: [],
            sync: [],
            error: []
        };

        this.init();
    }

    async init() {
        console.log('PlayerState: Initializing reactive state management...');
        
        try {
            // Load persisted state
            if (this.options.enablePersistence) {
                await this.loadPersistedState();
            }

            // Setup network monitoring
            this.setupNetworkMonitoring();

            // Setup sync
            if (this.options.enableSync) {
                this.startSync();
            }

            // Setup computed values
            this.setupComputedValues();

            console.log('PlayerState: Initialization complete');
        } catch (error) {
            console.error('PlayerState: Initialization failed:', error);
            this.emit('error', { error, phase: 'initialization' });
        }
    }

    // Get state value by path
    get(path) {
        return this.getByPath(this.state, path);
    }

    // Set state value by path
    set(path, value, options = {}) {
        const oldValue = this.get(path);
        
        // Create mutation record
        const mutation = {
            type: 'set',
            path,
            oldValue,
            newValue: value,
            timestamp: Date.now(),
            source: options.source || 'manual'
        };

        // Apply mutation
        this.setByPath(this.state, path, value);
        
        // Record mutation
        this.mutations.push(mutation);
        if (this.mutations.length > 1000) {
            this.mutations = this.mutations.slice(-500); // Keep last 500
        }

        // Trigger reactivity
        this.triggerObservers(path, value, oldValue);
        
        // Emit events
        this.emit('mutation', mutation);
        this.emit('stateChange', { path, value, oldValue });

        // Persist if enabled
        if (this.options.enablePersistence && !options.skipPersistence) {
            this.debouncedPersist();
        }

        if (this.options.enableDebug) {
            console.log('PlayerState: State updated:', path, { oldValue, newValue: value });
        }
    }

    // Update multiple state values atomically
    update(updates, options = {}) {
        const mutations = [];
        
        // Batch mutations
        Object.keys(updates).forEach(path => {
            const oldValue = this.get(path);
            const newValue = updates[path];
            
            mutations.push({
                type: 'update',
                path,
                oldValue,
                newValue,
                timestamp: Date.now(),
                source: options.source || 'batch'
            });
            
            this.setByPath(this.state, path, newValue);
        });

        // Record mutations
        this.mutations.push(...mutations);
        
        // Trigger all observers
        mutations.forEach(mutation => {
            this.triggerObservers(mutation.path, mutation.newValue, mutation.oldValue);
        });

        // Emit events
        mutations.forEach(mutation => {
            this.emit('mutation', mutation);
            this.emit('stateChange', { 
                path: mutation.path, 
                value: mutation.newValue, 
                oldValue: mutation.oldValue 
            });
        });

        // Persist
        if (this.options.enablePersistence && !options.skipPersistence) {
            this.debouncedPersist();
        }
    }

    // Watch state changes
    watch(path, callback, options = {}) {
        if (!this.observers.has(path)) {
            this.observers.set(path, new Set());
        }
        
        const observer = {
            callback,
            immediate: options.immediate || false,
            deep: options.deep || false,
            once: options.once || false
        };

        this.observers.get(path).add(observer);

        // Trigger immediately if requested
        if (observer.immediate) {
            callback(this.get(path), undefined, path);
        }

        // Return unwatch function
        return () => {
            const observers = this.observers.get(path);
            if (observers) {
                observers.delete(observer);
                if (observers.size === 0) {
                    this.observers.delete(path);
                }
            }
        };
    }

    // Computed values
    computed(name, computeFn, dependencies = []) {
        const computedValue = {
            fn: computeFn,
            dependencies,
            value: null,
            isValid: false
        };

        this.computedCache.set(name, computedValue);

        // Watch dependencies
        dependencies.forEach(dep => {
            this.watch(dep, () => {
                computedValue.isValid = false;
            });
        });

        // Return getter function
        return () => {
            if (!computedValue.isValid) {
                computedValue.value = computeFn();
                computedValue.isValid = true;
            }
            return computedValue.value;
        };
    }

    // Actions for complex state changes
    actions = {
        // Player actions
        playSession: async (sessionData) => {
            this.update({
                'player.isLoading': true,
                'player.error': null,
                'player.currentSession': sessionData
            });

            try {
                // Load session logic would go here
                this.update({
                    'player.isPlaying': true,
                    'player.isLoading': false
                });

                // Add to recent
                this.addToRecent(sessionData);
                
                // Track analytics
                await this.trackEvent('session_started', {
                    sessionId: sessionData.id,
                    title: sessionData.title
                });

            } catch (error) {
                this.set('player.error', error);
                this.set('player.isLoading', false);
            }
        },

        pausePlayer: () => {
            this.set('player.isPlaying', false);
        },

        resumePlayer: () => {
            this.set('player.isPlaying', true);
        },

        stopPlayer: () => {
            this.update({
                'player.isPlaying': false,
                'player.currentTime': 0
            });
        },

        setVolume: (volume) => {
            this.set('player.volume', Math.max(0, Math.min(1, volume)));
        },

        seekTo: (time) => {
            this.set('player.currentTime', time);
        },

        // Session management
        addSession: (sessionData) => {
            const sessions = this.get('sessions.available');
            sessions.set(sessionData.id, sessionData);
            this.set('sessions.available', sessions);
        },

        removeSession: (sessionId) => {
            const sessions = this.get('sessions.available');
            sessions.delete(sessionId);
            this.set('sessions.available', sessions);
        },

        toggleFavorite: (sessionId) => {
            const favorites = new Set(this.get('sessions.favorites'));
            if (favorites.has(sessionId)) {
                favorites.delete(sessionId);
            } else {
                favorites.add(sessionId);
            }
            this.set('sessions.favorites', favorites);
        },

        // UI actions
        toggleTheme: () => {
            const currentTheme = this.get('ui.theme');
            this.set('ui.theme', currentTheme === 'dark' ? 'light' : 'dark');
        },

        showNotification: (notification) => {
            const notifications = [...this.get('ui.notifications')];
            const notificationWithId = {
                ...notification,
                id: this.generateId(),
                timestamp: Date.now()
            };
            notifications.push(notificationWithId);
            this.set('ui.notifications', notifications);

            // Auto-remove after timeout
            if (notification.timeout !== false) {
                setTimeout(() => {
                    this.actions.removeNotification(notificationWithId.id);
                }, notification.timeout || 5000);
            }
        },

        removeNotification: (notificationId) => {
            const notifications = this.get('ui.notifications')
                .filter(n => n.id !== notificationId);
            this.set('ui.notifications', notifications);
        },

        // Preference actions
        setPreference: async (key, value) => {
            const preferences = { ...this.get('user.preferences') };
            preferences[key] = value;
            this.set('user.preferences', preferences);

            // Persist to IndexedDB
            if (window.sessionStorageDB) {
                await window.sessionStorageDB.setPreference(key, value);
            }
        }
    };

    // Helper methods
    getByPath(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    setByPath(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    triggerObservers(path, newValue, oldValue) {
        // Trigger exact path observers
        const exactObservers = this.observers.get(path);
        if (exactObservers) {
            exactObservers.forEach(observer => {
                try {
                    observer.callback(newValue, oldValue, path);
                    
                    // Remove if once
                    if (observer.once) {
                        exactObservers.delete(observer);
                    }
                } catch (error) {
                    console.error('PlayerState: Observer error:', error);
                }
            });
        }

        // Trigger parent path observers if deep watching
        this.observers.forEach((observers, observerPath) => {
            if (path !== observerPath && (path.startsWith(observerPath + '.') || observerPath === '*')) {
                observers.forEach(observer => {
                    if (observer.deep) {
                        try {
                            observer.callback(this.get(observerPath), undefined, observerPath);
                        } catch (error) {
                            console.error('PlayerState: Deep observer error:', error);
                        }
                    }
                });
            }
        });
    }

    // Persistence
    async loadPersistedState() {
        try {
            const persistedData = localStorage.getItem(this.options.persistenceKey);
            if (persistedData) {
                const parsed = JSON.parse(persistedData);
                
                // Merge with current state, preserving Maps and Sets
                this.mergeState(this.state, parsed);
                
                console.log('PlayerState: Loaded persisted state');
            }
        } catch (error) {
            console.warn('PlayerState: Failed to load persisted state:', error);
        }
    }

    persistState() {
        try {
            // Convert Maps and Sets to serializable format
            const serializable = this.serializeState(this.state);
            localStorage.setItem(this.options.persistenceKey, JSON.stringify(serializable));
        } catch (error) {
            console.warn('PlayerState: Failed to persist state:', error);
        }
    }

    debouncedPersist = this.debounce(() => {
        this.persistState();
    }, 1000);

    // State serialization
    serializeState(state) {
        return JSON.parse(JSON.stringify(state, (key, value) => {
            if (value instanceof Map) {
                return { __type: 'Map', data: Array.from(value.entries()) };
            }
            if (value instanceof Set) {
                return { __type: 'Set', data: Array.from(value) };
            }
            return value;
        }));
    }

    deserializeState(state) {
        return JSON.parse(JSON.stringify(state), (key, value) => {
            if (value && value.__type === 'Map') {
                return new Map(value.data);
            }
            if (value && value.__type === 'Set') {
                return new Set(value.data);
            }
            return value;
        });
    }

    mergeState(target, source) {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.mergeState(target[key], source[key]);
            } else {
                target[key] = this.deserializeState(source[key]);
            }
        });
    }

    // Network monitoring
    setupNetworkMonitoring() {
        const updateNetworkState = () => {
            this.update({
                'network.isOnline': navigator.onLine,
                'network.connectionType': this.getConnectionType()
            });
        };

        window.addEventListener('online', updateNetworkState);
        window.addEventListener('offline', updateNetworkState);

        // Monitor connection changes
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', updateNetworkState);
        }
    }

    getConnectionType() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType || 'unknown';
        }
        return 'unknown';
    }

    // Sync functionality
    startSync() {
        this.syncTimer = setInterval(() => {
            this.syncState();
        }, this.options.syncInterval);
    }

    stopSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }

    async syncState() {
        if (!this.get('network.isOnline')) return;

        try {
            // Sync with server/IndexedDB
            if (window.sessionStorageDB) {
                const stats = await window.sessionStorageDB.getStorageStats();
                this.set('cache.entries', stats.totalRecords);
            }

            this.emit('sync', { timestamp: Date.now() });
        } catch (error) {
            console.warn('PlayerState: Sync failed:', error);
        }
    }

    // Computed values setup
    setupComputedValues() {
        // Current session info
        this.computed('currentSessionInfo', () => {
            const session = this.get('player.currentSession');
            const isPlaying = this.get('player.isPlaying');
            const currentTime = this.get('player.currentTime');
            
            return session ? {
                title: session.title,
                progress: session.duration ? (currentTime / session.duration) * 100 : 0,
                isPlaying
            } : null;
        }, ['player.currentSession', 'player.isPlaying', 'player.currentTime']);

        // Favorite sessions count
        this.computed('favoritesCount', () => {
            return this.get('sessions.favorites').size;
        }, ['sessions.favorites']);

        // Can play (has session and not loading)
        this.computed('canPlay', () => {
            return !!(this.get('player.currentSession') && !this.get('player.isLoading'));
        }, ['player.currentSession', 'player.isLoading']);
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
                    console.error('PlayerState: Event listener error:', error);
                }
            });
        }
    }

    // Utility functions
    addToRecent(sessionData) {
        const recent = [...this.get('sessions.recent')];
        const existingIndex = recent.findIndex(s => s.id === sessionData.id);
        
        if (existingIndex > -1) {
            recent.splice(existingIndex, 1);
        }
        
        recent.unshift(sessionData);
        recent.splice(10); // Keep only last 10
        
        this.set('sessions.recent', recent);
    }

    async trackEvent(eventName, data = {}) {
        if (window.sessionStorageDB) {
            await window.sessionStorageDB.trackEvent(
                data.sessionId || 'unknown',
                eventName,
                data
            );
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Debug helpers
    getStateSnapshot() {
        return this.serializeState(this.state);
    }

    getMutationHistory(limit = 50) {
        return this.mutations.slice(-limit);
    }

    // Cleanup
    destroy() {
        console.log('PlayerState: Cleaning up...');
        
        this.stopSync();
        
        // Clear observers
        this.observers.clear();
        this.computedCache.clear();
        
        // Final persistence
        if (this.options.enablePersistence) {
            this.persistState();
        }
    }
}

// Export for use in other modules
window.PlayerState = PlayerState;

// Auto-initialize if needed
if (typeof window !== 'undefined' && !window.playerState) {
    window.playerState = new PlayerState();
}

console.log('PlayerState: Module loaded successfully');