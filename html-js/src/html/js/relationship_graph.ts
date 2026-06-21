// @ts-nocheck
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

/** Avoid O(n²) clique marking for very large shared groups (e.g. package roommates). */
const MAX_SYMMETRIC_RELATIONSHIP_GROUP_SIZE = 512;

function markClassReferencesToType(classId, typeId, forwardRelationships) {
    if (typeof classId !== 'number' || typeof typeId !== 'number') {
        return;
    }
    for (let i = 0; i < forwardRelationships.length; i++) {
        addToRelationshipGraph(forwardRelationships[i], classId, typeId);
    }
    addToRelationshipGraph(RELATIONSHIP.REFERENCES, classId, typeId);
    addToRelationshipGraph(RELATIONSHIP.REFERENCED_BY, typeId, classId);
}

function markSymmetricRelationshipClique(group, relationshipType) {
    const n = group.length;
    if (n < 2 || n > MAX_SYMMETRIC_RELATIONSHIP_GROUP_SIZE) {
        return;
    }
    for (let i = 0; i < n; i++) {
        const from = group[i];
        for (let j = i + 1; j < n; j++) {
            const to = group[j];
            addToRelationshipGraph(relationshipType, from, to);
            addToRelationshipGraph(relationshipType, to, from);
        }
    }
}

function readFieldTypeFromCompressedData(fieldData) {
    if (!exists(fieldData)) {
        return null;
    }
    if (typeof fieldData === 'object') {
        const typeId = fieldData[PROPERTY.FIELD_TYPE];
        return typeof typeId === 'number' ? typeId : null;
    }
    if (typeof fieldData === 'string') {
        const comma = fieldData.indexOf(',');
        if (comma === -1) {
            return null;
        }
        const secondComma = fieldData.indexOf(',', comma + 1);
        const typePart = secondComma === -1
            ? fieldData.slice(comma + 1)
            : fieldData.slice(comma + 1, secondComma);
        const decoded = decodePart(typePart.trim(), null);
        return typeof decoded === 'number' ? decoded : null;
    }
    return null;
}

function readMethodReturnTypeAndParameterIds(methodData) {
    if (!exists(methodData)) {
        return { returnType: null, parameterIds: [] };
    }
    if (typeof methodData === 'object') {
        return {
            returnType: methodData[PROPERTY.METHOD_RETURN_TYPE],
            parameterIds: getAsArray(methodData[PROPERTY.PARAMETERS]),
        };
    }
    if (typeof methodData === 'string') {
        const values = methodData.split(',');
        if (values.length < 5) {
            return { returnType: null, parameterIds: [] };
        }
        const returnType = decodePart(values[2].trim(), null);
        const parameterIds = decodePart(values[4].trim(), null);
        return {
            returnType: typeof returnType === 'number' ? returnType : null,
            parameterIds: getAsArray(parameterIds),
        };
    }
    return { returnType: null, parameterIds: [] };
}

function readParameterTypeFromCompressedData(paramData) {
    if (!exists(paramData)) {
        return null;
    }
    if (typeof paramData === 'object') {
        const typeId = paramData[PROPERTY.PARAMETER_TYPE];
        return typeof typeId === 'number' ? typeId : null;
    }
    if (typeof paramData === 'string') {
        const comma = paramData.indexOf(',');
        if (comma === -1) {
            return null;
        }
        const secondComma = paramData.indexOf(',', comma + 1);
        const typePart = secondComma === -1
            ? paramData.slice(comma + 1)
            : paramData.slice(comma + 1, secondComma);
        const decoded = decodePart(typePart.trim(), null);
        return typeof decoded === 'number' ? decoded : null;
    }
    return null;
}

function readConstructorParameterIdsFromCompressedData(constructorData) {
    if (!exists(constructorData)) {
        return [];
    }
    if (typeof constructorData === 'object') {
        return getAsArray(constructorData[PROPERTY.PARAMETERS]);
    }
    if (typeof constructorData === 'string') {
        const values = constructorData.split(',');
        if (values.length < 5) {
            return [];
        }
        return getAsArray(decodePart(values[4].trim(), null));
    }
    return [];
}

function getPackageIdFromTypeData(typeData) {
    const packageId = typeData[PROPERTY.PACKAGE_NAME];
    if (exists(packageId)) {
        return packageId;
    }
    if (exists(typeData[PROPERTY.RAW_PARAMETERIZED_TYPE])) {
        const rawType = typeData[PROPERTY.RAW_PARAMETERIZED_TYPE];
        if (typeof rawType === 'number') {
            const rawData = getTypeData(rawType);
            if (exists(rawData)) {
                return rawData[PROPERTY.PACKAGE_NAME] ?? null;
            }
        }
    }
    return null;
}

/**
 * One pass over types to map member ids (fields, methods, constructors) to owning class ids.
 */
function buildMemberIdToOwningClassIds() {
    const fieldIdToClasses = new Map();
    const methodIdToClasses = new Map();
    const constructorIdToClasses = new Map();
    const totalTypes = DATA.types.length;

    for (let classId = 0; classId < totalTypes; classId++) {
        const typeData = getTypeData(classId);
        if (!exists(typeData)) {
            continue;
        }

        if (exists(typeData[PROPERTY.FIELDS])) {
            for (const fieldId of getAsArray(typeData[PROPERTY.FIELDS])) {
                if (typeof fieldId !== 'number') {
                    continue;
                }
                let owners = fieldIdToClasses.get(fieldId);
                if (!owners) {
                    owners = new Set();
                    fieldIdToClasses.set(fieldId, owners);
                }
                owners.add(classId);
            }
        }

        if (exists(typeData[PROPERTY.METHODS])) {
            for (const methodId of getAsArray(typeData[PROPERTY.METHODS])) {
                if (typeof methodId !== 'number') {
                    continue;
                }
                let owners = methodIdToClasses.get(methodId);
                if (!owners) {
                    owners = new Set();
                    methodIdToClasses.set(methodId, owners);
                }
                owners.add(classId);
            }
        }

        if (exists(typeData[PROPERTY.CONSTRUCTORS])) {
            for (const constructorId of getAsArray(typeData[PROPERTY.CONSTRUCTORS])) {
                if (typeof constructorId !== 'number') {
                    continue;
                }
                let owners = constructorIdToClasses.get(constructorId);
                if (!owners) {
                    owners = new Set();
                    constructorIdToClasses.set(constructorId, owners);
                }
                owners.add(classId);
            }
        }
    }

    return { fieldIdToClasses, methodIdToClasses, constructorIdToClasses };
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
async function markFieldTypeRelationships(progressCallback = null, fieldIdToClasses = null) {
    // Map: fieldType -> Set of classIds that have fields of this type
    const fieldTypeToClasses = new Map();
    const memberMap = fieldIdToClasses ?? buildMemberIdToOwningClassIds().fieldIdToClasses;
    
    const totalFields = DATA.fields.length;
    let processedCount = 0;
    
    for (let fieldId = 0; fieldId < totalFields; fieldId++) {
        const fieldData = getFieldData(fieldId);
        if (!exists(fieldData)) continue;
        
        const fieldType = readFieldTypeFromCompressedData(fieldData);
        
        if (fieldType !== null) {
            const classesWithField = memberMap.get(fieldId);
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
        if (progressCallback && (processedCount % 500 === 0 || processedCount === totalFields)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Grouping fields by type: ${processedCount} / ${totalFields}`,
                progress: (processedCount / totalFields) * 50,
                current: processedCount,
                total: totalFields
            });
        }
    }
    
    // Mark relationships in bulk
    let relationshipsMarked = 0;
    const totalRelationships = fieldTypeToClasses.size;
    
    for (const [fieldType, classIds] of fieldTypeToClasses.entries()) {
        for (const classId of classIds) {
            markClassReferencesToType(
                classId,
                fieldType,
                [RELATIONSHIP.FIELD_TYPE]
            );
        }
        
        relationshipsMarked++;
        if (progressCallback && (relationshipsMarked % 100 === 0 || relationshipsMarked === totalRelationships)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Marking field relationships: ${relationshipsMarked} / ${totalRelationships}`,
                progress: 50 + (relationshipsMarked / totalRelationships) * 50,
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
async function markMethodTypeRelationships(progressCallback = null, methodIdToClasses = null) {
    // Map: methodReturnType -> Set of classIds
    const methodReturnTypeToClasses = new Map();
    // Map: methodParameterType -> Set of classIds
    const methodParameterTypeToClasses = new Map();
    const memberMap = methodIdToClasses ?? buildMemberIdToOwningClassIds().methodIdToClasses;
    
    const totalMethods = DATA.methods.length;
    let processedCount = 0;
    
    for (let methodId = 0; methodId < totalMethods; methodId++) {
        const methodData = getMethodData(methodId);
        if (!exists(methodData)) continue;
        
        const { returnType, parameterIds } = readMethodReturnTypeAndParameterIds(methodData);
        
        const classesWithMethod = memberMap.get(methodId);
        if (!classesWithMethod || classesWithMethod.size === 0) continue;
        
        if (returnType !== null) {
            if (!methodReturnTypeToClasses.has(returnType)) {
                methodReturnTypeToClasses.set(returnType, new Set());
            }
            classesWithMethod.forEach(classId => {
                methodReturnTypeToClasses.get(returnType).add(classId);
            });
        }
        
        for (const paramId of parameterIds) {
            if (typeof paramId !== 'number') continue;
            const paramData = getParameterData(paramId);
            const paramType = readParameterTypeFromCompressedData(paramData);
            
            if (paramType !== null) {
                if (!methodParameterTypeToClasses.has(paramType)) {
                    methodParameterTypeToClasses.set(paramType, new Set());
                }
                classesWithMethod.forEach(classId => {
                    methodParameterTypeToClasses.get(paramType).add(classId);
                });
            }
        }
        
        processedCount++;
        if (progressCallback && (processedCount % 500 === 0 || processedCount === totalMethods)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Grouping methods by type: ${processedCount} / ${totalMethods}`,
                progress: (processedCount / totalMethods) * 50,
                current: processedCount,
                total: totalMethods
            });
        }
    }
    
    let relationshipsMarked = 0;
    const totalReturnRelationships = methodReturnTypeToClasses.size;
    
    for (const [returnType, classIds] of methodReturnTypeToClasses.entries()) {
        for (const classId of classIds) {
            markClassReferencesToType(
                classId,
                returnType,
                [RELATIONSHIP.METHOD_RETURN_TYPE]
            );
        }
        
        relationshipsMarked++;
        if (progressCallback && (relationshipsMarked % 100 === 0 || relationshipsMarked === totalReturnRelationships)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Marking method return type relationships: ${relationshipsMarked} / ${totalReturnRelationships}`,
                progress: 50 + (relationshipsMarked / totalReturnRelationships) * 25,
                current: relationshipsMarked,
                total: totalReturnRelationships
            });
        }
    }
    
    relationshipsMarked = 0;
    const totalParamRelationships = methodParameterTypeToClasses.size;
    
    for (const [paramType, classIds] of methodParameterTypeToClasses.entries()) {
        for (const classId of classIds) {
            markClassReferencesToType(
                classId,
                paramType,
                [RELATIONSHIP.METHOD_PARAMETER_TYPE]
            );
        }
        
        relationshipsMarked++;
        if (progressCallback && (relationshipsMarked % 100 === 0 || relationshipsMarked === totalParamRelationships)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Marking method parameter relationships: ${relationshipsMarked} / ${totalParamRelationships}`,
                progress: 75 + (relationshipsMarked / totalParamRelationships) * 25,
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
async function markConstructorParameterTypeRelationships(progressCallback = null, constructorIdToClasses = null) {
    const constructorParameterTypeToClasses = new Map();
    const memberMap = constructorIdToClasses ?? buildMemberIdToOwningClassIds().constructorIdToClasses;
    
    const totalConstructors = DATA.constructors.length;
    let processedCount = 0;
    
    for (let constructorId = 0; constructorId < totalConstructors; constructorId++) {
        const constructorData = getConstructorData(constructorId);
        if (!exists(constructorData)) continue;
        
        const parameterIds = readConstructorParameterIdsFromCompressedData(constructorData);
        const classesWithConstructor = memberMap.get(constructorId);
        if (!classesWithConstructor || classesWithConstructor.size === 0) continue;
        
        for (const paramId of parameterIds) {
            if (typeof paramId !== 'number') continue;
            const paramData = getParameterData(paramId);
            const paramType = readParameterTypeFromCompressedData(paramData);
            
            if (paramType !== null) {
                if (!constructorParameterTypeToClasses.has(paramType)) {
                    constructorParameterTypeToClasses.set(paramType, new Set());
                }
                classesWithConstructor.forEach(classId => {
                    constructorParameterTypeToClasses.get(paramType).add(classId);
                });
            }
        }
        
        processedCount++;
        if (progressCallback && (processedCount % 500 === 0 || processedCount === totalConstructors)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Grouping constructors by parameter type: ${processedCount} / ${totalConstructors}`,
                progress: (processedCount / totalConstructors) * 50,
                current: processedCount,
                total: totalConstructors
            });
        }
    }
    
    let relationshipsMarked = 0;
    const totalRelationships = constructorParameterTypeToClasses.size;
    
    for (const [paramType, classIds] of constructorParameterTypeToClasses.entries()) {
        for (const classId of classIds) {
            markClassReferencesToType(
                classId,
                paramType,
                [RELATIONSHIP.CONSTRUCTOR_PARAMETER_TYPE, RELATIONSHIP.PARAMETER_TYPE]
            );
        }
        
        relationshipsMarked++;
        if (progressCallback && (relationshipsMarked % 100 === 0 || relationshipsMarked === totalRelationships)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Marking constructor parameter relationships: ${relationshipsMarked} / ${totalRelationships}`,
                progress: 50 + (relationshipsMarked / totalRelationships) * 50,
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
        markSymmetricRelationshipClique(group, relationship);
        
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
async function markInnerClassAndPackageRelationships(progressCallback = null) {
    if (DATA.types.length > 20000) {
        return;
    }

    const enclosingGroups = new Map();
    const packageGroups = new Map();
    const totalTypes = DATA.types.length;

    for (let classId = 0; classId < totalTypes; classId++) {
        const typeData = getTypeData(classId);
        if (!exists(typeData)) {
            continue;
        }

        const enclosingClass = typeData[PROPERTY.ENCLOSING_CLASS];
        if (exists(enclosingClass)) {
            let group = enclosingGroups.get(enclosingClass);
            if (!group) {
                group = [];
                enclosingGroups.set(enclosingClass, group);
            }
            group.push(classId);
        }

        const packageId = getPackageIdFromTypeData(typeData);
        if (exists(packageId)) {
            let group = packageGroups.get(packageId);
            if (!group) {
                group = [];
                packageGroups.set(packageId, group);
            }
            group.push(classId);
        }

        if (progressCallback && (classId % 500 === 0 || classId === totalTypes - 1)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Grouping inner classes and packages: ${classId + 1} / ${totalTypes}`,
                progress: ((classId + 1) / totalTypes) * 50,
                current: classId + 1,
                total: totalTypes
            });
        }
    }

    const siblingGroups = [];
    for (const group of enclosingGroups.values()) {
        if (group.length >= 2) {
            siblingGroups.push(group);
        }
    }

    let groupsProcessed = 0;
    for (const group of siblingGroups) {
        markSymmetricRelationshipClique(group, RELATIONSHIP.SIBLING);
        groupsProcessed++;
        if (progressCallback && (groupsProcessed % 10 === 0 || groupsProcessed === siblingGroups.length)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Marking siblings: ${groupsProcessed} / ${siblingGroups.length}`,
                progress: 50 + (groupsProcessed / siblingGroups.length) * 25,
                current: groupsProcessed,
                total: siblingGroups.length
            });
        }
    }

    const roommateGroups = [];
    for (const group of packageGroups.values()) {
        if (group.length >= 2) {
            roommateGroups.push(group);
        }
    }

    groupsProcessed = 0;
    for (const group of roommateGroups) {
        markSymmetricRelationshipClique(group, RELATIONSHIP.ROOMMATE);
        groupsProcessed++;
        if (progressCallback && (groupsProcessed % 10 === 0 || groupsProcessed === roommateGroups.length)) {
            progressCallback({
                type: 'progress',
                stage: 'marking_relationships',
                message: `Marking roommates: ${groupsProcessed} / ${roommateGroups.length}`,
                progress: 75 + (groupsProcessed / roommateGroups.length) * 25,
                current: groupsProcessed,
                total: roommateGroups.length
            });
        }
    }
}

async function markAllRelationships(progressCallback = null) {
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

    if (DATA.types.length <= 20000) {
        await markInnerClassAndPackageRelationships(progressCallback);
    }
}

async function optimizeDataSearch(progressCallback = null) {
    DATA._optimized = true;
    DATA._wildcard_types = [];
    DATA._parameterized_types = [];
    DATA._raw_types = [];
    DATA._type_variables = [];
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
        await indexClass(i);
        processedCount++;
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

    const memberMaps = buildMemberIdToOwningClassIds();

    await Promise.all([
        markFieldTypeRelationships(progressCallback, memberMaps.fieldIdToClasses),
        markMethodTypeRelationships(progressCallback, memberMaps.methodIdToClasses),
        markConstructorParameterTypeRelationships(progressCallback, memberMaps.constructorIdToClasses),
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