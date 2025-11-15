package pie.ilikepiefoo.kubejsoffline.core.api.collection;

import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.MethodData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.MethodID;

import java.util.NavigableMap;

public interface Methods extends JSONSerializable, Iterable<MethodData>, Lockable, TwoWayMapHolder<MethodID, MethodData> {
    NavigableMap<MethodID, MethodData> getAllMethods();

    MethodID addMethod(MethodData data);

    boolean contains(MethodData data);

    MethodID getID(MethodData data);

    MethodData getMethod(MethodID id);

    void clear();
}
