package pie.ilikepiefoo.kubejsoffline.core.api.collection;

import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.ConstructorData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.ConstructorID;

import java.util.NavigableMap;

public interface Constructors extends JSONSerializable, Iterable<ConstructorData>, Lockable, TwoWayMapHolder<ConstructorID, ConstructorData> {
    NavigableMap<ConstructorID, ConstructorData> getAllConstructors();

    ConstructorID addConstructor(ConstructorData data);

    boolean contains(ConstructorData data);

    ConstructorID getID(ConstructorData data);

    ConstructorData getConstructor(ConstructorID id);

    void clear();
}

