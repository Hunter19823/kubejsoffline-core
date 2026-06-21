

function getField(

    fieldID: number,

    typeVariableMap: TypeVariableMap = {},

    sourceClassId: number,

    sourceFieldId: number

): FieldDoc {

    if (!exists(fieldID)) {

        throw new Error('Invalid field id: ' + fieldID);

    }



    if (!exists(sourceClassId)) {

        throw new Error('Declaring class ID must be provided for field.');

    }



    let output: DocWrapper = { data: {} };

    output.data = decodeField(getFieldData(fieldID)) as EntityData;



    output.data._declaringClass = sourceClassId;

    output.data._declaringField = sourceFieldId;



    output = setBasicName(output);

    output = setRemapType(output);

    output = setModifiers(output);

    output = setAnnotations(output);

    output = setDataIndex(output);

    output = setDeclaringClass(output);

    output = setDeclaringField(output);

    output = setTypeVariableMap(output);

    (output.withTypeVariableMap as (map: unknown) => void)(typeVariableMap);



    output.toKubeJSStaticReference = function (this: DocWrapper) {

        const parent = getClass((this.getDeclaringClass as () => number)())!;

        return `// KJSODocs: ${(this.getTypeWrapped as () => JavaType)().hrefLink()}\n$${parent.simplename((this.getTypeVariableMap as () => TypeVariableMap)()).toUpperCase()}.${(this.name as () => string)()};`;

    };



    output.toKubeJSCode = output.toKubeJSStaticReference;



    output.id = function (this: DocWrapper) {

        return (

            getClass((this.getTypeWrapped as () => JavaType)())!.getReferenceName(

                (this.getTypeVariableMap as () => TypeVariableMap)()

            ) +

            '.' +

            (this.getName as () => string)()

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

        const returnType = (this.getTypeWrapped as () => JavaType)().toString();

        const modifier = MODIFIER.toString((this.getModifiers as () => JavaModifiers)());

        const args = [modifier, returnType, (this.name as () => string)()];



        return args

            .map((part) => part.trim())

            .filter((part) => part.length > 0)

            .join(' ');

    };



    return output as FieldDoc;

}



function decodeField(objectString: unknown): EntityData {

    if (typeof objectString === 'object' && objectString !== null) {

        return objectString as EntityData;

    }

    if (typeof objectString !== 'string') {

        throw new Error('Invalid field structure: ' + objectString);

    }

    const keys = [PROPERTY.FIELD_NAME, PROPERTY.FIELD_TYPE, PROPERTY.MODIFIERS, PROPERTY.ANNOTATIONS];

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


