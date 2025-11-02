/**
 * Returns a parameter wrapper object with the given parameter data.
 *
 * @param {ParameterIdentifier} parameterID The blob of parameter data
 * @param {TypeVariableMap} typeVariableMap The type variable map to use for this parameter.
 * @param {TypeIdentifier} sourceClassId The class ID of the class declaring this parameter.
 * @param {int} [sourceMethodId] The index of the method declaring this parameter.
 * @param {int} [sourceConstructorId] The index of the constructor declaring this parameter.
 * @param {int} [sourceParameterId] The index of the parameter within the declaring method's or constructor's parameter list.
 * @returns {Parameter}
 */
function getParameter(parameterID, typeVariableMap = {}, sourceClassId, sourceMethodId=null, sourceConstructorId=null, sourceParameterId=null) {
    if (typeof parameterID !== "number") {
        console.error("Invalid parameter type for parameter:", parameterID);
        throw new Error(`Invalid parameter type for parameter: ${parameterID}`);
    }
    if (!exists(sourceClassId)) {
        throw new Error("Declaring class ID must be provided for parameter.");
    }
    if (!exists(sourceMethodId) && !exists(sourceConstructorId)) {
        throw new Error("Either source method ID or source constructor ID must be provided for parameter.");
    }
    if (exists(sourceMethodId) && exists(sourceConstructorId)) {
        throw new Error("Only one of source method ID or source constructor ID can be provided for parameter.");
    }
    const paramData = getParameterData(parameterID);

    let output = {};
    output.data = decodeParameter(paramData);
    output.data._declaringClass = sourceClassId;
    if (exists(sourceMethodId)) {
        output.data._declaringMethod = sourceMethodId;
    }
    if (exists(sourceConstructorId)) {
        output.data._declaringConstructor = sourceConstructorId;
    }
    output.data._declaringParameter = sourceParameterId;

    output = setBasicName(output);
    output = setRemapType(output);
    output = setModifiers(output);
    output = setAnnotations(output);
    output = setDataIndex(output);
    output = setTypeVariableMap(output);
    output = setDeclaringClass(output);
    output = setDeclaringMethod(output);
    output = setDeclaringConstructor(output);
    output = setDeclaringParameter(output);
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
        let decodedValue = decodePart(value, null);
        if (decodedValue !== null) {
            output[key] = decodedValue;
        } else {
            if (PROPERTY.MODIFIERS === key) {
                output[key] = 0; // Default modifiers to 0
            }
        }
    }

    return output;
}