package pie.ilikepiefoo.kubejsoffline.core.util;

import com.google.gson.ExclusionStrategy;
import com.google.gson.FieldAttributes;

import java.io.Serializable;
import java.util.Map;

public class SimpleTypesExclusionStrategy implements ExclusionStrategy {
    /**
     * @param f the field object that is under test
     * @return true if the field should be ignored; otherwise false
     */
    @Override
    public boolean shouldSkipField(FieldAttributes f) {
        return false;
    }

    /**
     * @param clazz the class object that is under test
     * @return true if the class should be ignored; otherwise false
     */
    @Override
    public boolean shouldSkipClass(Class<?> clazz) {
        if (Iterable.class.isAssignableFrom(clazz)) {
            return false;
        }
        if (Map.class.isAssignableFrom(clazz)) {
            return false;
        }
        if (Class.class.isAssignableFrom(clazz)) {
            return false;
        }
        if (Enum.class.isAssignableFrom(clazz)) {
            return false;
        }
        if (clazz.isArray()) {
            return false;
        }
        if (clazz.isPrimitive()) {
            return false;
        }
        return !Serializable.class.isAssignableFrom(clazz);
    }
}
