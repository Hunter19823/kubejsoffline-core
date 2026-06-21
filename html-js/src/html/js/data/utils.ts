function exists<T>(thing: T | null | undefined): thing is T {
    return thing !== null && thing !== undefined;
}

function getAsArray<T>(value: T | T[] | null | undefined): T[] {
    if (!exists(value)) {
        return [];
    }
    if (Array.isArray(value)) {
        return value;
    }
    return [value];
}

function applyToAllClasses(action: (classData: JavaType) => void) {
    for (let i = 0; i < DATA.types.length; i++) {
        try {
            action(getClass(i)!);
        } catch (e) {
            console.error(`An error occurred performing operation on class #${i}`, e);
        }
    }
}

function findAllClassesThatMatch(predicate: (classData: JavaType) => boolean): number[] {
    const output: number[] = [];
    applyToAllClasses((class_data) => {
        if (predicate(class_data)) {
            output.push(class_data.id());
        }
    });
    return output;
}

function doesObjectInclude(object: unknown, value: unknown, seen: Set<unknown> = new Set()): boolean {
    if (!exists(object)) {
        return false;
    }
    if (object === value) {
        return true;
    }
    if (seen.has(object)) {
        return false;
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
            if (Object.prototype.hasOwnProperty.call(object, key)) {
                const record = object as Record<string, unknown>;
                if (record[key] === value) {
                    return true;
                }
                if (doesObjectInclude(record[key], value, seen)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function decodePart(
    part: unknown,
    objectDecoder: ((encoded: string) => unknown) | null = null
): unknown {
    if (typeof part !== 'string') {
        throw new Error('Invalid part data: ' + part);
    }
    let partText = part;
    if (partText.trim() === '') {
        return null;
    }
    if (partText === 'T') {
        return true;
    }
    if (partText === 'F') {
        return false;
    }
    if (partText.startsWith('[')) {
        partText = partText.slice(1);
        return partText.split('|').map((p: string) => {
            return decodePart(p.trim());
        });
    } else if (partText.startsWith('{')) {
        partText = partText.slice(1);
        if (objectDecoder && typeof objectDecoder === 'function') {
            return objectDecoder(atob(partText));
        }
        throw new Error('Object decoder not provided for part: ' + partText);
    } else {
        const num = parseInt(partText, 10);
        if (isNaN(num)) {
            throw new Error('Invalid number: ' + partText);
        }
        return num;
    }
}
