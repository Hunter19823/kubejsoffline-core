function getBinding([name, type, data]: [string, number, unknown]): DocWrapper {
    const output: DocWrapper = {};
    output._data = data;
    output._name = name;
    output._type = type;
    output._id = `${name}-${getClass(type)!.id()}`;

    const wrapped = setRemapType(setTypeVariableMap(output)) as DocWrapper;

    wrapped.getName = function () {
        return wrapped._name;
    };
    wrapped.name = wrapped.getName;
    wrapped.getType = function () {
        return wrapped._type;
    };
    wrapped.type = wrapped.getType;
    wrapped.getData = function () {
        return wrapped._data;
    };
    wrapped.data = wrapped.getData as EntityData | undefined;
    wrapped.getId = function () {
        return wrapped._id;
    };

    wrapped.id = wrapped.getId;
    return wrapped;
}
