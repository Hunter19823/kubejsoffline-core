/**
 * Returns a field wrapper object with the given field data.
 *
 * @param fieldData The blob of field data
 * @param typeVariableMap The type variable map to use for this field.
 * @param sourceClassId The class ID of the class declaring this field.
 * @param sourceFieldId The index of the field within the declaring class's field list.
 * @returns {Field}
 */
function getField(fieldData, typeVariableMap = {}, sourceClassId, sourceFieldId) {
    if (!exists(fieldData)) {
        throw new Error("Invalid field data: " + fieldData);
    }

    if (!exists(sourceClassId)) {
        throw new Error("Declaring class ID must be provided for field.");
    }

    let output = {};
    output.data = decodeField(fieldData);

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

    output.toString = function () {
        let returnType = getClass(this.getType()).toString();
        let modifier = MODIFIER.toString(getModifiers());
        if (exists(modifier) && modifier.length > 0) {
            modifier += " ";
        }
        return `${modifier}${returnType} ${this.name()}`;
    }

    return output;
}

function decodeField(objectString) {
    if (typeof objectString === "object") {
        return objectString; // Already decoded
    }
    if (typeof objectString !== "string") {
        throw new Error("Invalid field structure: " + objectString);
    }
    let keys = [
        PROPERTY.FIELD_NAME,
        PROPERTY.FIELD_TYPE,
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