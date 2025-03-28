package pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property;

import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.NameID;

public interface NamedData extends JSONSerializable {
    NameID getName();
}
