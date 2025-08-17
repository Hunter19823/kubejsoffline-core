package pie.ilikepiefoo.kubejsoffline.core.impl.collection;

import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.IndexedData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.Index;
import pie.ilikepiefoo.kubejsoffline.core.util.ConcurrentNavigableMapIterator;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.NavigableMap;
import java.util.TreeMap;

public class TwoWayMap<INDEX extends Index, VALUE> implements Iterable<VALUE> {
    protected final NavigableMap<INDEX, VALUE> indexToValueMap = new TreeMap<>();
    protected final Map<VALUE, INDEX> valueToIndexMap = new HashMap<>();
    protected final ConcurrentNavigableMapIterator<INDEX, VALUE> iterator = new ConcurrentNavigableMapIterator<>(
            indexToValueMap,
            StackWalker
                    .getInstance()
                    .walk(
                            (s) -> s
                                    .skip(1)
                                    .findFirst()
                                    .orElseThrow(
                                            () -> new RuntimeException("Failed to get caller class for iterator")
                                    )
                    )
                    .getClassName()
                    .replace(
                            this.getClass().getPackageName() + ".",
                            ""
                    )
    );
    protected IndexFactory<INDEX> indexFactory;
    protected boolean locked = false;

    public TwoWayMap(IndexFactory<INDEX> indexFactory) {
        this.indexFactory = indexFactory;
    }

    @Override
    public ConcurrentNavigableMapIterator<INDEX, VALUE> iterator() {
        return iterator;
    }

    public Collection<VALUE> getValues() {
        return indexToValueMap.values();
    }

    public Collection<VALUE> getValuesBetween(INDEX from, INDEX to) {
        return indexToValueMap.subMap(from, true, to, true).values();
    }

    public INDEX getFirstIndex() {
        return indexToValueMap.firstEntry().getKey();
    }

    public INDEX getNextIndex(INDEX index) {
        return indexToValueMap.higherKey(index);
    }

    public INDEX getLastIndex() {
        return indexToValueMap.lastEntry().getKey();
    }

    public void reorganize(Comparator<VALUE> comparator) {
        if (locked) {
            throw new IllegalStateException("Cannot reorganize TwoWayMap while it is locked");
        }
        var newValues = indexToValueMap
                .entrySet()
                .parallelStream()
                .sorted(Map.Entry.comparingByValue(comparator))
                .toList();
        indexToValueMap.clear();
        valueToIndexMap.clear();
        for (int i = 0; i < newValues.size(); i++) {
            var entry = newValues.get(i);
            var index = entry.getKey();
            var value = entry.getValue();
            if (index.getArrayIndex() != i) {
                index.setArrayIndex(i);
            }
            put(index, value);
        }
    }

    public synchronized void put(INDEX index, VALUE value) {
        if (locked) {
            throw new IllegalStateException("Cannot modify TwoWayMap while it is locked");
        }
        indexToValueMap.put(index, value);
        valueToIndexMap.put(value, index);
    }

    public Collection<INDEX> getIndexes() {
        return indexToValueMap.keySet();
    }

    public Map<VALUE, INDEX> getValueToIndexMap() {
        return valueToIndexMap;
    }

    public NavigableMap<INDEX, VALUE> getIndexToValueMap() {
        return indexToValueMap;
    }

    public IndexFactory<INDEX> getIndexFactory() {
        return indexFactory;
    }

    public synchronized INDEX add(VALUE value) {
        return add(value, indexFactory);
    }

    public synchronized INDEX add(VALUE value, IndexFactory<INDEX> indexFactory) {
        if (locked) {
            throw new IllegalStateException("Cannot modify TwoWayMap while it is locked");
        }
        if (valueToIndexMap.containsKey(value)) {
            return (INDEX) valueToIndexMap.get(value).getSelfWithReference();
        }
        INDEX index = indexFactory.createIndex(indexToValueMap.size());
        if (value instanceof IndexedData indexedData) {
            indexedData.setIndex(index);
        }
        indexToValueMap.put(index, value);
        valueToIndexMap.put(value, index);
        return index;
    }

    public boolean contains(VALUE value) {
        return valueToIndexMap.containsKey(value);
    }

    public boolean contains(INDEX index) {
        return indexToValueMap.containsKey(index);
    }

    public int size() {
        return indexToValueMap.size();
    }

    public INDEX get(VALUE value) {
        return (INDEX) valueToIndexMap.get(value).getSelfWithReference();
    }

    public VALUE get(INDEX index) {
        return indexToValueMap.get(index);
    }

    public void clear() {
        indexToValueMap.clear();
        valueToIndexMap.clear();
        iterator.reset();
    }

    public synchronized void toggleLock() {
        locked = !locked;
    }

    public interface IndexFactory<INDEX extends Index> {
        INDEX createIndex(int arrayIndex);
    }
}
