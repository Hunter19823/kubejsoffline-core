/**
 * Returns an annotation wrapper object with the given annotation data.
 *
 * @param {Object} annotationData
 * @returns {Annotation}
 */
function getAnnotation(annotationData) {
    if (!exists(annotationData)) {
        throw new Error("Invalid annotation data: " + annotationData);
    }
    if (typeof annotationData !== "number") {
        console.error("Invalid annotation type for annotation:", annotationData);
        throw new Error("Invalid annotation type for annotation: " + annotationData);
    }
    let output = {};
    output.data = decodeAnnotation(getAnnotationData(annotationData));

    output = setRemapType(output);
    output = setDataIndex(output);
    output = setTypeVariableMap(output);

    output.string = function () {
        if (exists(this.data[PROPERTY.ANNOTATION_STRING])) {
            if (typeof this.data[PROPERTY.ANNOTATION_STRING] === "number") {
                return getNameData(this.data[PROPERTY.ANNOTATION_STRING]);
            }
            return (this.data[PROPERTY.ANNOTATION_STRING]);
        } else {
            return "";
        }
    }

    output.getString = output.string;

    output.toString = function () {
        return `@${this.getString()}`;
    }

    return output;
}



function decodeAnnotation(objectString) {
    if (typeof objectString === "object") {
        return objectString; // Already decoded
    }
    if (typeof objectString !== "string") {
        throw new Error("Invalid method structure: " + objectString);
    }
    let keys = [
        PROPERTY.ANNOTATION_TYPE,
        PROPERTY.ANNOTATION_STRING
    ];
    let values = objectString.split(",");
    if (values.length !== keys.length) {
        throw new Error("Invalid method structure: " + objectString);
    }
    let output = {};
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        if (!exists(key)) {
            throw new Error(`Invalid annotation key at index ${i}: ${key}`);
        }
        let value = values[i].trim();
        var decodedValue = decodePart(value, null);
        if (decodedValue !== null) {
            output[key] = decodedValue;
        }
    }

    return output;
}