package pie.ilikepiefoo.kubejsoffline.core.api.identifier;

import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;

public interface Index extends Comparable<Index>, JSONSerializable {
    default int compareTo(Index o) {
        return Integer.compare(getArrayIndex(), o.getArrayIndex());
    }

    int getArrayIndex();
}
