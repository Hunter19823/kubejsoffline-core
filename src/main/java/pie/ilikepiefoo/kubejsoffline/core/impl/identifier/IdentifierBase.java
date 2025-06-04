package pie.ilikepiefoo.kubejsoffline.core.impl.identifier;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.Index;

import java.util.concurrent.atomic.AtomicLong;

public class IdentifierBase implements Index {

    protected int arrayIndex;
    protected AtomicLong referenceCount = new AtomicLong(0);

    public IdentifierBase(int arrayIndex) {
        this.arrayIndex = arrayIndex;
    }

    @Override
    public int getArrayIndex() {
        return arrayIndex;
    }

    @Override
    public <T extends Index> void swapWith(T other) {
        if (other == null) {
            throw new IllegalArgumentException("Cannot swap with null");
        }
        if (other.getArrayIndex() == arrayIndex) {
            return; // No need to swap with itself
        }
        int temp = other.getArrayIndex();
        other.setArrayIndex(arrayIndex);
        arrayIndex = temp;
    }

    @Override
    public void setArrayIndex(int arrayIndex) {
        this.arrayIndex = arrayIndex;
    }

    @Override
    public Index getSelfWithReference() {
        referenceCount.incrementAndGet();
        return this;
    }

    @Override
    public long getReferenceCount() {
        return referenceCount.get();
    }


    @Override
    public int hashCode() {
        return Integer.hashCode(arrayIndex);
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }
        if (obj == this) {
            return true;
        }
        if (obj instanceof IdentifierBase) {
            return ((IdentifierBase) obj).arrayIndex == arrayIndex;
        }
        if (obj instanceof Index) {
            return ((Index) obj).getArrayIndex() == arrayIndex;
        }
        if (obj instanceof Integer) {
            return ((Integer) obj) == arrayIndex;
        }
        return false;
    }

    @Override
    public JsonElement toJSON() {
        return new JsonPrimitive(arrayIndex);
    }
}
