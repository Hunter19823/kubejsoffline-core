package pie.ilikepiefoo.kubejsoffline.core.api;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

public interface TypeNameMapper {
    String getMappedClass(Class<?> from);

    String getMappedField(Class<?> from, Field field);

    String getMappedMethod(Class<?> from, Method method);
}
