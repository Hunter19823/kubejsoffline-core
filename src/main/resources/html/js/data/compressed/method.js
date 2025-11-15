function getMethodData(id) {
    if (!exists(id)) {
        throw new Error("Invalid method id: " + id);
    }
    if (typeof id !== "number") {
        throw new Error("Invalid method id type: " + typeof id);
    }
    if (id < 0 || id >= DATA.methods.length) {
        throw new Error("method id not within range: " + id);
    }

    if (!exists(DATA.methods[id])) {
        throw new Error("Illegal State: method data does not exist for id: " + id);
    }

    return DATA.methods[id];
}