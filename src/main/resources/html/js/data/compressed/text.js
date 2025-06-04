function decompressString(compressedString) {
    return DATA.names[compressedString];
}

function getNameData(id) {
    if (!exists(id)) {
        throw new Error("Invalid name id: " + id);
    }
    if (typeof id !== "number") {
        if (typeof id === "string") {
            return id;
        }
        if (Array.isArray(id)) {
            return id.map((part) => {
                return getNameData(part);
            }).join("");
        }
    }
    if (id < 0 || id >= DATA.names.length) {
        throw new Error("Name id not within range: " + id);
    }

    if (!exists(DATA.names[id])) {
        throw new Error("Illegal State: Name data does not exist for id: " + id);
    }

    return getNameData(DATA.names[id]);
}