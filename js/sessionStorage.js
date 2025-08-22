// SessionStorage.js - IndexedDB-based storage for sessions and metadata
// Handles persistent storage of user preferences, playback history, and session data

class SessionStorage {
    constructor(options = {}) {
        this.options = {
            dbName: options.dbName || 'AudioSessionsDB',
            dbVersion: options.dbVersion || 1,
            maxHistoryEntries: options.maxHistoryEntries || 1000,
            maxOfflineSessions: options.maxOfflineSessions || 50,
            enableOfflineSync: options.enableOfflineSync !== false,
            ...options
        };

        this.db = null;
        this.isInitialized = false;
        this.pendingOperations = [];

        // Storage schema
        this.schema = {
            sessions: {
                keyPath: 'id',
                indexes: {
                    title: 'title',
                    genre: 'genre',
                    lastPlayed: 'lastPlayed',
                    playCount: 'playCount'
                }
            },
            playHistory: {
                keyPath: 'id',
                indexes: {
                    sessionId: 'sessionId',
                    timestamp: 'timestamp',
                    userId: 'userId'
                }
            },
            userPreferences: {
                keyPath: 'key'
            },
            offlineData: {
                keyPath: 'id',
                indexes: {
                    type: 'type',
                    timestamp: 'timestamp'
                }
            },
            analytics: {
                keyPath: 'id',
                indexes: {
                    sessionId: 'sessionId',
                    event: 'event',
                    timestamp: 'timestamp'
                }
            }
        };

        this.init();
    }

    async init() {
        console.log('SessionStorage: Initializing IndexedDB...');
        
        try {
            await this.openDatabase();
            this.processPendingOperations();
            this.isInitialized = true;
            console.log('SessionStorage: Initialization complete');
        } catch (error) {
            console.error('SessionStorage: Initialization failed:', error);
            throw error;
        }
    }

    // Open IndexedDB database
    openDatabase() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error('IndexedDB not supported'));
                return;
            }

            const request = indexedDB.open(this.options.dbName, this.options.dbVersion);

            request.onerror = () => {
                reject(new Error('Failed to open database: ' + request.error));
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('SessionStorage: Database opened successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                console.log('SessionStorage: Database upgrade needed');
                this.upgradeDatabase(event.target.result);
            };
        });
    }

    // Create/upgrade database schema
    upgradeDatabase(db) {
        console.log('SessionStorage: Upgrading database schema...');

        // Create object stores
        Object.keys(this.schema).forEach(storeName => {
            const storeConfig = this.schema[storeName];
            
            // Drop existing store if it exists
            if (db.objectStoreNames.contains(storeName)) {
                db.deleteObjectStore(storeName);
            }

            // Create new store
            const store = db.createObjectStore(storeName, {
                keyPath: storeConfig.keyPath,
                autoIncrement: !storeConfig.keyPath || storeConfig.keyPath === 'id'
            });

            // Create indexes
            if (storeConfig.indexes) {
                Object.keys(storeConfig.indexes).forEach(indexName => {
                    const indexKey = storeConfig.indexes[indexName];
                    store.createIndex(indexName, indexKey, { unique: false });
                });
            }

            console.log(`SessionStorage: Created store '${storeName}'`);
        });
    }

    // Generic database operation wrapper
    async performOperation(storeName, operation, mode = 'readonly') {
        if (!this.isInitialized) {
            return new Promise((resolve, reject) => {
                this.pendingOperations.push({ storeName, operation, mode, resolve, reject });
            });
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], mode);
                const store = transaction.objectStore(storeName);
                
                const request = operation(store);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                
                transaction.onerror = () => reject(transaction.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Process pending operations
    processPendingOperations() {
        const operations = [...this.pendingOperations];
        this.pendingOperations = [];

        operations.forEach(({ storeName, operation, mode, resolve, reject }) => {
            this.performOperation(storeName, operation, mode)
                .then(resolve)
                .catch(reject);
        });
    }

    // Session management
    async saveSession(sessionData) {
        const session = {
            ...sessionData,
            id: sessionData.id || this.generateId(),
            lastUpdated: Date.now(),
            version: 1
        };

        return this.performOperation('sessions', store => {
            return store.put(session);
        }, 'readwrite');
    }

    async getSession(sessionId) {
        return this.performOperation('sessions', store => {
            return store.get(sessionId);
        });
    }

    async getAllSessions() {
        return this.performOperation('sessions', store => {
            return store.getAll();
        });
    }

    async deleteSession(sessionId) {
        return this.performOperation('sessions', store => {
            return store.delete(sessionId);
        }, 'readwrite');
    }

    async searchSessions(query) {
        const sessions = await this.getAllSessions();
        const searchTerm = query.toLowerCase();
        
        return sessions.filter(session => 
            session.title?.toLowerCase().includes(searchTerm) ||
            session.genre?.toLowerCase().includes(searchTerm) ||
            session.artist?.toLowerCase().includes(searchTerm)
        );
    }

    // Play history management
    async recordPlayback(sessionId, playbackData = {}) {
        const historyEntry = {
            id: this.generateId(),
            sessionId,
            timestamp: Date.now(),
            duration: playbackData.duration || 0,
            completed: playbackData.completed || false,
            position: playbackData.position || 0,
            userId: playbackData.userId || 'anonymous',
            deviceType: this.getDeviceType(),
            ...playbackData
        };

        // Add to history
        await this.performOperation('playHistory', store => {
            return store.put(historyEntry);
        }, 'readwrite');

        // Update session play count
        await this.incrementPlayCount(sessionId);

        // Cleanup old history entries
        await this.cleanupPlayHistory();

        return historyEntry;
    }

    async getPlayHistory(limit = 50) {
        return this.performOperation('playHistory', store => {
            const index = store.index('timestamp');
            return index.getAll(IDBKeyRange.lowerBound(0), limit);
        });
    }

    async getSessionPlayHistory(sessionId, limit = 20) {
        return this.performOperation('playHistory', store => {
            const index = store.index('sessionId');
            return index.getAll(sessionId, limit);
        });
    }

    async incrementPlayCount(sessionId) {
        const session = await this.getSession(sessionId);
        if (session) {
            session.playCount = (session.playCount || 0) + 1;
            session.lastPlayed = Date.now();
            await this.saveSession(session);
        }
    }

    async cleanupPlayHistory() {
        const allHistory = await this.getPlayHistory(this.options.maxHistoryEntries + 100);
        
        if (allHistory.length > this.options.maxHistoryEntries) {
            // Sort by timestamp (oldest first)
            allHistory.sort((a, b) => a.timestamp - b.timestamp);
            
            // Delete oldest entries
            const toDelete = allHistory.slice(0, allHistory.length - this.options.maxHistoryEntries);
            
            await this.performOperation('playHistory', store => {
                toDelete.forEach(entry => store.delete(entry.id));
                return { success: true };
            }, 'readwrite');
            
            console.log(`SessionStorage: Cleaned up ${toDelete.length} old history entries`);
        }
    }

    // User preferences management
    async setPreference(key, value) {
        const preference = {
            key,
            value,
            timestamp: Date.now()
        };

        return this.performOperation('userPreferences', store => {
            return store.put(preference);
        }, 'readwrite');
    }

    async getPreference(key, defaultValue = null) {
        try {
            const result = await this.performOperation('userPreferences', store => {
                return store.get(key);
            });
            return result ? result.value : defaultValue;
        } catch (error) {
            console.warn('SessionStorage: Failed to get preference:', key, error);
            return defaultValue;
        }
    }

    async getAllPreferences() {
        const prefs = await this.performOperation('userPreferences', store => {
            return store.getAll();
        });
        
        const prefsObject = {};
        prefs.forEach(pref => {
            prefsObject[pref.key] = pref.value;
        });
        
        return prefsObject;
    }

    async deletePreference(key) {
        return this.performOperation('userPreferences', store => {
            return store.delete(key);
        }, 'readwrite');
    }

    // Offline data management
    async saveOfflineData(type, data) {
        const offlineEntry = {
            id: this.generateId(),
            type,
            data,
            timestamp: Date.now(),
            synced: false
        };

        return this.performOperation('offlineData', store => {
            return store.put(offlineEntry);
        }, 'readwrite');
    }

    async getOfflineData(type) {
        return this.performOperation('offlineData', store => {
            const index = store.index('type');
            return index.getAll(type);
        });
    }

    async getUnsyncedData() {
        const allData = await this.performOperation('offlineData', store => {
            return store.getAll();
        });
        
        return allData.filter(item => !item.synced);
    }

    async markAsSynced(dataId) {
        const data = await this.performOperation('offlineData', store => {
            return store.get(dataId);
        });
        
        if (data) {
            data.synced = true;
            data.syncedAt = Date.now();
            
            await this.performOperation('offlineData', store => {
                return store.put(data);
            }, 'readwrite');
        }
    }

    // Analytics and event tracking
    async trackEvent(sessionId, event, data = {}) {
        const analyticsEntry = {
            id: this.generateId(),
            sessionId,
            event,
            data,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            deviceType: this.getDeviceType()
        };

        return this.performOperation('analytics', store => {
            return store.put(analyticsEntry);
        }, 'readwrite');
    }

    async getAnalytics(sessionId, eventType) {
        return this.performOperation('analytics', store => {
            const index = store.index('sessionId');
            return index.getAll(sessionId);
        }).then(results => {
            if (eventType) {
                return results.filter(item => item.event === eventType);
            }
            return results;
        });
    }

    // Backup and export functions
    async exportAllData() {
        const data = {};
        
        for (const storeName of Object.keys(this.schema)) {
            data[storeName] = await this.performOperation(storeName, store => {
                return store.getAll();
            });
        }
        
        return {
            version: this.options.dbVersion,
            timestamp: Date.now(),
            data
        };
    }

    async importData(importData) {
        if (!importData.data) {
            throw new Error('Invalid import data format');
        }

        let imported = 0;
        
        for (const [storeName, records] of Object.entries(importData.data)) {
            if (this.schema[storeName]) {
                for (const record of records) {
                    await this.performOperation(storeName, store => {
                        return store.put(record);
                    }, 'readwrite');
                    imported++;
                }
            }
        }
        
        console.log(`SessionStorage: Imported ${imported} records`);
        return imported;
    }

    async clearAllData() {
        const promises = Object.keys(this.schema).map(storeName => {
            return this.performOperation(storeName, store => {
                return store.clear();
            }, 'readwrite');
        });
        
        await Promise.all(promises);
        console.log('SessionStorage: All data cleared');
    }

    // Storage statistics
    async getStorageStats() {
        const stats = {
            totalRecords: 0,
            storeStats: {}
        };

        for (const storeName of Object.keys(this.schema)) {
            const records = await this.performOperation(storeName, store => {
                return store.count();
            });
            
            stats.storeStats[storeName] = records;
            stats.totalRecords += records;
        }

        // Estimate storage size
        if ('navigator' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                stats.usedBytes = estimate.usage;
                stats.availableBytes = estimate.quota;
                stats.usagePercent = (estimate.usage / estimate.quota) * 100;
            } catch (error) {
                console.warn('SessionStorage: Could not estimate storage:', error);
            }
        }

        return stats;
    }

    // Utility functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    getDeviceType() {
        const userAgent = navigator.userAgent;
        if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
            return 'tablet';
        }
        if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
            return 'mobile';
        }
        return 'desktop';
    }

    // Cleanup and maintenance
    async performMaintenance() {
        console.log('SessionStorage: Performing maintenance...');
        
        await this.cleanupPlayHistory();
        
        // Cleanup old analytics data (older than 30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const oldAnalytics = await this.performOperation('analytics', store => {
            const index = store.index('timestamp');
            return index.getAll(IDBKeyRange.upperBound(thirtyDaysAgo));
        });

        if (oldAnalytics.length > 0) {
            await this.performOperation('analytics', store => {
                oldAnalytics.forEach(item => store.delete(item.id));
                return { deleted: oldAnalytics.length };
            }, 'readwrite');
            console.log(`SessionStorage: Cleaned up ${oldAnalytics.length} old analytics entries`);
        }

        const stats = await this.getStorageStats();
        console.log('SessionStorage: Maintenance complete. Stats:', stats);
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            console.log('SessionStorage: Database connection closed');
        }
    }
}

// Export for use in other modules
window.SessionStorage = SessionStorage;

// Auto-initialize if needed
if (typeof window !== 'undefined' && !window.sessionStorage) {
    window.sessionStorageDB = new SessionStorage();
}

console.log('SessionStorage: Module loaded successfully');