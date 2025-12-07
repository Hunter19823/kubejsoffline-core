// This class is dedicated to calculating the relationships between each class.

/**
 * Adds a relationshipType, a source, and a list of targets to the relationship graph.
 * Also handles initializing parts of the relationship graph if they don't exist.
 *
 * @param relationshipType {RELATIONSHIP}
 * @param from {TypeIdentifier}
 * @param to {TypeIdentifier}
 */
function addToRelationshipGraph(relationshipType, from, to) {
    if (!RELATIONSHIP_GRAPH.has(relationshipType)) {
        RELATIONSHIP_GRAPH.set(relationshipType, new Map());
    }
    const relationshipMap = RELATIONSHIP_GRAPH.get(relationshipType);
    if (!relationshipMap.has(from)) {
        relationshipMap.set(from, new Set());
    }
    relationshipMap.get(from).add(to);
}

/**
 * This function marks the relationships between two classes, and their inverse relationships.
 * This is done in bulk to reduce the number of iterations over the data.
 *
 * @param from {TypeIdentifier} the source class
 * @param targets {Array<TypeIdentifier>} the related classes
 * @param relationshipTypes {Array<RELATIONSHIP>} the relationships to mark
 * @param inverseRelationshipTypes {Array<RELATIONSHIP>} the inverse relationships to mark
 */
function markRelationship(from, targets, relationshipTypes, inverseRelationshipTypes) {
    if (!exists(targets)) {
        return;
    }
    // Assume source is already a wrapped class.
    if (targets.length === 0) {
        return;
    }

    const uniqueTargets = new Set(targets);
    uniqueTargets.forEach(to => {
        if (typeof to === 'number') {
            relationshipTypes.forEach(relationshipType => {
                addToRelationshipGraph(relationshipType, from, to);
            });
            inverseRelationshipTypes.forEach(inverseRelationshipType => {
                addToRelationshipGraph(inverseRelationshipType, to, from);
            });
        }
    });
}


/**
 * This function marks all known relationships between itself and other classes
 * using the data provided in the class data.
 * @param target {TypeIdentifier} the id of the class
 */
async function indexClass(target) {
    const classType = getClass(target);
    classType._follow_inheritance((parent, index) => {
        if (index === target) {
            return;
        }
        markRelationship(
            target,
            [getClass(index).id()],
            [RELATIONSHIP.INHERITS, RELATIONSHIP.REFERENCES],
            [RELATIONSHIP.INHERITED_BY, RELATIONSHIP.REFERENCES]
        );
    })
    markRelationship(
        target,
        getAsArray(classType.getSuperClass()),
        [RELATIONSHIP.SUPER_CLASS],
        []
    );
    markRelationship(
        target,
        classType.constructors(true).flatMap((constructorData) => constructorData.getParameters().map((parameterData) => parameterData.getType())),
        [RELATIONSHIP.CONSTRUCTOR_PARAMETER_TYPE, RELATIONSHIP.PARAMETER_TYPE, RELATIONSHIP.REFERENCES],
        [RELATIONSHIP.REFERENCED_BY]
    );
    markRelationship(
        target,
        classType.fields(true).map((fieldData) => fieldData.getType()),
        [RELATIONSHIP.FIELD_TYPE, RELATIONSHIP.REFERENCES],
        [RELATIONSHIP.REFERENCED_BY]
    );
    markRelationship(
        target,
        classType.methods(true).map((methodData) => methodData.getType()),
        [RELATIONSHIP.METHOD_RETURN_TYPE, RELATIONSHIP.REFERENCES],
        [RELATIONSHIP.REFERENCED_BY]
    );
    markRelationship(
        target,
        classType.methods(true).flatMap((methodData) => methodData.getParameters().map((parameterData) => parameterData.getType())),
        [RELATIONSHIP.METHOD_PARAMETER_TYPE, RELATIONSHIP.REFERENCES],
        [RELATIONSHIP.REFERENCED_BY]
    );
    markRelationship(
        target,
        getAsArray(classType.getDeclaringClass()),
        [RELATIONSHIP.DECLARING_CLASS, RELATIONSHIP.REFERENCES],
        [RELATIONSHIP.DECLARES_CLASS, RELATIONSHIP.REFERENCED_BY]
    );
    markRelationship(
        target,
        getAsArray(classType.getEnclosingClass()),
        [RELATIONSHIP.ENCLOSING_CLASS, RELATIONSHIP.REFERENCES],
        [RELATIONSHIP.ENCLOSES_CLASS, RELATIONSHIP.REFERENCED_BY]
    );
    markRelationship(
        target,
        classType.getInnerClasses(),
        [RELATIONSHIP.ENCLOSES_CLASS, RELATIONSHIP.REFERENCES],
        [RELATIONSHIP.ENCLOSING_CLASS, RELATIONSHIP.REFERENCED_BY]
    );
    markRelationship(
        target,
        classType.getTypeVariables().map((typeVariableData) => getClass(typeVariableData)).map((typeVariable) => typeVariable.id()),
        [RELATIONSHIP.TYPE_VARIABLE_OF, RELATIONSHIP.REFERENCES],
        [RELATIONSHIP.COMPONENT_OF, RELATIONSHIP.REFERENCED_BY]
    );
    markRelationship(
        target,
        getAsArray(classType.getRawType()),
        [RELATIONSHIP.RAW_TYPE, RELATIONSHIP.REFERENCES],
        [RELATIONSHIP.PARAMETERIZED_VARIANT, RELATIONSHIP.REFERENCED_BY]
    )
    markRelationship(
        target,
        getAsArray(classType.getOwnerType()),
        [RELATIONSHIP.OWNER_TYPE, RELATIONSHIP.REFERENCES],
        [RELATIONSHIP.REFERENCED_BY]
    )
    markRelationship(
        target,
        classType.getLowerBound(),
        [RELATIONSHIP.LOWER_BOUND, RELATIONSHIP.REFERENCES],
        [RELATIONSHIP.BOUNDED_WITHIN, RELATIONSHIP.REFERENCED_BY]
    )
    markRelationship(
        target,
        classType.getUpperBound(),
        [RELATIONSHIP.UPPER_BOUND, RELATIONSHIP.REFERENCES],
        [RELATIONSHIP.BOUNDED_WITHIN, RELATIONSHIP.REFERENCED_BY]
    )
    markRelationship(
        target,
        classType.getTypeVariableBounds(),
        [RELATIONSHIP.TYPE_VARIABLE_BOUNDS, RELATIONSHIP.REFERENCES],
        [RELATIONSHIP.BOUNDED_WITHIN, RELATIONSHIP.REFERENCED_BY]
    )
}

async function optimizeDataSearch(progressCallback = null) {
    DATA._optimized = true;
    DATA._wildcard_types = [];
    DATA._parameterized_types = [];
    DATA._raw_types = [];
    DATA._type_variables = [];
    const indexPromises = [];
    const totalTypes = DATA.types.length;
    let processedCount = 0;

    DATA.types.forEach((typeData, index) => {
        processedCount++;
        getClass(index).getTypeVariableMap()
        if (progressCallback && (processedCount % 10 === 0 || processedCount === totalTypes)) {
            const progress = (processedCount / totalTypes) * 100;
            progressCallback({
                type: 'progress',
                stage: 'warmup',
                message: `Warming classes: ${processedCount} / ${totalTypes}`,
                progress: progress,
                current: processedCount,
                total: totalTypes
            });
        }
    });
    processedCount = 0;
    for (let i = 0; i < DATA.types.length; i++) {
        const typeData = getTypeData(i);
        if (!exists(typeData)) {
            console.error("Invalid type data in export: ", i);
            continue;
        }
        const subject = getClass(i);
        indexPromises.push(indexClass(i).then(() => {
            processedCount++;
            // Send progress update every 10 items or on last item
            if (progressCallback && (processedCount % 10 === 0 || processedCount === totalTypes)) {
                const progress = (processedCount / totalTypes) * 100;
                progressCallback({
                    type: 'progress',
                    stage: 'optimizing',
                    message: `Scanning classes: ${processedCount} / ${totalTypes}`,
                    progress: progress,
                    current: processedCount,
                    total: totalTypes
                });
            }
        }));
        if (subject.isWildcard()) {
            DATA._wildcard_types.push(i);
        } else if (subject.isParameterizedType()) {
            DATA._parameterized_types.push(i);
        } else if (subject.isTypeVariable()) {
            DATA._type_variables.push(i);
        } else {
            DATA._raw_types.push(i);
        }
    }
    await Promise.all(indexPromises);
    findEventClasses();
}


function findEventClasses() {
    if (DATA._eventsIndexed) {
        console.log("Events already indexed");
        return;
    }
    console.log("Indexing events");
    DATA._eventsIndexed = true;

    const keys = Object.keys(EVENTS);
    for (let i = 0; i < keys.length; i++) {
        let eventClass = getClass(keys[i]);
        if (!exists(eventClass)) {
            console.debug("Failed to find class for ", keys[i])
            continue;
        }
        EVENTS[keys[i]].push(eventClass.id());
        EVENTS[keys[i]].push(...getRelation(RELATIONSHIP.INHERITED_BY, eventClass.id()));
        EVENTS[keys[i]].push(...getRelation(RELATIONSHIP.PARAMETERIZED_VARIANT, eventClass.id()));

        EVENTS[keys[i]] = [...new Set(EVENTS[keys[i]])]
    }
    DATA._events = EVENTS;
}

function getRelation(relationshipType, id) {
    // Check in-memory cache (synchronous)
    // NOTE: Relationship graph should be loaded into memory during initialization
    // to ensure synchronous access. If it's not in memory, return empty array.
    if (RELATIONSHIP_GRAPH.has(relationshipType)) {
        const relationshipMap = RELATIONSHIP_GRAPH.get(relationshipType);
        if (relationshipMap.has(id)) {
            return Array.from(relationshipMap.get(id));
        }
    }
    
    // If not in memory, the relationship graph hasn't been loaded yet.
    // This should only happen during initialization. Return empty array.
    return [];
}

// Async version for when async is explicitly needed
async function getRelationAsync(relationshipType, id) {
    // Check in-memory cache first
    if (RELATIONSHIP_GRAPH.has(relationshipType)) {
        const relationshipMap = RELATIONSHIP_GRAPH.get(relationshipType);
        if (relationshipMap.has(id)) {
            return Array.from(relationshipMap.get(id));
        }
    }
    
    // Try to load from IndexedDB
    if (typeof readRelationshipGraphEntry === 'function') {
        try {
            const toSet = await readRelationshipGraphEntry(relationshipType, id);
            if (toSet !== undefined) {
                // Update in-memory cache
                if (!RELATIONSHIP_GRAPH.has(relationshipType)) {
                    RELATIONSHIP_GRAPH.set(relationshipType, new Map());
                }
                const relationshipMap = RELATIONSHIP_GRAPH.get(relationshipType);
                relationshipMap.set(id, toSet);
                return Array.from(toSet);
            }
        } catch (err) {
            console.debug(`Failed to load relationship graph entry for ${relationshipType}:${id}:`, err);
        }
    }
    
    return [];
}

/**
 * Get a map of every relationship a Type has to other Types.
 *
 * @param id {TypeIdentifier} the id of the class to get relationships for.
 * @returns {Map<TypeIdentifier, RELATIONSHIP[]>} a map of TypeIdentifiers to a list of relationships.
 */
function getAllRelations(id) {
    // Return a list of map of id, to list of relationship type.
    const relations = new Map();
    
    // Check in-memory cache (synchronous)
    RELATIONSHIP_GRAPH.forEach((relationshipMap, relationshipType) => {
        if (!relationshipMap.has(id)) {
            return;
        }
        relationshipMap.get(id).forEach((to) => {
            if (!relations.has(to)) {
                relations.set(to, []);
            }
            relations.get(to).push(relationshipType);
        })
    });
    
    // Try to load missing relationship types from IndexedDB asynchronously (non-blocking)
    if (typeof readRelationshipGraphByType === 'function') {
        // Get all relationship types that might exist
        const allRelationshipTypes = Object.values(RELATIONSHIP);
        for (const relationshipType of allRelationshipTypes) {
            // Skip if already loaded in memory
            if (RELATIONSHIP_GRAPH.has(relationshipType)) {
                continue;
            }
            
            // Load asynchronously in background
            readRelationshipGraphByType(relationshipType).then(relationshipMap => {
                if (relationshipMap && relationshipMap.has(id)) {
                    // Update in-memory cache
                    RELATIONSHIP_GRAPH.set(relationshipType, relationshipMap);
                }
            }).catch(err => {
                console.debug(`Failed to load relationship graph for type ${relationshipType}:`, err);
            });
        }
    }
    
    return relations;
}

// Async version for when async is explicitly needed
async function getAllRelationsAsync(id) {
    const relations = new Map();
    
    // First, check in-memory cache
    RELATIONSHIP_GRAPH.forEach((relationshipMap, relationshipType) => {
        if (!relationshipMap.has(id)) {
            return;
        }
        relationshipMap.get(id).forEach((to) => {
            if (!relations.has(to)) {
                relations.set(to, []);
            }
            relations.get(to).push(relationshipType);
        })
    });
    
    // Then, try to load missing relationship types from IndexedDB
    if (typeof readRelationshipGraphByType === 'function') {
        // Get all relationship types that might exist
        const allRelationshipTypes = Object.values(RELATIONSHIP);
        for (const relationshipType of allRelationshipTypes) {
            // Skip if already loaded in memory
            if (RELATIONSHIP_GRAPH.has(relationshipType)) {
                continue;
            }
            
            try {
                const relationshipMap = await readRelationshipGraphByType(relationshipType);
                if (relationshipMap && relationshipMap.has(id)) {
                    // Update in-memory cache
                    RELATIONSHIP_GRAPH.set(relationshipType, relationshipMap);
                    relationshipMap.get(id).forEach((to) => {
                        if (!relations.has(to)) {
                            relations.set(to, []);
                        }
                        relations.get(to).push(relationshipType);
                    });
                }
            } catch (err) {
                console.debug(`Failed to load relationship graph for type ${relationshipType}:`, err);
            }
        }
    }
    
    return relations;
}

/**
 * A JSON object that represents the object with the following structure:
 * @example {
 *     <Relationship: RELATIONSHIP>: {
 *         <From: TypeIdentifier>: [
 *              <To: TypeIdentifier>,
 *         ]
 *     }
 * }
 * @typedef {
 *  Record<RELATIONSHIP | string,Object.<TypeIdentifier | string,TypeIdentifier[]>>
 * } RelationshipGraphJSON
 /**
 * Represents the string version of the relationship graph.
 * @see RelationshipGraphJSON
 * @typedef {string} RelationshipGraphJSONString
 */

/**
 * Get a list of all the relationships a Type has to other Types.
 * This is used to send and receive data between the worker and the main thread.
 * @param map {RelationshipGraph} a map of TypeIdentifiers to a set of TypeIdentifiers.
 * @returns {RelationshipGraphJSONString} the JSON string of the relationship graph.
 */
function getRelationshipGraphAsJSON(map) {
    /**
     * @type RelationshipGraphJSON
     */
    let output;
    output = {};
    [...map.entries()].forEach(([relationshipType, relationshipMap]) => {
        const relationshipOutput = {};
        [...relationshipMap.entries()].forEach(([from, toSet]) => {
            relationshipOutput[from] = Array.from(toSet);
        });
        output[relationshipType] = relationshipOutput;
    });
    return JSON.stringify(output);
}

/**
 * Load a JSON string into the relationship graph.
 * This is used to send and receive data between the worker and the main thread.
 * NOTE: This function is deprecated - data is now stored in IndexedDB instead.
 * @param json {RelationshipGraphJSONString} the JSON string to load.
 * @deprecated Use IndexedDB instead. This function is kept for backward compatibility.
 */
function loadJSONToRelationshipGraph(json) {
    RELATIONSHIP_GRAPH.clear();
    /**
     * @type {RelationshipGraphJSON}
     */
    const parsed = JSON.parse(json);

    Object.entries(parsed).forEach(
        /**
         * @param {[RELATIONSHIP, Object.<TypeIdentifier | string, TypeIdentifier[]>]} entry
         */
        ([relationshipType, relationMap]) => {
            const relationshipOutput = new Map();
            Object.entries(relationMap).forEach(([from, toSet]) => {
                relationshipOutput.set(parseInt(from), new Set(toSet));
            });
            RELATIONSHIP_GRAPH.set(relationshipType, relationshipOutput);
        });
}