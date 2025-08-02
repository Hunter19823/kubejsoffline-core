package pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property;

import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.Index;

public interface IndexedData<INDEX_TYPE extends Index> extends JSONSerializable, Comparable<IndexedData<INDEX_TYPE>> {
    INDEX_TYPE getIndex();

    IndexedData<INDEX_TYPE> setIndex(INDEX_TYPE index);

    @Override
    default int compareTo(IndexedData<INDEX_TYPE> o) {
        return getIndex().compareTo(o.getIndex());
    }
}
