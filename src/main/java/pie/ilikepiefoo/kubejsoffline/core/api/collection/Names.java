package pie.ilikepiefoo.kubejsoffline.core.api.collection;

import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.NameID;

import java.util.NavigableMap;

public interface Names extends JSONSerializable, Lockable {
    NavigableMap<NameID, String> getAllNames();

    boolean contains(String name);

    NameID addName(String name);

    void clear();

}
