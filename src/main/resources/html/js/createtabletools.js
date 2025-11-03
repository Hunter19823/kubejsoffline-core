/**
 * Creates a TableRowAdder for fields.
 * @return {TableDataAdder<Field>} A function that adds fields to tables.
 */
function addFieldToTableFunction() {
    return /** @type TableDataAdder<Field> */ ((table, field) => {
        try {
            let row = addRow(
                table,
                createFieldSignature(field),
                span(MODIFIER.toString(field.modifiers())),
                createFullSignature(field.getTypeWrapped()),
                span(field.getName()),
                createFullSignature(field.getDeclaringClass())
            );
            appendAttributesToFieldTableRow(row, table.id, field);
        } catch (e) {
            console.error("Failed to create field entry for ", field.getDeclaringClass(), " field: ", field, " Error: ", e);
        }
    });
}

/**
 * Creates a TableRowAdder for constructors.
 * @return {TableDataAdder<Constructor>} A function that adds constructors to tables.
 */
function addConstructorToTableFunction() {
    return /** @type TableDataAdder<Constructor> */ ((table, constructor) => {
        try {
            let row = addRow(
                table,
                createConstructorSignature(constructor),
                span(MODIFIER.toString(constructor.modifiers())),
                createParametersSignature(constructor),
                createTypeVariableSignature(constructor),
                createFullSignature(constructor.getDeclaringClass())
            );
            appendAttributesToConstructorTableRow(row, table.id, constructor);
        } catch (e) {
            console.error("Failed to create constructor for Table: ", table.id, " Constructor: ", constructor, " Error: ", e);
        }
    });
}

/**
 * Creates a TableRowAdder for methods.
 * @return {TableDataAdder<Method>} A function that adds methods to tables.
 */
function addMethodToTableFunction() {
    return /** @type TableDataAdder<Method> */ ((table, method) => {
        try {
            let row = addRow(
                table,
                createMethodSignature(method),
                span(MODIFIER.toString(method.getModifiers())),
                createFullSignature(method.getTypeWrapped()),
                span(method.name()),
                createParametersSignature(method),
                createTypeVariableSignature(method),
                createFullSignature(method.getDeclaringClass())
            );
            appendAttributesToMethodTableRow(row, table.id, method.getDeclaringClass(), method);
        } catch (e) {
            console.error("Failed to create method entry for Table: ", table.id, " Method: ", method, " Error: ", e);
        }
    });
}

/**
 * Creates a TableRowAdder for classes.
 * @return {TableDataAdder<JavaType>} A function that adds classes to tables.
 */
function addClassToTableFunction() {
    return /** @type TableDataAdder<JavaType> */ ((table, subject) => {
        try {
            let row = addRow(
                table,
                createFullSignature(subject, subject.getTypeVariableMap()),
                span(MODIFIER.toString(subject.modifiers())),
                span(subject.getPackage()),
                span(subject.getSimpleName()),
                createTypeVariableSignature(subject),
                exists(subject.getEnclosingClass()) ? createFullSignature(subject.getEnclosingClass(), subject.getTypeVariableMap()) : span("")
            );
            appendAttributesToClassTableRow(row, table.id, subject)
        } catch (e) {
            console.error(`Failed to create entry for `, table.id, " Class: ", subject, " Error: ", e);
        }
    });
}
/**
 * Creates a TableRowAdder for related classes.
 * @return {TableDataAdder<[JavaType,string]>} A function that adds classes to tables.
 */
function addRelatedClassToTableFunction() {
    return /** @type {TableDataAdder<[JavaType,string]>} */ ((table, [subject, relation]) => {
        try {
            let row = addRow(
                table,
                span(relation),
                createFullSignature(subject, subject.getTypeVariableMap()),
                span(subject.getPackageName()),
                span(subject.getSimpleName()),
            );
            appendAttributesToClassTableRow(row, table.id, subject)
            row.setAttribute('relation', relation);
        } catch (e) {
            console.error(`Failed to create related class for `, table.id, " Class: ", subject, " Error: ", e);
        }
    });
}

/**
 * Creates a TableRowAdder for bindings.
 * @return {TableDataAdder<Binding>} A function that adds bindings to tables.
 */
function addBindingToTableFunction() {
    return /** @type TableDataAdder<Binding> */ ((table, binding) => {
        try {
            let data = null;
            // Check if the binding name is formatted as a function
            let bindingName = binding.getName();
            if (exists(bindingName) && bindingName.includes('(') && bindingName.includes(')') && bindingName.includes(',')) {
                // If the data is a number, we should test to see if it is a type identifier.
                if (typeof data === 'number' && data > 0) {
                    if (getClass(data) != null) {
                        data = createFullSignature(data);
                    }
                }
            }
            data = exists(data) ? data : span(exists(binding.getData()) ? JSON.stringify(binding.getData(), null, 2) : "")
            let row = addRow(
                table,
                span(binding.getName()),
                createFullSignature(binding.getTypeWrapped()),
                data
            );
            appendAttributesToBindingTableRow(row, table.id, binding)
        } catch (e) {
            console.error(`Failed to create entry for `, table.id, " Binding: ", binding, " Error: ", e);
        }
    });
}

/**
 * Creates a TableRowAdder for TypeVariable mappings.
 * @return {TableDataAdder<[string, string]>} A function that adds type variable mappings to tables.
 */
function addTypeVariableMappingToTableFunction() {
    return /** @type {TableDataAdder<[string, string]>} */ ((table, [name, mapping]) => {
        try {
            let row = addRow(
                table,
                span(name),
                span(mapping)
            );
            appendAttributesToTypeVariableMapTableRow(row, table.id, name, mapping)
        } catch (e) {
            console.error(`Failed to create entry for `, table.id, " Type Variable Mapping: ", name, " Error: ", e);
        }
    });
}

/**
 * Creates a table of methods for a class.
 * @param target {JavaType} The class id to create the method table for.
 */
function createMethodTable(target) {
    let methods = target.getMethods();
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
        // if (GLOBAL_SETTINGS.showMethodsInherited === false && method.getDeclaringClass() != id) {
        //     return false;
        // }
        return true;
    })
    // Filter methods to only include the most specific overloads
    // methods = methods.filter((method) => {
    //     return !methods.find((otherMethod) => {
    //         if (method.areMethodsEqual(otherMethod) && otherMethod.isMoreSpecificThan(method)) {
    //             return true;
    //         }
    //     });
    // });
    if (methods.length === 0) {
        return;
    }
    createPagedTable('Methods', 'methods', methods, addMethodToTableFunction(),
        'Link',
        'Signature',
        'Access Modifiers',
        'Return Type',
        'Method Name',
        'Parameters',
        'Type Variables',
        'Declared In'
    )
        ?.sortableByMethod((a) => a)
        ?.create();
}

function createFieldTable(target) {
    let fields = target.getFields();
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
        // if (GLOBAL_SETTINGS.showFieldsInherited === false && field.getDeclaringClass() != id) {
        //     return false;
        // }
        return true;
    });
    if (fields.length === 0) {
        return;
    }
    createPagedTable('Fields', 'fields', fields, addFieldToTableFunction(), 'Link', 'Signature', 'Access Modifiers', 'Type', 'Field Name', 'Declaring Class')
        ?.sortableByField((a) => a)
        ?.create();
}

function createConstructorTable(target) {
    let constructors = target.getConstructors();
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
        // if (GLOBAL_SETTINGS.showConstructorsInherited === false && constructor.getDeclaringClass() !== id) {
        //     return false;
        // }
        return true;
    });
    if (constructors.length === 0) {
        return;
    }
    createPagedTable('Constructors', 'constructors', constructors, addConstructorToTableFunction(),
        'Link',
        'Constructors',
        'Access Modifiers',
        'Parameters',
        'Type Variables',
        'Declared In'
    )
        ?.sortableByConstructor()
        ?.create();
}

function createRelatedClassTable(target) {
    let relatedClasses = target.getRelatedClasses();
    if (relatedClasses.size <= 0) {
        return;
    }
    createPagedTable(
        'Related Classes',
        'related-classes',
        relatedClasses,
        addRelatedClassToTableFunction(),
        'Link',
        'Relation',
        'Signature',
        'Package',
        'Name'
    )
        ?.sortableByRelatedClass()
        ?.create();
}

function createRelationshipTable(target) {
    if (!GLOBAL_SETTINGS.showRelationships) {
        return;
    }
    const relationships = getAllRelations(target.id());
    if (relationships.size === 0) {
        return;
    }
    const addToTable = (table, [to, relations]) => {
        try {
            let row = addRow(
                table,
                createFullSignature(to, {}),
                span(relations.join(","))
            );
            appendAttributesToRelationshipToTableRow(row, to, relations, target.id())
        } catch (e) {
            console.error("Failed to create relationship entry for ", target.id(), " To: ", to, " Relations: ", relations, " Error: ", e);
        }
    };
    createPagedTable('Relationships', 'relationships', [...relationships.entries()], addToTable,
        'Links',
        'RelatedClass',
        'Relationships'
    )
        ?.sortableByRelation()
        ?.create();
}

function createClassTable(title, table_id, classes) {
    if (classes) {
        createPagedTable(title, table_id, classes, addClassToTableFunction(),
            'Link',
            'Signature',
            'Modifiers',
            'Package',
            'Name',
            'Type Variables',
            'Enclosing Class'
        )
            ?.sortableByClass((a) => a)
            ?.create();
    }
}

function createInnerClassTable(subject) {

}

/**
 * Creates a table of bindings
 * @param title {String} The title of the table
 * @param scope {String} The scope of the bindings
 * @param table_id {String} The id of the table
 * @param bindings {Array<Binding>} The bindings to display
 */
function createBindingsTable(title, scope, table_id, bindings) {
    createPagedTable(title, table_id, bindings, addBindingToTableFunction(),
        'Link',
        'Name',
        'Type',
        'Values'
    )
        ?.addDefaultOptionPair(PageableSortableTable.SORTABLE_BY_NAME)
        ?.addSortOptionPair(PageableSortableTable.SORTABLE_BY_TYPE)
        ?.sortableByName()
        ?.create();

}

function createTypeVariableMappingTable(target) {
    let typeVariableMap = target.getTypeVariableMap();
    console.log(`Creating type variable mapping table for ${target.toString()}: `, typeVariableMap);
    if (typeVariableMap.length === 0) {
        return;
    }
    createPagedTable(
        'Type Variable Mappings',
        'type-variable-mappings',
        Object.entries(typeVariableMap).map(
            ([key, value], index) => [
                getClass(key).toString(),
                getClass(value).toString()
            ]
        ),
        addTypeVariableMappingToTableFunction(),
        "Type Variable Name",
        "Mapped To"
    )
        ?.addDefaultOptionPair(PageableSortableTable.SORTABLE_BY_NAME)
        ?.sortableByName()
        ?.create();
}