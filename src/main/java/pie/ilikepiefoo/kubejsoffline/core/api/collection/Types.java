package pie.ilikepiefoo.kubejsoffline.core.api.collection;

import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.ParameterizedTypeData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.RawClassData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.TypeVariableData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.WildcardTypeData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.TypeData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeOrTypeVariableID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeVariableID;

import java.util.NavigableMap;

public interface Types extends JSONSerializable {
    NavigableMap<TypeOrTypeVariableID, TypeData> getAllTypes();

    NavigableMap<TypeID, RawClassData> getAllRawTypes();

    NavigableMap<TypeID, ParameterizedTypeData> getAllParameterizedTypes();

    NavigableMap<TypeID, WildcardTypeData> getAllWildcardTypes();

    NavigableMap<TypeVariableID, TypeData> getAllTypeVariables();

    TypeOrTypeVariableID addType(TypeData data);

    boolean contains(TypeData data);

    TypeOrTypeVariableID getID(TypeData type);

    TypeID getID(RawClassData type);

    TypeID getID(ParameterizedTypeData type);

    TypeID getID(WildcardTypeData type);

    TypeVariableID getID(TypeVariableData type);

    TypeData getType(TypeID id);

    void clear();
}
