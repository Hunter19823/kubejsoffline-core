package pie.ilikepiefoo.kubejsoffline.core.util;


import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Iterator;
import java.util.NavigableMap;
import java.util.NoSuchElementException;
import java.util.Stack;

public class ConcurrentNavigableMapIterator<K, V> implements Iterator<V>, Iterable<V> {
    private final static Logger LOG = LogManager.getLogger();
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
     * Returns an iterator over elements of type {@code T}.
     *
     * @return an Iterator.
     */
    @Override
    public Iterator<V> iterator() {
        return this;
    }    /**
     * Returns {@code true} if the iteration has more elements.
     * (In other words, returns {@code true} if {@link #next} would
     * return an element rather than throwing an exception.)
     *
     * @return {@code true} if the iteration has more elements
     */
    @Override
    public boolean hasNext() {
        if (!remainingValues.empty()) {
            return true; // If there are already remaining values, no need to refill
        }
        if (currentKey == null && !map.isEmpty()) {
            currentKey = map.firstKey(); // Start from the first key if currentKey is null
        }
        if (currentKey == null) {
            return false; // No keys to iterate
        }
        if (map.isEmpty()) {
            LOG.info("The {} queue is empty, nothing to process.", name);
            return false; // If the map is empty, no elements to iterate
        }
        var finalKey = map.lastKey();
        if (currentKey == null) {
            return false; // No more keys to iterate
        }
        if (currentKey == finalKey) {
            return false; // If currentKey is the last key, no more elements to iterate
        }
        var subMap = map.subMap(currentKey, true, finalKey, true);
        remainingValues.addAll(subMap.values());
        LOG.info("Found {} new elements that need to be processed in the {} queue. Finished Processing {} elements.", remainingValues.size(), name, currentKey);
        currentKey = finalKey;
        return !remainingValues.isEmpty();
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

    public void reset() {
        remainingValues.clear();
        currentKey = null;
        LOG.info("Iterator for {} has been reset.", name);
    }


}
