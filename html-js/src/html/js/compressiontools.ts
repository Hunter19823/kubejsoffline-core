interface NameParametersInstance {
    setTypeVariableMap(typeVariableMap: TypeVariableMap): NameParametersInstance;
    setDefiningTypeVariable(isDefiningTypeVariable: boolean, typeVariable?: number | number[]): NameParametersInstance;
    setAppendPackageName(appendPackageName: boolean): NameParametersInstance;
    setIncludeGenerics(includeGenerics: boolean): NameParametersInstance;
    disableEnclosingName(isDefiningParameterizedType: boolean): NameParametersInstance;
    setOverrideID(overrideID: number | null): NameParametersInstance;
    getTypeVariableMap(): TypeVariableMap;
    getDefiningTypeVariable(typeVariable?: number | number[]): boolean;
    getAppendPackageName(): boolean;
    getIncludeGenerics(): boolean;
    getDefiningParameterizedType(): boolean;
    getOverrideID(): number | null;
    remapType(type: number | JavaType): JavaType;
}

interface SignatureParametersInstance {
    setTypeVariableMap(typeVariableMap: TypeVariableMap): SignatureParametersInstance;
    setDefiningTypeVariable(isDefiningTypeVariable: boolean, typeVariable?: number | number[]): SignatureParametersInstance;
    setAppendPackageName(appendPackageName: boolean): SignatureParametersInstance;
    setOverrideID(overrideID: number | null): SignatureParametersInstance;
    setDefiningParameterizedType(isDefiningParameterizedType: boolean): SignatureParametersInstance;
    disableDeclaringClass(): SignatureParametersInstance;
    disableEnclosingClass(): SignatureParametersInstance;
    getTypeVariableMap(): TypeVariableMap;
    getDefiningTypeVariable(typeVariable?: number | number[]): boolean;
    getAppendPackageName(): boolean;
    getOverrideID(): number | null;
    getLinkableID(fallbackId?: number): number;
    getDefiningParameterizedType(): boolean;
    getIncludeEnclosingClass(): boolean;
    remapType(type: number | JavaType): JavaType;
}

declare var name_parameters: {
    new (): NameParametersInstance;
};

declare var signature_parameters: {
    new (): SignatureParametersInstance;
};

type TypeVariableMap = Record<string, number>;

function cachedFunction<F extends (...args: never[]) => unknown>(func: F): F {
    const cache: Record<string, unknown> = {};

    return function (this: unknown, ...args: Parameters<F>) {
        const key = JSON.stringify(args);
        if (!(key in cache)) {
            cache[key] = func(...args);
        }
        return cache[key];
    } as F;
}

function classOf(id: number | JavaType): JavaType {
    const type = getClass(id);
    if (!type) {
        throw new Error('Missing type for id: ' + String(id));
    }
    return type;
}


function clearAllCaches() {
    LOOK_UP_CACHE.clear();
    RELATIONSHIP_GRAPH.clear();
    // Clear global LRU caches if they exist
    if (typeof CLASS_CACHES !== 'undefined') {
        CLASS_CACHES.fieldsShallow.clear();
        CLASS_CACHES.fieldsDeep.clear();
        CLASS_CACHES.methodsShallow.clear();
        CLASS_CACHES.methodsDeep.clear();
        CLASS_CACHES.constructors.clear();
        CLASS_CACHES.packageNames.clear();
        CLASS_CACHES.inheritedClasses.clear();
    }
    for (let i = 0; i < DATA.types.length; i++) {
        delete DATA.types[i]._name_cache;
        // Old cache properties - may not exist anymore but safe to delete
        delete DATA.types[i]._cachedInheritedClasses;
        delete DATA.types[i]._cachedPackageName;
        delete DATA.types[i]._field_cache;
        delete DATA.types[i]._shallow_field_cache;
        delete DATA.types[i]._method_cache;
        delete DATA.types[i]._shallow_method_cache;
        delete DATA.types[i]._constructor_cache;
        delete DATA.types[i]._id;
    }
    DATA._eventsIndexed = false;
    DATA._optimized = false;
}

function deobfuscateData(data: unknown): unknown {
    if (typeof data === 'number') {
        data = classOf(data).data;
    }
    if (Array.isArray(data)) {
        return data.map((content) => {
            return deobfuscateData(content);
        });
    }
    const source = data as Record<string, unknown>;
    const deobfuscatedData: Record<string, unknown> = {};
    for (const prop of Object.entries(PROPERTY)) {
        if (exists(source[prop[1]])) {
            deobfuscatedData[prop[0]] = source[prop[1]];
            if (Array.isArray(deobfuscatedData[prop[0]])) {
                deobfuscatedData[prop[0]] = (deobfuscatedData[prop[0]] as unknown[]).map((content) => {
                    if (typeof content === 'number') {
                        return classOf(content).data;
                    }
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
function joiner<T>(
    values: T[],
    separator: string,
    transformer: (value: T) => string = (a) => String(a),
    prefix = '',
    suffix = ''
) {
    if (!exists(transformer)) {
        transformer = (a) => String(a);
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

/**
 * Creates a TypeVariableMap from a given class.
 * @param type {TypeIdentifier} the id of the type
 * @param existingMap {TypeVariableMap} The existing map to add to (optional)
 * @returns {TypeVariableMap} the created TypeVariableMap
 */
function createTypeVariableMap(type: number, _existingMap: TypeVariableMap = {}): TypeVariableMap {
    return computeExhaustiveMapping(type);
}

function computeConsolidatedMapping(id: number): TypeVariableMap {
    const type = classOf(id);
    const mapping: TypeVariableMap = {};
    if (!type.isRawClass()) {
        return mapping;
    }
    const superType = type.getSuperClass();
    if (exists(superType)) {
        extractSuperMapping(superType, mapping);
    }

    type.getInterfaces().forEach((interfaceId) => {
        extractSuperMapping(interfaceId as number, mapping);
    });

    let superMapping: TypeVariableMap = exists(superType) ? computeConsolidatedMapping(superType!) : {};
    const interfaceMappings: TypeVariableMap[] = [];

    type.getInterfaces().forEach((interfaceId) => {
        interfaceMappings.push(computeConsolidatedMapping(interfaceId as number));
    });

    let areAllInterfacesEmpty = interfaceMappings.filter(
        (mapping) => !isMapEmpty(mapping)
    ).length === 0;
    if (isMapEmpty(superMapping) && areAllInterfacesEmpty) {
        return mapping;
    }

    let merged = transformMapping(superMapping, mapping);
    interfaceMappings.forEach((interfaceMapping) => {
        putAll(merged, transformMapping(interfaceMapping, mapping));
    });

    putAll(merged, mapping);


    return merged;
}

function isMapEmpty(map: TypeVariableMap): boolean {
    return Object.keys(map).length === 0;
}

function putAll(targetMap: TypeVariableMap, sourceMap: TypeVariableMap): void {
    for (const [key, value] of Object.entries(sourceMap)) {
        targetMap[key] = value;
    }
}

function transformMapping(typeVariableMap: TypeVariableMap, overrideMap: TypeVariableMap): TypeVariableMap {
    if (isMapEmpty(typeVariableMap)) {
        return typeVariableMap;
    }
    const result: TypeVariableMap = {};
    for (const [key, value] of Object.entries(typeVariableMap)) {
        const overrideKey = String(value);
        if (exists(overrideMap[overrideKey])) {
            result[key] = overrideMap[overrideKey];
        } else {
            result[key] = value;
        }
    }
    return result;
}

function extractSuperMapping(id: number | null | undefined, typeVariableMap: TypeVariableMap): void {
    try {
        if (!exists(typeVariableMap)) {
            throw new Error("Type Variable Map must be provided to extract super mapping.");
        }
        if (!exists(id)) {
            return;
        }
        const type = classOf(id);
        if (!type.isParameterizedType()) {
            return;
        }
        if (!exists(type.getRawType())) {
            throw new Error("Raw Type must exist for parameterized type to extract super mapping.");
        }
        const rawType = classOf(type.getRawType()!);
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
    } catch (e) {
        console.error("Error extracting super mapping for type ID: " + id, e);
    }
}

function computeExhaustiveMapping(id: number): TypeVariableMap {
    const mapping: TypeVariableMap = {};
    try {
        const type = classOf(id);
        if (type.isWildcard()) {
            return mapping;
        }
        if (type.isTypeVariable()) {
            mapping[type.id()] = type.id();
            return mapping;
        }
        if (type.isParameterizedType()) {
            const rawType = classOf(type.getRawType()!);
            let ownerType = type.getOwnerType();
            let rawTypeVariables = rawType.getTypeVariables();
            let actualTypes = type.getTypeVariables();
            if (rawTypeVariables.length !== actualTypes.length) {
                throw new Error("Raw Type Variables and Actual Types length mismatch when computing exhaustive mapping.");
            }
            let rawMapping = computeExhaustiveMapping(type.getRawType()!);
            let ownerMapping: TypeVariableMap = exists(ownerType) ? computeExhaustiveMapping(ownerType!) : {};
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
        let superMapping: TypeVariableMap = exists(superType) ? computeExhaustiveMapping(superType!) : {};
        const interfaceMappings = interfaces.map((interfaceId) => computeExhaustiveMapping(interfaceId as number));

        putAll(mapping, superMapping);
        interfaceMappings.forEach((interfaceMapping) => {
            putAll(mapping, interfaceMapping);
        });
    } catch (e) {
        console.error("Error computing exhaustive mapping for type ID: " + id, e);
    }
    return mapping;
}

function getGenericDefinition(type: number, typeVariableMap: TypeVariableMap, includeGenerics = true): string {
    return cachedGenericDefinition(type,
        new name_parameters()
            .setTypeVariableMap(typeVariableMap)
            .setDefiningTypeVariable(false)
            .setAppendPackageName(true)
            .setIncludeGenerics(includeGenerics)
    );
}

function getGenericDefinitionWithoutPackage(type: number, typeVariableMap: TypeVariableMap, includeGenerics = true): string {
    return cachedGenericDefinition(type,
        new name_parameters()
            .setTypeVariableMap(typeVariableMap)
            .setDefiningTypeVariable(false)
            .setAppendPackageName(false)
            .setIncludeGenerics(includeGenerics)
    );
}

function getGenericName(type: number, typeVariableMap: TypeVariableMap, includeGenerics = true): string {
    return cachedGenericDefinition(type,
        new name_parameters()
            .setTypeVariableMap(typeVariableMap)
            .setDefiningTypeVariable(false)
            .setAppendPackageName(false)
            .setIncludeGenerics(includeGenerics)
    );
}

function getGenerics(actualTypes: number[], config: NameParametersInstance): string {
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

function getParameterizedName(type: JavaType, config: NameParametersInstance): string {
    // Append the package name as long as the owner type does not exist and appendPackageName is true
    const rawTypeName = cachedGenericDefinition(type.getRawType()!, config.setAppendPackageName(config.getAppendPackageName() && !exists(type.getOwnerType())).disableEnclosingName(true));
    const ownerType = type.getOwnerType();
    const ownerPrefix = (exists(ownerType) && (!config.getDefiningParameterizedType()) ? cachedGenericDefinition(ownerType!, config.disableEnclosingName(true)) + "$" : "");
    const actualTypes = type.getTypeVariables();
    const genericArguments = getGenerics(actualTypes, config.disableEnclosingName(true));

    return ownerPrefix + rawTypeName + genericArguments;
}

function getWildcardName(type: JavaType, config: NameParametersInstance): string {
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

function getTypeVariableName(type: JavaType, config: NameParametersInstance): string {
    const typeVariableName = getNameData(type.data[PROPERTY.TYPE_VARIABLE_NAME] as number);
    if (config.getDefiningTypeVariable(type.id())) {
        return typeVariableName;
    }
    let newType = config.remapType(type);
    if (newType.id() !== type.id()) {
        return getGenericDefinitionLogic(
            newType,
            config
                .setDefiningTypeVariable(true, type.id())
        );
    }
    const bounds = type.getTypeVariableBounds();
    if (bounds.length === 0) {
        return typeVariableName;
    }
    return typeVariableName + joiner(bounds, " & ", (bound) => cachedGenericDefinition(bound, config.setDefiningTypeVariable(true, type.id())), " extends ");
}

function getRawClassName(type: JavaType, config: NameParametersInstance): string {
    const name = getNameData(type.data[PROPERTY.CLASS_NAME] as number);
    if (config.getAppendPackageName()) {
        if (type.package() === '') {
            return name;
        }
        return type.package() + "." + name;
    } else {
        return name;
    }
}

function getGenericDefinitionLogic(type: number | JavaType, config: NameParametersInstance): string {
    type = classOf(type);
    if (type.isRawClass()) {
        if (exists(type.getDeclaringClass())) {
            return cachedGenericDefinition(type.getDeclaringClass()!, config) + "$" + getRawClassName(type, config.setAppendPackageName(false));
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


cachedGenericDefinition = cachedFunction(getGenericDefinitionLogic) as typeof cachedGenericDefinition;

name_parameters = class {
    typeVariableMap: TypeVariableMap;
    isDefiningTypeVariable: boolean;
    appendPackageName: boolean;
    includeGenerics: boolean;
    isDefiningParameterizedType: boolean;
    overrideID: number | null;
    typeVariablesBeingDefined: Set<number>;

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

    setTypeVariableMap(typeVariableMap: TypeVariableMap) {
        const clone = this.clone();
        clone.typeVariableMap = typeVariableMap;
        return clone;
    }

    setDefiningTypeVariable(isDefiningTypeVariable: boolean, typeVariable?: number | number[]) {
        const clone = this.clone();
        clone.isDefiningTypeVariable = isDefiningTypeVariable;
        clone.typeVariablesBeingDefined = new Set(clone.typeVariablesBeingDefined);
        if (exists(typeVariable)) {
            clone.typeVariablesBeingDefined.add(Array.isArray(typeVariable) ? typeVariable[0] : typeVariable);
        }
        return clone;
    }

    setAppendPackageName(appendPackageName: boolean) {
        const clone = this.clone();
        clone.appendPackageName = appendPackageName;
        return clone;
    }

    setIncludeGenerics(includeGenerics: boolean) {
        const clone = this.clone();
        clone.includeGenerics = includeGenerics;
        return clone;
    }

    disableEnclosingName(isDefiningParameterizedType: boolean) {
        const clone = this.clone();
        clone.isDefiningParameterizedType = isDefiningParameterizedType;
        return clone;
    }

    setOverrideID(overrideID: number | null) {
        const clone = this.clone();
        clone.overrideID = overrideID;
        return clone;
    }

    getTypeVariableMap() {
        return this.typeVariableMap;
    }

    getDefiningTypeVariable(typeVariable?: number | number[]) {
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

    remapType(type: number | JavaType): JavaType {
        if (typeof type === 'number') {
            if (exists(this.typeVariableMap[type])) {
                return classOf(this.typeVariableMap[type]);
            } else {
                return classOf(type);
            }
        }
        if (exists((type as JavaType & { isTypeVariable?: () => boolean }).isTypeVariable)) {
            if (exists(this.typeVariableMap[type.id()])) {
                return classOf(this.typeVariableMap[type.id()]);
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
function tagJoiner<T>(
    values: T[],
    separator: string,
    transformer: (value: T) => HTMLElement = (a) => span(String(a)),
    prefix?: HTMLElement,
    suffix?: HTMLElement
): HTMLElement[] {
    if (!exists(transformer)) {
        transformer = (a) => span(String(a));
    }
    const output: HTMLElement[] = [];
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
function getRawClassSignature(type: JavaType, outputSpan: HTMLElement, config: SignatureParametersInstance): HTMLElement {
    const name = getNameData(type.data[PROPERTY.CLASS_NAME] as number);
    if (type.isInnerClass() && config.getIncludeEnclosingClass()) {
        outputSpan.append(createLinkableSignature(type.getEnclosingClass()!, config));
        outputSpan.append(span('$'));
        config = config.setAppendPackageName(false);
    }
    if (config.getAppendPackageName() && type.package() && typeof type.package() === 'string' && type.package().length > 0) {
        outputSpan.append(span(type.package()));
        outputSpan.append(span('.'));
        config = config.setAppendPackageName(false);
    }

    outputSpan.append(createLink(span(name), config.getLinkableID(type.id())));

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
function getTypeVariableSignature(type: JavaType, outputSpan: HTMLElement, config: SignatureParametersInstance): HTMLElement {
    const typeVariableName = getNameData(type.data[PROPERTY.TYPE_VARIABLE_NAME] as number);
    if (config.getDefiningTypeVariable(type.id()) || config.getDefiningParameterizedType()) {
        outputSpan.append(createLink(span(typeVariableName), config.getLinkableID(type.id())));
        return outputSpan;
    }
    let newType = config.remapType(type);
    if (newType.id() !== type.id()) {
        return createLinkableSignature(
            newType,
            config.setDefiningTypeVariable(true, type.id())
        );
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
function getWildcardSignature(type: JavaType, outputSpan: HTMLElement, config: SignatureParametersInstance): HTMLElement {
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
function getParameterizedTypeSignature(type: JavaType, outputSpan: HTMLElement, config: SignatureParametersInstance): HTMLElement {
    const ownerType = type.getOwnerType();
    const actualTypes = type.getTypeVariables();
    for (let i = 0; i < actualTypes.length; i++) {
        config = config.setDefiningTypeVariable(true, actualTypes[i]);
    }
    if (exists(ownerType) && !config.getDefiningParameterizedType()) {
        const ownerPrefix = createLinkableSignature(
            ownerType!,
            config
                .setDefiningParameterizedType(false)
                .setOverrideID(type.id())
        );
        outputSpan.append(ownerPrefix);
        outputSpan.append(span('$'));
        config = config.setAppendPackageName(false);
    }
    const rawTypeName = createLinkableSignature(
        type.getRawType()!,
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
function createLinkableSignature(type: number | JavaType, config: SignatureParametersInstance): HTMLElement {
    type = classOf(type);
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
    typeVariableMap: TypeVariableMap;
    isDefiningTypeVariable: boolean;
    appendPackageName: boolean;
    overrideID: number | null;
    isDefiningParameterizedType: boolean;
    includeEnclosingClass: boolean;
    includeDeclaringClass?: boolean;
    typeVariablesBeingDefined: Set<number>;

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

    setTypeVariableMap(typeVariableMap: TypeVariableMap) {
        const clone = this.clone();
        clone.typeVariableMap = typeVariableMap;
        return clone;
    }

    setDefiningTypeVariable(isDefiningTypeVariable: boolean, typeVariable?: number | number[]) {
        const clone = this.clone();
        clone.isDefiningTypeVariable = isDefiningTypeVariable;
        clone.typeVariablesBeingDefined = new Set(clone.typeVariablesBeingDefined);
        if (exists(typeVariable)) {
            clone.typeVariablesBeingDefined.add(Array.isArray(typeVariable) ? typeVariable[0] : typeVariable);
        }
        return clone;
    }

    setAppendPackageName(appendPackageName: boolean) {
        const clone = this.clone();
        clone.appendPackageName = appendPackageName;
        return clone;
    }

    setOverrideID(overrideID: number | null) {
        const clone = this.clone();
        clone.overrideID = overrideID;
        return clone;
    }

    setDefiningParameterizedType(isDefiningParameterizedType: boolean) {
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

    getDefiningTypeVariable(typeVariable?: number | number[]) {
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

    getLinkableID(fallbackId?: number) {
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

    remapType(type: number | JavaType): JavaType {
        if (typeof type === 'number') {
            if (exists(this.typeVariableMap[type])) {
                return classOf(this.typeVariableMap[type]);
            } else {
                return classOf(type);
            }
        }
        if (exists((type as JavaType & { isTypeVariable?: () => boolean }).isTypeVariable)) {
            if (exists(this.typeVariableMap[type.id()])) {
                return classOf(this.typeVariableMap[type.id()]);
            } else {
                return type;
            }
        }
        return type;
    }
}

