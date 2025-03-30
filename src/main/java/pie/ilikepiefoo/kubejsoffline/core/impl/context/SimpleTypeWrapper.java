package pie.ilikepiefoo.kubejsoffline.core.impl.context;

import pie.ilikepiefoo.kubejsoffline.core.api.context.TypeWrapper;

import java.lang.reflect.Type;
import java.util.Set;

public record SimpleTypeWrapper(Type getWrappedType, Set<Type> getSupportedTypes) implements TypeWrapper {
}
