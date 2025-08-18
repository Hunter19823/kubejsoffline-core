/**
 * Returns a parameter wrapper object with the given parameter data.
 *
 * @param {ParameterIdentifier} parameterID The blob of parameter data
 * @param {TypeVariableMap} typeVariableMap The type variable map to use for this parameter.
 * @returns {Parameter}
 */
function getParameter(parameterID, typeVariableMap = {}) {
    if (typeof parameterID !== "number") {
        console.error("Invalid parameter type for parameter:", parameterID);
        throw new Error("Invalid parameter type for parameter: " + parameterID);
    }
    const paramData = getParameterData(parameterID);

    let output = {};
    output.data = decodeParameter(paramData);

    output = setBasicName(output);
    output = setRemapType(output);
    output = setModifiers(output);
    output = setAnnotations(output);
    output = setDataIndex(output);
    output = setTypeVariableMap(output);
    output.withTypeVariableMap(typeVariableMap);

    output.id = function () {
        return getClass(this.getType()).getReferenceName(this.getTypeVariableMap());
    }

    output.getId = output.id;


    return output;
}


function decodeParameter(objectString) {
    if (typeof objectString === "object") {
        return objectString; // Already decoded
    }
    if (typeof objectString !== "string") {
        throw new Error("Invalid method structure: " + objectString);
    }
    let keys = [
        PROPERTY.PARAMETER_NAME,
        PROPERTY.PARAMETER_TYPE,
        PROPERTY.MODIFIERS,
        PROPERTY.ANNOTATIONS
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