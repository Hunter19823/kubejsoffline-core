package pie.ilikepiefoo.kubejsoffline.core.util.json;

import com.google.gson.JsonObject;

public class BindingsJSON {
    private static JsonObject bindings;

    public static void setJsonObject(JsonObject jsonObject) {
        bindings = jsonObject;
    }
    public static JsonObject get() {
        return bindings;
    }
}
