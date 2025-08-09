package pie.ilikepiefoo.kubejsoffline.core.util.json;

import com.google.gson.JsonElement;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Supplier;
import java.util.stream.Collectors;

public class GlobalConstants {
    public static final GlobalConstants INSTANCE = new GlobalConstants();

    private final Map<String, Supplier<JsonElement>> constantSupplier;

    private GlobalConstants() {
        // Private constructor to prevent instantiation
        constantSupplier = new LinkedHashMap<>();
    }

    public void setConstant(String key, JsonElement value) {
        synchronized (constantSupplier) {
            constantSupplier.put(key, () -> value);
        }
    }

    public void setConstant(String key, Supplier<JsonElement> value) {
        synchronized (constantSupplier) {
            constantSupplier.put(key, value);
        }
    }

    public JsonElement getConstant(String key) {
        synchronized (constantSupplier) {
            return constantSupplier.get(key).get();
        }
    }

    public Map<String, Supplier<JsonElement>> getConstants() {
        synchronized (constantSupplier) {
            // Return a copy of the map to prevent external modification
            return constantSupplier
                    .entrySet()
                    .stream()
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        }
    }

    public void clear() {
        synchronized (constantSupplier) {
            constantSupplier.clear();
        }
    }
}
