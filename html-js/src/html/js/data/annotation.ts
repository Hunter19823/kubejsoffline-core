function getAnnotation(annotationData: number, _typeVariableMap?: unknown): DocWrapper {
    if (!exists(annotationData)) {
        throw new Error('Invalid annotation data: ' + annotationData);
    }
    if (typeof annotationData !== 'number') {
        console.error('Invalid annotation type for annotation:', annotationData);
        throw new Error('Invalid annotation type for annotation: ' + annotationData);
    }
    let output: DocWrapper = { data: {} };
    output.data = decodeAnnotation(getAnnotationData(annotationData)) as EntityData;

    output = setRemapType(output);
    output = setDataIndex(output);
    output = setTypeVariableMap(output);

    output.string = function (this: DocWrapper) {
        if (exists(this.data![PROPERTY.ANNOTATION_STRING])) {
            if (typeof this.data![PROPERTY.ANNOTATION_STRING] === 'number') {
                return getNameData(this.data![PROPERTY.ANNOTATION_STRING] as number);
            }
            return this.data![PROPERTY.ANNOTATION_STRING];
        } else {
            return '';
        }
    };

    output.getString = output.string;

    output.toString = function (this: DocWrapper) {
        return `@${(this.getString as () => string)()}`;
    };

    return output;
}

function decodeAnnotation(objectString: unknown): EntityData {
    if (typeof objectString === 'object' && objectString !== null) {
        return objectString as EntityData;
    }
    if (typeof objectString !== 'string') {
        throw new Error('Invalid method structure: ' + objectString);
    }
    const keys = [PROPERTY.ANNOTATION_TYPE, PROPERTY.ANNOTATION_STRING];
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
