function getParameter(
    parameterID: number,
    typeVariableMap: Record<string, unknown> = {},
    sourceClassId: number,
    sourceMethodId: number | null = null,
    sourceConstructorId: number | null = null,
    sourceParameterId: number | null = null
): DocWrapper {
    if (typeof parameterID !== 'number') {
        console.error('Invalid parameter type for parameter:', parameterID);
        throw new Error(`Invalid parameter type for parameter: ${parameterID}`);
    }
    if (!exists(sourceClassId)) {
        throw new Error('Declaring class ID must be provided for parameter.');
    }
    if (!exists(sourceMethodId) && !exists(sourceConstructorId)) {
        throw new Error('Either source method ID or source constructor ID must be provided for parameter.');
    }
    if (exists(sourceMethodId) && exists(sourceConstructorId)) {
        throw new Error('Only one of source method ID or source constructor ID can be provided for parameter.');
    }
    const paramData = getParameterData(parameterID);

    let output: DocWrapper = { data: {} };
    output.data = decodeParameter(paramData) as EntityData;
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
    (output.withTypeVariableMap as (map: unknown) => void)(typeVariableMap);

    output.id = function (this: DocWrapper) {
        return (this.getTypeWrapped as () => JavaType)().getReferenceName((this.getTypeVariableMap as () => unknown)());
    };

    output.getId = output.id;

    output.toString = function (this: DocWrapper) {
        const typeName = (this.getTypeWrapped as () => JavaType)().toString();
        const modifier = MODIFIER.toString((this.getModifiers as () => unknown)());
        const args = [modifier, typeName, (this.name as () => string)()];

        return args
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
            .join(' ');
    };

    return output;
}

function decodeParameter(objectString: unknown): EntityData {
    if (typeof objectString === 'object' && objectString !== null) {
        return objectString as EntityData;
    }
    if (typeof objectString !== 'string') {
        throw new Error('Invalid method structure: ' + objectString);
    }
    const keys = [PROPERTY.PARAMETER_NAME, PROPERTY.PARAMETER_TYPE, PROPERTY.MODIFIERS, PROPERTY.ANNOTATIONS];
    const values = objectString.split(',');
    if (values.length !== keys.length) {
        throw new Error('Invalid method structure: ' + objectString);
    }
    const output: EntityData = {};
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!exists(key)) {
            throw new Error(`Invalid annotation key at index ${i}: ${key}`);
        }
        const value = values[i].trim();
        const decodedValue = decodePart(value, null);
        if (decodedValue !== null) {
            output[key] = decodedValue;
        }
    }

    return output;
}
