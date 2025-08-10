package pie.ilikepiefoo.kubejsoffline.core.impl.identifier;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.ArrayBasedIndex;

import java.util.function.Supplier;

public class ArrayIdentifier extends IdentifierBase implements ArrayBasedIndex {
    protected int arrayDepth;

    public ArrayIdentifier(int arrayIndex) {
        super(arrayIndex);
        this.arrayDepth = 0;
    }

    public ArrayIdentifier(ArrayBasedIndex index, int arrayDepth) {
        this(index::getArrayIndex, arrayDepth + index.getArrayDepth());
    }

    public ArrayIdentifier(Supplier<Integer> arrayIndexSupplier, int arrayDepth) {
        super(arrayIndexSupplier);
        this.arrayDepth = arrayDepth;
    }

    @Override
    public int hashCode() {
        return super.hashCode() ^ arrayDepth;
    }

    @Override
    public String toString() {
        return "%d%s%s".formatted(getArrayIndex(), "[".repeat(getArrayDepth()), "]".repeat(getArrayDepth()));
    }

    @Override
    public int getArrayDepth() {
        return arrayDepth;
    }

    @Override
    public JsonElement toJSON() {
        if (this.arrayDepth == 0) {
            return super.toJSON();
        }
        var jsonArray = new JsonArray();
        jsonArray.add(this.getSelfWithReference().getArrayIndex());
        jsonArray.add(this.arrayDepth);
        return jsonArray;
    }

    @Override
    public ArrayIdentifier getSelfWithReference() {
        super.getSelfWithReference();
        return this;
    }
}
