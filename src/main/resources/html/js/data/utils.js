function exists(thing) {
    return thing !== null && thing !== undefined;
}

/**
 * Returns the value as an array, returns
 * an empty array if the value is null or undefined,
 * and returns the value if the value is already an Array.
 * @param {T | T[]}value
 * @template T
 * @returns {T[]}
 */
function getAsArray(value) {
    if (!exists(value)) {
        return [];
    }
    if (Array.isArray(value)) {
        return value;
    }
    return [value];
}

function applyToAllClasses(action) {
    for (let i = 0; i < DATA.types.length; i++) {
        try {
            action(getClass(i));
        } catch(e) {
            console.error(`An error occurred performing operation on class #${i}`, e);
        }
    }
}

function findAllClassesThatMatch(predicate) {
    let output = [];
    applyToAllClasses((class_data) => {
        if (predicate(class_data)) {
            output.push(class_data.id());
        }
    });
    return output;
}

function doesObjectInclude(object, value, seen=new Set()) {
    if (!exists(object)) {
        return false;
    }
    if (object === value) {
        return true;
    }
    if (seen.has(object)) {
        return false; // Prevent circular references
    }
    seen.add(object);
    if (Array.isArray(object)) {
        for (let i = 0; i < object.length; i++) {
            if (object[i] === value) {
                return true;
            }
            if (doesObjectInclude(object[i], value, seen)) {
                return true;
            }
        }
    }
    if (typeof object === 'object') {
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                if (object[key] === value) {
                    return true;
                }
                if (doesObjectInclude(object[key], value, seen)) {
                    return true;
                }
            }
        }
    }
    return false;
}