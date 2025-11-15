package pie.ilikepiefoo.kubejsoffline.core.api.collection;

import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.FieldData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.FieldID;

import java.util.NavigableMap;

public interface Fields extends JSONSerializable, Iterable<FieldData>, Lockable, TwoWayMapHolder<FieldID, FieldData> {
    NavigableMap<FieldID, FieldData> getAllFields();

    FieldID addField(FieldData data);

    boolean contains(FieldData data);

    FieldID getID(FieldData data);

    FieldData getField(FieldID id);

    void clear();
}

