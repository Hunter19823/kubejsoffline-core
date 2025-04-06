/**
 * Creates a TableRowAdder for fields.
 * @param id {TypeIdentifier} The id of the class to create the field table for.
 * @param typeVariableMap {TypeVariableMap} The type variable map to use for field types.
 * @return {TableDataAdder<Field>} A function that adds fields to tables.
 */
function addFieldToTableFunction(id, typeVariableMap = {}) {
    let target = getClass(id);
    return /** @type TableDataAdder<Field> */ ((table, field) => {
        try {
            let row = addRow(
                table,
                createFieldSignature(field, typeVariableMap),
                span(MODIFIER.toString(field.modifiers())),
                createFullSignature(field.type()),
                span(field.getName()),
                createFullSignature(field.getDeclaringClass())
            );
            appendAttributesToFieldTableRow(row, table.id, field, target.id());
        } catch (e) {
            console.error("Failed to create field entry for ", id, " field: ", field, " Error: ", e);
        }
    });
}

/**
 * Creates a TableRowAdder for methods.
 * @param id {TypeIdentifier} The id of the class to create the method table for.
 * @param typeVariableMap {TypeVariableMap} The type variable map to use for method types.
 * @return {TableDataAdder<Method>} A function that adds methods to tables.
 */
function addMethodToTableFunction(id, typeVariableMap = {}) {
    let target = getClass(id);
    return /** @type TableDataAdder<Method> */ ((table, method) => {
        try {
            let row = addRow(
                table,
                createMethodSignature(method, typeVariableMap),
                span(MODIFIER.toString(method.getModifiers())),
                createFullSignature(method.type()),
                span(method.name()),
                tagJoiner(
                    method.getParameters(),
                    ", ",
                    (param) => createParameterSignature(param, param.getTypeVariableMap())
                ),
                tagJoiner(
                    method.getTypeVariables(),
                    ", ",
                    (typeVariable) => createFullSignature(typeVariable, method.getTypeVariableMap())
                ),
                createFullSignature(method.getDeclaringClass())
            );
            appendAttributesToMethodTableRow(row, table.id, method.getDeclaringClass(), method, target.id());
        } catch (e) {
            console.error("Failed to create method entry for ", id, " method: ", method, " Error: ", e);
        }
    });
}

/**
 * Creates a TableRowAdder for constructors.
 * @param id {TypeIdentifier} The id of the class to create the constructor table for.
 * @param typeVariableMap {TypeVariableMap} The type variable map to use for constructor types.
 * @return {TableDataAdder<Constructor>} A function that adds constructors to tables.
 */
function addConstructorToTableFunction(id, typeVariableMap = {}) {
    let target = getClass(id);
    return /** @type TableDataAdder<Constructor> */ ((table, constructor) => {
        try {
            let row = addRow(
                table,
                createConstructorSignature(constructor, id, typeVariableMap),
                span(MODIFIER.toString(constructor.modifiers())),
                tagJoiner(
                    constructor.getParameters(),
                    ", ",
                    (param) => createParameterSignature(param, param.getTypeVariableMap())
                ),
                tagJoiner(
                    constructor.getTypeVariables(),
                    ", ",
                    (typeVariable) => createFullSignature(typeVariable, constructor.getTypeVariableMap())
                ),
                createFullSignature(constructor.getDeclaringClass())
            );
            appendAttributesToConstructorTableRow(row, id, constructor, target.id());
        } catch (e) {
            console.error("Failed to create constructor table for ", id, " Constructor: ", constructor, " Error: ", e);
        }
    });
}

/**
 * Creates a TableRowAdder for classes.
 * @return {TableDataAdder<Class>} A function that adds classes to tables.
 */
function addClassToTableFunction() {
    return /** @type TableDataAdder<Class> */ ((table, subject) => {
        try {
            let row = addRow(
                table,
                createFullSignature(subject),
                span(MODIFIER.toString(subject.modifiers())),
                span(subject.getPackage()),
                span(subject.getSimpleName()),
                tagJoiner(
                    subject.getTypeVariables(),
                    ", ",
                    (typeVariable) => createFullSignature(typeVariable, subject.getTypeVariableMap())
                )
            );
            appendAttributesToClassTableRow(row, table.id, subject)
        } catch (e) {
            console.error(`Failed to create entry for `, table.id, " Class: ", subject, " Error: ", e);
        }
    });
}

/**
 * Creates a TableRowAdder for bindings.
 * @param scope {String} The scope of the bindings.
 * @return {TableDataAdder<Binding>} A function that adds bindings to tables.
 */
function addBindingToTableFunction(scope) {
    return /** @type TableDataAdder<Binding> */ ((table, binding) => {
        try {
            let row = addRow(
                table,
                span(binding.getName()),
                createFullSignature(binding.getType()),
                span(exists(binding.getData()) ? JSON.stringify(binding.getData(), null, 2) : "")
            );
            appendAttributesToBindingTableRow(row, table.id, binding)
        } catch (e) {
            console.error(`Failed to create entry for `, table.id, " Binding: ", binding, " Error: ", e);
        }
    });
}

/**
 * Creates a table of methods for a class.
 * @param id {TypeIdentifier} The class id to create the method table for.
 * @param typeVariableMap {TypeVariableMap} The type variable map to use for method types.
 */
function createMethodTable(id, typeVariableMap = {}) {
    let target = getClass(id);
    let methods = target.methods();
    if (!(methods && GLOBAL_SETTINGS.showMethods)) {
        return;
    }
    methods = methods.filter((method) => {
        if (GLOBAL_SETTINGS.showPrivate === false && MODIFIER.isPrivate(method.modifiers())) {
            return false;
        }
        if (GLOBAL_SETTINGS.showProtected === false && MODIFIER.isProtected(method.modifiers())) {
            return false;
        }
        if (GLOBAL_SETTINGS.showMethodsInherited === false && method.getDeclaringClass() != id) {
            return false;
        }
        return true;
    });
    if (methods.length === 0) {
        return;
    }
    createPagedTable('Methods', 'methods', methods, addMethodToTableFunction(id, typeVariableMap),
        'Link',
        'Signature',
        'Access Modifiers',
        'Return Type',
        'Method Name',
        'Parameters',
        'Type Variables',
        'Declared In'
    )
        .sortableByMethod((a) => a)
        .create();
}

function createFieldTable(id, typeVariableMap = {}) {
    let target = getClass(id);
    let fields = target.fields();
    if (!(fields && GLOBAL_SETTINGS.showFields)) {
        return;
    }
    fields = fields.filter((field) => {
        if (GLOBAL_SETTINGS.showPrivate === false && MODIFIER.isPrivate(field.modifiers())) {
            return false;
        }
        if (GLOBAL_SETTINGS.showProtected === false && MODIFIER.isProtected(field.modifiers())) {
            return false;
        }
        if (GLOBAL_SETTINGS.showFieldsInherited === false && field.getDeclaringClass() != id) {
            return false;
        }
        return true;
    });
    if (fields.length === 0) {
        return;
    }
    createPagedTable('Fields', 'fields', fields, addFieldToTableFunction(id, typeVariableMap), 'Link', 'Signature', 'Access Modifiers', 'Type', 'Field Name', 'Declaring Class')
        .sortableByField((a) => a)
        .create();
}

function createConstructorTable(id, typeVariableMap = {}) {
    let target = getClass(id);
    let constructors = target.constructors();
    if (!(constructors && GLOBAL_SETTINGS.showConstructors)) {
        return;
    }
    constructors = [...constructors].filter((constructor) => {
        if (GLOBAL_SETTINGS.showPrivate === false && MODIFIER.isPrivate(constructor.modifiers())) {
            return false;
        }
        if (GLOBAL_SETTINGS.showProtected === false && MODIFIER.isProtected(constructor.modifiers())) {
            return false;
        }
        if (GLOBAL_SETTINGS.showConstructorsInherited === false && constructor.getDeclaringClass() !== id) {
            return false;
        }
        return true;
    });
    if (constructors.length === 0) {
        return;
    }
    createPagedTable('Constructors', 'constructors', constructors, addConstructorToTableFunction(id, typeVariableMap),
        'Link',
        'Constructors',
        'Access Modifiers',
        'Parameters',
        'Type Variables',
        'Declared In'
    )
        .create();
}

function createRelationshipTable(id, typeVariableMap = {}) {
    let data = getClass(id);
    if (!GLOBAL_SETTINGS.showRelationships) {
        return;
    }
    const relationships = getAllRelations(data.id());
    if (relationships.size === 0) {
        return;
    }
    const addToTable = (table, [to, relations]) => {
        try {
            let row = addRow(
                table,
                createFullSignature(to, typeVariableMap),
                span(relations.join(","))
            );
            appendAttributesToRelationshipToTableRow(row, to, relations, data.id())
        } catch (e) {
            console.error("Failed to create relationship entry for ", data.id(), " To: ", to, " Relations: ", relations, " Error: ", e);
        }
    };
    createPagedTable('Relationships', 'relationships', [...relationships.entries()], addToTable,
        'Links',
        'RelatedClass',
        'Relationships'
    )
        .sortableByRelation()
        .create();
}

function createClassTable(title, table_id, classes) {
    if (classes) {
        createPagedTable(title, table_id, classes, addClassToTableFunction(),
            'Link',
            'Signature',
            'Modifiers',
            'Package',
            'Name',
            'Type Variables'
        )
            ?.sortableByClass((a) => a)
            ?.create();
    }
}

/**
 * Creates a table of bindings
 * @param title {String} The title of the table
 * @param scope {String} The scope of the bindings
 * @param table_id {String} The id of the table
 * @param bindings {Array<Binding>} The bindings to display
 */
function createBindingsTable(title, scope, table_id, bindings) {
    createPagedTable(title, table_id, bindings, addBindingToTableFunction(scope),
        'Link',
        'Name',
        'Type',
        'Values'
    )
        .sortableByClass((a) => getClass(a.getType()))
        .sortableByName((a) => a.getName())
        .create();

}