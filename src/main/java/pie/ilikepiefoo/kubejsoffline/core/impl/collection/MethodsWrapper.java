package pie.ilikepiefoo.kubejsoffline.core.impl.collection;

import com.google.gson.JsonElement;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Methods;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.MethodData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.MethodID;
import pie.ilikepiefoo.kubejsoffline.core.impl.identifier.IdentifierBase;

import java.util.Iterator;
import java.util.NavigableMap;

public class MethodsWrapper implements Methods {
    protected final TwoWayMap<MethodID, MethodData> data = new TwoWayMap<>(MethodIdentifier::new);

    @Override
    public void toggleLock() {
        this.data.toggleLock();
    }

    @Override
    public Iterator<MethodData> iterator() {
        return data.iterator();
    }

    @Override
    public NavigableMap<MethodID, MethodData> getAllMethods() {
        return this.data.getIndexToValueMap();
    }

    @Override
    public synchronized MethodID addMethod(MethodData data) {
        var index = this.data.add(data);
        data.setIndex(index);
        return index;
    }

    @Override
    public boolean contains(MethodData data) {
        return this.data.contains(data);
    }

    @Override
    public MethodID getID(MethodData data) {
        return this.data.get(data);
    }

    @Override
    public MethodData getMethod(MethodID id) {
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
    public TwoWayMap<MethodID, MethodData> getTwoWayMap() {
        return data;
    }

    public static class MethodIdentifier extends IdentifierBase implements MethodID {
        public MethodIdentifier(int arrayIndex) {
            super(arrayIndex);
        }

        @Override
        public MethodIdentifier getSelfWithReference() {
            super.getSelfWithReference();
            return this;
        }
    }
}
