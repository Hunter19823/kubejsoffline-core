function getRelationship([to, relations]: [number, Record<string, unknown>]): JavaType {
    const output = getClass(to)!;
    output.data = JSON.parse(JSON.stringify(output.data)) as EntityData;
    output._relations = relations;
    return output;
}
