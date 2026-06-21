function getTypeData(id: number) {
    if (!exists(id)) {
        throw new Error('Invalid type id: ' + id);
    }
    if (typeof id !== 'number') {
        throw new Error('Invalid type id type: ' + typeof id);
    }
    if (id < 0 || id >= DATA.types.length) {
        throw new Error('Type id not within range: ' + id);
    }

    if (!exists(DATA.types[id])) {
        throw new Error('Illegal State: Type data does not exist for id: ' + id);
    }

    if (!exists(DATA.types[id]._id)) DATA.types[id]._id = id;

    return DATA.types[id];
}

function findClassByName(name: string): JavaType | null {
    const isArray = name.endsWith('[]');
    if (isArray) {
        return findClassByName(name.substring(0, name.length - 2));
    }
    const containsGeneric = name.includes('<') && name.includes('>');
    const containsInnerClass = name.includes('$');
    const isParameterized = (Number(containsGeneric) & Number(name.endsWith('>'))) !== 0 || containsInnerClass;
    const isWildcard = name.startsWith('?');
    const containsPackage = name.includes('.');

    const shouldUseReferenceName = containsPackage && containsGeneric;
    const shouldUseFullyQualifiedName = containsPackage && !containsGeneric;
    const shouldUseName = !containsPackage && containsGeneric;
    const shouldUseSimpleName = !containsPackage && !containsGeneric;

    function createFilter(filterName: string) {
        return function (type: JavaType | null) {
            if (!type) {
                return undefined;
            }
            if (shouldUseReferenceName && type.referenceName() === name) {
                console.debug('Found ' + filterName + ' using referenceName: ', type.referenceName());
                return type;
            }
            if (
                shouldUseFullyQualifiedName &&
                type.fullyQualifiedName(type.getTypeVariableMap(), false) === name
            ) {
                console.debug(
                    'Found ' + filterName + ' using fully qualified name: ',
                    type.fullyQualifiedName(type.getTypeVariableMap(), false)
                );
                return type;
            }
            if (shouldUseName && type.name() === name) {
                console.debug('Found ' + filterName + ' using name: ', type.name());
                return type;
            }
            if (shouldUseSimpleName && type.simplename() === name) {
                console.debug('Found ' + filterName + ' using simple name: ', type.simplename());
                return type;
            }
        };
    }

    const wildCardFilter = createFilter('wildcard type');
    const parameterizedFilter = createFilter('parameterized type');
    const rawFilter = createFilter('raw class type');
    const typeVariableFilter = createFilter('type variable');

    console.debug(
        'Searching for class: ',
        name,
        'isArray: ',
        isArray,
        'containsGeneric: ',
        containsGeneric,
        'containsInnerClass: ',
        containsInnerClass,
        'isParameterized: ',
        isParameterized,
        'isWildcard: ',
        isWildcard,
        'containsPackage: ',
        containsPackage,
        'shouldUseReferenceName: ',
        shouldUseReferenceName,
        'shouldUseFullyQualifiedName: ',
        shouldUseFullyQualifiedName,
        'shouldUseName: ',
        shouldUseName,
        'shouldUseSimpleName: ',
        shouldUseSimpleName
    );

    if (isWildcard) {
        return DATA._wildcard_types.map((index) => getClass(index)).find(wildCardFilter) ?? null;
    }

    if (isParameterized) {
        const result = DATA._parameterized_types.map((index) => getClass(index)).find(parameterizedFilter);
        if (exists(result)) return result;
        const rawResult = DATA._raw_types.map((index) => getClass(index)).find(rawFilter);
        if (exists(rawResult)) return rawResult;
        return DATA._type_variables.map((index) => getClass(index)).find(typeVariableFilter) ?? null;
    }

    const out = DATA._raw_types.map((index) => getClass(index)).find(rawFilter);
    if (exists(out)) return out;
    return DATA._type_variables.map((index) => getClass(index)).find(typeVariableFilter) ?? null;
}
