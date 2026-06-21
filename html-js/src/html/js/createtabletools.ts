type TableEntity = DocWrapper & Record<string, (...args: never[]) => unknown>;

function readModifiers(entity: TableEntity): JavaModifiers {
    return (entity.modifiers as () => JavaModifiers)();
}

function addFieldToTableFunction() {
    return (table: HTMLTableElement, field: TableEntity) => {
        try {
            const row = addRow(
                table,
                createFieldSignature(field),
                span(MODIFIER.toString(readModifiers(field))),
                createFullSignature(field.getTypeWrapped() as number, field.getTypeVariableMap() as Record<string, number>),
                span(field.getName() as string),
                createFullSignature(field.getDeclaringClass() as number, field.getTypeVariableMap() as Record<string, number>)
            );
            appendAttributesToFieldTableRow(row, table.id, field);
        } catch (e) {
            console.error('Failed to create field entry for ', field.getDeclaringClass(), ' field: ', field, ' Error: ', e);
        }
    };
}

function addConstructorToTableFunction() {
    return (table: HTMLTableElement, constructor: TableEntity) => {
        try {
            const row = addRow(
                table,
                createConstructorSignature(constructor),
                span(MODIFIER.toString(readModifiers(constructor))),
                createParametersSignature(constructor),
                createTypeVariableSignature(constructor),
                createFullSignature(constructor.getDeclaringClass() as number, constructor.getTypeVariableMap() as Record<string, number>)
            );
            appendAttributesToConstructorTableRow(row, table.id, constructor);
        } catch (e) {
            console.error('Failed to create constructor for Table: ', table.id, ' Constructor: ', constructor, ' Error: ', e);
        }
    };
}

function addMethodToTableFunction() {
    return (table: HTMLTableElement, method: TableEntity) => {
        try {
            const row = addRow(
                table,
                createMethodSignature(method),
                span(MODIFIER.toString(readModifiers(method))),
                createFullSignature(method.getTypeWrapped() as number, method.getTypeVariableMap() as Record<string, number>),
                span(method.name() as string),
                createParametersSignature(method),
                createTypeVariableSignature(method),
                createFullSignature(method.getDeclaringClass() as number, method.getTypeVariableMap() as Record<string, number>)
            );
            appendAttributesToMethodTableRow(row, table.id, method.getDeclaringClass() as number, method);
        } catch (e) {
            console.error('Failed to create method entry for Table: ', table.id, ' Method: ', method, ' Error: ', e);
        }
    };
}

function addClassToTableFunction() {
    return (table: HTMLTableElement, subject: JavaType) => {
        try {
            const row = addRow(
                table,
                createFullSignature(subject.id(), subject.getTypeVariableMap() as Record<string, number>),
                span(MODIFIER.toString(subject.modifiers())),
                span(subject.getPackage()),
                span(subject.getSimpleName()),
                createTypeVariableSignature(subject as unknown as TableEntity),
                exists(subject.getEnclosingClass())
                    ? createFullSignature(subject.getEnclosingClass() as number, subject.getTypeVariableMap() as Record<string, number>)
                    : span('')
            );
            appendAttributesToClassTableRow(row, table.id, subject);
        } catch (e) {
            console.error(`Failed to create entry for `, table.id, ' Class: ', subject, ' Error: ', e);
        }
    };
}

function addRelatedClassToTableFunction() {
    return (table: HTMLTableElement, [subject, relation]: [JavaType, string]) => {
        try {
            const row = addRow(
                table,
                span(relation),
                createFullSignature(subject.id(), subject.getTypeVariableMap() as Record<string, number>),
                span(subject.getPackageName()),
                span(subject.getSimpleName())
            );
            appendAttributesToClassTableRow(row, table.id, subject);
            row.setAttribute('relation', relation);
        } catch (e) {
            console.error(`Failed to create related class for `, table.id, ' Class: ', subject, ' Error: ', e);
        }
    };
}

function addBindingToTableFunction() {
    return (table: HTMLTableElement, binding: TableEntity) => {
        try {
            let data: HTMLElement | null = null;
            const bindingName = binding.getName() as string;
            if (exists(bindingName) && bindingName.includes('(') && bindingName.includes(')') && bindingName.includes(',')) {
                if (typeof data === 'number' && data > 0) {
                    if (getClass(data) != null) {
                        data = createFullSignature(data);
                    }
                }
            }
            const cellData = exists(data)
                ? data
                : span(exists(binding.getData()) ? JSON.stringify(binding.getData(), null, 2) : '');
            const row = addRow(
                table,
                span(binding.getName() as string),
                createFullSignature(binding.getTypeWrapped() as number, binding.getTypeVariableMap() as Record<string, number>),
                cellData
            );
            appendAttributesToBindingTableRow(row, table.id, binding);
        } catch (e) {
            console.error(`Failed to create entry for `, table.id, ' Binding: ', binding, ' Error: ', e);
        }
    };
}

function addTypeVariableMappingToTableFunction() {
    return (table: HTMLTableElement, [name, mapping]: [string, string]) => {
        try {
            const row = addRow(table, span(name), span(mapping));
            appendAttributesToTypeVariableMapTableRow(row, table.id, name, mapping);
        } catch (e) {
            console.error(`Failed to create entry for `, table.id, ' Type Variable Mapping: ', name, ' Error: ', e);
        }
    };
}

function createMethodTable(target: JavaType) {
    let methods = target.getMethods() as TableEntity[];
    if (!(methods && GLOBAL_SETTINGS?.showMethods)) {
        return;
    }
    methods = methods.filter((method) => {
        if (GLOBAL_SETTINGS?.showPrivate === false && MODIFIER.isPrivate(readModifiers(method))) {
            return false;
        }
        if (GLOBAL_SETTINGS?.showProtected === false && MODIFIER.isProtected(readModifiers(method))) {
            return false;
        }
        return true;
    });
    createMethodTableFromList('Methods', methods);
}

function createMethodTableFromList(title: string, methods: TableEntity[]) {
    if (methods.length === 0) {
        return;
    }
    return createPagedTable(title, 'methods', methods, addMethodToTableFunction(), 'Link', 'Signature', 'Access Modifiers', 'Return Type', 'Method Name', 'Parameters', 'Type Variables', 'Declared In')
        ?.sortableByMethod((a) => a)
        ?.create();
}

function createFieldTable(target: JavaType) {
    let fields = target.getFields() as TableEntity[];
    if (!(fields && GLOBAL_SETTINGS?.showFields)) {
        return;
    }
    fields = fields.filter((field) => {
        if (GLOBAL_SETTINGS?.showPrivate === false && MODIFIER.isPrivate(readModifiers(field))) {
            return false;
        }
        if (GLOBAL_SETTINGS?.showProtected === false && MODIFIER.isProtected(readModifiers(field))) {
            return false;
        }
        return true;
    });
    createFieldTableFromList('Fields', fields);
}

function createFieldTableFromList(title: string, fields: TableEntity[]) {
    if (fields.length === 0) {
        return;
    }
    return createPagedTable(title, 'fields', fields, addFieldToTableFunction(), 'Link', 'Signature', 'Access Modifiers', 'Type', 'Field Name', 'Declaring Class')
        ?.sortableByField((a) => a)
        ?.create();
}

function createConstructorTable(target: JavaType) {
    let constructors = target.getConstructors() as TableEntity[];
    if (!(constructors && GLOBAL_SETTINGS?.showConstructors)) {
        return;
    }
    constructors = [...constructors].filter((constructor) => {
        if (GLOBAL_SETTINGS?.showPrivate === false && MODIFIER.isPrivate(readModifiers(constructor))) {
            return false;
        }
        if (GLOBAL_SETTINGS?.showProtected === false && MODIFIER.isProtected(readModifiers(constructor))) {
            return false;
        }
        return true;
    });
    createConstructorTableFromList(constructors);
}

function createConstructorTableFromList(constructors: TableEntity[]) {
    if (constructors.length === 0) {
        return;
    }
    return createPagedTable('Constructors', 'constructors', constructors, addConstructorToTableFunction(), 'Link', 'Constructors', 'Access Modifiers', 'Parameters', 'Type Variables', 'Declared In')
        ?.sortableByConstructor()
        ?.create();
}

function createRelatedClassTable(target: JavaType) {
    const relatedClasses = target.getRelatedClasses() as unknown as { size: number };
    if (relatedClasses.size <= 0) {
        return;
    }
    createPagedTable('Related Classes', 'related-classes', relatedClasses as unknown as [JavaType, string][], addRelatedClassToTableFunction(), 'Link', 'Relation', 'Signature', 'Package', 'Name')
        ?.sortableByRelatedClass()
        ?.create();
}

function createRelationshipTable(target: JavaType) {
    if (!GLOBAL_SETTINGS?.showRelationships) {
        return;
    }
    const relationships = getAllRelations(target.id());
    if (relationships.size === 0) {
        return;
    }
    const addToTable = (table: HTMLTableElement, [to, relations]: [number, unknown[]]) => {
        try {
            const row = addRow(table, createFullSignature(to, {}), span(relations.join(',')));
            appendAttributesToRelationshipToTableRow(row, to, relations, target.id());
        } catch (e) {
            console.error('Failed to create relationship entry for ', target.id(), ' To: ', to, ' Relations: ', relations, ' Error: ', e);
        }
    };
    createPagedTable('Relationships', 'relationships', [...relationships.entries()], addToTable, 'Links', 'RelatedClass', 'Relationships')?.sortableByRelation()?.create();
}

function createClassTable(title: string, table_id: string, classes: (JavaType | null)[]) {
    if (!exists(classes) || classes.length === 0) {
        return;
    }
    createPagedTable(title, table_id, classes.filter(exists) as JavaType[], addClassToTableFunction(), 'Link', 'Signature', 'Modifiers', 'Package', 'Name', 'Type Variables', 'Enclosing Class')
        ?.sortableByClass((a) => a)
        ?.create();
}

function createBindingsTable(title: string, scope: string, table_id: string, bindings: DocWrapper[]) {
    createPagedTable(title, table_id, bindings as TableEntity[], addBindingToTableFunction(), 'Link', 'Name', 'Type', 'Values')
        ?.addDefaultOptionPair(PageableSortableTable!.SORTABLE_BY_NAME)
        ?.addSortOptionPair(PageableSortableTable!.SORTABLE_BY_TYPE)
        ?.sortableByName()
        ?.create();
}

function createTypeVariableMappingTable(target: JavaType) {
    const typeVariableMap = target.getTypeVariableMap() as Record<string, number>;
    console.log(`Creating type variable mapping table for ${target.toString()}: `, typeVariableMap);
    createTypeVariableTable(typeVariableMap);
}

function createTypeVariableTable(typeVariableMap: Record<string, number>) {
    if ((typeVariableMap as unknown as { length?: number }).length === 0) {
        return;
    }
    return createPagedTable(
        'Type Variable Mappings',
        'type-variable-mappings',
        Object.entries(typeVariableMap).map(
            ([key, value]): [string, string] => [getClass(key)!.toString(), getClass(value)!.toString()]
        ),
        addTypeVariableMappingToTableFunction(),
        'Type Variable Name',
        'Mapped To'
    )
        ?.addDefaultOptionPair(PageableSortableTable!.SORTABLE_BY_NAME)
        ?.sortableByName()
        ?.create();
}
