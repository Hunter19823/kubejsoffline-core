// @ts-nocheck
function removeRecursive(obj, keysToRemove = new Set()) {
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            removeRecursive(obj[i], keysToRemove);
        }
    }
    if (obj && typeof obj === 'object') {
        for (const key in obj) {
            if (keysToRemove.has(key)) {
                delete obj[key];
            } else {
                removeRecursive(obj[key], keysToRemove);
            }
        }
    }
}
function removeCachedValuesForSerialization() {
    removeRecursive(DATA, new Set([
        '_parameter_cache',
        '_annotation_cache',
        '_name_cache',
        '_field_cache',
        '_shallow_field_cache',
        '_shallow_method_cache',
        '_method_cache',
        '_constructor_cache'
    ]));
}

/**
 * Write optimized data to IndexedDB in batches.
 * @param {string} dataVersion - The data version for database selection
 * @returns {Promise<void>}
 */
async function writeOptimizedDataToIndexedDB(dataVersion) {
    try {
        // Initialize IndexedDB with the data version to use version-specific database
        await initIndexedDB(dataVersion);
        console.info(`IndexedDB initialized in worker with database: ${getCurrentDatabaseName()}`);

        // Extract optimized properties from DATA
        const optimizedProperties = {};
        for (const key in DATA) {
            if (key.startsWith('_')) {
                optimizedProperties[key] = DATA[key];
            }
        }

        // Calculate total items to write for progress tracking
        const optimizedPropsCount = Object.keys(optimizedProperties).length;
        const lookupCacheCount = LOOK_UP_CACHE instanceof Map ? LOOK_UP_CACHE.size : Object.keys(LOOK_UP_CACHE).length;
        let relationshipGraphCount = 0;
        for (const [relationshipType, relationshipMap] of RELATIONSHIP_GRAPH.entries()) {
            relationshipGraphCount += relationshipMap.size;
        }
        const totalItems = optimizedPropsCount + lookupCacheCount + relationshipGraphCount;
        let baseCompleted = 0; // Track items completed in previous stages

        // Progress callback factory for batch writes
        // Each stage gets its own callback that knows its offset
        const createProgressCallback = (stageOffset, stageName) => {
            return (current, total, stage, progress) => {
                const overallCurrent = stageOffset + current;
                const overallProgress = (overallCurrent / totalItems) * 100;
                postMessage({
                    type: 'progress',
                    stage: 'writing',
                    message: `Writing ${stageName}: ${current} / ${total}`,
                    progress: overallProgress,
                    current: overallCurrent,
                    total: totalItems,
                    substage: stage
                });
            };
        };

        // Write optimized properties in batches
        console.info("Writing optimized data properties to IndexedDB...");
        postMessage({ type: 'progress', stage: 'writing', message: 'Writing optimized data properties...', progress: 0, current: 0, total: totalItems });
        await writeOptimizedDataBatch(optimizedProperties, createProgressCallback(0, 'Optimized Data'));
        baseCompleted += optimizedPropsCount;
        console.info("Optimized data properties written.");

        // Write lookup cache in batches
        console.info("Writing lookup cache to IndexedDB...");
        postMessage({ type: 'progress', stage: 'writing', message: 'Writing lookup cache...', progress: (baseCompleted / totalItems) * 100, current: baseCompleted, total: totalItems });
        await writeLookupCacheBatch(LOOK_UP_CACHE, createProgressCallback(optimizedPropsCount, 'Lookup Cache'));
        baseCompleted += lookupCacheCount;
        console.info("Lookup cache written.");

        // Write relationship graph in batches
        console.info("Writing relationship graph to IndexedDB...");
        postMessage({ type: 'progress', stage: 'writing', message: 'Writing relationship graph...', progress: (baseCompleted / totalItems) * 100, current: baseCompleted, total: totalItems });
        await writeRelationshipGraphBatch(RELATIONSHIP_GRAPH, createProgressCallback(optimizedPropsCount + lookupCacheCount, 'Relationship Graph'));
        baseCompleted += relationshipGraphCount;
        console.info("Relationship graph written.");

        // Write completion status
        await writeMetadata('optimizationComplete', true);
        await writeMetadata('optimizationTimestamp', Date.now());
        console.info("Optimization metadata written.");

        // Note: Data version is stored separately in the main worker message handler
        // to ensure it's calculated from pristine DATA before any modifications

        // Send final progress update
        postMessage({ type: 'progress', stage: 'complete', message: 'All data written to IndexedDB', progress: 100, current: totalItems, total: totalItems });
    } catch (error) {
        console.error("Error writing to IndexedDB:", error);
        postMessage({ type: 'error', error: error.message });
        throw error;
    }
}

self.onmessage = async function (e) {
    try {
        if (e.data.task === TASKS.OPTIMIZE) {
            // Calculate data version IMMEDIATELY after DATA is loaded, before any modifications
            // This ensures we capture the pristine state before optimization or runtime changes
            let dataVersion = null;
            try {
                dataVersion = calculateDataVersion(DATA);
                console.info("Data version calculated (before optimization):", dataVersion);
            } catch (versionError) {
                console.error("Failed to calculate data version:", versionError);
                // Continue anyway - we'll calculate it again later
            }

            // Initialize IndexedDB with the data version BEFORE optimization starts
            // This ensures that any database reads during optimization use the correct database
            if (dataVersion) {
                try {
                    await initIndexedDB(dataVersion);
                    console.info(`IndexedDB initialized in worker with database: ${getCurrentDatabaseName()}`);
                } catch (dbError) {
                    console.error("Failed to initialize IndexedDB in worker:", dbError);
                    // Continue with optimization - database operations will fail gracefully
                }
            }

            // Send initial progress
            postMessage({ type: 'progress', stage: 'optimizing', message: 'Starting data optimization...', progress: 0, current: 0, total: DATA.types ? DATA.types.length : 0 });

            // Run optimization with progress callback
            await optimizeDataSearch((progressData) => {
                postMessage(progressData);
            });
            console.info("Data optimization complete, preparing for IndexedDB storage...");

            // Remove cached values that shouldn't be stored
            removeCachedValuesForSerialization();
            console.info("Serialization preparation complete.");

            // Send progress update
            postMessage({ type: 'progress', stage: 'writing', message: 'Writing optimized data to IndexedDB...' });

            // Write to IndexedDB instead of sending via postMessage
            // Use the version we calculated at the start (before any modifications)
            if (!dataVersion) {
                // Fallback: calculate it now (though it might be less accurate)
                try {
                    dataVersion = calculateDataVersion(DATA);
                    console.info("Data version calculated (fallback, after optimization):", dataVersion);
                } catch (versionError) {
                    console.error("Failed to calculate fallback data version:", versionError);
                }
            }
            
            if (dataVersion) {
                await writeOptimizedDataToIndexedDB(dataVersion);
                
                // Store the data version in the version-specific database
                try {
                    await storeDataVersion(dataVersion);
                    console.info("Data version stored (from pristine state):", dataVersion);
                } catch (versionError) {
                    console.error("Failed to store data version:", versionError);
                }
            } else {
                console.error("Cannot write to IndexedDB: no data version available");
                throw new Error("Data version is required for IndexedDB operations");
            }

            // Send completion message (no data payload)
            postMessage({ type: 'complete', message: 'Optimization complete. Data stored in IndexedDB.' });
        }
    } catch (error) {
        console.error("Error in worker:", error);
        postMessage({ type: 'error', error: error.message, stack: error.stack });
    }
}