function getConstructor(
    constructorID: number,
    typeVariableMap: TypeVariableMap = {},
    sourceClassId: number,
    sourceConstructorId: number
): ConstructorDoc {
    if (!exists(constructorID)) {
        throw new Error('Invalid constructor id: ' + constructorID);
    }
    if (!exists(sourceClassId)) {
        throw new Error('Declaring class ID must be provided for constructor.');
    }
    let output: DocWrapper = { data: {} };
    output.data = decodeConstructor(getConstructorData(constructorID)) as EntityData;
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
    (output.withTypeVariableMap as (map: unknown) => void)(typeVariableMap);

    output.toKubeJSStaticCall = function (this: DocWrapper) {
        const parent = getClass((this.getDeclaringClass as () => number)())!;
        let out = `// KJSODocs: ${(this.hrefLink as () => string)()}\nlet ${parent.simplename((this.getTypeVariableMap as () => TypeVariableMap)())} = new $${parent.simplename((this.getTypeVariableMap as () => TypeVariableMap)()).toUpperCase()}(`;
        out += (this.parameters as () => { name(): string }[])
            .call(this)
            .map((param) => param.name())
            .join(', ');
        out += ');';
        return out;
    };

    output.toKubeJSCode = output.toKubeJSStaticCall;

    output.id = function (this: DocWrapper) {
        return (
            getClass((output.getDeclaringClass as () => number)())!.fullyQualifiedName(
                (output.getTypeVariableMap as () => TypeVariableMap)()
            ) +
            '.__init__(' +
            (output.parameters as () => { id(): string }[])
                .call(output)
                .map((param) => param.id())
                .join(',') +
            ')'
        );
    };

    output.getId = output.id;

    output.hrefLink = function (this: DocWrapper) {
        const url = CURRENT_URL.clone();
        url.params.set('focus', (this.id as () => string)());
        return url.href();
    };

    output.getHrefLink = output.hrefLink;

    output.toString = function (this: DocWrapper) {
        const parentName = getClass((this.getDeclaringClass as () => number)())!.toString();
        const modifier = MODIFIER.toString((this.getModifiers as () => JavaModifiers)());
        const typeVars = (this.getTypeVariablesMapped as () => { toString(): string }[])
            .call(this)
            .map((typeVar) => typeVar.toString())
            .join(', ');
        const parameterList = (this.parameters as () => { toString(): string }[])
            .call(this)
            .map((param) => param.toString())
            .join(', ');
        const args = [
            modifier,
            exists(typeVars) && typeVars.length > 0 ? `<${typeVars}>` : '',
            `${parentName}(${parameterList})`,
        ];
        return args
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
            .join(' ');
    };

    return output as ConstructorDoc;
}

function decodeConstructor(objectString: unknown): EntityData {
    if (typeof objectString === 'object' && objectString !== null) {
        return objectString as EntityData;
    }
    if (typeof objectString !== 'string') {
        throw new Error('Invalid method structure: ' + objectString);
    }
    const keys = [
        PROPERTY.MODIFIERS,
        PROPERTY.ANNOTATIONS,
        PROPERTY.EXCEPTIONS,
        PROPERTY.TYPE_VARIABLES,
        PROPERTY.PARAMETERS,
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
