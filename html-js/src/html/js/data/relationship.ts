function getRelationship([to, relations]: [number, unknown]): JavaType {
    const output = getClass(to)!;
    output.data = JSON.parse(JSON.stringify(output.data)) as Record<string, unknown>;
    output._relations = relations;
    return output;
}
