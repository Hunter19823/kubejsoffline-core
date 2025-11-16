/**
 * Returns a method wrapper object with the given method data.
 *
 * @param methodData The blob of method data
 * @param typeVariableMap The type variable map to use for this method.
 * @param sourceClassId The class ID of the class declaring this method.
 * @param sourceMethodId The index of the method within the declaring class's method list.
 * @returns {Method}
 */
function getMethod(methodData, typeVariableMap = {}, sourceClassId, sourceMethodId) {
    if (!exists(methodData)) {
        throw new Error("Invalid method data: " + methodData);
    }
    if (!exists(sourceClassId)) {
        throw new Error("Declaring class ID must be provided for method.");
    }

    let output = {};

    output.data = decodeMethod(methodData);
    output.data._declaringClass = sourceClassId;
    output.data._declaringMethod = sourceMethodId;

    output = setBasicName(output);
    output = setRemapType(output);
    output = setModifiers(output);
    output = setAnnotations(output);
    output = setParameters(output, sourceClassId, sourceMethodId, null);
    output = setDataIndex(output);
    output = setDeclaringClass(output);
    output = setDeclaringMethod(output);
    output = setTypeVariables(output);
    output = setTypeVariableMap(output);
    output.withTypeVariableMap(typeVariableMap);

    output.toKubeJSStaticCall = function () {
        let parent = getClass(this.getDeclaringClass());
        let out = `// KJSODocs: ${this.hrefLink()}\n$${parent.simplename(this.getTypeVariableMap()).toUpperCase()}.${this.name()}(`;
        out += this.parameters().map((param) => param.name()).join(", ");

        out += `);`;
        return out;
    }

    output.toKubeJSCode = output.toKubeJSStaticCall;

    output.id = function () {
        let params = this.parameters().map((param) => {
            return param.id();
        }).join(",");
        // Generate a unique HTML ID for this method
        return `${getClass(this.getTypeWrapped()).getReferenceName(this.getTypeVariableMap())} ${this.getName()}(${params})`;

    }

    output.getId = output.id;

    output.hrefLink = function () {
        let url = CURRENT_URL.clone();
        url.params.set("focus", this.id());
        return url.href();
    }

    output.getHrefLink = output.hrefLink;

    output.toString = function () {
        let returnType = this.getTypeWrapped().toString();
        let modifier = MODIFIER.toString(this.getModifiers());
        let typeVariables = this.getTypeVariablesMapped().map((v) => getClass(v.id())).map((tv) => tv.toString());
        let params = this.parameters().map((param) => param.toString()).join(", ");
        let args = [
            modifier,
            typeVariables.length > 0 ? `<${typeVariables.join(", ")}>` : "",
            returnType,
            `${this.name()}(${params})`
        ];
        return args
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
            .join(" ");
    }

    /**
     * This method checks if another method is equal to this one.
     * Two methods are considered equal if they have the same name,
     * compatible return types, and compatible parameters.
     * @param otherMethod The other method to compare against.
     * @returns {boolean} True if the methods are equal, false otherwise.
     */
    output.areMethodsEqual = function(otherMethod) {
        if (this.getName() !== otherMethod.getName()) {
            return false;
        }
        let thisReturnType = this.getTypeWrapped();
        let otherReturnType = otherMethod.getTypeWrapped();
        // If this is compatible with other, return true
        let compatibleReturn = thisReturnType.isTypeCompatibleWith(otherReturnType) || otherReturnType.isTypeCompatibleWith(thisReturnType);
        if (!compatibleReturn) {
            return false;
        }
        let thisParams = this.parameters();
        let otherParams = otherMethod.parameters();
        if (thisParams.length !== otherParams.length) {
            return false;
        }
        for (let i = 0; i < thisParams.length; i++) {
            let thisParamType = thisParams[i].getTypeWrapped();
            let otherParamType = otherParams[i].getTypeWrapped();
            let compatibleParam = thisParamType.isTypeCompatibleWith(otherParamType) || otherParamType.isTypeCompatibleWith(thisParamType);
            if (!compatibleParam) {
                return false;
            }
        }
        return true;
    }

    /**
     * This method checks if another method has a higher specificity than this one.
     * A method is considered more specific if its return type and parameter types
     * are subtypes of the corresponding types in the other method, but not vice versa.
     * @param otherMethod The other method to compare against.
     * @returns {boolean} True if this method is more specific, false otherwise.
     */
    output.isMoreSpecificThan = function(otherMethod) {
        let thisReturnType = this.getTypeWrapped();
        let otherReturnType = otherMethod.getTypeWrapped();
        let thisParams = this.parameters();
        let otherParams = otherMethod.parameters();
        if (thisParams.length !== otherParams.length) {
            return false;
        }
        let isThisReturnTypeCompatible = thisReturnType.isTypeCompatibleWith(otherReturnType);
        let isOtherReturnTypeCompatible = otherReturnType.isTypeCompatibleWith(thisReturnType);
        if (!(isThisReturnTypeCompatible && !isOtherReturnTypeCompatible)) {
            return false;
        }
        for (let i = 0; i < thisParams.length; i++) {
            let thisParamType = thisParams[i].getTypeWrapped();
            let otherParamType = otherParams[i].getTypeWrapped();
            let thisParamMoreSpecific = thisParamType.isTypeCompatibleWith(otherParamType);
            let otherParamMoreSpecific = otherParamType.isTypeCompatibleWith(thisParamType);
            if (!(thisParamMoreSpecific && !otherParamMoreSpecific)) {
                return false;
            }
        }
        return true;
    }

    return output;
}

function decodeMethod(objectString) {
    if (typeof objectString === "object") {
        return objectString; // Already decoded
    }
    if (typeof objectString !== "string") {
        throw new Error("Invalid method structure: " + objectString);
    }
    // Format: "nameId,modifiers(optional),returnTypeId,annotationIds(optional),parameterIds(optional),typeVariableIds(optional),exceptionIds(optional)"
    let keys = [
        PROPERTY.METHOD_NAME,
        PROPERTY.MODIFIERS,
        PROPERTY.METHOD_RETURN_TYPE,
        PROPERTY.ANNOTATIONS,
        PROPERTY.PARAMETERS,
        PROPERTY.TYPE_VARIABLES,
        PROPERTY.EXCEPTIONS
    ];
    let values = objectString.split(",");
    if (values.length !== keys.length) {
        throw new Error("Invalid method structure: " + objectString);
    }
    let output = {};
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        if (!exists(key)) {
            throw new Error(`Invalid annotation key at index ${i}: ${key}`);
        }
        let value = values[i].trim();
        var decodedValue = decodePart(value, null);
        if (decodedValue !== null) {
            output[key] = decodedValue;
        }
    }

    return output;
}