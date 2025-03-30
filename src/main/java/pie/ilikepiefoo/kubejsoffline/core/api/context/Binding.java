package pie.ilikepiefoo.kubejsoffline.core.api.context;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.impl.TypeManager;

import java.lang.reflect.Type;
import java.util.Set;

public interface Binding extends JSONSerializable {
    /**
     * Get the scopes for this binding.
     * This is a set of strings that are used to identify the script scope
     * in which this binding is available.
     *
     * @return The set of scopes for this binding.
     */
    Set<String> getScopes();

    default JsonElement toJSON() {
        var json = new JsonArray();
        json.add(getName());
        json.add(TypeManager.INSTANCE.getID(getType()).toJSON());
        if (getData() != null) {
            json.add(getData());
        }
        return json;
    }

    /**
     * Get the name of the binding as it is registered in KubeJS.
     *
     * @return The name of the binding.
     */
    String getName();

    /**
     * Get the type of the binding for documentation purposes.
     * This is the type that will be used in the documentation.
     *
     * @return The type of the binding.
     */
    Type getType();

    /**
     * Get data associated with this binding.
     * This is used for Bindings that represent a value and not just a type or function.
     *
     * @return The data associated with this binding.
     */
    default JsonElement getData() {
        return null;
    }
}
