/**
 * Returns a relationship wrapper object with the given relationship data.
 *
 * @param {TypeIdentifier} to The type identifier of the class that this relationship is to.
 * @param {Array<Relationship>} relations The relations between the two classes.
 * @returns {Relationship} The relationship wrapper object.
 */
function getRelationship([to, relations]) {
    /**
     * @type {JavaType}
     */
    let output = getClass(to);
    output.data = JSON.parse(JSON.stringify(output.data));
    output._relations = relations;
    return output;
}