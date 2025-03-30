package pie.ilikepiefoo.kubejsoffline.core.api.context;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;

import java.util.Arrays;

public interface TypeWrapperProvider extends JSONSerializable {
    static TypeWrapperProvider of(Iterable<TypeWrapper> typeWrappers) {
        return () -> typeWrappers;
    }

    static TypeWrapperProvider of(TypeWrapper... typeWrappers) {
        return () -> Arrays.asList(typeWrappers);
    }

    default JsonElement toJSON() {
        JsonArray array = new JsonArray();
        for (TypeWrapper typeWrapper : getTypeWrappers()) {
            array.add(typeWrapper.toJSON());
        }
        return array;
    }

    /**
     * Gets all type wrappers that this provider provides.
     *
     * @return The list of type wrappers that this provider provides.
     */
    Iterable<TypeWrapper> getTypeWrappers();
}
