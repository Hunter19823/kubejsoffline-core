package pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property;

import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.Index;

public interface IndexedData<INDEX_TYPE extends Index> extends JSONSerializable {
    INDEX_TYPE getIndex();

    IndexedData<INDEX_TYPE> setIndex(INDEX_TYPE index);
}
