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
    output.data = paramData;

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