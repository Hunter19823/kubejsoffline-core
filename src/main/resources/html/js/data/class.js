/**
 * Looks up and wraps the class with the given id, name, or object, and returns the
 * wrapped class. If the class is not found, then null is returned.
 * @param id {TypeIdentifier | FullTypeName | TypeName | SimplifiedTypeName | IndexedClassData}
 * @returns {JavaType | null}
 */
function getClass(id) {
    let output = {};
    if (!exists(id)) {
        console.error("Invalid class id: " + id);
        return null;
    }
    switch (typeof (id)) {
        case "number":
            if (!exists(getTypeData(id))) {
                console.error("Invalid class data: " + id);
                return null;
            }
            output.data = getTypeData(id);
            break;
        case "object":
            if (exists(id._id)) {
                output.data = getTypeData(id._id);
            } else if (exists(id.data) && exists(id.data._id)) {
                output.data = getTypeData(id.data._id);
            } else if (Array.isArray(id) && id.length === 2) {
                // If it's an array, then assume it's an array of a class.
                // the first index is the array type, the depth is the second index,
                output.data = getTypeData(id[0]);
                output.data._id = id[0];
                output._array_depth = id[1];
            } else {
                throw new Error("Invalid class object: " + id);
            }
            break;
        case "string":
            // See if the string is a number
            let num = parseInt(id);
            if (!isNaN(num)) {
                return getClass(num);
            }
            // Look up the cache to see if the class has already been found before.
            if (LOOK_UP_CACHE.has(id)) {
                return getClass(LOOK_UP_CACHE.get(id));
            }
            // Check if the string matches the java qualified type name regex
            if (!id.match(/([a-zA-Z_$][a-zA-Z\d_$]*\.)*[a-zA-Z_$][a-zA-Z\d_$]*/)) {
                // Class does not match a valid java qualified type name, so return null
                console.error("Invalid class id/search: " + id);
                return null;
            }
            const subject = findClassByName(id);
            if (exists(subject)) {
                LOOK_UP_CACHE.set(id, subject.id());
            }
            return subject;
        default:
            console.error("Unsupported class type provided to getClass: " + id + " (" + typeof (id) + ")");
            return null;
    }

    if (!exists(output.data)) {
        console.error("Invalid class data: ", id, typeof (id));
    }


    output = setModifiers(output);
    output = setAnnotations(output);


    // ========================================
    //        Start of Raw Class Properties
    // ========================================

    /**
     * Whether this type is a Class type.
     * This means the Type extends Class<?> and is not a parameterized type.
     * @returns {*}
     */
    output.isRaw = function () {
        return exists(this.data[PROPERTY.CLASS_NAME])
    }

    output.isRawClass = output.isRaw;

    output.isRawType = output.isRaw;

    output.getInterfaces = function () {
        return getAsArray(this.data[PROPERTY.INTERFACES]);
    }

    output.superclass = function () {
        if (exists(this.data[PROPERTY.SUPER_CLASS])) {
            return this.data[PROPERTY.SUPER_CLASS];
        }

        return null;
    }

    output.getSuperClass = function () {
        return this.data[PROPERTY.SUPER_CLASS];
    }

    output.getEnclosingClass = function () {
        return this.data[PROPERTY.ENCLOSING_CLASS];
    }

    output.isInnerClass = function () {
        return exists(output.getEnclosingClass());
    }

    output.getDeclaringClass = function () {
        return this.data[PROPERTY.DECLARING_CLASS];
    }

    output.getInnerClasses = function () {
        return getAsArray(this.data[PROPERTY.INNER_CLASSES]);
    }

    /**
     * Returns a list of all related classes to this class.
     * @param relations {[TypeIdentifier, String][]} relations
     * @param {Set<TypeIdentifier>} alreadySeen
     * @return {[JavaType, String][]} relatedClasses
     */
    output.getRelatedClasses = function (relations=[], alreadySeen=new Set()) {
        if (alreadySeen.has(output.id())) {
            function getClassWithVariableMap(id) {
                const result = getClass(id);
                if (exists(result)) {
                    result.withTypeVariableMap(output.getTypeVariableMap());
                }
                return result;
            }
            return relations
                .map(([id, relation]) => [getClassWithVariableMap(id), relation]);
        }
        alreadySeen.add(output.id());
        const relatedClasses = [];
        // Start by traversing the super class and interfaces
        if (exists(output.getSuperClass())) {
            relatedClasses.push([getClass(output.getSuperClass()), "Extends"]);
        }
        for (const iface of output.getInterfaces()) {
            relatedClasses.push([getClass(iface), "Implements"]);
        }
        // Now recursively traverse the related classes
        for (const [relatedClass, relation] of relatedClasses) {
            let related = relatedClass.getRelatedClasses([], alreadySeen)
                .filter(([relatedClass, relation]) => relation.startsWith('Extends') || relation.startsWith("Implements"))
                .map(([relatedClass, relation]) => [relatedClass, relation.endsWith('(Indirect)') ? relation : `${relation} (Indirect)`])
                .filter(([relatedClass, relation]) => !relatedClasses.some(([rc, r]) => getClass(rc).id() === relatedClass.id()));
            while (related.length > 0) {
                relatedClasses.push(...related);
                related = related.map(([relatedClass, relation]) => relatedClass.getRelatedClasses([], alreadySeen))
                    .flat()
                    .filter(([relatedClass, relation]) => relation.equals('Extends') || relation.equals("Implements"))
                    .map(([relatedClass, relation]) => [relatedClass, relation.endsWith('(Indirect)') ? relation : `${relation} (Indirect)`])
                    .filter(([relatedClass, relation]) => !relatedClasses.some(([rc, r]) => getClass(rc).id() === relatedClass.id()));
            }
        }
        if (exists(output.getEnclosingClass())) {
            relatedClasses.push([getClass(output.getEnclosingClass()), "Enclosing Class"]);
        }
        for (const innerClass of output.getInnerClasses()) {
            relatedClasses.push([getClass(innerClass), "Inner Class"]);
        }
        // Finally, return the related classes with their relations
        return output.getRelatedClasses(relatedClasses, alreadySeen);
    }

    /**
     * Returns all fields of this class.
     * @param shallow {boolean} whether to only get the fields of this class and not its inherited classes.
     * @returns {Field[]} an array of fields
     */
    output.fields = function (shallow = false) {
        const fields = [];

        function addFields(data) {
            if (exists(data.data[PROPERTY.FIELDS])) {
                for (let i = 0; i < data.data[PROPERTY.FIELDS].length; i++) {
                    fields.push(getField(data.data[PROPERTY.FIELDS][i], output.getTypeVariableMap()));
                }
            }
        }

        if (shallow) {
            addFields(this);
        } else {
            this._follow_inheritance((data, index) => {
                addFields(data);
            });
        }
        if (fields.length === 0) {
            return [];
        }

        for (let i = 0; i < fields.length; i++) {
            fields[i].data._dataIndex = i;
        }

        return fields;
    }

    output.getFields = output.fields;

    /**
     * Returns all methods of this class.
     * @param shallow {boolean} whether to only get the methods of this class and not its inherited classes.
     * @returns {Method[]}
     */
    output.methods = function (shallow = false) {
        const methods = [];

        function addMethods(data) {
            if (exists(data.data[PROPERTY.METHODS])) {
                for (let i = 0; i < data.data[PROPERTY.METHODS].length; i++) {
                    methods.push(getMethod(data.data[PROPERTY.METHODS][i], output.getTypeVariableMap()));
                }
            }
        }

        if (shallow) {
            addMethods(this);
        } else {
            this._follow_inheritance((data, index) => {
                addMethods(data);
            });
        }
        if (methods.length === 0) {
            return [];
        }
        for (let i = 0; i < methods.length; i++) {
            methods[i].data._dataIndex = i;
        }

        return methods;
    }

    output.getMethods = output.methods;

    output.constructors = function () {
        const constructors = [];
        if (exists(this.data[PROPERTY.CONSTRUCTORS])) {
            for (let i = 0; i < this.data[PROPERTY.CONSTRUCTORS].length; i++) {
                constructors.push(getConstructor(this.data[PROPERTY.CONSTRUCTORS][i], output.getTypeVariableMap()));
            }
        }

        if (constructors.length === 0) {
            return [];
        }

        for (let i = 0; i < constructors.length; i++) {
            constructors[i].data._dataIndex = i;
        }

        return constructors;
    }

    output.getConstructors = output.constructors;

    // ========================================
    //        End of Raw Class Properties
    // ========================================


    // ========================================
    //  Start of Parameterized Type Properties
    // ========================================

    /**
     * Whether this type is a parameterized type.
     * This means the Type extends ParameterizedType or a subclass of ParameterizedType.
     * @returns {*}
     */
    output.isParameterized = function () {
        return exists(this.data[PROPERTY.RAW_PARAMETERIZED_TYPE]);
    }

    output.isParameterizedType = output.isParameterized;

    output.getRawType = function () {
        return this.data[PROPERTY.RAW_PARAMETERIZED_TYPE];
    }

    output.getOwnerType = function () {
        return this.data[PROPERTY.OWNER_TYPE];
    }

    output = setTypeVariables(output);

    // ========================================
    //   End of Parameterized Type Properties
    // ========================================


    // ========================================
    //    Start of Wildcard Type Properties
    // ========================================

    /**
     * Whether this type is a wildcard type.
     * This means the Type extends WildcardType.
     * @returns {boolean|*}
     */
    output.isWildcard = function () {
        return Object.keys(this.data).filter((key) => key.indexOf("_") !== 0).length === 0 || exists(this.data[PROPERTY.WILDCARD_LOWER_BOUNDS]) || exists(this.data[PROPERTY.WILDCARD_UPPER_BOUNDS])
    }

    output.isWildcardType = output.isWildcard;

    output.getLowerBound = function () {
        return getAsArray(this.data[PROPERTY.WILDCARD_LOWER_BOUNDS]);
    }

    output.getUpperBound = function () {
        return getAsArray(this.data[PROPERTY.WILDCARD_UPPER_BOUNDS]);
    }


    // ========================================
    //     End of Wildcard Type Properties
    // ========================================

    // ========================================
    //    Start of TypeVariable Properties
    // ========================================

    /**
     * Whether this type is a type variable.
     * This means the Type extends TypeVariable.
     * @returns {*}
     */
    output.isTypeVariable = function () {
        return exists(this.data[PROPERTY.TYPE_VARIABLE_NAME]);
    }

    output.getTypeVariableBounds = function () {
        return getAsArray(this.data[PROPERTY.TYPE_VARIABLE_BOUNDS]);
    }

    // ========================================
    //     End of TypeVariable Properties
    // ========================================

    setTypeVariableMap(output);

    // Override the type variable map getter to create a new one if it doesn't exist
    output.getTypeVariableMap = function () {
        if (!exists(this._type_variable_map)) {
            this._type_variable_map = createTypeVariableMap(output.id());
            let parameterizedType = output;
            let i = 0;
            while (exists(parameterizedType.getOwnerType()) && i <= 100) {
                parameterizedType = getClass(parameterizedType.getOwnerType());
                output.withTypeVariableMap(parameterizedType.getTypeVariableMap());
                i++;
            }
            if (i > 100) {
                console.warn("Infinite loop detected while creating type variable map for class: " + output.fullyQualifiedName());
            }
        }
        return this._type_variable_map;
    }

    /**
     * Returns a TypeIdentifier for this class.
     * @returns {TypeIdentifier}
     */
    output.id = function () {
        return this.data._id;
    }
    output.getId = output.id;

    output.referenceName = function (typeVariableMap = {}) {
        return this.fullyQualifiedName(typeVariableMap, true);
    }
    output.getReferenceName = output.referenceName;

    output.fullyQualifiedName = function (typeVariableMap = {}, includeGenerics = true) {
        if (this.isRawClass()) {
            const name = getGenericDefinition(this.id(), typeVariableMap, includeGenerics);
            const typeVariables = this.getTypeVariables();
            let genericSuffix = "";
            if (typeVariables.length > 0 && includeGenerics) {
                genericSuffix = joiner(typeVariables, ", ", (type) => {
                    return getClass(type).fullyQualifiedName(typeVariableMap);
                }, "<", ">");
            }
            return name + genericSuffix + "[]".repeat(this.getArrayDepth());
        } else {
            return getGenericDefinition(this.id(), typeVariableMap, includeGenerics) + "[]".repeat(this.getArrayDepth());
        }
    }
    output.fullName = output.fullyQualifiedName;
    output.getFullyQualifiedName = output.fullyQualifiedName;
    output.getFullName = output.fullyQualifiedName;


    output.name = function (typeVariableMap = {}, includeGenerics = true) {
        if (this.isRawClass()) {
            const name = getGenericName(this.id(), createTypeVariableMap(this.id()), includeGenerics);
            const typeVariables = this.getTypeVariables();
            let genericSuffix = "";
            if (typeVariables.length > 0 && includeGenerics) {
                genericSuffix = joiner(typeVariables, ", ", (type) => {
                    return getClass(type).name(typeVariableMap);
                }, "<", ">");
            }
            return name + genericSuffix + "[]".repeat(this.getArrayDepth());
        } else {
            return getGenericName(this.id(), typeVariableMap, includeGenerics) + "[]".repeat(this.getArrayDepth());
        }
    }
    output.getName = output.name;

    output.simplename = function (typeVariableMap = {}) {
        if (this.isWildcard()) {
            return "?" + "[]".repeat(this.getArrayDepth());
        }
        if (this.isTypeVariable()) {
            return decompressString(this.data[PROPERTY.TYPE_VARIABLE_NAME]) + "[]".repeat(this.getArrayDepth());
        }
        if (this.isParameterizedType()) {
            const rawName = getClass(this.getRawType()).getSimpleName(typeVariableMap);
            const ownerPrefix = this.getOwnerType() ? getClass(this.getOwnerType()).getSimpleName(typeVariableMap) + "$" : "";
            return ownerPrefix + rawName + "[]".repeat(this.getArrayDepth());
        }
        return decompressString(this.data[PROPERTY.CLASS_NAME]) + "[]".repeat(this.getArrayDepth());
    }
    output.simpleName = output.simplename;
    output.getSimpleName = output.simplename;

    output.getArrayDepth = function () {
        return (exists(this._array_depth) ? this._array_depth : 0);
    }

    output.getPackageName = function () {
        if (exists(this.data._cachedPackageName)) {
            return this.data._cachedPackageName;
        }
        const packageName = this.data[PROPERTY.PACKAGE_NAME];
        if (exists(packageName)) {
            this.data._cachedPackageName = getPackageName(packageName);
        } else {
            this.data._cachedPackageName = "";
        }
        return this.data._cachedPackageName;
    }
    output.package = output.getPackageName;
    output.getPackage = output.getPackageName;

    output.getParameterizedArgs = function () {
        return getAsArray(this.data[PROPERTY.PARAMETERIZED_ARGUMENTS]);
    }

    output.getAllInheritedClasses = function () {
        if (exists(this.data._cachedInheritedClasses)) {
            return this.data._cachedInheritedClasses;
        }
        let classes = new Set();
        this._follow_inheritance((data, index) => {
            classes.add(index);
        });
        this.data._cachedInheritedClasses = classes;
        return classes;
    }

    output._follow_inheritance = function (action) {
        const seen = new Set();
        const unprocessed = [this.id()];
        while (unprocessed.length > 0) {
            const current = unprocessed.pop();
            if (!exists(current)) {
                continue;
            }
            if (seen.has(current)) {
                continue;
            }
            const currentClass = getClass(current);
            seen.add(currentClass.id());
            action(currentClass, current);
            unprocessed.push(currentClass.getSuperClass());
            unprocessed.push(...currentClass.getInterfaces());
            if (currentClass.isParameterized()) {
                unprocessed.push(currentClass.getRawType());
            }
        }
    }

    output.relation = function (index) {
        if (!exists(index)) {
            return [];
        }
        // return [];
        if (index >= 0 && index < RELATIONS.length) {
            switch (RELATIONS[index]) {
                case "SUPER_CLASS_OF":
                    // Find all classes that inherit from this class
                    return [...getRelation(RELATIONSHIP.SUPER_CLASS, this.id())]
                case "INNER_TYPE_OF":
                    return [...getRelation(RELATIONSHIP.ENCLOSING_CLASS, this.id())]
                case "COMPONENT_OF":
                    return [...getRelation(RELATIONSHIP.COMPONENT_OF, this.id())]
                case "IMPLEMENTATION_OF":
                    return [...getRelation(RELATIONSHIP.INHERITS, this.id())]
                case "DECLARED_FIELD_TYPE_OF":
                    return [...getRelation(RELATIONSHIP.FIELD_TYPE, this.id())]
                case "DECLARED_METHOD_RETURN_TYPE_OF":
                    return [...getRelation(RELATIONSHIP.METHOD_RETURN_TYPE, this.id())]
                case "DECLARED_METHOD_PARAMETER_TYPE_OF":
                    return [...getRelation(RELATIONSHIP.METHOD_PARAMETER_TYPE, this.id())]
                case "TYPE_VARIABLE_OF":
                    return [...getRelation(RELATIONSHIP.TYPE_VARIABLE_OF, this.id())]
            }
        }
    }

    output.toKubeJSLoad_1_18 = function () {
        return `// KJSODocs: ${output.hrefLink()}\nconst $${output.simplename().toUpperCase()} = Java("${output.fullyQualifiedName()}");`
    }

    output.toKubeJSLoad_1_19 = function () {
        return `// KJSODocs: ${output.hrefLink()}\nconst $${output.simplename().toUpperCase()} = Java.loadClass("${output.fullyQualifiedName()}");`
    }

    output.toKubeJSLoad_1_20 = function () {
        return `// KJSODocs: ${output.hrefLink()}\nconst $${output.simplename().toUpperCase()} = Java.loadClass("${output.fullyQualifiedName()}");`
    }

    output.toKubeJSLoad = function () {
        if (PROJECT_INFO.minecraft_version.includes("1.18")) {
            return this.toKubeJSLoad_1_18();
        }
        if (PROJECT_INFO.minecraft_version.includes("1.19")) {
            return this.toKubeJSLoad_1_19();
        }
        if (PROJECT_INFO.minecraft_version.includes("1.20")) {
            return this.toKubeJSLoad_1_20();
        }
    }

    output.hrefLink = function () {
        let url = CURRENT_URL.clone();
        url.params.set("focus", this.fullyQualifiedName());
        return url.href();
    }

    output.getHrefLink = output.hrefLink;

    return output;
}