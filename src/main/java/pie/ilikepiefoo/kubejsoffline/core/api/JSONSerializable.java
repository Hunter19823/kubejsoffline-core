package pie.ilikepiefoo.kubejsoffline.core.api;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Collection;
import java.util.StringJoiner;
import java.util.function.Consumer;
import java.util.function.Supplier;

public interface JSONSerializable {
    Logger LOG = LogManager.getLogger();

    static <S extends JSONSerializable> JsonArray of(Collection<S> jsonSerializableList) {
        JsonArray jsonArray = new JsonArray();
        for (JSONSerializable jsonSerializable : jsonSerializableList) {
            try {
                jsonArray.add(jsonSerializable.toJSON());
            } catch (final Throwable e) {
                LOG.warn("Failed to convert JSONSerializable to JSONElement", e);
            }
        }
        return jsonArray;
    }

    JsonElement toJSON();

    default <S extends JSONSerializable> void addTo(JsonElement jsonElement, Supplier<S> supplier) {
        addTo(jsonElement, null, supplier);
    }

    default <S extends JSONSerializable> void addTo(JsonElement jsonElement, String key, Supplier<S> supplier) {
        Consumer<JsonElement> collectionAdder = jsonElement instanceof JsonObject jsonObject ?
                (element) -> jsonObject.add(key, element) :
                jsonElement instanceof JsonArray jsonArray ?
                        jsonArray::add :
                        null;

        if (collectionAdder == null) {
            return;
        }
        if (supplier == null) {
            // If the supplier is null, we cannot add anything
            return;
        }
        try {
            JSONSerializable jsonSerializable = supplier.get();
            var jsonValue = jsonSerializable != null ? jsonSerializable.toJSON() : null;
            if (jsonSerializable != null) {
                collectionAdder.accept(jsonValue);
            }
        } catch (final Throwable e) {
            LOG.warn("Failed to add JSONSerializable to JSONElement when serializing key {}", key, e);
        }
    }

    default void addTo(JsonElement jsonElement, String key, JSONSerializable jsonSerializable) {
        addTo(jsonElement, key, () -> jsonSerializable);
    }

    default <S extends JSONSerializable, I extends Iterable<S>> void addAllTo(JsonElement jsonElement, boolean skipNulls, Supplier<I> jsonSerializableSupplier) {
        addAllTo(jsonElement, null, skipNulls, jsonSerializableSupplier);
    }

    default <S extends JSONSerializable, I extends Iterable<S>> void addAllTo(JsonElement jsonElement, String key, boolean skipNulls, Supplier<I> jsonSerializableSupplier) {
        // Try to convert the iterable to a json array and add it to the addTo method
        if (jsonSerializableSupplier == null) {
            return;
        }
        Iterable<S> jsonSerializable;
        try {
            jsonSerializable = jsonSerializableSupplier.get();
        } catch (final Throwable e) {
            LOG.warn("Failed to retrieve JSON Serializable collection when serializing key {}", key, e);
            return;
        }
        Consumer<JsonElement> collectionAdder = jsonElement instanceof JsonObject jsonObject ?
                (element) -> jsonObject.add(key, element) :
                jsonElement instanceof JsonArray jsonArray ?
                        jsonArray::add :
                        null;
        if (collectionAdder == null) {
            return;
        }
        JsonArray jsonArray = new JsonArray();
        for (JSONSerializable jsonSerializableElement : jsonSerializable) {
            if (!skipNulls && jsonSerializableElement == null) {
                // Exit early if we find a null element and skipNulls if false
                return;
            }
            try {
                var jsonElementValue = jsonSerializableElement != null ? jsonSerializableElement.toJSON() : null;
                jsonArray.add(jsonElementValue);
            } catch (final Throwable e) {
                LOG.warn("Failed to convert JSONSerializable to JSONElement", e);
                if (!skipNulls) {
                    // If skipNulls is false, we log the error and continue
                    return;
                }
            }
        }
        if (jsonArray.isEmpty()) {
            // If the array is empty, we do not add it to the JSON element
            return;
        }
        collectionAdder.accept(jsonArray);
    }

    default <S extends JSONSerializable> void addAllTo(JsonElement jsonElement, boolean skipNulls, Iterable<S> jsonSerializable) {
        addAllTo(jsonElement, null, skipNulls, jsonSerializable);
    }

    default <S extends JSONSerializable> void addAllTo(JsonElement jsonElement, String key, boolean skipNulls, Iterable<S> jsonSerializable) {
        addAllTo(jsonElement, key, skipNulls, () -> jsonSerializable);
    }

    default JsonElement compressObject(JsonElement... jsonElements) {
        if (jsonElements == null) {
            throw new IllegalArgumentException("jsonElements cannot be null");
        }
        StringJoiner joiner = new StringJoiner(",");
        for (JsonElement jsonElement : jsonElements) {
            if (jsonElement == null) {
                joiner.add("");
                continue;
            }
            if (jsonElement.isJsonNull()) {
                joiner.add("");
                continue;
            }
            if (jsonElement.isJsonPrimitive()) {
                JsonPrimitive primitive = jsonElement.getAsJsonPrimitive();
                if (primitive.isString()) {
                    throw new IllegalArgumentException("String values cannot be compressed, use a different method to handle strings.");
                } else if (primitive.isNumber()) {
                    joiner.add(primitive.getAsNumber().toString());
                } else if (primitive.isBoolean()) {
                    if (primitive.getAsBoolean()) {
                        joiner.add("T");
                    } else {
                        joiner.add("F");
                    }
                } else {
                    throw new IllegalArgumentException("Unsupported JsonPrimitive type: " + primitive.getClass().getName());
                }
            } else if (jsonElement.isJsonArray()) {
                // For objects and arrays, we just add the string representation
                // Convert jsonArray to array of JsonElements
                JsonArray jsonArray = jsonElement.getAsJsonArray();
                if (jsonArray.isEmpty()) {
                    joiner.add("");
                    continue;
                }
                StringJoiner arrayJoiner = new StringJoiner("|", "[", "");
                for (JsonElement element : jsonArray) {
                    arrayJoiner.add(compressObject(element).getAsString());
                }
                joiner.add(arrayJoiner.toString());
            } else {
                throw new IllegalArgumentException("Unsupported JsonElement type: " + jsonElement.getClass().getName());
            }
        }
        if (joiner.length() == 0) {
            return new JsonPrimitive("");
        }
        return new JsonPrimitive(joiner.toString());
    }
}
