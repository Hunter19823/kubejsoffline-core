// @ts-nocheck
/**
 * IndexedDB utilities for storing and retrieving optimized data.
 * This module provides an abstraction layer for storing large data structures
 * in IndexedDB to avoid memory duplication between worker and main thread.
 */

const DB_NAME_PREFIX = 'kubejs_offline_docs';
const DB_VERSION = 2;
const MAX_DATABASES = 3; // Maximum number of databases to keep
/** Stored in metadata; bump when relationship graph IndexedDB layout changes. */
const RELATIONSHIP_GRAPH_STORAGE_VERSION = 2;
const METADATA_RELATIONSHIP_GRAPH_SCHEMA = 'relationshipGraphSchemaVersion';
const DB_TRACKING_KEY = 'kubejs_offline_db_tracking'; // localStorage key for tracking database access

// Store names
const STORE_OPTIMIZED_DATA = 'optimizedData';
const STORE_LOOKUP_CACHE = 'lookupCache';
const STORE_RELATIONSHIP_GRAPH = 'relationshipGraph';
const STORE_METADATA = 'metadata';

// In-memory caches for frequently accessed data (LRU-like behavior)
const memoryCache = {
    optimizedData: new Map(),
    lookupCache: new Map(),
    relationshipGraph: new Map(),
    maxSize: 1000 // Maximum entries per cache
};

let dbPromise = null;
let currentDbName = null;

/**
 * Create a short hash from a version string for use in database names.
 * @param {string} version - The full version string
 * @returns {string} A short hash suitable for database names
 */
function createShortHash(version) {
    // Create a shorter hash from the version string
    let hash = 0;
    for (let i = 0; i < version.length; i++) {
        const char = version.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    // Convert to positive hex string (8 chars)
    return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Get the database name for a given data version.
 * @param {string} dataVersion - The data version hash
 * @returns {string} The database name
 */
function getDatabaseName(dataVersion) {
    if (!dataVersion) {
        // Fallback to default name if no version provided
        return DB_NAME_PREFIX;
    }
    const shortHash = createShortHash(dataVersion);
    return `${DB_NAME_PREFIX}_${shortHash}`;
}

/**
 * Initialize IndexedDB database and return a promise that resolves to the database.
 * @param {string} dataVersion - Optional data version to use for database name
 * @returns {Promise<IDBDatabase>}
 */
function initIndexedDB(dataVersion = null) {
    const dbName = getDatabaseName(dataVersion);
    
    // If we already have a promise for this database, return it
    if (dbPromise && currentDbName === dbName) {
        return dbPromise;
    }
    
    // Reset promise if database name changed
    if (currentDbName !== dbName) {
        dbPromise = null;
        currentDbName = dbName;
    }
    
    // Trigger cleanup of old databases (non-blocking)
    cleanupOldDatabases().catch(e => {
        console.debug('Database cleanup failed (non-critical):', e);
    });

    dbPromise = new Promise((resolve, reject) => {
        // Check for IndexedDB support in both worker and main thread contexts
        const idb = (typeof self !== 'undefined' && 'indexedDB' in self) ? self.indexedDB :
                    (typeof window !== 'undefined' && 'indexedDB' in window) ? window.indexedDB :
                    null;
        
        if (!idb) {
            reject(new Error('IndexedDB is not supported in this browser'));
            return;
        }

        const request = idb.open(dbName, DB_VERSION);

        request.onerror = () => {
            reject(new Error('Failed to open IndexedDB: ' + request.error));
        };

        request.onsuccess = () => {
            // Record database access time
            recordDatabaseAccess(dbName);
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create stores if they don't exist
            if (!db.objectStoreNames.contains(STORE_OPTIMIZED_DATA)) {
                db.createObjectStore(STORE_OPTIMIZED_DATA);
            }
            if (!db.objectStoreNames.contains(STORE_LOOKUP_CACHE)) {
                db.createObjectStore(STORE_LOOKUP_CACHE);
            }
            if (event.oldVersion < 2 && db.objectStoreNames.contains(STORE_RELATIONSHIP_GRAPH)) {
                db.deleteObjectStore(STORE_RELATIONSHIP_GRAPH);
            }
            if (!db.objectStoreNames.contains(STORE_RELATIONSHIP_GRAPH)) {
                db.createObjectStore(STORE_RELATIONSHIP_GRAPH);
            }
            if (!db.objectStoreNames.contains(STORE_METADATA)) {
                db.createObjectStore(STORE_METADATA);
            }
        };
    });

    return dbPromise;
}

/**
 * Get the database instance.
 * Uses the currently initialized database (from last initIndexedDB call).
 * @returns {Promise<IDBDatabase>}
 */
function getDB() {
    if (!dbPromise) {
        // If no database has been initialized, initialize with default (no version)
        // WARNING: This should not happen in normal operation. Database should be initialized
        // with initIndexedDB(dataVersion) before any database operations are performed.
        throw new Error("The DB couldn't be initialized, and was likely removed.");
    }
    return dbPromise;
}

/**
 * Write optimized data property to IndexedDB.
 * @param {string} key - The property key
 * @param {*} value - The property value
 * @returns {Promise<void>}
 */
async function writeOptimizedData(key, value) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_OPTIMIZED_DATA], 'readwrite');
        const store = transaction.objectStore(STORE_OPTIMIZED_DATA);
        const request = store.put(value, key);

        request.onsuccess = () => {
            // Update memory cache
            if (memoryCache.optimizedData.size >= memoryCache.maxSize) {
                const firstKey = memoryCache.optimizedData.keys().next().value;
                memoryCache.optimizedData.delete(firstKey);
            }
            memoryCache.optimizedData.set(key, value);
            resolve();
        };

        request.onerror = () => {
            reject(new Error('Failed to write optimized data: ' + request.error));
        };
    });
}

/**
 * Write multiple optimized data properties in a batch.
 * @param {Object} data - Object with key-value pairs to write
 * @param {Function} progressCallback - Optional callback for progress updates (current, total, stage)
 * @returns {Promise<void>}
 */
async function writeOptimizedDataBatch(data, progressCallback = null) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_OPTIMIZED_DATA], 'readwrite');
        const store = transaction.objectStore(STORE_OPTIMIZED_DATA);
        let completed = 0;
        const total = Object.keys(data).length;

        if (total === 0) {
            resolve();
            return;
        }

        for (const [key, value] of Object.entries(data)) {
            const request = store.put(value, key);
            request.onsuccess = () => {
                // Update memory cache
                if (memoryCache.optimizedData.size >= memoryCache.maxSize) {
                    const firstKey = memoryCache.optimizedData.keys().next().value;
                    memoryCache.optimizedData.delete(firstKey);
                }
                memoryCache.optimizedData.set(key, value);
                completed++;
                
                // Report progress (throttle to every 10 items or on completion)
                if (progressCallback && (completed % 10 === 0 || completed === total)) {
                    const progress = (completed / total) * 100;
                    progressCallback(completed, total, 'optimizedData', progress);
                }
                
                if (completed === total) {
                    resolve();
                }
            };
            request.onerror = () => {
                reject(new Error('Failed to write optimized data batch: ' + request.error));
            };
        }
    });
}

/**
 * Read optimized data property from IndexedDB.
 * @param {string} key - The property key
 * @returns {Promise<*>}
 */
async function readOptimizedData(key) {
    // Check memory cache first
    if (memoryCache.optimizedData.has(key)) {
        return memoryCache.optimizedData.get(key);
    }

    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_OPTIMIZED_DATA], 'readonly');
        const store = transaction.objectStore(STORE_OPTIMIZED_DATA);
        const request = store.get(key);

        request.onsuccess = () => {
            const value = request.result;
            // Update memory cache
            if (value !== undefined) {
                if (memoryCache.optimizedData.size >= memoryCache.maxSize) {
                    const firstKey = memoryCache.optimizedData.keys().next().value;
                    memoryCache.optimizedData.delete(firstKey);
                }
                memoryCache.optimizedData.set(key, value);
            }
            resolve(value);
        };

        request.onerror = () => {
            reject(new Error('Failed to read optimized data: ' + request.error));
        };
    });
}

/**
 * Write lookup cache entry to IndexedDB.
 * @param {string} key - The lookup key
 * @param {number} value - The type identifier
 * @returns {Promise<void>}
 */
async function writeLookupCacheEntry(key, value) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_LOOKUP_CACHE], 'readwrite');
        const store = transaction.objectStore(STORE_LOOKUP_CACHE);
        const request = store.put(value, key);

        request.onsuccess = () => {
            // Update memory cache
            if (memoryCache.lookupCache.size >= memoryCache.maxSize) {
                const firstKey = memoryCache.lookupCache.keys().next().value;
                memoryCache.lookupCache.delete(firstKey);
            }
            memoryCache.lookupCache.set(key, value);
            resolve();
        };

        request.onerror = () => {
            reject(new Error('Failed to write lookup cache entry: ' + request.error));
        };
    });
}

/**
 * Write multiple lookup cache entries in a batch.
 * @param {Map|Object} cache - Map or object with key-value pairs
 * @param {Function} progressCallback - Optional callback for progress updates (current, total, stage, progress)
 * @returns {Promise<void>}
 */
async function writeLookupCacheBatch(cache, progressCallback = null) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_LOOKUP_CACHE], 'readwrite');
        const store = transaction.objectStore(STORE_LOOKUP_CACHE);
        let entries = cache instanceof Map ? [...cache.entries()] : Object.entries(cache);
        let completed = 0;
        const total = entries.length;

        if (total === 0) {
            resolve();
            return;
        }

        for (const [key, value] of entries) {
            const request = store.put(value, key);
            request.onsuccess = () => {
                // Update memory cache
                if (memoryCache.lookupCache.size >= memoryCache.maxSize) {
                    const firstKey = memoryCache.lookupCache.keys().next().value;
                    memoryCache.lookupCache.delete(firstKey);
                }
                memoryCache.lookupCache.set(key, value);
                completed++;
                
                // Report progress (throttle to every 100 items or on completion)
                if (progressCallback && (completed % 100 === 0 || completed === total)) {
                    const progress = (completed / total) * 100;
                    progressCallback(completed, total, 'lookupCache', progress);
                }
                
                if (completed === total) {
                    resolve();
                }
            };
            request.onerror = () => {
                reject(new Error('Failed to write lookup cache batch: ' + request.error));
            };
        }
    });
}

/**
 * Read lookup cache entry from IndexedDB.
 * @param {string} key - The lookup key
 * @returns {Promise<number|undefined>}
 */
async function readLookupCacheEntry(key) {
    // Check memory cache first
    if (memoryCache.lookupCache.has(key)) {
        return memoryCache.lookupCache.get(key);
    }

    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_LOOKUP_CACHE], 'readonly');
        const store = transaction.objectStore(STORE_LOOKUP_CACHE);
        const request = store.get(key);

        request.onsuccess = () => {
            const value = request.result;
            // Update memory cache
            if (value !== undefined) {
                if (memoryCache.lookupCache.size >= memoryCache.maxSize) {
                    const firstKey = memoryCache.lookupCache.keys().next().value;
                    memoryCache.lookupCache.delete(firstKey);
                }
                memoryCache.lookupCache.set(key, value);
            }
            resolve(value);
        };

        request.onerror = () => {
            reject(new Error('Failed to read lookup cache entry: ' + request.error));
        };
    });
}

/**
 * Convert a persisted relationship-type record into an in-memory adjacency map.
 * @param {*} stored
 * @returns {Map<number, Set<number>>|null}
 */
function relationshipTypeRecordToMap(stored) {
    if (!stored) {
        return null;
    }
    if (stored.rows) {
        const map = new Map();
        for (let i = 0; i < stored.rows.length; i++) {
            const row = stored.rows[i];
            map.set(row[0], new Set(row[1]));
        }
        return map;
    }
    if (stored.from !== undefined && stored.toSet) {
        const map = new Map();
        map.set(stored.from, new Set(stored.toSet));
        return map;
    }
    return null;
}

/**
 * Write the relationship graph: one IndexedDB record per relationship type (not per source node).
 * @param {Map} relationshipGraph - The relationship graph Map
 * @param {Function} progressCallback - Optional callback for progress updates (current, total, stage, progress)
 * @returns {Promise<void>}
 */
async function writeRelationshipGraphBatch(relationshipGraph, progressCallback = null) {
    const db = await getDB();

    const typesToWrite = [];
    for (const [relationshipType, relationshipMap] of relationshipGraph.entries()) {
        if (relationshipMap.size === 0) {
            continue;
        }
        const rows = new Array(relationshipMap.size);
        let rowIndex = 0;
        for (const [from, toSet] of relationshipMap.entries()) {
            rows[rowIndex++] = [from, Array.from(toSet)];
        }
        typesToWrite.push({ relationshipType, rows });
    }

    const total = typesToWrite.length;
    if (total === 0) {
        return;
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_RELATIONSHIP_GRAPH, STORE_METADATA], 'readwrite');
        const store = transaction.objectStore(STORE_RELATIONSHIP_GRAPH);
        const metaStore = transaction.objectStore(STORE_METADATA);

        for (const entry of typesToWrite) {
            store.put(
                { relationshipType: entry.relationshipType, rows: entry.rows },
                entry.relationshipType
            );
        }
        metaStore.put(RELATIONSHIP_GRAPH_STORAGE_VERSION, METADATA_RELATIONSHIP_GRAPH_SCHEMA);

        transaction.oncomplete = () => {
            if (progressCallback) {
                progressCallback(total, total, 'relationshipGraph', 100);
            }
            resolve();
        };

        transaction.onerror = () => {
            reject(new Error(`Failed to write relationship graph: ${transaction.error}`));
        };
    });
}

/**
 * Read relationship graph entry from IndexedDB.
 * @param {string} relationshipType - The relationship type
 * @param {number} from - The source type identifier
 * @returns {Promise<Set<number>|undefined>}
 */
async function readRelationshipGraphEntry(relationshipType, from) {
    const cacheKey = `${relationshipType}:${from}`;
    // Check memory cache first
    if (memoryCache.relationshipGraph.has(cacheKey)) {
        return memoryCache.relationshipGraph.get(cacheKey);
    }

    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_RELATIONSHIP_GRAPH], 'readonly');
        const store = transaction.objectStore(STORE_RELATIONSHIP_GRAPH);
        const request = store.get(relationshipType);

        request.onsuccess = () => {
            const typeMap = relationshipTypeRecordToMap(request.result);
            const value = typeMap && typeMap.has(from) ? typeMap.get(from) : undefined;
            if (value !== undefined) {
                if (memoryCache.relationshipGraph.size >= memoryCache.maxSize) {
                    const firstKey = memoryCache.relationshipGraph.keys().next().value;
                    memoryCache.relationshipGraph.delete(firstKey);
                }
                memoryCache.relationshipGraph.set(cacheKey, value);
            }
            resolve(value);
        };

        request.onerror = () => {
            reject(new Error('Failed to read relationship graph entry: ' + request.error));
        };
    });
}

/**
 * Read all relationship graph entries for a specific relationship type.
 * @param {string} relationshipType - The relationship type
 * @returns {Promise<Map<number, Set<number>>>}
 */
async function readRelationshipGraphByType(relationshipType) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_RELATIONSHIP_GRAPH], 'readonly');
        const store = transaction.objectStore(STORE_RELATIONSHIP_GRAPH);
        const request = store.get(relationshipType);

        request.onsuccess = () => {
            const result = relationshipTypeRecordToMap(request.result);
            resolve(result ?? new Map());
        };

        request.onerror = () => {
            reject(new Error('Failed to read relationship graph by type: ' + request.error));
        };
    });
}

/**
 * Write metadata to IndexedDB.
 * @param {string} key - The metadata key
 * @param {*} value - The metadata value
 * @returns {Promise<void>}
 */
async function writeMetadata(key, value) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_METADATA], 'readwrite');
        const store = transaction.objectStore(STORE_METADATA);
        const request = store.put(value, key);

        request.onsuccess = () => resolve();
        request.onerror = () => {
            reject(new Error('Failed to write metadata: ' + request.error));
        };
    });
}

/**
 * Read metadata from IndexedDB.
 * @param {string} key - The metadata key
 * @returns {Promise<*>}
 */
async function readMetadata(key) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_METADATA], 'readonly');
        const store = transaction.objectStore(STORE_METADATA);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            reject(new Error('Failed to read metadata: ' + request.error));
        };
    });
}

/**
 * Check if optimization is complete.
 * Also verifies that data version matches (if version checking is available).
 * @param {Object} data - Optional DATA object for version validation
 * @returns {Promise<boolean>}
 */
async function checkOptimizationStatus(data = null) {
    try {
        const status = await readMetadata('optimizationComplete');
        if (status !== true) {
            return false;
        }

        const graphSchema = await readMetadata(METADATA_RELATIONSHIP_GRAPH_SCHEMA);
        if (graphSchema !== RELATIONSHIP_GRAPH_STORAGE_VERSION) {
            return false;
        }
        
        // If data is provided, also check version validity
        if (data && typeof isDataVersionValid === 'function') {
            const versionValid = await isDataVersionValid(data);
            if (!versionValid) {
                console.warn('Optimization status is complete but data version is invalid. Optimization will be re-run.');
                return false;
            }
        }
        
        return true;
    } catch (e) {
        console.error('Failed to check optimization status:', e);
        return false;
    }
}

/**
 * Simple hash function for creating version strings.
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Simple sampling function for sampling array indexes.
 * @param {Array} arr - Array to sample from
 * @param {number} sampleCount - Number of samples to take
 * @returns {Array} Sampled indexes
 */
function sampleIndexes(arr, sampleCount) {
    const samples = [];
    if (arr.length <= sampleCount) {
        return arr.map((_, idx) => arr[idx]);
    }
    // Always include first and last
    samples.push(0);
    samples.push(arr.length - 1);
    for (let i = 2; i < sampleCount; i++) {
        const index = Math.floor(i * (arr.length - 1) / (sampleCount - 1));
        if (!samples.includes(index)) {
            samples.push(index);
        }
    }
    if (samples[samples.length - 1] !== arr.length - 1) {
        samples.push(arr.length - 1);
    }
    return samples;
}

/**
 * Calculate a data version hash based on the DATA object structure.
 * This helps detect when data has changed between page generations.
 * 
 * Since the HTML file is regenerated on each Minecraft command run, the DATA object
 * can have non-deterministic indexes, class counts, and structure. This function
 * creates a fingerprint of the data that will change when significant changes occur,
 * allowing us to detect when IndexedDB contains stale/incompatible data.
 * 
 * IMPORTANT: This function only uses immutable properties that don't change at runtime.
 * It avoids JSON.stringify() and any properties that might be modified based on page views.
 * 
 * The version is based on:
 * - Counts of all major data arrays (types, parameters, methods, etc.)
 * - Hash of array element structure (keys/types) without content
 * - Overall hash for additional safety
 * 
 * @param {Object} data - The DATA object
 * @returns {string} A version hash string
 */
function calculateDataVersion(data) {
    // Create a hash based on key characteristics of the data
    // This should change when data structure changes significantly
    const versionParts = [
        data.types ? data.types.length : 0,
        data.parameters ? data.parameters.length : 0,
        data.methods ? data.methods.length : 0,
        data.constructors ? data.constructors.length : 0,
        data.fields ? data.fields.length : 0,
        data.packages ? data.packages.length : 0,
        data.names ? data.names.length : 0,
        data.annotations ? data.annotations.length : 0
    ];
    
    // Create a version string from the parts
    let versionString = versionParts.join('-');
    
    // Add a hash of array element structure (keys/types) without content
    // This detects structural changes without being affected by runtime modifications
    // Sample from beginning, middle, and end to catch various types of changes
    if (data.types && data.types.length > 0) {
        const sampleIndices = sampleIndexes(data.types, 25);
        
        const structureSamples = sampleIndices.map(idx => {
            const type = data.types[idx];
            if (!type || typeof type !== 'object') return '';
            
            // Only use the structure (keys) and primitive values, not objects/arrays
            // This avoids issues with runtime modifications
            try {
                const keys = Object.keys(type).sort().join(',');
                // Get a hash of just the keys and their types (not values)
                const keyTypes = Object.keys(type).map(key => {
                    const value = type[key];
                    // Only include primitive types, not object/array content
                    if (value === null) return key + ':null';
                    if (Array.isArray(value)) return key + value.join(',') + ':array';
                    if (typeof value === 'object') return key + ':object';
                    return key + ':' + typeof value;
                }).join('|');
                return keys + '|' + keyTypes;
            } catch (e) {
                // Fallback: just use the number of keys
                return Object.keys(type).length.toString();
            }
        }).join('||');
        
        const structureHash = simpleHash(structureSamples);
        versionString += '|' + structureHash;
    }
    
    // Add overall hash for additional safety
    const finalHash = simpleHash(versionString);
    return versionString + '|' + finalHash;
}

/**
 * Get the stored data version from IndexedDB.
 * @returns {Promise<string|null>}
 */
async function getStoredDataVersion() {
    try {
        return await readMetadata('dataVersion');
    } catch (e) {
        console.debug('Failed to read stored data version:', e);
        return null;
    }
}

/**
 * Store the current data version in IndexedDB.
 * @param {string} version - The version hash
 * @returns {Promise<void>}
 */
async function storeDataVersion(version) {
    try {
        await writeMetadata('dataVersion', version);
    } catch (e) {
        console.error('Failed to store data version:', e);
        throw e;
    }
}

/**
 * Check if the current data version matches the stored version.
 * NOTE: With version-based databases, this is less critical since each version
 * has its own database. This function is kept for compatibility.
 * @param {Object} data - The DATA object
 * @returns {Promise<boolean>}
 */
async function isDataVersionValid(data) {
    try {
        const currentVersion = calculateDataVersion(data);
        const storedVersion = await getStoredDataVersion();
        
        if (!storedVersion) {
            console.log('No stored data version found.');
            return false;
        }
        
        const isValid = currentVersion === storedVersion;
        if (!isValid) {
            console.log('Data version mismatch. Current:', currentVersion, 'Stored:', storedVersion);
        }
        return isValid;
    } catch (e) {
        console.error('Failed to validate data version:', e);
        return false;
    }
}

/**
 * Get the current database name being used.
 * @returns {string|null}
 */
function getCurrentDatabaseName() {
    return currentDbName;
}

/**
 * Clear all data from the current IndexedDB database (useful for debugging or reset).
 * Clears only the currently active database (version-specific).
 * @returns {Promise<void>}
 */
async function clearIndexedDB() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([
            STORE_OPTIMIZED_DATA,
            STORE_LOOKUP_CACHE,
            STORE_RELATIONSHIP_GRAPH,
            STORE_METADATA
        ], 'readwrite');

        let completed = 0;
        const stores = [
            STORE_OPTIMIZED_DATA,
            STORE_LOOKUP_CACHE,
            STORE_RELATIONSHIP_GRAPH,
            STORE_METADATA
        ];

        stores.forEach(storeName => {
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => {
                completed++;
                if (completed === stores.length) {
                    // Clear memory caches
                    memoryCache.optimizedData.clear();
                    memoryCache.lookupCache.clear();
                    memoryCache.relationshipGraph.clear();
                    resolve();
                }
            };
            request.onerror = () => {
                reject(new Error('Failed to clear store ' + storeName + ': ' + request.error));
            };
        });
    });
}

/**
 * Get the storage object (localStorage) for tracking database access.
 * Returns null if localStorage is not available (e.g., in some worker contexts).
 * @returns {Storage|null}
 */
function getStorage() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage;
        }
        if (typeof self !== 'undefined' && self.localStorage) {
            return self.localStorage;
        }
        return null;
    } catch (e) {
        // localStorage may be disabled or unavailable
        return null;
    }
}

/**
 * Record database access time for LRU tracking.
 * @param {string} dbName - The database name
 */
function recordDatabaseAccess(dbName) {
    const storage = getStorage();
    if (!storage) return;
    
    try {
        const tracking = JSON.parse(storage.getItem(DB_TRACKING_KEY) || '{}');
        tracking[dbName] = Date.now();
        storage.setItem(DB_TRACKING_KEY, JSON.stringify(tracking));
    } catch (e) {
        console.debug('Failed to record database access:', e);
    }
}

/**
 * Get database access times from storage.
 * @returns {Object<string, number>} Object mapping database names to access timestamps
 */
function getDatabaseAccessTimes() {
    const storage = getStorage();
    if (!storage) return {};
    
    try {
        return JSON.parse(storage.getItem(DB_TRACKING_KEY) || '{}');
    } catch (e) {
        console.debug('Failed to get database access times:', e);
        return {};
    }
}

/**
 * Remove database from tracking.
 * @param {string} dbName - The database name
 */
function removeDatabaseTracking(dbName) {
    const storage = getStorage();
    if (!storage) return;
    
    try {
        const tracking = JSON.parse(storage.getItem(DB_TRACKING_KEY) || '{}');
        delete tracking[dbName];
        storage.setItem(DB_TRACKING_KEY, JSON.stringify(tracking));
    } catch (e) {
        console.debug('Failed to remove database tracking:', e);
    }
}

/**
 * List all version-specific databases that exist.
 * Uses indexedDB.databases() if available, otherwise falls back to tracking.
 * @returns {Promise<string[]>} Array of database names
 */
async function listAllVersionDatabases() {
    const idb = (typeof self !== 'undefined' && 'indexedDB' in self) ? self.indexedDB :
                (typeof window !== 'undefined' && 'indexedDB' in window) ? window.indexedDB :
                null;
    
    if (!idb) {
        return [];
    }
    
    // Try to use indexedDB.databases() if available (modern browsers)
    if (typeof idb.databases === 'function') {
        try {
            const databases = await idb.databases();
            // Filter to only include our databases
            return databases
                .map(db => db.name)
                .filter(name => name.startsWith(DB_NAME_PREFIX));
        } catch (e) {
            console.debug('indexedDB.databases() not available, falling back to tracking:', e);
        }
    }
    
    // Fallback: use tracking data
    const tracking = getDatabaseAccessTimes();
    return Object.keys(tracking).filter(name => name.startsWith(DB_NAME_PREFIX));
}

/**
 * Delete an IndexedDB database.
 * @param {string} dbName - The database name to delete
 * @returns {Promise<void>}
 */
async function deleteDatabase(dbName) {
    const idb = (typeof self !== 'undefined' && 'indexedDB' in self) ? self.indexedDB :
                (typeof window !== 'undefined' && 'indexedDB' in window) ? window.indexedDB :
                null;
    
    if (!idb) {
        throw new Error('IndexedDB is not supported');
    }
    
    return new Promise((resolve, reject) => {
        const request = idb.deleteDatabase(dbName);
        
        request.onsuccess = () => {
            // Remove from tracking
            removeDatabaseTracking(dbName);
            // If this was the current database, reset state
            if (dbName === currentDbName) {
                dbPromise = null;
                currentDbName = null;
            }
            resolve();
        };
        
        request.onerror = () => {
            reject(new Error('Failed to delete database: ' + request.error));
        };
        
        request.onblocked = () => {
            // Database is in use, but we'll still try to delete it
            console.warn('Database deletion blocked, but continuing:', dbName);
        };
    });
}

/**
 * Clean up old databases, keeping only the most recently used ones.
 * If there are more than MAX_DATABASES, removes the least recently used ones.
 * @param {number} maxDatabases - Maximum number of databases to keep (defaults to MAX_DATABASES)
 * @returns {Promise<number>} Number of databases deleted
 */
async function cleanupOldDatabases(maxDatabases = MAX_DATABASES) {
    try {
        const allDatabases = await listAllVersionDatabases();
        
        if (allDatabases.length <= maxDatabases) {
            return 0; // No cleanup needed
        }
        
        const accessTimes = getDatabaseAccessTimes();
        
        // Sort databases by access time (most recent first)
        const sortedDatabases = allDatabases
            .map(dbName => ({
                name: dbName,
                accessTime: accessTimes[dbName] || 0
            }))
            .sort((a, b) => b.accessTime - a.accessTime);
        
        // Keep the most recently used databases
        const databasesToKeep = sortedDatabases.slice(0, maxDatabases);
        const databasesToDelete = sortedDatabases.slice(maxDatabases);
        
        // Don't delete the current database even if it's old
        const currentDb = getCurrentDatabaseName();
        const filteredToDelete = databasesToDelete.filter(db => db.name !== currentDb);
        
        if (filteredToDelete.length === 0) {
            return 0;
        }
        
        // Delete old databases
        let deletedCount = 0;
        const deletePromises = filteredToDelete.map(async (db) => {
            try {
                await deleteDatabase(db.name);
                deletedCount++;
                console.log('Deleted old database:', db.name);
            } catch (e) {
                console.warn('Failed to delete database:', db.name, e);
            }
        });
        
        await Promise.all(deletePromises);
        
        if (deletedCount > 0) {
            console.log(`Cleaned up ${deletedCount} old database(s), keeping ${databasesToKeep.length} most recent`);
        }
        
        return deletedCount;
    } catch (e) {
        console.error('Failed to cleanup old databases:', e);
        return 0;
    }
}