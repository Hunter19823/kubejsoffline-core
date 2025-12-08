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
 * This version only handles class-specific relationships (inheritance, superclass, etc.)
 * Field, method, and constructor relationships are handled in bulk by other functions.
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

/**
 * Optimized function to mark field type relationships in bulk.
 * Groups fields by their type and marks relationships for all classes that have fields of each type.
 * @param {function|null} progressCallback - Optional callback function to report progress
 */
async function markFieldTypeRelationships(progressCallback = null) {
    // Map: fieldType -> Set of classIds that have fields of this type
    const fieldTypeToClasses = new Map();
    // Map: fieldId -> Set of classIds that have this field
    const fieldIdToClasses = new Map();
    
    const totalTypes = DATA.types.length;
    let processedCount = 0;
    
    // First pass: build reverse map from field IDs to classes
    for (let i = 0; i < totalTypes; i++) {
        const typeData = getTypeData(i);
        if (!exists(typeData)) continue;
        
        if (exists(typeData[PROPERTY.FIELDS])) {
            const fieldIds = getAsArray(typeData[PROPERTY.FIELDS]);
            for (const fieldId of fieldIds) {
                if (typeof fieldId === 'number') {
                    if (!fieldIdToClasses.has(fieldId)) {
                        fieldIdToClasses.set(fieldId, new Set());
                    }
                    fieldIdToClasses.get(fieldId).add(i);
                }
            }
        }
        
        processedCount++;
        if (progressCallback && (processedCount % 100 === 0 || processedCount === totalTypes)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Collecting field data: ${processedCount} / ${totalTypes}`,
                progress: (processedCount / totalTypes) * 50,
                current: processedCount,
                total: totalTypes
            });
        }
    }
    
    // Second pass: group fields by type
    const totalFields = DATA.fields.length;
    processedCount = 0;
    
    for (let fieldId = 0; fieldId < totalFields; fieldId++) {
        const fieldData = getFieldData(fieldId);
        if (!exists(fieldData)) continue;
        
        const decodedField = decodeField(fieldData);
        const fieldType = decodedField[PROPERTY.FIELD_TYPE];
        
        if (exists(fieldType) && typeof fieldType === 'number') {
            // Get all classes that have this field
            const classesWithField = fieldIdToClasses.get(fieldId);
            if (classesWithField && classesWithField.size > 0) {
                if (!fieldTypeToClasses.has(fieldType)) {
                    fieldTypeToClasses.set(fieldType, new Set());
                }
                classesWithField.forEach(classId => {
                    fieldTypeToClasses.get(fieldType).add(classId);
                });
            }
        }
        
        processedCount++;
        if (progressCallback && (processedCount % 100 === 0 || processedCount === totalFields)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Grouping fields by type: ${processedCount} / ${totalFields}`,
                progress: 50 + (processedCount / totalFields) * 25,
                current: processedCount,
                total: totalFields
            });
        }
    }
    
    // Third pass: mark relationships in bulk
    let relationshipsMarked = 0;
    const totalRelationships = fieldTypeToClasses.size;
    
    for (const [fieldType, classIds] of fieldTypeToClasses.entries()) {
        const classArray = Array.from(classIds);
        for (const classId of classArray) {
            markRelationship(
                classId,
                [fieldType],
                [RELATIONSHIP.FIELD_TYPE, RELATIONSHIP.REFERENCES],
                [RELATIONSHIP.REFERENCED_BY]
            );
        }
        
        relationshipsMarked++;
        if (progressCallback && (relationshipsMarked % 100 === 0 || relationshipsMarked === totalRelationships)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Marking field relationships: ${relationshipsMarked} / ${totalRelationships}`,
                progress: 75 + (relationshipsMarked / totalRelationships) * 25,
                current: relationshipsMarked,
                total: totalRelationships
            });
        }
    }
}

/**
 * Optimized function to mark method return type and parameter type relationships in bulk.
 * Groups methods by their return type and parameter types, then marks relationships for all classes.
 * @param {function|null} progressCallback - Optional callback function to report progress
 */
async function markMethodTypeRelationships(progressCallback = null) {
    // Map: methodReturnType -> Set of classIds
    const methodReturnTypeToClasses = new Map();
    // Map: methodParameterType -> Set of classIds
    const methodParameterTypeToClasses = new Map();
    // Map: methodId -> Set of classIds that have this method
    const methodIdToClasses = new Map();
    
    const totalTypes = DATA.types.length;
    let processedCount = 0;
    
    // First pass: build reverse map from method IDs to classes
    for (let i = 0; i < totalTypes; i++) {
        const typeData = getTypeData(i);
        if (!exists(typeData)) continue;
        
        if (exists(typeData[PROPERTY.METHODS])) {
            const methodIds = getAsArray(typeData[PROPERTY.METHODS]);
            for (const methodId of methodIds) {
                if (typeof methodId === 'number') {
                    if (!methodIdToClasses.has(methodId)) {
                        methodIdToClasses.set(methodId, new Set());
                    }
                    methodIdToClasses.get(methodId).add(i);
                }
            }
        }
        
        processedCount++;
        if (progressCallback && (processedCount % 100 === 0 || processedCount === totalTypes)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Collecting method data: ${processedCount} / ${totalTypes}`,
                progress: (processedCount / totalTypes) * 33,
                current: processedCount,
                total: totalTypes
            });
        }
    }
    
    // Second pass: group methods by return type and parameter types
    const totalMethods = DATA.methods.length;
    processedCount = 0;
    
    for (let methodId = 0; methodId < totalMethods; methodId++) {
        const methodData = getMethodData(methodId);
        if (!exists(methodData)) continue;
        
        const decodedMethod = decodeMethod(methodData);
        const returnType = decodedMethod[PROPERTY.METHOD_RETURN_TYPE];
        const parameterIds = getAsArray(decodedMethod[PROPERTY.PARAMETERS]);
        
        // Get all classes that have this method
        const classesWithMethod = methodIdToClasses.get(methodId);
        if (!classesWithMethod || classesWithMethod.size === 0) continue;
        
        // Group by return type
        if (exists(returnType) && typeof returnType === 'number') {
            if (!methodReturnTypeToClasses.has(returnType)) {
                methodReturnTypeToClasses.set(returnType, new Set());
            }
            classesWithMethod.forEach(classId => {
                methodReturnTypeToClasses.get(returnType).add(classId);
            });
        }
        
        // Group by parameter types
        for (const paramId of parameterIds) {
            if (typeof paramId !== 'number') continue;
            const paramData = getParameterData(paramId);
            if (!exists(paramData)) continue;
            
            const decodedParam = decodeParameter(paramData);
            const paramType = decodedParam[PROPERTY.PARAMETER_TYPE];
            
            if (exists(paramType) && typeof paramType === 'number') {
                if (!methodParameterTypeToClasses.has(paramType)) {
                    methodParameterTypeToClasses.set(paramType, new Set());
                }
                classesWithMethod.forEach(classId => {
                    methodParameterTypeToClasses.get(paramType).add(classId);
                });
            }
        }
        
        processedCount++;
        if (progressCallback && (processedCount % 100 === 0 || processedCount === totalMethods)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Grouping methods by type: ${processedCount} / ${totalMethods}`,
                progress: 33 + (processedCount / totalMethods) * 33,
                current: processedCount,
                total: totalMethods
            });
        }
    }
    
    // Third pass: mark return type relationships in bulk
    let relationshipsMarked = 0;
    const totalReturnRelationships = methodReturnTypeToClasses.size;
    
    for (const [returnType, classIds] of methodReturnTypeToClasses.entries()) {
        const classArray = Array.from(classIds);
        for (const classId of classArray) {
            markRelationship(
                classId,
                [returnType],
                [RELATIONSHIP.METHOD_RETURN_TYPE, RELATIONSHIP.REFERENCES],
                [RELATIONSHIP.REFERENCED_BY]
            );
        }
        
        relationshipsMarked++;
        if (progressCallback && (relationshipsMarked % 100 === 0 || relationshipsMarked === totalReturnRelationships)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Marking method return type relationships: ${relationshipsMarked} / ${totalReturnRelationships}`,
                progress: 66 + (relationshipsMarked / totalReturnRelationships) * 17,
                current: relationshipsMarked,
                total: totalReturnRelationships
            });
        }
    }
    
    // Fourth pass: mark parameter type relationships in bulk
    relationshipsMarked = 0;
    const totalParamRelationships = methodParameterTypeToClasses.size;
    
    for (const [paramType, classIds] of methodParameterTypeToClasses.entries()) {
        const classArray = Array.from(classIds);
        for (const classId of classArray) {
            markRelationship(
                classId,
                [paramType],
                [RELATIONSHIP.METHOD_PARAMETER_TYPE, RELATIONSHIP.REFERENCES],
                [RELATIONSHIP.REFERENCED_BY]
            );
        }
        
        relationshipsMarked++;
        if (progressCallback && (relationshipsMarked % 100 === 0 || relationshipsMarked === totalParamRelationships)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Marking method parameter relationships: ${relationshipsMarked} / ${totalParamRelationships}`,
                progress: 83 + (relationshipsMarked / totalParamRelationships) * 17,
                current: relationshipsMarked,
                total: totalParamRelationships
            });
        }
    }
}

/**
 * Optimized function to mark constructor parameter type relationships in bulk.
 * Groups constructors by their parameter types and marks relationships for all classes.
 * @param {function|null} progressCallback - Optional callback function to report progress
 */
async function markConstructorParameterTypeRelationships(progressCallback = null) {
    // Map: constructorParameterType -> Set of classIds
    const constructorParameterTypeToClasses = new Map();
    // Map: constructorId -> Set of classIds that have this constructor
    const constructorIdToClasses = new Map();
    
    const totalTypes = DATA.types.length;
    let processedCount = 0;
    
    // First pass: build reverse map from constructor IDs to classes
    for (let i = 0; i < totalTypes; i++) {
        const typeData = getTypeData(i);
        if (!exists(typeData)) continue;
        
        if (exists(typeData[PROPERTY.CONSTRUCTORS])) {
            const constructorIds = getAsArray(typeData[PROPERTY.CONSTRUCTORS]);
            for (const constructorId of constructorIds) {
                if (typeof constructorId === 'number') {
                    if (!constructorIdToClasses.has(constructorId)) {
                        constructorIdToClasses.set(constructorId, new Set());
                    }
                    constructorIdToClasses.get(constructorId).add(i);
                }
            }
        }
        
        processedCount++;
        if (progressCallback && (processedCount % 100 === 0 || processedCount === totalTypes)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Collecting constructor data: ${processedCount} / ${totalTypes}`,
                progress: (processedCount / totalTypes) * 50,
                current: processedCount,
                total: totalTypes
            });
        }
    }
    
    // Second pass: group constructors by parameter types
    const totalConstructors = DATA.constructors.length;
    processedCount = 0;
    
    for (let constructorId = 0; constructorId < totalConstructors; constructorId++) {
        const constructorData = getConstructorData(constructorId);
        if (!exists(constructorData)) continue;
        
        const decodedConstructor = decodeConstructor(constructorData);
        const parameterIds = getAsArray(decodedConstructor[PROPERTY.PARAMETERS]);
        
        // Get all classes that have this constructor
        const classesWithConstructor = constructorIdToClasses.get(constructorId);
        if (!classesWithConstructor || classesWithConstructor.size === 0) continue;
        
        // Group by parameter types
        for (const paramId of parameterIds) {
            if (typeof paramId !== 'number') continue;
            const paramData = getParameterData(paramId);
            if (!exists(paramData)) continue;
            
            const decodedParam = decodeParameter(paramData);
            const paramType = decodedParam[PROPERTY.PARAMETER_TYPE];
            
            if (exists(paramType) && typeof paramType === 'number') {
                if (!constructorParameterTypeToClasses.has(paramType)) {
                    constructorParameterTypeToClasses.set(paramType, new Set());
                }
                classesWithConstructor.forEach(classId => {
                    constructorParameterTypeToClasses.get(paramType).add(classId);
                });
            }
        }
        
        processedCount++;
        if (progressCallback && (processedCount % 100 === 0 || processedCount === totalConstructors)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Grouping constructors by parameter type: ${processedCount} / ${totalConstructors}`,
                progress: 50 + (processedCount / totalConstructors) * 25,
                current: processedCount,
                total: totalConstructors
            });
        }
    }
    
    // Third pass: mark relationships in bulk
    let relationshipsMarked = 0;
    const totalRelationships = constructorParameterTypeToClasses.size;
    
    for (const [paramType, classIds] of constructorParameterTypeToClasses.entries()) {
        const classArray = Array.from(classIds);
        for (const classId of classArray) {
            markRelationship(
                classId,
                [paramType],
                [RELATIONSHIP.CONSTRUCTOR_PARAMETER_TYPE, RELATIONSHIP.PARAMETER_TYPE, RELATIONSHIP.REFERENCES],
                [RELATIONSHIP.REFERENCED_BY]
            );
        }
        
        relationshipsMarked++;
        if (progressCallback && (relationshipsMarked % 100 === 0 || relationshipsMarked === totalRelationships)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Marking constructor parameter relationships: ${relationshipsMarked} / ${totalRelationships}`,
                progress: 75 + (relationshipsMarked / totalRelationships) * 25,
                current: relationshipsMarked,
                total: totalRelationships
            });
        }
    }
}

/**
 * Helper function to group items, filter groups with 2+ items, and mark all pairs with a relationship.
 */
async function markGroupedRelationships(items, getKey, relationship, groupingMessage, markingMessage, progressCallback) {
    const groups = new Map();
    let processed = 0;
    const total = items.length;
    
    // Group items
    for (const item of items) {
        const key = getKey(item);
        if (key === null || key === undefined) continue;
        
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(item);
        
        processed++;
        if (progressCallback && (processed % 10 === 0 || processed === total)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `${groupingMessage}: ${processed} / ${total}`,
                progress: (processed / total) * 100,
                current: processed,
                total: total
            });
        }
    }
    
    // Filter and mark pairs
    const validGroups = Array.from(groups.values()).filter(group => group.length >= 2);
    let groupsProcessed = 0;
    
    for (const group of validGroups) {
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                markRelationship(group[i], [group[j]], [relationship], [relationship]);
            }
        }
        
        groupsProcessed++;
        if (progressCallback && (groupsProcessed % 10 === 0 || groupsProcessed === validGroups.length)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `${markingMessage}: ${groupsProcessed} / ${validGroups.length}`,
                progress: (groupsProcessed / validGroups.length) * 100,
                current: groupsProcessed,
                total: validGroups.length
            });
        }
    }
}

/**
 * Marks all relationship types (neighbors, siblings, and roommates) sequentially.
 * 
 * @param {function|null} progressCallback - Optional callback function to report progress
 * @returns {Promise<void>} Promise that resolves when all relationship marking is complete
 */
async function markAllRelationships(progressCallback = null) {
    // 1. Mark parameterized type neighbors
    await markGroupedRelationships(
        DATA._parameterized_types,
        (id) => {
            const paramType = getClass(id);
            return paramType && paramType.isParameterizedType() ? paramType.getRawType() : null;
        },
        RELATIONSHIP.NEIGHBOR,
        'Grouping parameterized types',
        'Marking neighbors',
        progressCallback
    );
    
    // 2. Mark inner class siblings
    // If there are more than 20k classes, skip sibling marking to save time and memory
    if (DATA.types.length <= 20000) {
        await markGroupedRelationships(
            Array.from({length: DATA.types.length}, (_, i) => i),
            (id) => {
                const classType = getClass(id);
                return classType ? classType.getEnclosingClass() : null;
            },
            RELATIONSHIP.SIBLING,
            'Grouping inner classes',
            'Marking siblings',
            progressCallback
        );

        // 3. Mark package roommates
        await markGroupedRelationships(
            Array.from({length: DATA.types.length}, (_, i) => i),
            (id) => {
                const classType = getClass(id);
                return classType ? classType.getPackageId() : null;
            },
            RELATIONSHIP.ROOMMATE,
            'Grouping classes by package',
            'Marking roommates',
            progressCallback
        );
    }
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
                    message: `Classes Scanned: ${processedCount} / ${totalTypes}`,
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
        if (progressCallback && (i % 10 === 0 || i === totalTypes)) {
            const progress = (i / totalTypes) * 100;
            progressCallback({
                type: 'progress',
                stage: 'optimizing',
                message: `Scanners Initialized: ${i} / ${totalTypes}`,
                progress: progress,
                current: i,
                total: totalTypes
            });
        }
    }
    
    // Wait for class indexing to complete first (for class-specific relationships)
    await Promise.all(indexPromises);
    
    // Now process field, method, and constructor relationships in bulk
    // These can run in parallel since they don't depend on each other
    await Promise.all([
        markFieldTypeRelationships(progressCallback),
        markMethodTypeRelationships(progressCallback),
        markConstructorParameterTypeRelationships(progressCallback),
        markAllRelationships(progressCallback)
    ]);
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
*/

/**
 * Represents the string version of the relationship graph.
 * @see RelationshipGraphJSON
 * @typedef {string} RelationshipGraphJSONString
 */