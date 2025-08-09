package pie.ilikepiefoo.kubejsoffline.core.util;


import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Iterator;
import java.util.NavigableMap;
import java.util.NoSuchElementException;
import java.util.Stack;

public class ConcurrentNavigableMapIterator<K, V> implements Iterator<V>, Iterable<V> {
    private final static Logger LOG  = LogManager.getLogger();
    private final NavigableMap<K, V> map;
    private final Stack<V> remainingValues = new Stack<>();
    private final String name;
    private K currentKey;

    public ConcurrentNavigableMapIterator(NavigableMap<K, V> map, String name) {
        this.map = map;
        this.currentKey = null;
        this.name = name;
    }

    /**
     * Returns {@code true} if the iteration has more elements.
     * (In other words, returns {@code true} if {@link #next} would
     * return an element rather than throwing an exception.)
     *
     * @return {@code true} if the iteration has more elements
     */
    @Override
    public boolean hasNext() {
        return refillRemainingKeys() || !remainingValues.empty();
    }

    /**
     * Returns the next element in the iteration.
     *
     * @return the next element in the iteration
     * @throws NoSuchElementException if the iteration has no more elements
     */
    @Override
    public V next() {
        if (!hasNext()) {
            throw new NoSuchElementException("No more elements in the iterator.");
        }
        return remainingValues.pop();
    }

    private boolean refillRemainingKeys() {
        if (currentKey == null && !map.isEmpty()) {
            currentKey = map.firstKey(); // Start from the first key if currentKey is null
        }
        if (currentKey == null) {
            return false; // No keys to iterate
        }
        var finalKey = map.lastKey();
        if (currentKey == null || currentKey == finalKey) {
            return false; // No more keys to iterate
        }
        var subMap = map.subMap(currentKey, true, finalKey, true);
        currentKey = finalKey;
        remainingValues.addAll(subMap.values());
        LOG.info("Refilled remaining values in {} iterator with {} elements.", name, remainingValues.size());
        return !remainingValues.isEmpty();
    }

    /**
     * Returns an iterator over elements of type {@code T}.
     *
     * @return an Iterator.
     */
    @Override
    public Iterator<V> iterator() {
        return this;
    }
}
