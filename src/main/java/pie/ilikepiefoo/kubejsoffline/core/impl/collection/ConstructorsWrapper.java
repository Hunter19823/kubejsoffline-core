package pie.ilikepiefoo.kubejsoffline.core.impl.collection;

import com.google.gson.JsonElement;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Constructors;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.ConstructorData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.ConstructorID;
import pie.ilikepiefoo.kubejsoffline.core.impl.identifier.IdentifierBase;

import java.util.Iterator;
import java.util.NavigableMap;

public class ConstructorsWrapper implements Constructors {
    protected final TwoWayMap<ConstructorID, ConstructorData> data = new TwoWayMap<>(ConstructorIdentifier::new);

    @Override
    public void toggleLock() {
        this.data.toggleLock();
    }

    @Override
    public Iterator<ConstructorData> iterator() {
        return data.iterator();
    }

    @Override
    public NavigableMap<ConstructorID, ConstructorData> getAllConstructors() {
        return this.data.getIndexToValueMap();
    }

    @Override
    public synchronized ConstructorID addConstructor(ConstructorData data) {
        var index = this.data.add(data);
        data.setIndex(index);
        return index;
    }

    @Override
    public boolean contains(ConstructorData data) {
        return this.data.contains(data);
    }

    @Override
    public ConstructorID getID(ConstructorData data) {
        return this.data.get(data);
    }

    @Override
    public ConstructorData getConstructor(ConstructorID id) {
        return this.data.get(id);
    }

    @Override
    public void clear() {
        this.data.clear();
    }

    @Override
    public JsonElement toJSON() {
        return JSONSerializable.of(this.data.getValues());
    }

    @Override
    public TwoWayMap<ConstructorID, ConstructorData> getTwoWayMap() {
        return data;
    }

    public static class ConstructorIdentifier extends IdentifierBase implements ConstructorID {
        public ConstructorIdentifier(int arrayIndex) {
            super(arrayIndex);
        }

        @Override
        public ConstructorIdentifier getSelfWithReference() {
            super.getSelfWithReference();
            return this;
        }
    }
}

