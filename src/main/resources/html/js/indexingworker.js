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
self.onmessage = function (e) {
    optimizeDataSearch().then(r => {
        console.info("Data optimization complete, preparing for serialization...");
        removeCachedValuesForSerialization();
        console.info("Serialization preparation complete.");
    }).then(r => {
        postMessage({data: DATA, cache: LOOK_UP_CACHE, RELATIONSHIP_GRAPH: getRelationshipGraphAsJSON(RELATIONSHIP_GRAPH)});
    });
}