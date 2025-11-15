function getFieldData(id) {
    if (!exists(id)) {
        throw new Error("Invalid field id: " + id);
    }
    if (typeof id !== "number") {
        throw new Error("Invalid field id type: " + typeof id);
    }
    if (id < 0 || id >= DATA.fields.length) {
        throw new Error("field id not within range: " + id);
    }

    if (!exists(DATA.fields[id])) {
        throw new Error("Illegal State: field data does not exist for id: " + id);
    }

    return DATA.fields[id];
}

