package pie.ilikepiefoo.kubejsoffline.core.api.collection;

import pie.ilikepiefoo.kubejsoffline.core.api.identifier.Index;
import pie.ilikepiefoo.kubejsoffline.core.impl.collection.TwoWayMap;

public interface TwoWayMapHolder<INDEX extends Index, VALUE> {
    public TwoWayMap<INDEX, VALUE> getTwoWayMap();
}
