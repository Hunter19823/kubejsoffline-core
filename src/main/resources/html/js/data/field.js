/**
 * Returns a field wrapper object with the given field data.
 *
 * @param fieldData The blob of field data
 * @param typeVariableMap The type variable map to use for this field.
 * @returns {Field}
 */
function getField(fieldData, typeVariableMap = {}) {
    if (!exists(fieldData)) {
        throw new Error("Invalid field data: " + fieldData);
    }

    let output = {};
    output.data = fieldData;

    output = setBasicName(output);
    output = setRemapType(output);
    output = setModifiers(output);
    output = setAnnotations(output);
    output = setDataIndex(output);
    output = setDeclaringClass(output);
    output = setTypeVariableMap(output);
    output.withTypeVariableMap(typeVariableMap);

    output.toKubeJSStaticReference = function () {
        let parent = getClass(this.getDeclaringClass());
        return `// KJSODocs: ${getClass(this.type()).hrefLink()}\n$${parent.simplename(this.getTypeVariableMap()).toUpperCase()}.${this.name()};`;
    }

    output.toKubeJSCode = output.toKubeJSStaticReference;

    output.id = function () {
        // Generate a unique HTML ID for this field
        return getClass(this.getType()).getReferenceName(this.getTypeVariableMap()) + "." + this.getName();
    }

    output.getId = output.id;

    output.hrefLink = function () {
        let url = CURRENT_URL.clone();
        url.params.set("focus", this.id());
        return url.href();
    }

    output.getHrefLink = output.hrefLink;

    return output;
}