type MethodLike = DocWrapper & {
    getName(): string;
    getTypeWrapped(): JavaType;
    getTypeVariableMap(): unknown;
    parameters(): { getTypeWrapped(): JavaType; id(): string; name(): string; toString(): string }[];
    getTypeVariablesMapped(): { id(): number; toString(): string }[];
    getModifiers(): unknown;
};

function getMethod(
    methodData: unknown,
    typeVariableMap: TypeVariableMap = {},
    sourceClassId: number,
    sourceMethodId: number
): MethodDoc {
    if (!exists(methodData)) {
        throw new Error('Invalid method data: ' + methodData);
    }
    if (!exists(sourceClassId)) {
        throw new Error('Declaring class ID must be provided for method.');
    }

    let output: DocWrapper = { data: {} };

    output.data = decodeMethod(methodData) as EntityData;
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
    (output as DocWrapper & { withTypeVariableMap(map: Record<string, unknown>): unknown }).withTypeVariableMap(
        typeVariableMap
    );

    output.toKubeJSStaticCall = function (this: DocWrapper) {
        const parent = getClass((this.getDeclaringClass as () => number)())!;
        let out = `// KJSODocs: ${(this.hrefLink as () => string)()}\n$${parent.simplename((this.getTypeVariableMap as () => TypeVariableMap)()).toUpperCase()}.${(this.name as () => string)()}(`;
        out += (this.parameters as MethodLike['parameters'])
            .call(this)
            .map((param) => param.name())
            .join(', ');

        out += `);`;
        return out;
    };

    output.toKubeJSCode = output.toKubeJSStaticCall;

    output.id = function (this: DocWrapper) {
        const params = (this.parameters as MethodLike['parameters'])
            .call(this)
            .map((param) => param.id())
            .join(',');
        return `${getClass((this.getTypeWrapped as () => JavaType)())!.getReferenceName((this.getTypeVariableMap as () => TypeVariableMap)())} ${(this.getName as () => string)()}(${params})`;
    };

    output.getId = output.id;

    output.hrefLink = function (this: DocWrapper) {
        const url = CURRENT_URL.clone();
        url.params.set('focus', (this.id as () => string)());
        return url.href();
    };

    output.getHrefLink = output.hrefLink;

    output.toString = function (this: DocWrapper) {
        const returnType = (this.getTypeWrapped as () => JavaType)().toString();
        const modifier = MODIFIER.toString((this.getModifiers as () => JavaModifiers)());
        const typeVariables = (this.getTypeVariablesMapped as () => { id(): number; toString(): string }[])
            .call(this)
            .map((v) => getClass(v.id())!)
            .map((tv) => tv.toString());
        const params = (this.parameters as MethodLike['parameters'])
            .call(this)
            .map((param) => param.toString())
            .join(', ');
        const args = [
            modifier,
            typeVariables.length > 0 ? `<${typeVariables.join(', ')}>` : '',
            returnType,
            `${(this.name as () => string)()}(${params})`,
        ];
        return args
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
            .join(' ');
    };

    output.areMethodsEqual = function (this: DocWrapper, otherMethod: MethodLike) {
        if ((this.getName as () => string)() !== otherMethod.getName()) {
            return false;
        }
        const thisReturnType = (this.getTypeWrapped as () => JavaType)();
        const otherReturnType = otherMethod.getTypeWrapped();
        const compatibleReturn =
            thisReturnType.isTypeCompatibleWith(otherReturnType) ||
            otherReturnType.isTypeCompatibleWith(thisReturnType);
        if (!compatibleReturn) {
            return false;
        }
        const thisParams = (this.parameters as MethodLike['parameters']).call(this);
        const otherParams = otherMethod.parameters();
        if (thisParams.length !== otherParams.length) {
            return false;
        }
        for (let i = 0; i < thisParams.length; i++) {
            const thisParamType = thisParams[i].getTypeWrapped();
            const otherParamType = otherParams[i].getTypeWrapped();
            const compatibleParam =
                thisParamType.isTypeCompatibleWith(otherParamType) ||
                otherParamType.isTypeCompatibleWith(thisParamType);
            if (!compatibleParam) {
                return false;
            }
        }
        return true;
    };

    output.isMoreSpecificThan = function (this: DocWrapper, otherMethod: MethodLike) {
        const thisReturnType = (this.getTypeWrapped as () => JavaType)();
        const otherReturnType = otherMethod.getTypeWrapped();
        const thisParams = (this.parameters as MethodLike['parameters']).call(this);
        const otherParams = otherMethod.parameters();
        if (thisParams.length !== otherParams.length) {
            return false;
        }
        const isThisReturnTypeCompatible = thisReturnType.isTypeCompatibleWith(otherReturnType);
        const isOtherReturnTypeCompatible = otherReturnType.isTypeCompatibleWith(thisReturnType);
        if (!(isThisReturnTypeCompatible && !isOtherReturnTypeCompatible)) {
            return false;
        }
        for (let i = 0; i < thisParams.length; i++) {
            const thisParamType = thisParams[i].getTypeWrapped();
            const otherParamType = otherParams[i].getTypeWrapped();
            const thisParamMoreSpecific = thisParamType.isTypeCompatibleWith(otherParamType);
            const otherParamMoreSpecific = otherParamType.isTypeCompatibleWith(thisParamType);
            if (!(thisParamMoreSpecific && !otherParamMoreSpecific)) {
                return false;
            }
        }
        return true;
    };

    return output as MethodDoc;
}

function decodeMethod(objectString: unknown): EntityData {
    if (typeof objectString === 'object' && objectString !== null) {
        return objectString as EntityData;
    }
    if (typeof objectString !== 'string') {
        throw new Error('Invalid method structure: ' + objectString);
    }
    const keys = [
        PROPERTY.METHOD_NAME,
        PROPERTY.MODIFIERS,
        PROPERTY.METHOD_RETURN_TYPE,
        PROPERTY.ANNOTATIONS,
        PROPERTY.PARAMETERS,
        PROPERTY.TYPE_VARIABLES,
        PROPERTY.EXCEPTIONS,
    ];
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
