/**
 * Returns a method wrapper object with the given method data.
 *
 * @param methodData The blob of method data
 * @param typeVariableMap The type variable map to use for this method.
 * @returns {Method}
 */
function getMethod(methodData, typeVariableMap = {}) {
    if (!exists(methodData)) {
        throw new Error("Invalid method data: " + methodData);
    }

    let output = {};
    output.data = methodData;

    output = setBasicName(output);
    output = setRemapType(output);
    output = setModifiers(output);
    output = setAnnotations(output);
    output = setParameters(output);
    output = setDataIndex(output);
    output = setDeclaringClass(output);
    output = setTypeVariables(output);
    output = setTypeVariableMap(output);
    output.withTypeVariableMap(typeVariableMap);

    output.toKubeJSStaticCall = function () {
        let parent = getClass(this.getDeclaringClass());
        let out = `// KJSODocs: ${this.hrefLink()}\n$${parent.simplename(this.getTypeVariableMap()).toUpperCase()}.${this.name()}(`;
        out += this.parameters().map((param) => param.name()).join(", ");

        out += `);`;
        return out;
    }

    output.toKubeJSCode = output.toKubeJSStaticCall;

    output.id = function () {
        let params = this.parameters().map((param) => {
            return param.id();
        }).join(",");
        // Generate a unique HTML ID for this method
        return `${getClass(this.getType()).getReferenceName(this.getTypeVariableMap())} ${this.getName()}(${params})`;

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