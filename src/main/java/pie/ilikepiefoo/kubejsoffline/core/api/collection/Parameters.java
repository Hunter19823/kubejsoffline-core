package pie.ilikepiefoo.kubejsoffline.core.api.collection;

import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.ParameterData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.ParameterID;

import java.util.NavigableMap;

public interface Parameters extends JSONSerializable {
    NavigableMap<ParameterID, ParameterData> getAllParameters();

    ParameterID addParameter(ParameterData data);

    boolean contains(ParameterData data);

    ParameterID getID(ParameterData data);

    ParameterData getParameter(ParameterID id);

    void clear();

}
