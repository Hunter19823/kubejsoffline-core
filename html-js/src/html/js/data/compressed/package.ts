function getPackageData(id: number) {
    if (!exists(id)) {
        throw new Error('Invalid package id: ' + id);
    }
    if (typeof id !== 'number') {
        throw new Error('Invalid package id type: ' + typeof id);
    }
    if (id < 0 || id >= DATA.packages.length) {
        throw new Error('Package id not within range: ' + id);
    }

    if (!exists(DATA.packages[id])) {
        throw new Error('Illegal State: Package data does not exist for id: ' + id);
    }

    return DATA.packages[id];
}

function getPackageName(id: number): string {
    const parts = getAsArray(getPackageData(id));
    if (parts.length === 1) {
        return String(parts[0]);
    }
    return getPackageName(Number(parts[1])) + '.' + parts[0];
}
