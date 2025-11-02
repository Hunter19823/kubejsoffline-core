/**
 * Returns a constructor wrapper object with the given constructor data.
 *
 * @param {Object} constructorData The blob of constructor data
 * @param {TypeVariableMap} typeVariableMap The type variable map to use for this constructor.
 * @param {TypeIdentifier} sourceClassId The class ID of the class declaring this constructor.
 * @param {int} sourceConstructorId The index of the constructor within the declaring class's constructor list.
 * @returns {Constructor}
 */
function getConstructor(constructorData, typeVariableMap = {}, sourceClassId, sourceConstructorId) {
    if (!exists(constructorData)) {
        throw new Error("Invalid constructor data: " + constructorData);
    }
    if (!exists(sourceClassId)) {
        throw new Error("Declaring class ID must be provided for constructor.");
    }
    let output = {};
    output.data = decodeConstructor(constructorData);
    output.data._declaringClass = sourceClassId;
    output.data._declaringConstructor = sourceConstructorId;

    output = setModifiers(output);
    output = setAnnotations(output);
    output = setDataIndex(output);
    output = setDeclaringClass(output);
    output = setDeclaringConstructor(output);
    output = setParameters(output, sourceClassId, null, sourceConstructorId);
    output = setTypeVariables(output);
    output = setTypeVariableMap(output);
    output.withTypeVariableMap(typeVariableMap);

    output.toKubeJSStaticCall = function () {
        let parent = getClass(this.getDeclaringClass());
        let out = `// KJSODocs: ${this.hrefLink()}\nlet ${parent.simplename(this.getTypeVariableMap())} = new $${parent.simplename(this.getTypeVariableMap()).toUpperCase()}(`;
        out += this.parameters().map((param) => param.name()).join(", ");
        out += ");";
        return out;
    }

    output.toKubeJSCode = output.toKubeJSStaticCall;

    output.id = function () {
        // Generate a unique HTML ID for this constructor
        return getClass(output.getDeclaringClass()).fullyQualifiedName(output.getTypeVariableMap()) + ".__init__(" + output.parameters().map((param) => {
            return param.id();
        }).join(",") + ")";
    }

    output.getId = output.id;

    output.hrefLink = function () {
        let url = CURRENT_URL;
        url.params.set("focus", this.id());
        return url.href();
    }

    output.getHrefLink = output.hrefLink;

    return output;
}

function decodeConstructor(objectString) {
    if (typeof objectString === "object") {
        return objectString; // Already decoded
    }
    if (typeof objectString !== "string") {
        throw new Error("Invalid method structure: " + objectString);
    }
    let keys = [
        PROPERTY.MODIFIERS,
        PROPERTY.ANNOTATIONS,
        PROPERTY.EXCEPTIONS,
        PROPERTY.TYPE_VARIABLES,
        PROPERTY.PARAMETERS
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