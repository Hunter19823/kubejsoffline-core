package pie.ilikepiefoo.kubejsoffline.core.impl.collection;

import com.google.gson.JsonElement;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Fields;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.FieldData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.FieldID;
import pie.ilikepiefoo.kubejsoffline.core.impl.identifier.IdentifierBase;

import java.util.Iterator;
import java.util.NavigableMap;

public class FieldsWrapper implements Fields {
    protected final TwoWayMap<FieldID, FieldData> data = new TwoWayMap<>(FieldIdentifier::new);

    @Override
    public void toggleLock() {
        this.data.toggleLock();
    }

    @Override
    public Iterator<FieldData> iterator() {
        return data.iterator();
    }

    @Override
    public NavigableMap<FieldID, FieldData> getAllFields() {
        return this.data.getIndexToValueMap();
    }

    @Override
    public synchronized FieldID addField(FieldData data) {
        var index = this.data.add(data);
        data.setIndex(index);
        return index;
    }

    @Override
    public boolean contains(FieldData data) {
        return this.data.contains(data);
    }

    @Override
    public FieldID getID(FieldData data) {
        return this.data.get(data);
    }

    @Override
    public FieldData getField(FieldID id) {
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
    public TwoWayMap<FieldID, FieldData> getTwoWayMap() {
        return data;
    }

    public static class FieldIdentifier extends IdentifierBase implements FieldID {
        public FieldIdentifier(int arrayIndex) {
            super(arrayIndex);
        }

        @Override
        public FieldIdentifier getSelfWithReference() {
            super.getSelfWithReference();
            return this;
        }
    }
}

