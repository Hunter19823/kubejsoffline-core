package pie.ilikepiefoo.kubejsoffline.core.util;

import com.google.gson.ExclusionStrategy;
import com.google.gson.FieldAttributes;

import java.util.HashSet;
import java.util.Set;

public class RecursionProofExclusionStrategy implements ExclusionStrategy {
    private final Set<Class<?>> seenClasses = new HashSet<>();

    /**
     * @param f the field object that is under test
     * @return true if the field should be ignored; otherwise false
     */
    @Override
    public boolean shouldSkipField(FieldAttributes f) {
        if (f.getDeclaredType() instanceof Class<?> clazz) {
            return seenClasses.contains(clazz);
        }
        return false;
    }

    /**
     * @param clazz the class object that is under test
     * @return true if the class should be ignored; otherwise false
     */
    @Override
    public boolean shouldSkipClass(Class<?> clazz) {
        if (seenClasses.contains(clazz)) {
            return true;
        }
        seenClasses.add(clazz);
        return false;
    }
}
