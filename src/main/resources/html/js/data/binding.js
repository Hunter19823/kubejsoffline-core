/**
 * Returns a binding wrapper object with the given binding data.
 *
 * @param {String} name The name of the binding.
 * @param {TypeIdentifier} type The type of the binding.
 * @param {any} data The data of the binding.
 * @returns {Binding} The binding wrapper object.
 */
function getBinding([name, type, data]) {
    let output = {};
    output._data = data;
    output._name = name;
    output._type = type;
    output._id = `${name}-${getClass(type).id()}`;
    output.getName = function () {
        return output._name;
    }
    output.name = output.getName;
    output.getType = function () {
        return output._type;
    }
    output.type = output.getType;
    output.getData = function () {
        return output._data;
    }
    output.data = output.getData;
    output.getId = function () {
        return output._id;
    }
    output.id = output.getId;
    return output;
}