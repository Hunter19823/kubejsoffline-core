/**
 * Returns a method wrapper object with the given method data.
 *
 * @param methodData The blob of method data
 * @param typeVariableMap The type variable map to use for this method.
 * @returns {Method}
 */
function getMethod(methodData, typeVariableMap = {}) {
    if (!exists(methodData)) {
        throw new Error("Invalid method data: " + methodData);
    }

    let output = {};

    output.data = decodeMethod(methodData);

    output = setBasicName(output);
    output = setRemapType(output);
    output = setModifiers(output);
    output = setAnnotations(output);
    output = setParameters(output);
    output = setDataIndex(output);
    output = setDeclaringClass(output);
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
        return `${getClass(this.getType()).getReferenceName(this.getTypeVariableMap())} ${this.getName()}(${params})`;

    }

    output.getId = output.id;

    output.hrefLink = function () {
        let url = CURRENT_URL.clone();
        url.params.set("focus", this.id());
        return url.href();
    }

    output.getHrefLink = output.hrefLink;

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
        PROPERTY.METHOD_MODIFIERS,
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
        let value = values[i].trim();
        var decodedValue = decodePart(value, null);
        if (decodedValue !== null) {
            output[key] = decodedValue;
        }
    }

    return output;
}