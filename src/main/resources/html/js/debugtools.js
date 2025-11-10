// This file does not get included in the build, but is used for
// ide Type hinting and debugging.

function countCircularReferences() {
    for (let prop of Object.entries(PROPERTY)) {
        let circularReferences = 0;
        DATA.types.forEach((data, index) => {
            if (data[prop[1]] !== index) {
                return;
            }
            circularReferences++;
        });
        if (circularReferences === 0) continue;
        console.log(`Property '${prop[0]}' has ${circularReferences} Circular References.`);
    }
}


function findBrokenClassNames() {
    let brokenNames = [];
    DATA.types.forEach((data, index) => {
        try {
            getClass(index).name();
        } catch (e) {
            brokenNames.push([data, index, e]);
            if (brokenNames.length > 100) {
                console.log("Breaking after 100 broken names.", brokenNames);
                throw new Error("Too many broken names.");
            }
        }
    })
    console.log("Total Broken Names: " + brokenNames.length);
    return brokenNames;
}

function findInvalidNames() {
    let invalidNames = [];
    for (let i = 0; i < DATA.types.length; i++) {
        try {
            let name = getClass(i).name();
            // If it's blank
            if (name.trim().length === 0) {
                invalidNames.push([name, i]);
            }
            // If it ends with a period
            if (name.trim().endsWith(".")) {
                invalidNames.push([name, i]);
            }
            // If it starts with a period
            if (name.trim().startsWith(".")) {
                invalidNames.push([name, i]);
            }
            // If it contains an empty generic definition
            if (name.trim().includes("<>")) {
                invalidNames.push([name, i]);
            }
        } catch (e) {
            invalidNames.push([e, i]);
        }
    }
    console.log("Total Invalid Names: " + invalidNames.length);
    return invalidNames;
}

function findAllTypeVariablesWithInvalidState() {
    let invalid = [];
    DATA.types.forEach((data, index) => {
        if (!getClass(index).isParameterizedType())
            return;
        if (!exists(data[PROPERTY.TYPE_VARIABLES]))
            return;
        let actualTypes = _getAsArray(data[PROPERTY.TYPE_VARIABLES]);
        let typeVariables = getClass(data[PROPERTY.RAW_PARAMETERIZED_TYPE]).getTypeVariables();
        if (actualTypes.length !== typeVariables.length) {
            invalid.push([data, index, actualTypes, typeVariables]);
        }
    });
    console.log("Total Invalid Type Variables: " + invalid.length);
    return invalid;
}

function findWeirdestNames() {
    let weirdNames = [];
    DATA.types.forEach((data, index) => {
        try {
            let name = getClass(index).name();
            // If the name contains more than 2 periods.
            if (name.split(".").length > 2) {
                weirdNames.push([name, data, index]);
            }
            // If the name contains more than 2 generics.
            if (name.split("<").length > 2) {
                weirdNames.push([name, data, index]);
            }
        } catch (e) {
            console.error(e);
            console.log(data, index);
            throw e;
        }
    });
    console.log("Total Weird Names: " + weirdNames.length);
    return weirdNames.sort((a, b) => {
        return a[0].length - b[0].length;
    });
}

function getRawClasses() {
    let rawClasses = [];
    DATA.types.forEach((data, index) => {
        if (getClass(index).isRawClass()) {
            rawClasses.push([deobfuscateData(data), index]);
        }
    });
    console.log("Total Raw Classes: " + rawClasses.length);
    return rawClasses;
}

function getParameterizedClasses() {
    let parameterizedClasses = [];
    DATA.types.forEach((data, index) => {
        if (getClass(index).isParameterizedType()) {
            parameterizedClasses.push([deobfuscateData(data), index]);
        }
    });
    console.log("Total Parameterized Classes: " + parameterizedClasses.length);
    return parameterizedClasses;
}

function getWildcardClasses() {
    let wildcardClasses = [];
    DATA.types.forEach((data, index) => {
        if (getClass(index).isWildcard()) {
            wildcardClasses.push([deobfuscateData(data), index]);
        }
    });
    console.log("Total Wildcard Classes: " + wildcardClasses.length);
    return wildcardClasses;
}

function getTypeVariables() {
    let typeVariables = [];
    DATA.types.forEach((data, index) => {
        if (getClass(index).isTypeVariable()) {
            typeVariables.push([deobfuscateData(data), index]);
        }
    });
    console.log("Total Type Variables: " + typeVariables.length);
    return typeVariables;
}

function getProperNameOfRawClass(id) {
    const classType = getClass(id);
    if (!classType.isRawClass()) {
        console.error("Type is not a raw class. Cannot get proper name.");
    }
    const typeVariableMap = createTypeVariableMap(id);
    return getGenericDefinitionLogic(classType, typeVariableMap, false);
}

function getTypeVariableTree(id) {
    // The end format will be:
    // {
    //   id: <typeId>,
    //   name: <typeName>,
    //   typeVariables: [
    //      {
    //          id: <typeId>,
    //          name: <typeName>,
    //          bounds: [
    //              {
    //                  id: <typeId>,
    //                  name: <typeName>
    //              },
    //              ...
    //          ]
    //      },
    //      ...
    //   ],
    //   actualTypes: [
    //      {
    //          id: <typeId>,
    //          name: <typeName>
    //      },
    //      ...
    //   ],
    //   ownerType: {
    //       <same format as above>
    //   },
    //   rawType: {
    //       <same format as above>
    //   },
    //   superClass: {
    //       <same format as above>
    //   },
    //   interfaces: [
    //       {
    //           <same format as above>
    //       },
    //       ...
    //   ]
    // }
    const classType = getClass(id);
    if (classType == null) {
        throw new Error("Invalid class ID: " + id);
    }
    let output = {};
    output.id = id;
    output.name = classType.getFullyQualifiedName();

    if (classType.isTypeVariable()) {
        output.bounds = classType.getTypeVariableBounds().map((bound) => {
            let boundType = getClass(bound);
            return {
                id: boundType.id(),
                name: boundType.getFullyQualifiedName()
            };
        });
        return output;
    }

    if (classType.isParameterizedType()) {
        // The Parameterized Type's actual types are also using the type variables variable.
        output.actualTypes = classType.getTypeVariables().map((typeVar, index) => {
            let actualType = getClass(typeVar);
            return {
                id: actualType.id(),
                name: actualType.getFullyQualifiedName()
            };
        });
        if (exists(classType.getRawType())) {
            output.rawType = getTypeVariableTree(classType.getRawType());
        }
        if (exists(classType.getOwnerType())){
            output.ownerType = getTypeVariableTree(classType.getOwnerType());
        }

        return output;
    }

    if (!classType.isRawClass()) {
        throw new Error("Type is not a raw class, parameterized type, or type variable. Cannot get type variable tree.");
    }

    output.typeVariables = classType.getTypeVariables().map((typeVar) => {
        return getTypeVariableTree(typeVar);
    });

    if (exists(classType.getSuperClass())) {
        output.superClass = getTypeVariableTree(classType.getSuperClass());
    }

    output.interfaces = classType.getInterfaces().map((interfaceId) => {
        return getTypeVariableTree(interfaceId);
    });

    return output;
}

function cleanLabel(label) {
    return label.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function createGraphVizGraph(ids) {
    let graph = {
        nodes: [],
        edges: []
    };
    let seenNodes = new Set();
    let edgedNodes = new Set();
    let seenEdges = {};
    let isolatedNodes = new Set();
    function addNode(id, label, metaData={}) {
        if (seenNodes.has(id)) return;
        if (!edgedNodes.has(id)) {
            isolatedNodes.add(id);
        }
        seenNodes.add(id);
        graph.nodes.push({id: id, label: cleanLabel(label), metaData: metaData});
    }
    function addEdge(fromId, toId, label, metaData={}) {
        if (!exists(seenEdges[fromId])) {
            seenEdges[fromId] = new Set();
        }
        if (seenEdges[fromId].has(toId)) {
            return;
        }
        seenEdges[fromId].add(toId);
        if (isolatedNodes.has(fromId)) {
            isolatedNodes.delete(fromId);
        }
        if (isolatedNodes.has(toId)) {
            isolatedNodes.delete(toId);
        }
        if (!edgedNodes.has(fromId)) {
            edgedNodes.add(fromId);
        }
        if (!edgedNodes.has(toId)) {
            edgedNodes.add(toId);
        }
        graph.edges.push({from: fromId, to: toId, label: cleanLabel(label), metaData: metaData});
    }

    ids.forEach((id) => {
        const classType = getClass(id);
        const className = classType.getName();
        addNode(classType.id(), className);

        // Raw Class
        if (classType.isRawClass()) {
            addRawClass(classType, addEdge);
        }
        // Parameterized Type
        if (classType.isParameterizedType()) {
            addParameterizedType(classType, addEdge);
        }
        // Type Variable
        if (classType.isTypeVariable()) {
            addTypeVariable(classType, addEdge);
        }
        // Wildcard Type
        if (classType.isWildcard()) {
            addWildcardType(classType, addEdge);
        }

        // let typeVariableMap = classType.getTypeVariableMap();
        //
        // for (let [key, value] of Object.entries(typeVariableMap)) {
        //     let id = (key * 10000)+(value % 10000); // Unique ID for the mapping
        //     const typeVar = getClass(key);
        //     const mappedType = getClass(value);
        //     addNode(id, `${typeVar.getSimpleName()} → ${mappedType.getSimpleName()}`);
        //     addEdge(classType.id(), id, `type variable map`);
        //     addEdge(id, typeVar.id(), `type variable`);
        //     addEdge(id, mappedType.id(), `mapped to`);
        // }
    });

    // Remove isolated nodes
    // graph.nodes = graph.nodes.filter((node) => !isolatedNodes.has(node.id));

    return graph;
}

function addRawClass(type, addEdge) {
    if (!type.isRawClass()) {
        throw new Error("Type is not a raw class. Cannot add raw class edges.");
    }
    // Add superclass edge
    if (exists(type.getSuperClass())) {
        addEdge(type.id(), type.getSuperClass(), "extends");
    }
    // Add interface edges
    type.getInterfaces().forEach((interfaceId) => {
        addEdge(type.id(), interfaceId, "implements");
    });

    // Add Type Variable edges
    type.getTypeVariables().forEach((typeVarId, index) => {
        addEdge(type.id(), typeVarId, `defines type variable`);
    });

    // // Add Enclosing class edge
    // if (exists(type.getEnclosingClass())) {
    //     addEdge(type.id(), type.getEnclosingClass(), "enclosed by");
    // }
    //
    // // Add Declaring class edge
    // if (exists(type.getDeclaringClass())) {
    //     addEdge(type.id(), type.getDeclaringClass(), "declared in");
    // }
    //
    // // Add Inner Classes
    // type.getInnerClasses().forEach((innerClassId) => {
    //     addEdge(type.id(), innerClassId, "inner class");
    // });
}

function addParameterizedType(type, addEdge) {
    if (!type.isParameterizedType()) {
        throw new Error("Type is not a parameterized type. Cannot add parameterized type edges.");
    }
    // Add raw type edge
    if (exists(type.getRawType())) {
        addEdge(type.id(), type.getRawType(), "raw type");
    }
    // Add owner type edge
    if (exists(type.getOwnerType())) {
        addEdge(type.getOwnerType(), type.id(), "owner type");
    }
    // // Add actual types edges
    type.getTypeVariables().forEach((actualTypeId, index) => {
        addEdge(type.id(), actualTypeId, `actual type ${index}`);
    });
}

function addTypeVariable(type, addEdge) {
    if (!type.isTypeVariable()) {
        throw new Error("Type is not a type variable. Cannot add type variable edges.");
    }
    // // Add bounds edges
    // type.getTypeVariableBounds().forEach((boundId, index) => {
    //     addEdge(type.id(), boundId, `bound ${index}`);
    // });
}

function addWildcardType(type, addEdge) {
    if (!type.isWildcard()) {
        throw new Error("Type is not a wildcard type. Cannot add wildcard type edges.");
    }
    // Add upper bounds edges
    type.getUpperBound().forEach((upperBoundId, index) => {
        addEdge(type.id(), upperBoundId, `upper bound ${index}`);
    });
    // Add lower bounds edges
    type.getLowerBound().forEach((lowerBoundId, index) => {
        addEdge(type.id(), lowerBoundId, `lower bound ${index}`);
    });
}

function gatherReferences(id, references=new Set()) {
    const classType = getClass(id);
    if (references.has(classType.id())) {
        return;
    }
    references.add(classType.id());
    if (classType.isRawClass()) {
        // Superclass
        if (exists(classType.getSuperClass())) {
            gatherReferences(classType.getSuperClass(), references);
        }
        // Interfaces
        classType.getInterfaces().forEach((interfaceId) => {
            gatherReferences(interfaceId, references);
        });
        // Type Variables
        classType.getTypeVariables().forEach((typeVarId) => {
            gatherReferences(typeVarId, references);
        });
        // // Enclosing Class
        // if (exists(classType.getEnclosingClass())) {
        //     gatherReferences(classType.getEnclosingClass(), references);
        // }
        // // Declaring Class
        // if (exists(classType.getDeclaringClass())) {
        //     gatherReferences(classType.getDeclaringClass(), references);
        // }
        // // Inner Classes
        // classType.getInnerClasses().forEach((innerClassId) => {
        //     gatherReferences(innerClassId, references);
        // });
    }
    if (classType.isParameterizedType()) {
        // Raw Type
        if (exists(classType.getRawType())) {
            gatherReferences(classType.getRawType(), references);
        }
        // Owner Type
        if (exists(classType.getOwnerType())) {
            gatherReferences(classType.getOwnerType(), references);
        }
        // Actual Types
        classType.getTypeVariables().forEach((actualTypeId) => {
            gatherReferences(actualTypeId, references);
        });
    }
    if (classType.isTypeVariable()) {
        // Bounds
        classType.getTypeVariableBounds().forEach((boundId) => {
            gatherReferences(boundId, references);
        });
    }
    if (classType.isWildcard()) {
        // Upper Bounds
        classType.getUpperBound().forEach((upperBoundId) => {
            gatherReferences(upperBoundId, references);
        });
        // Lower Bounds
        classType.getLowerBound().forEach((lowerBoundId) => {
            gatherReferences(lowerBoundId, references);
        });
    }
    return references;
}

function generateGraphVizDot(graph) {
    let dot = "digraph G {\n";
    graph.nodes.forEach((node) => {
        dot += `  ${node.id} [label="${node.label}"];\n`;
    });
    graph.edges.forEach((edge) => {
        dot += `  ${edge.from} -> ${edge.to} [label="${edge.label}"];\n`;
    });
    dot += "}\n";
    return dot;
}

function generateMermaidGraph(graph) {
    let mermaid = "flowchart TD\n";
    graph.nodes.forEach((node) => {
        if (node.id >= DATA.types.length) {
            mermaid += `  ${node.id}(["${node.label}"]);\n`;
            return;
        }
        let type = getClass(node.id);
        if (type.isRawClass()) {
            mermaid += `  ${node.id}(("${node.label}"));\n`;
        }
        if (type.isParameterizedType()) {
            mermaid += `  ${node.id}["${node.label}"];\n`;
        }
        if (type.isTypeVariable()) {
            mermaid += `  ${node.id}(["${node.label}"]);\n`;
        }
        if (type.isWildcard()) {
            mermaid += `  ${node.id}{{"${node.label}"}};\n`;
        }
    });
    mermaid += "\n";
    graph.edges.forEach((edge) => {
        mermaid += `  ${edge.from} -->|${edge.label}| ${edge.to};\n`;
    });
    return mermaid;
}

function generateMermaidGraphFromReferencesToId(id) {
    const references = gatherReferences(id);
    const graph = createGraphVizGraph(Array.from(references));
    return generateMermaidGraph(graph);
}

function generateGraphVizDotFromReferencesToId(id) {
    const references = gatherReferences(id);
    const graph = createGraphVizGraph(Array.from(references));
    return generateGraphVizDot(graph);
}