package pie.ilikepiefoo.kubejsoffline.core.util;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import pie.ilikepiefoo.kubejsoffline.core.api.TypeNameMapper;

import java.lang.annotation.Annotation;
import java.lang.reflect.AnnotatedElement;
import java.lang.reflect.Constructor;
import java.lang.reflect.Executable;
import java.lang.reflect.Field;
import java.lang.reflect.GenericDeclaration;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.lang.reflect.TypeVariable;
import java.lang.reflect.WildcardType;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

public class SafeOperations {
    private static final Logger LOG = LogManager.getLogger();
    private static TypeNameMapper mapper;
    protected static final ThreadLocal<Set<Type>> TYPES_PROCESSING = ThreadLocal.withInitial(() -> new HashSet<>());

    public static void setTypeMapper(TypeNameMapper mapper) {
        SafeOperations.mapper = mapper;
    }

    public static boolean isClassPresent(Class<?> type) {
        if (type == null) {
            return true;
        }
        try {
            String name = type.getName();
            if (name.contains("$")) {
                name = name.substring(name.lastIndexOf("$") + 1);
            }
            if (name.contains(".")) {
                name = name.substring(name.lastIndexOf(".") + 1);
            }
            if (name.isBlank()) {
                return false;
            }
            type.getCanonicalName();
            type.getModifiers();
            type.getPackage();
            if (!isTypePresent(type.getSuperclass())) {
                return false;
            }
            if (!isGenericDeclarationPresent(type)) {
                return false;
            }
            for (var typeParameter : type.getTypeParameters()) {
                if (!isTypePresent(typeParameter)) {
                    return false;
                }
            }
            for (var interfaceType : type.getInterfaces()) {
                if (!isTypePresent(interfaceType)) {
                    return false;
                }
            }
            for (var genericInterface : type.getGenericInterfaces()) {
                if (!isTypePresent(genericInterface)) {
                    return false;
                }
            }
            return true;
        } catch (final Throwable e) {
            LOG.warn("Skipping Class that isn't fully loaded...", e);
            return false;
        }
    }

    public static boolean isTypePresent(Type type) {
        if (type == null) {
            return true;
        }
        try {
            if (TYPES_PROCESSING.get().contains(type)) {
                return true;
            }

            TYPES_PROCESSING.get().add(type);
            type.getTypeName();
            if (type.getTypeName().isBlank()) {
                TYPES_PROCESSING.get().remove(type);
                return false;
            }
            if (type instanceof Class<?> clazz) {
                var result = isClassPresent(clazz);
                TYPES_PROCESSING.get().remove(type);
                return result;
            }
            if (type instanceof TypeVariable<?> typeVariable) {
                var result = isTypeVariablePresent(typeVariable);
                TYPES_PROCESSING.get().remove(type);
                return result;
            }
            if (type instanceof ParameterizedType parameterizedType) {
                for (var argument : parameterizedType.getActualTypeArguments()) {
                    if (!isTypePresent(argument)) {
                        TYPES_PROCESSING.get().remove(type);
                        return false;
                    }
                }
                if (parameterizedType == parameterizedType.getRawType()) {
                    TYPES_PROCESSING.get().remove(type);
                    return false;
                }
                if (parameterizedType == parameterizedType.getOwnerType()) {
                    TYPES_PROCESSING.get().remove(type);
                    return false;
                }
                var result = isTypePresent(parameterizedType.getRawType()) && isTypePresent(parameterizedType.getOwnerType());
                TYPES_PROCESSING.get().remove(type);
                return result;
            }
            if (type instanceof WildcardType wildcardType) {
                for (var bound : wildcardType.getUpperBounds()) {
                    if (!isTypePresent(bound)) {
                        TYPES_PROCESSING.get().remove(type);
                        return false;
                    }
                }
                for (var bound : wildcardType.getLowerBounds()) {
                    if (!isTypePresent(bound)) {
                        TYPES_PROCESSING.get().remove(type);
                        return false;
                    }
                }
            }

            TYPES_PROCESSING.get().remove(type);
            return true;
        } catch (final Throwable e) {
            TYPES_PROCESSING.get().remove(type);
            return false;
        }
    }

    public static boolean isAnnotatedElementPresent(AnnotatedElement annotatedElement) {
        if (annotatedElement == null) {
            return true;
        }
        try {
            for (var annotation : annotatedElement.getAnnotations()) {
                if (!isAnnotationPresent(annotation)) {
                    return false;
                }
            }
            return true;
        } catch (final Throwable e) {
            LOG.warn("Skipping AnnotatedElement that isn't fully loaded...", e);
            return false;
        }
    }

    public static boolean isMethodPresent(Method method) {
        if (method == null) {
            return true;
        }
        return isTypePresent(method.getReturnType()) && isExecutableLoaded(method);
    }

    public static boolean isFieldPresent(Field field) {
        if (field == null) {
            return true;
        }
        try {
            if (isTypePresent(field.getType())) {
                return false;
            }
            if (isTypePresent(field.getGenericType())) {
                return false;
            }
            return isAnnotatedElementPresent(field);
        } catch (final Throwable e) {
            return false;
        }
    }

    public static boolean isAnnotationPresent(Annotation annotation) {
        if (annotation == null) {
            return true;
        }
        try {
            if (!isTypePresent(annotation.annotationType())) {
                return false;
            }
            annotation.toString();
            return true;
        } catch (final Throwable e) {
            LOG.warn("Skipping Annotation that isn't fully loaded...", e);
            return false;
        }
    }

    public static boolean isGenericDeclarationPresent(GenericDeclaration genericDeclaration) {
        if (genericDeclaration == null) {
            return true;
        }
        try {
            for (var typeParameter : genericDeclaration.getTypeParameters()) {
                if (!isTypePresent(typeParameter)) {
                    return false;
                }
            }
            return isAnnotatedElementPresent(genericDeclaration);
        } catch (final Throwable e) {
            LOG.warn("Skipping GenericDeclaration that isn't fully loaded...", e);
            return false;
        }
    }

    public static boolean isConstructorPresent(Constructor<?> constructor) {
        if (constructor == null) {
            return true;
        }
        return isExecutableLoaded(constructor);
    }

    public static boolean isTypeVariablePresent(TypeVariable<?> type) {
        if (type == null) {
            return true;
        }
        try {
            type.getTypeName();
            type.getName();
            if (!isGenericDeclarationPresent(type.getGenericDeclaration())) {
                return false;
            }
            for (var bound : type.getBounds()) {
                if (!isTypePresent(bound)) {
                    return false;
                }
            }
            return true;
        } catch (final Throwable e) {
            return false;
        }
    }

    public static boolean isExecutableLoaded(Executable executable) {
        if (executable == null) {
            return true;
        }
        try {
            executable.getName();
            executable.toGenericString();
            executable.getModifiers();
            if (!isGenericDeclarationPresent(executable)) {
                return false;
            }
            for (var parameter : executable.getParameters()) {
                if (!isTypePresent(parameter.getType())) {
                    return false;
                }
                if (!isTypePresent(parameter.getParameterizedType())) {
                    return false;
                }
            }
            for (var parameter : executable.getGenericParameterTypes()) {
                if (!isTypePresent(parameter)) {
                    return false;
                }
            }

            return true;
        } catch (final Throwable e) {
            LOG.warn("Skipping Executable that isn't fully loaded...", e);
            return false;
        }
    }

    public static String safeRemap(final Method method) {
        if (null == method) {
            return null;
        }
        final var name = tryGet(method::getName);
        if (getRemap().isEmpty()) {
            if (name.isEmpty()) {
                throw new IllegalStateException("Method name is null!");
            }
            if (name.get().isBlank()) {
                throw new IllegalStateException("Method name is blank!");
            }
            return name.get();
        }
        final var remap = getRemap().get().getMappedMethod(method.getDeclaringClass(), method);
        if (remap.isBlank()) {
            if (name.isEmpty()) {
                throw new IllegalStateException("Method name is null!");
            }
            return name.get();
        }
        return remap;
    }

    @SafeVarargs
    public static <D> Optional<D> tryGetFirst(final ExceptionalSupplier<D>... suppliers) {
        if (null == suppliers) {
            return Optional.empty();
        }
        for (final ExceptionalSupplier<D> supplier : suppliers) {
            final var out = tryGet(supplier);
            if (out.isPresent()) {
                return out;
            }
        }
        return Optional.empty();
    }

    private static Optional<TypeNameMapper> getRemap() {
        return Optional.ofNullable(mapper);
    }

    public static String safeRemap(final Field field) {
        if (null == field) {
            throw new IllegalArgumentException("Field is null!");
        }
        final var name = tryGet(field::getName);
        if (getRemap().isEmpty()) {
            if (name.isEmpty()) {
                throw new IllegalStateException("Field name is null!");
            }
            if (name.get().isBlank()) {
                throw new IllegalStateException("Field name is blank!");
            }
            return name.get();
        }
        final var remap = getRemap().get().getMappedField(field.getDeclaringClass(), field);
        if (remap.isBlank()) {
            if (name.isEmpty()) {
                throw new IllegalStateException("Field name is null!");
            }
            return name.get();
        }
        return remap;
    }

    public static String safeRemap(final Class<?> clazz) {
        if (null == clazz) {
            return null;
        }
        final var name = tryGet(clazz::getName);
        if (getRemap().isEmpty() || name.isEmpty()) {
            return getRemappedClassName(clazz, true);
        }
        final var remap = getRemap().get().getMappedClass(clazz);
        if (remap.isBlank()) {
            return getRemappedClassName(clazz, true);
        }
        return remap;
    }

    public static String getRemappedClassName(Class<?> clazz, boolean simple) {
        var name = simple ?
                tryGet(clazz::getSimpleName).orElse(null)
                :
                tryGet(clazz::getName).orElse(null);
        if (getRemap().isPresent()) {
            final var remapped = getRemap().get().getMappedClass(clazz);
            if (null != remapped && !remapped.isBlank()) {
                return remapped;
            }
        }
        return name;
    }

    // tryGet(Object::toString) -> Optional<String>
    // tryGet(Method::getFields) -> Optional<Field[]>
    public static <T> Optional<T> tryGet(final ExceptionalSupplier<T> supplier) {
        if (null == supplier) {
            return Optional.empty();
        }
        try {
            return Optional.of(supplier.get());
        } catch (final Throwable e) {
            return Optional.empty();
        }
    }

    public static Type[] getAllNonObjects(Type[] bounds) {
        if (null == bounds || bounds.length == 0) {
            return new Type[]{};
        }
        return Arrays.stream(bounds).filter((bound) -> bound != Object.class).toArray(Type[]::new);
    }

    @FunctionalInterface
    public interface ExceptionalSupplier<T> {
        T get() throws Exception;
    }

}
