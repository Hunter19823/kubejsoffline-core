/**
 * Mixins applied to compressed documentation entities ({@link DocWrapper} + {@link EntityData}).
 * Each `set*` function attaches named accessors to the same object instance.
 */

function setRemapType<T extends CompressedDataHolder>(target: T): T {
    target.type = function (this: CompressedDataHolder) {
        const type = this.data[PROPERTY.TYPE] as number;
        if (!exists(this.getTypeVariableMap)) {
            return type;
        }
        const typeMap = this.getTypeVariableMap!();
        const seen = new Set<number>();
        let remappedType: number = type;
        while (exists(typeMap[String(remappedType)]) && !seen.has(remappedType)) {
            seen.add(remappedType);
            remappedType = typeMap[String(remappedType)];
        }
        return remappedType;
    };

    target.getType = target.type;

    target.getTypeWrapped = function (this: CompressedDataHolder) {
        const result = getClass(this.type!());
        if (result === null) {
            throw new Error('Type not found for object.');
        }
        result.withTypeVariableMap(this.getTypeVariableMap!());
        return result;
    };

    return target;
}

function setModifiers<T extends CompressedDataHolder>(target: T): T {
    target.modifiers = function (this: CompressedDataHolder) {
        if (this.data[PROPERTY.MODIFIERS] === undefined) {
            if (this.getRawType !== undefined) {
                const rawTypeId = this.getRawType();
                if (exists(rawTypeId)) {
                    const rawClass = getClass(rawTypeId);
                    if (rawClass !== null) {
                        return rawClass.modifiers();
                    }
                }
            }
        }
        return this.data[PROPERTY.MODIFIERS] as number;
    };

    target.getModifiers = target.modifiers;

    return target;
}

function setParameters<T extends CompressedDataHolder>(
    target: T,
    sourceClassId: number,
    sourceMethodId: number | null = null,
    sourceConstructorId: number | null = null
): T {
    target.getWrappedParameterHolder = function (
        this: CompressedDataHolder,
        methodId: number | null,
        constructorId: number | null
    ) {
        if (exists(constructorId)) {
            return this.getDeclaringConstructorWrapped!() as CompressedDataHolder;
        }
        if (exists(methodId)) {
            return this.getDeclaringMethodWrapped!() as CompressedDataHolder;
        }
        throw new Error('No source method or constructor id provided for parameter holder.');
    };

    function mapParameter(this: void, parameter: number, index: number) {
        const holder = target.getWrappedParameterHolder!(sourceMethodId, sourceConstructorId);
        return getParameter(
            parameter,
            holder.getTypeVariableMap!(),
            sourceClassId,
            sourceMethodId,
            sourceConstructorId,
            index
        );
    }

    target.parameters = function (this: CompressedDataHolder) {
        if (this.data._parameter_cache !== undefined) {
            return this.data._parameter_cache as DocWrapper[];
        }
        this.data._parameter_cache = getAsArray(this.data[PROPERTY.PARAMETERS] as number[] | number).map(
            mapParameter
        );
        return this.data._parameter_cache as DocWrapper[];
    };

    target.getParameters = target.parameters;

    return target;
}

function setAnnotations<T extends CompressedDataHolder>(target: T): T {
    function mapAnnotation(annotation: number) {
        return getAnnotation(annotation, target.getTypeVariableMap!());
    }

    target.annotations = function (this: CompressedDataHolder) {
        if (this.data._annotation_cache !== undefined) {
            return this.data._annotation_cache as DocWrapper[];
        }
        this.data._annotation_cache = getAsArray(this.data[PROPERTY.ANNOTATIONS] as number[] | number).map(
            mapAnnotation
        );
        return this.data._annotation_cache as DocWrapper[];
    };

    target.getAnnotations = target.annotations;

    return target;
}

function setTypeVariableMap<T extends CompressedDataHolder>(target: T): T {
    target.getTypeVariableMap = function (): TypeVariableMap {
        return {};
    };

    target.withTypeVariableMap = function (this: CompressedDataHolder, map: TypeVariableMap) {
        if (!exists(map) || Object.keys(map).length === 0) {
            return this.getTypeVariableMap!();
        }
        const leftMap = JSON.stringify(this.getTypeVariableMap!());
        const rightMap = JSON.stringify(map);
        if (leftMap === rightMap) {
            return this.getTypeVariableMap!();
        }
        const originalGetTypeVariableMap = this.getTypeVariableMap!.bind(this);
        this.getTypeVariableMap = function () {
            const typeVariableMap = originalGetTypeVariableMap();
            for (const [key, value] of Object.entries(map)) {
                typeVariableMap[key] = value;
            }
            return typeVariableMap;
        };
        return this.getTypeVariableMap!();
    };

    return target;
}

function setTypeVariables<T extends CompressedDataHolder>(target: T): T {
    target.getTypeVariables = function (this: CompressedDataHolder) {
        return getAsArray(this.data[PROPERTY.TYPE_VARIABLES as keyof EntityData]);
    };

    target.getTypeVariablesMapped = function (this: CompressedDataHolder) {
        const typeVariableMap = this.getTypeVariableMap!();
        return this.getTypeVariables!().map((tv) => typeVariableMap[String(tv)] ?? tv);
    };

    return target;
}

function setBasicName<T extends CompressedDataHolder>(target: T): T {
    target.name = function (this: CompressedDataHolder) {
        if (!exists(this.data._name_cache)) {
            this.data._name_cache = getNameData(this.data[PROPERTY.NAME] as number | string | number[]);
        }
        return this.data._name_cache as string;
    };

    target.getName = target.name;

    return target;
}

function setDataIndex<T extends CompressedDataHolder>(target: T): T {
    target.dataIndex = function (this: CompressedDataHolder) {
        return this.data._dataIndex as number;
    };

    target.getDataIndex = target.dataIndex;

    return target;
}

function setDeclaringClass<T extends CompressedDataHolder>(target: T): T {
    target.declaringClass = function (this: CompressedDataHolder) {
        const declaring = this.data._declaringClass;
        if (!exists(declaring)) {
            return -1;
        }
        return declaring as number;
    };

    target.getDeclaringClass = target.declaringClass;

    target.getDeclaringClassWrapped = function (this: CompressedDataHolder) {
        const declaringClassIndex = this.declaringClass!();
        if (declaringClassIndex === -1) {
            throw new Error(
                `This object does not have a declaring class. Object data index: ${this.getDataIndex!()}`
            );
        }
        const result = getClass(declaringClassIndex);
        if (result === null) {
            throw new Error(
                `Declaring class with index ${declaringClassIndex} not found for object with data index ${this.getDataIndex!()}`
            );
        }
        result.withTypeVariableMap(this.getTypeVariableMap!());
        return result;
    };

    return target;
}

function setDeclaringMethod<T extends CompressedDataHolder>(target: T): T {
    target.declaringMethod = function (this: CompressedDataHolder) {
        const declaring = this.data._declaringMethod;
        if (!exists(declaring)) {
            return -1;
        }
        return declaring as number;
    };

    target.getDeclaringMethod = target.declaringMethod;

    target.getDeclaringMethodWrapped = function (this: CompressedDataHolder) {
        const declaringMethodIndex = this.declaringMethod!();
        if (declaringMethodIndex === -1) {
            return null;
        }
        const declaringClass = getClass(this.getDeclaringClass!());
        if (declaringClass === null) {
            throw new Error(`Declaring class not found for object with data index ${this.getDataIndex!()}`);
        }
        const result = declaringClass.getMethods()[declaringMethodIndex] as CompressedDataHolder;
        if (result === null) {
            throw new Error(
                `Declaring method with index ${declaringMethodIndex} not found for object with data index ${this.getDataIndex!()}`
            );
        }
        result.withTypeVariableMap!(this.getTypeVariableMap!());
        return result;
    };

    return target;
}

function setDeclaringConstructor<T extends CompressedDataHolder>(target: T): T {
    target.declaringConstructor = function (this: CompressedDataHolder) {
        const declaring = this.data._declaringConstructor;
        if (!exists(declaring)) {
            return -1;
        }
        return declaring as number;
    };

    target.getDeclaringConstructor = target.declaringConstructor;

    target.getDeclaringConstructorWrapped = function (this: CompressedDataHolder) {
        const declaringConstructorIndex = this.declaringConstructor!();
        if (declaringConstructorIndex === -1) {
            return null;
        }
        const declaringClass = getClass(this.getDeclaringClass!());
        if (declaringClass === null) {
            throw new Error(`Declaring class not found for object with data index ${this.getDataIndex!()}`);
        }
        const result = declaringClass.getConstructors()[declaringConstructorIndex] as CompressedDataHolder;
        if (result === null) {
            throw new Error(
                `Declaring constructor with index ${declaringConstructorIndex} not found for object with data index ${this.getDataIndex!()}`
            );
        }
        result.withTypeVariableMap!(this.getTypeVariableMap!());
        return result;
    };

    return target;
}

function setDeclaringParameter<T extends CompressedDataHolder>(target: T): T {
    target.declaringParameter = function (this: CompressedDataHolder) {
        const declaring = this.data._declaringParameter;
        if (!exists(declaring)) {
            return -1;
        }
        return declaring as number;
    };

    target.getDeclaringParameter = target.declaringParameter;

    return target;
}

function setDeclaringField<T extends CompressedDataHolder>(target: T): T {
    target.declaringField = function (this: CompressedDataHolder) {
        const declaring = this.data._declaringField;
        if (!exists(declaring)) {
            return -1;
        }
        return declaring as number;
    };

    target.getDeclaringField = target.declaringField;

    return target;
}

function setExceptions<T extends CompressedDataHolder>(target: T): T {
    target.getExceptions = function (this: CompressedDataHolder) {
        return getAsArray(this.data[PROPERTY.EXCEPTIONS]);
    };

    return target;
}
