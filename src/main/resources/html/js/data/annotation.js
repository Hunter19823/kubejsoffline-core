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
    output.data = getAnnotationData(annotationData);

    output = setRemapType(output);
    output = setDataIndex(output);

    output.string = function () {
        if (exists(this.data[PROPERTY.ANNOTATION_STRING])) {
            return (this.data[PROPERTY.ANNOTATION_STRING]);
        } else {
            return "";
        }
    }

    output.getString = output.string;

    return output;
}