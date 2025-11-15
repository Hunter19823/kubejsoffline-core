function cachedFunction(func) {
    const cache = {};

    return function (...args) {
        const key = JSON.stringify(args);
        if (!(key in cache)) {
            cache[key] = func(...args);
        }
        return cache[key];
    };
}


function clearAllCaches() {
    LOOK_UP_CACHE.clear();
    RELATIONSHIP_GRAPH.clear();
    for (let i = 0; i < DATA.types.length; i++) {
        delete DATA.types[i]._name_cache;
        delete DATA.types[i]._cachedInheritedClasses;
        delete DATA.types[i]._cachedPackageName;
        delete DATA.types[i]._id;
    }
    DATA._eventsIndexed = false;
    DATA._optimized = false;
}

function deobfuscateData(data) {
    if (typeof data === 'number') {
        data = getClass(data).data;
    }
    if (Array.isArray(data)) {
        return data.map((content) => {
            return deobfuscateData(content);
        });
    }
    let deobfuscatedData = {};
    for (let prop of Object.entries(PROPERTY)) {
        if (exists(data[prop[1]])) {
            deobfuscatedData[prop[0]] = data[prop[1]];
            if (Array.isArray(deobfuscatedData[prop[0]])) {
                deobfuscatedData[prop[0]] = deobfuscatedData[prop[0]].map((content) => {
                    if (typeof content === 'number')
                        return getClass(content).data;
                    return deobfuscateData(content);
                });
            }
        }
    }
    return deobfuscatedData;
}

/**
 * A helper function to join text by some separator with options for prefixes and suffixes.
 * @template T
 * @param values{Array<T>} the values to join
 * @param separator{string} the separator to use
 * @param transformer{function(T): string} the transformer to use
 * @param prefix{string?} the prefix to use
 * @param suffix{string?} the suffix to use
 * @returns {string} the span element
 */
function joiner(values, separator, transformer = (a) => a, prefix = "", suffix = "") {
    if (!exists(transformer)) {
        transformer = (a) => a;
    }
    let output = prefix;
    for (let i = 0; i < values.length; i++) {
        output += transformer(values[i]);
        // If not the last element, add the separator
        if (i < values.length - 1) {
            output += separator;
        }
    }
    output += suffix;
    return output;

}

function removeCircularTypeVariables(typeVariableMap) {
    // Remove any entries that equal their own key
    for (let [key, value] of Object.entries(typeVariableMap)) {
        // noinspection EqualityComparisonWithCoercionJS
        if (key == value) {
            delete typeVariableMap[key];
        }
    }
    return typeVariableMap;
}

/**
 * Creates a TypeVariableMap from a given class.
 * @param type {TypeIdentifier} the id of the type
 * @param existingMap {TypeVariableMap} The existing map to add to (optional)
 * @returns {TypeVariableMap} the created TypeVariableMap
 */
function createTypeVariableMap(type, existingMap = {}) {
    return computeExhaustiveMapping(type);
}

function remapTypeVariables(typeVariableMap, parameterizedType) {
    const classType = getClass(parameterizedType);
    if (!classType.isParameterizedType()) {
        console.error("Type is not a parameterized type. Cannot remap type variables.");
        throw new Error("Invalid state has been reached.");
    }
    const rawTypeId = classType.getRawType();
    const rawType = getClass(rawTypeId);
    if (!rawType.isRawClass()) {
        console.error("Raw type is not a raw class. Cannot remap type variables.");
        throw new Error("Invalid state has been reached.");
    }
    const typeVariables = rawType.getTypeVariables();
    const actualTypes = classType.getTypeVariables();
    TYPE_LOOP:
        for (let i = 0; i < typeVariables.length; i++) {
            if (exists(typeVariableMap[typeVariables[i]])) {
                continue;
            }
            let actualTypeId = actualTypes[i];
            let actualType = getClass(actualTypeId);
            if (!exists(actualType)) {
                throw new Error(`Actual type is not defined. Cannot remap type variables. Parameterized Type: ${parameterizedType} Raw type: ${rawType.getId()} Type: ${typeVariables[i]}, Actual Type: ${actualTypeId}`);
            }
            if (!actualType.isTypeVariable()) {
                typeVariableMap[typeVariables[i]] = actualTypes[i];
                continue;
            }
            let iterationCounter = 0;
            while (exists(typeVariableMap[actualTypeId]) && iterationCounter < 10) {
                const remappedTypeId = typeVariableMap[actualTypeId];
                const remappedType = getClass(remappedTypeId);
                iterationCounter++;
                if (remappedType.isTypeVariable()) {
                    actualTypeId = remappedTypeId;
                    actualType = remappedType;
                } else {
                    typeVariableMap[typeVariables[i]] = remappedTypeId;
                    continue TYPE_LOOP;
                }
            }
            if (iterationCounter >= 1000) {
                throw new Error("Infinite Loop Detected. Cannot remap type variables.");
            }

            typeVariableMap[typeVariables[i]] = actualTypeId;
        }
}


function computeConsolidatedMapping(id) {
    let type = getClass(id);
    let mapping = {};
    if (!type.isRawClass()) {
        return mapping;
    }
    // type.getTypeVariables().forEach((typeVariableId) => {
    //     mapping[typeVariableId] = typeVariableId;
    // });
    let superType = type.getSuperClass();
    extractSuperMapping(superType, mapping);

    type.getInterfaces().forEach((interfaceId) => {
        extractSuperMapping(interfaceId, mapping);
    });

    let superMapping = exists(superType) ? computeConsolidatedMapping(superType) : {};
    let interfaceMappings = [];

    type.getInterfaces().forEach((interfaceId) => {
        interfaceMappings.push(computeConsolidatedMapping(interfaceId));
    });

    let areAllInterfacesEmpty = interfaceMappings.filter(
        (mapping) => !isMapEmpty(mapping)
    ).length === 0;
    if (isMapEmpty(superMapping) && areAllInterfacesEmpty) {
        return mapping;
    }

    // putAll(mapping, superMapping);
    //
    // interfaceMappings.forEach((interfaceMapping) => {
    //     putAll(mapping, interfaceMapping);
    // });

    let merged = transformMapping(superMapping, mapping);
    interfaceMappings.forEach((interfaceMapping) => {
        putAll(merged, transformMapping(interfaceMapping, mapping));
    });

    putAll(merged, mapping);


    return merged;
}

function isMapEmpty(map) {
    return Object.keys(map).length === 0;
}

function putAll(targetMap, sourceMap) {
    for (let [key, value] of Object.entries(sourceMap)) {
        targetMap[key] = value;
    }
}

function transformMapping(typeVariableMap, overrideMap) {
    if (isMapEmpty(typeVariableMap)) {
        return typeVariableMap;
    }
    let result = {};
    for (let [key, value] of Object.entries(typeVariableMap)) {
        if (exists(overrideMap[value])) {
            result[key] = overrideMap[value];
        }else {
            result[key] = value;
        }
    }
    return result;
}

function extractSuperMapping(id, typeVariableMap) {
    if (!exists(typeVariableMap)) {
        throw new Error("Type Variable Map must be provided to extract super mapping.");
    }
    if (!exists(id)) {
        return;
    }
    let type = getClass(id);
    if (!type.isParameterizedType()) {
        return;
    }
    if (!exists(type.getRawType())) {
        throw new Error("Raw Type must exist for parameterized type to extract super mapping.");
    }
    let rawType = getClass(type.getRawType());
    let rawTypeVariables = rawType.getTypeVariables();
    let actualTypes = type.getTypeVariables();

    if (rawTypeVariables.length !== actualTypes.length) {
        throw new Error("Raw Type Variables and Actual Types length mismatch when extracting super mapping.");
    }

    for (let i = 0; i < rawTypeVariables.length; i++) {
        if (!exists(typeVariableMap[rawTypeVariables[i]])) {
            typeVariableMap[rawTypeVariables[i]] = actualTypes[i];
        }
    }
}

function computeExhaustiveMapping(id) {
    let type = getClass(id);
    let mapping = {};
    if (type.isWildcard()) {
        return mapping;
    }
    if (type.isTypeVariable()) {
        mapping[type.id()] = type.id();
        return mapping;
    }
    if (type.isParameterizedType()) {
        let rawType = getClass(type.getRawType());
        let ownerType = type.getOwnerType();
        let rawTypeVariables = rawType.getTypeVariables();
        let actualTypes = type.getTypeVariables();
        if (rawTypeVariables.length !== actualTypes.length) {
            throw new Error("Raw Type Variables and Actual Types length mismatch when computing exhaustive mapping.");
        }
        let rawMapping = computeExhaustiveMapping(type.getRawType());
        let ownerMapping = exists(ownerType) ? computeExhaustiveMapping(ownerType) : {};
        putAll(mapping, rawMapping);
        putAll(mapping, ownerMapping);
        for (let i = 0; i < rawTypeVariables.length; i++) {
            mapping[rawTypeVariables[i]] = actualTypes[i];
        }
        return mapping;
    }
    if (!type.isRawClass()) {
        throw new Error("Type must be a raw class, parameterized type, type variable, or wildcard to compute exhaustive mapping.");
    }
    let superType = type.getSuperClass();
    let interfaces = type.getInterfaces();
    let superMapping = exists(superType) ? computeExhaustiveMapping(superType) : {};
    let interfaceMappings = interfaces.map((interfaceId) => computeExhaustiveMapping(interfaceId));

    putAll(mapping, superMapping);
    interfaceMappings.forEach((interfaceMapping) => {
        putAll(mapping, interfaceMapping);
    });

    return mapping;
}

function getGenericDefinition(type, typeVariableMap, includeGenerics = true) {
    return cachedGenericDefinition(type,
        new name_parameters()
            .setTypeVariableMap(typeVariableMap)
            .setDefiningTypeVariable(false)
            .setAppendPackageName(true)
            .setIncludeGenerics(includeGenerics)
    );
}

function getGenericDefinitionWithoutPackage(type, typeVariableMap, includeGenerics = true) {
    return cachedGenericDefinition(type,
        new name_parameters()
            .setTypeVariableMap(typeVariableMap)
            .setDefiningTypeVariable(false)
            .setAppendPackageName(false)
            .setIncludeGenerics(includeGenerics)
    );
}

function getGenericName(type, typeVariableMap, includeGenerics = true) {
    return cachedGenericDefinition(type,
        new name_parameters()
            .setTypeVariableMap(typeVariableMap)
            .setDefiningTypeVariable(false)
            .setAppendPackageName(false)
            .setIncludeGenerics(includeGenerics)
    );
}

function getGenerics(actualTypes, config) {
    if (actualTypes.length === 0 || !config.getIncludeGenerics()) {
        return "";
    }
    return joiner(
        actualTypes,
        ", ",
        (actualType) => cachedGenericDefinition(actualType, config.setDefiningTypeVariable(true, actualType)),
        "<",
        ">"
    );

}

function getParameterizedName(type, config) {
    // Append the package name as long as the owner type does not exist and appendPackageName is true
    const rawTypeName = cachedGenericDefinition(type.getRawType(), config.setAppendPackageName(config.getAppendPackageName() && !exists(type.getOwnerType())).disableEnclosingName(true));
    const ownerType = type.getOwnerType();
    const ownerPrefix = (exists(ownerType) && (!config.getDefiningParameterizedType()) ? cachedGenericDefinition(ownerType, config.disableEnclosingName(true)) + "$" : "");
    const actualTypes = type.getTypeVariables();
    const genericArguments = getGenerics(actualTypes, config.disableEnclosingName(true));

    return ownerPrefix + rawTypeName + genericArguments;
}

function getWildcardName(type, config) {
    const name = "?";
    const lowerBounds = type.getLowerBound();
    if (lowerBounds.length !== 0) {
        return name + joiner(
            lowerBounds,
            " & ",
            (bound) => cachedGenericDefinition(bound, config),
            " super "
        );
    }
    const upperBounds = type.getUpperBound();
    if (upperBounds.length !== 0) {
        return name + joiner(
            upperBounds,
            " & ",
            (bound) => cachedGenericDefinition(bound, config),
            " extends "
        );
    }
    return name;
}

function getTypeVariableName(type, config) {
    const typeVariableName = getNameData(type.data[PROPERTY.TYPE_VARIABLE_NAME]);
    if (config.getDefiningTypeVariable(type.id())) {
        return typeVariableName;
    }
    const bounds = type.getTypeVariableBounds();
    if (bounds.length === 0) {
        return typeVariableName;
    }
    return typeVariableName + joiner(bounds, " & ", (bound) => cachedGenericDefinition(bound, config.setDefiningTypeVariable(true, type.id())), " extends ");
}

function getRawClassName(type, config) {
    const name = getNameData(type.data[PROPERTY.CLASS_NAME])
    if (config.getAppendPackageName()) {
        if (type.package() === '') {
            return name;
        }
        return type.package() + "." + name;
    } else {
        return name;
    }
}

function getGenericDefinitionLogic(type, config) {
    type = getClass(type);
    if (type.isTypeVariable()) {
        let newType = config.remapType(type);
        if (newType.id() !== type.id()) {
            return getGenericDefinitionLogic(newType, config);
        }
    }
    if (type.isRawClass()) {
        if (exists(type.getDeclaringClass())) {
            return cachedGenericDefinition(type.getDeclaringClass(), config) + "$" + getRawClassName(type, config.setAppendPackageName(false));
        }
        return getRawClassName(type, config);
    }
    if (type.isTypeVariable()) {
        return getTypeVariableName(type, config);
    }
    if (type.isWildcard()) {
        return getWildcardName(type, config);
    }
    if (type.isParameterizedType()) {
        return getParameterizedName(type, config);
    }

    console.error("Unknown Type! Cannot get generic definition for: ", type.id(), type.data);
    return "Unknown Type";


}


cachedGenericDefinition = cachedFunction(getGenericDefinitionLogic);

name_parameters = class {
    constructor() {
        this.typeVariableMap = {};
        this.isDefiningTypeVariable = false;
        this.appendPackageName = true;
        this.includeGenerics = false;
        this.isDefiningParameterizedType = false;
        this.overrideID = null;
        this.typeVariablesBeingDefined = new Set();
    }

    clone() {
        return Object.assign(new name_parameters(), this);
    }

    setTypeVariableMap(typeVariableMap) {
        const clone = this.clone();
        clone.typeVariableMap = typeVariableMap;
        return clone;
    }

    setDefiningTypeVariable(isDefiningTypeVariable, typeVariable) {
        const clone = this.clone();
        clone.isDefiningTypeVariable = isDefiningTypeVariable;
        clone.typeVariablesBeingDefined = new Set(clone.typeVariablesBeingDefined);
        if (exists(typeVariable)) {
            clone.typeVariablesBeingDefined.add(Array.isArray(typeVariable) ? typeVariable[0] : typeVariable);
        }
        return clone;
    }

    setAppendPackageName(appendPackageName) {
        const clone = this.clone();
        clone.appendPackageName = appendPackageName;
        return clone;
    }

    setIncludeGenerics(includeGenerics) {
        const clone = this.clone();
        clone.includeGenerics = includeGenerics;
        return clone;
    }

    disableEnclosingName(isDefiningParameterizedType) {
        const clone = this.clone();
        clone.isDefiningParameterizedType = isDefiningParameterizedType;
        return clone;
    }

    setOverrideID(overrideID) {
        const clone = this.clone();
        clone.overrideID = overrideID;
        return clone;
    }

    getTypeVariableMap() {
        return this.typeVariableMap;
    }

    getDefiningTypeVariable(typeVariable) {
        if (!exists(typeVariable))
            return this.isDefiningTypeVariable;
        return this.isDefiningTypeVariable && this.typeVariablesBeingDefined.has(Array.isArray(typeVariable) ? typeVariable[0] : typeVariable);
    }

    getAppendPackageName() {
        return this.appendPackageName;
    }

    getIncludeGenerics() {
        return this.includeGenerics;
    }

    getDefiningParameterizedType() {
        return this.isDefiningParameterizedType;
    }

    getOverrideID() {
        return this.overrideID;
    }

    remapType(type) {
        if (typeof type === 'number') {
            if (exists(this.typeVariableMap[type])) {
                return getClass(this.typeVariableMap[type]);
            } else {
                return getClass(type);
            }
        }
        if (exists(type['isTypeVariable'])) {
            if (exists(this.typeVariableMap[type.id()])) {
                return getClass(this.typeVariableMap[type.id()]);
            } else {
                return type;
            }
        }
        return type;
    }
}

/**
 * A helper function to create a span element
 * that consists of a list of elements.
 * @template T
 * @param values{Array<T>} the values to join
 * @param separator{string} the separator to use
 * @param transformer{function(T): HTMLElement} the transformer to use
 * @param prefix{HTMLElement?} the prefix to use
 * @param suffix{HTMLElement?} the suffix to use
 * @returns {Array<HTMLSpanElement>} the span element
 */
function tagJoiner(values, separator, transformer = (a) => span(a), prefix, suffix) {
    if (!exists(transformer)) {
        transformer = (a) => span(a);
    }
    const output = [];
    if (prefix) {
        output.push(prefix);
    }
    for (let i = 0; i < values.length; i++) {
        output.push(transformer(values[i]));
        // If not the last element, add the separator
        if (i < values.length - 1) {
            output.push(span(separator));
        }
    }
    if (suffix) {
        output.push(suffix);
    }
    return output;

}

/**
 * Generates the HTML signature for a raw class.
 * @param type {JavaType} the type to create the signature for
 * @param outputSpan {HTMLElement} the span to append the signature to
 * @param config {signature_parameters} the config to use
 * @returns {*}
 */
function getRawClassSignature(type, outputSpan, config) {
    const name = getNameData(type.data[PROPERTY.CLASS_NAME])
    if (type.isInnerClass() && config.getIncludeEnclosingClass()) {
        outputSpan.append(createLinkableSignature(type.getEnclosingClass(), config));
        outputSpan.append(span('$'));
        config = config.setAppendPackageName(false);
    }
    if (config.getAppendPackageName() && type.package() && typeof type.package() === 'string' && type.package().length > 0) {
        outputSpan.append(span(type.package()));
        outputSpan.append(span('.'));
        config = config.setAppendPackageName(false);
    }

    outputSpan.append(createLink(span(name), config.getLinkableID(type.id())));

    if (config.getDefiningParameterizedType()) {
        return outputSpan;
    }
    const typeVariables = type.getTypeVariables();
    if (typeVariables.length === 0) {
        return outputSpan;
    }
    tagJoiner(
        typeVariables,
        ", ",
        (actualType) => createLinkableSignature(
            actualType,
            config,
        ),
        span("<"),
        span(">")
    ).forEach((node) => outputSpan.append(node));

    return outputSpan;
}
/**
 * Generates the HTML signature for a type variable.
 * Appends the type variable name as a link to the output span.
 * If the type variable has bounds, appends them using "extends" and links for each bound.
 *
 * @param {JavaType} type - The type variable to generate the signature for.
 * @param {HTMLElement} outputSpan - The span element to append the signature to.
 * @param {signature_parameters} config - The configuration for signature generation.
 * @returns {HTMLElement} The span element containing the type variable signature.
 */
function getTypeVariableSignature(type, outputSpan, config) {
    const typeVariableName = getNameData(type.data[PROPERTY.TYPE_VARIABLE_NAME]);
    if (config.getDefiningTypeVariable(type.id()) || config.getDefiningParameterizedType()) {
        outputSpan.append(createLink(span(typeVariableName), config.getLinkableID(type.id())));
        return outputSpan;
    }
    const bounds = type.getTypeVariableBounds();
    if (bounds.length === 0) {
        outputSpan.append(createLink(span(typeVariableName), config.getLinkableID(type.id())));
        return outputSpan;
    }
    outputSpan.append(createLink(span(typeVariableName), config.getLinkableID(type.id())));
    tagJoiner(
        bounds,
        " & ",
        (bound) => createLinkableSignature(
            bound,
            config.setDefiningTypeVariable(true, type.id())
        ),
        span(" extends ")
    ).forEach((node) => outputSpan.append(node));
    return outputSpan;
}

/**
 * Creates a wildcard signature for a given type.
 * @param type {JavaType} the type to create the signature for
 * @param outputSpan {HTMLElement} the span to append the signature to
 * @param config {signature_parameters} the config to use
 * @returns {*} the span element containing the signature
 */
function getWildcardSignature(type, outputSpan, config) {
    const name = "?";
    outputSpan.append(span(name));
    const lowerBounds = type.getLowerBound();
    if (lowerBounds.length !== 0) {
        tagJoiner(
            lowerBounds,
            " & ",
            (bound) => createLinkableSignature(
                bound,
                config
            ),
            span(" super ")
        ).forEach((node) => outputSpan.append(node));
        return outputSpan;
    }
    const upperBounds = type.getUpperBound();
    if (upperBounds.length !== 0) {
        tagJoiner(
            upperBounds,
            " & ",
            (bound) => createLinkableSignature(
                bound,
                config,
            ),
            span(" extends ")
        ).forEach((node) => outputSpan.append(node));
        return outputSpan;
    }
    return outputSpan;
}

/**
 * Creates a parameterized type signature for a given type.
 * @param type {JavaType} the type to create the signature for
 * @param outputSpan {HTMLElement} the span to append the signature to
 * @param config {signature_parameters} the config to use
 * @returns {HTMLElement} the span element containing the signature
 */
function getParameterizedTypeSignature(type, outputSpan, config) {
    const ownerType = type.getOwnerType();
    const actualTypes = type.getTypeVariables();
    for (let i = 0; i < actualTypes.length; i++) {
        config = config.setDefiningTypeVariable(true, actualTypes[i]);
    }
    if (exists(ownerType) && !config.getDefiningParameterizedType()) {
        const ownerPrefix = createLinkableSignature(
            ownerType,
            config
                .setDefiningParameterizedType(false)
                .setOverrideID(type.id())
        );
        outputSpan.append(ownerPrefix);
        outputSpan.append(span('$'));
        config = config.setAppendPackageName(false);
    }
    const rawTypeName = createLinkableSignature(
        type.getRawType(),
        config
            .setDefiningParameterizedType(true)
            .disableEnclosingClass()
            .setOverrideID(type.id())
    );
    outputSpan.append(rawTypeName);
    if (actualTypes.length === 0) {
        return outputSpan;
    }
    tagJoiner(
        actualTypes,
        ", ",
        (actualType) => createLinkableSignature(
            actualType,
            config.setDefiningTypeVariable(true, actualType)
        ),
        span("<"),
        span(">")
    ).forEach((node) => outputSpan.append(node));
    return outputSpan;
}

/**
 * Creates a linkable signature for a given type.
 * @param type {JavaType | TypeIdentifier} the type to create the signature for
 * @param config {signature_parameters} the config to use
 * @returns {HTMLElement} the span element containing the signature
 */
function createLinkableSignature(type, config) {
    type = getClass(type);
    if (type.isTypeVariable()) {
        let newType = config.remapType(type);
        if (newType.id() !== type.id()) {
            return createLinkableSignature(newType, config);
        }
    }
    const outputSpan = document.createElement('span');
    if (type.isRawClass()) {
        return getRawClassSignature(type, outputSpan, config);
    }
    if (type.isTypeVariable()) {
        return getTypeVariableSignature(type, outputSpan, config);
    }
    if (type.isWildcard()) {
        return getWildcardSignature(type, outputSpan, config);
    }
    if (type.isParameterizedType()) {
        return getParameterizedTypeSignature(type, outputSpan, config);
    }

    console.error("Unknown Type! Cannot get generic definition for: ", type.id(), type.data);
    return span("Unknown Type");
}

signature_parameters = class {
    constructor() {
        this.typeVariableMap = {};
        this.isDefiningTypeVariable = false;
        this.appendPackageName = true;
        this.overrideID = null;
        this.isDefiningParameterizedType = false;
        this.includeEnclosingClass = true;
        this.typeVariablesBeingDefined = new Set();
    }

    clone() {
        return Object.assign(new signature_parameters(), this);
    }

    setTypeVariableMap(typeVariableMap) {
        const clone = this.clone();
        clone.typeVariableMap = typeVariableMap;
        return clone;
    }

    setDefiningTypeVariable(isDefiningTypeVariable, typeVariable) {
        const clone = this.clone();
        clone.isDefiningTypeVariable = isDefiningTypeVariable;
        clone.typeVariablesBeingDefined = new Set(clone.typeVariablesBeingDefined);
        if (exists(typeVariable)) {
            clone.typeVariablesBeingDefined.add(Array.isArray(typeVariable) ? typeVariable[0] : typeVariable);
        }
        return clone;
    }

    setAppendPackageName(appendPackageName) {
        const clone = this.clone();
        clone.appendPackageName = appendPackageName;
        return clone;
    }

    setOverrideID(overrideID) {
        const clone = this.clone();
        clone.overrideID = overrideID;
        return clone;
    }

    setDefiningParameterizedType(isDefiningParameterizedType) {
        const clone = this.clone();
        clone.isDefiningParameterizedType = isDefiningParameterizedType;
        return clone;
    }

    disableDeclaringClass() {
        const clone = this.clone();
        clone.includeDeclaringClass = false;
        return clone;
    }

    disableEnclosingClass() {
        const clone = this.clone();
        clone.includeEnclosingClass = false;
        return clone;
    }

    getTypeVariableMap() {
        return this.typeVariableMap;
    }

    getDefiningTypeVariable(typeVariable) {
        if (!exists(typeVariable))
            return this.isDefiningTypeVariable;
        return this.isDefiningTypeVariable && this.typeVariablesBeingDefined.has(Array.isArray(typeVariable) ? typeVariable[0] : typeVariable);
    }

    getAppendPackageName() {
        return this.appendPackageName;
    }

    getOverrideID() {
        return this.overrideID;
    }

    getLinkableID(fallbackId) {
        if (exists(this.overrideID)) {
            return this.overrideID;
        }
        if (exists(fallbackId)) {
            return fallbackId;
        }
        throw new Error("No override ID or fallback ID provided. Cannot create linkable signature.");
    }

    getDefiningParameterizedType() {
        return this.isDefiningParameterizedType;
    }

    getIncludeEnclosingClass() {
        return this.includeEnclosingClass;
    }

    remapType(type) {
        if (typeof type === 'number') {
            if (exists(this.typeVariableMap[type])) {
                return getClass(this.typeVariableMap[type]);
            } else {
                return getClass(type);
            }
        }
        if (exists(type['isTypeVariable'])) {
            if (exists(this.typeVariableMap[type.id()])) {
                return getClass(this.typeVariableMap[type.id()]);
            } else {
                return type;
            }
        }
        return type;
    }
}

