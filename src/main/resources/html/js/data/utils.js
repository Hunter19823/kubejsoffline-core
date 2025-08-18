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




function decodePart(part, objectDecoder = null) {
    if (typeof part !== "string") {
        throw new Error("Invalid part data: " + part);
    }
    // If the part is empty, return null
    if (part.trim() === "") {
        return null;
    }
    // Format
    // by default assume integer.
    // If it starts with a [ then it is an array.
    // If it starts with a { then it is an object.
    // If it is equal to T then it is a boolean (true)
    // If it is equal to F then it is a boolean (false)
    if (part === "T") {
        return true;
    }
    if (part === "F") {
        return false;
    }
    if (part.startsWith("[")) {
        // Remove the brackets
        part = part.slice(1);
        // Split by comma
        return part.split("|").map((p) => {
            return decodePart(p.trim());
        });
    } else if (part.startsWith("{")) {
        // Remove the curly braces
        part = part.slice(1);
        // Call the object decoder if provided
        if (objectDecoder && typeof objectDecoder === "function") {
            return objectDecoder(atob(part));
        }
        // Otherwise throw an error
        throw new Error("Object decoder not provided for part: " + part);
    } else {
        // Otherwise assume it's an integer
        let num = parseInt(part, 10);
        if (isNaN(num)) {
            throw new Error("Invalid number: " + part);
        }
        return num;
    }
}