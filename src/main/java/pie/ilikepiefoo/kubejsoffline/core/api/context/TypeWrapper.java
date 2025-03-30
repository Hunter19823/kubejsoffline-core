package pie.ilikepiefoo.kubejsoffline.core.api.context;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.impl.TypeManager;

import java.lang.reflect.Type;
import java.util.Set;

public interface TypeWrapper extends JSONSerializable {

    default JsonElement toJSON() {
        var json = new JsonArray();
        json.add(TypeManager.INSTANCE.getID(getWrappedType()).toJSON());
        getSupportedTypes().stream().map(TypeManager.INSTANCE::getID).map(JSONSerializable::toJSON).forEachOrdered(json::add);
        return json;
    }

    /**
     * Get the type of object that this type wrapper wraps.
     *
     * @return The type of object that this type wrapper wraps.
     */
    Type getWrappedType();

    /**
     * Get the set of classes that this type wrapper supports.
     * This is used to document what types this type wrapper supports.
     *
     * @return The set of classes that this type wrapper supports.
     */
    Set<Type> getSupportedTypes();
}
