package pie.ilikepiefoo.kubejsoffline.core.impl.identifier;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.Index;

import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Supplier;

public class IdentifierBase implements Index {

    protected Supplier<Integer> arrayIndexSupplier = null;
    protected AtomicLong referenceCount = new AtomicLong(0);

    public IdentifierBase(int arrayIndex) {
        this.arrayIndexSupplier = () -> arrayIndex;
    }

    public IdentifierBase(Supplier<Integer> arrayIndexSupplier) {
        if (arrayIndexSupplier == null) {
            throw new IllegalArgumentException("Array index supplier cannot be null");
        }
        this.arrayIndexSupplier = arrayIndexSupplier;
    }

    @Override
    public int getArrayIndex() {
        return arrayIndexSupplier.get();
    }

    @Override
    public <T extends Index> void swapWith(T other) {
        if (other == null) {
            throw new IllegalArgumentException("Cannot swap with null");
        }
        int arrayIndex = this.getArrayIndex();
        if (other.getArrayIndex() == arrayIndex) {
            return; // No need to swap with itself
        }
        int temp = other.getArrayIndex();
        other.setArrayIndex(arrayIndex);
        arrayIndex = temp;
    }

    @Override
    public void setArrayIndex(int arrayIndex) {
        this.arrayIndexSupplier = () -> arrayIndex;
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
        int arrayIndex = getArrayIndex();
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
            return ((IdentifierBase) obj).getArrayIndex() == getArrayIndex();
        }
        if (obj instanceof Index) {
            return ((Index) obj).getArrayIndex() == getArrayIndex();
        }
        if (obj instanceof Integer) {
            return ((Integer) obj) == getArrayIndex();
        }
        return false;
    }

    @Override
    public JsonElement toJSON() {
        return new JsonPrimitive(getSelfWithReference().getArrayIndex());
    }

    @Override
    public String toString() {
        return "%d".formatted(getArrayIndex());
    }
}
