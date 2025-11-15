function getConstructorData(id) {
    if (!exists(id)) {
        throw new Error("Invalid constructor id: " + id);
    }
    if (typeof id !== "number") {
        throw new Error("Invalid constructor id type: " + typeof id);
    }
    if (id < 0 || id >= DATA.constructors.length) {
        throw new Error("constructor id not within range: " + id);
    }

    if (!exists(DATA.constructors[id])) {
        throw new Error("Illegal State: constructor data does not exist for id: " + id);
    }

    return DATA.constructors[id];
}

