package pie.ilikepiefoo.kubejsoffline.core.util;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import pie.ilikepiefoo.kubejsoffline.core.api.TypeNameMapper;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.IndexGenerator;

import java.lang.annotation.Annotation;
import java.lang.reflect.Constructor;
import java.lang.reflect.Executable;
import java.lang.reflect.Field;
import java.lang.reflect.GenericArrayType;
import java.lang.reflect.GenericDeclaration;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.lang.reflect.TypeVariable;
import java.lang.reflect.WildcardType;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

public class SafeOperations {
    private static final Logger LOG = LogManager.getLogger();
    private static TypeNameMapper mapper;
    protected static final ThreadLocal<Set<Type>> TYPES_PROCESSING = ThreadLocal.withInitial(HashSet::new);

    public static void setTypeMapper(TypeNameMapper mapper) {
        SafeOperations.mapper = mapper;
    }

    private static boolean isClassPresent(Class<?> type) {
        if (type == null) {
            return true;
        }
        try {
            boolean nested = type.isArray();
            while (nested) {
                type = type.getComponentType();
                nested = type.isArray();
            }
            if (type.isAnonymousClass()) {
                return isTypePresent(type.getGenericSuperclass());
            }

            Objects.requireNonNull(SafeOperations.getSimpleRemappedClassName(type));

            if (!type.isPrimitive() || type.equals(Void.class)) {
                Objects.requireNonNull(type.getPackage());
            }

            if (!isTypePresent(type.getGenericSuperclass())) {
                return false;
            }

            if (!isTypePresent(type.getEnclosingClass())) {
                return false;
            }

            return isGenericDeclarationPresent(type);
        } catch (final Throwable e) {
            LOG.warn("Skipping Class that isn't fully loaded...", e);
            return false;
        }
    }

    public static boolean isTypeNotLoaded(Type type) {
        var isTypePresent = isTypePresent(type);
        TYPES_PROCESSING.get().clear();
        return !isTypePresent;
    }

    private static boolean isTypePresent(Type type) {
        if (type == null) {
            return true;
        }
        try {
            if (TYPES_PROCESSING.get().contains(type)) {
                return true;
            }

            TYPES_PROCESSING.get().add(type);
            if (type.getTypeName().isBlank()) {
                return false;
            }
            if (type instanceof Class<?> clazz) {
                return isClassPresent(clazz);
            }
            if (type instanceof GenericArrayType genericArrayType) {
                return isTypePresent(genericArrayType.getGenericComponentType());
            }
            if (type instanceof TypeVariable<?> typeVariable) {
                return isTypeVariablePresent(typeVariable);
            }
            if (type instanceof ParameterizedType parameterizedType) {
                for (var argument : parameterizedType.getActualTypeArguments()) {
                    if (!isTypePresent(argument)) {
                        return false;
                    }
                }
                if (parameterizedType == parameterizedType.getRawType()) {
                    return false;
                }
                if (parameterizedType == parameterizedType.getOwnerType()) {
                    return false;
                }
                var result = isTypePresent(parameterizedType.getRawType()) && isTypePresent(parameterizedType.getOwnerType());
                return result;
            }
            if (type instanceof WildcardType wildcardType) {
                return isPresent(wildcardType.getUpperBounds()) && isPresent(wildcardType.getLowerBounds());
            }

            return true;
        } catch (final Throwable e) {
            return false;
        }
    }

    private static boolean isPresent(Type... types) {
        if (types == null) {
            return true;
        }
        try {
            for (var type : types) {
                if (!isTypePresent(type)) {
                    return false;
                }
            }
        } catch (final Throwable e) {
            LOG.warn("Skipping Type that isn't fully loaded...", e);
            return false;
        }
        return true;
    }

    public static boolean isMethodPresent(Method method) {
        if (method == null) {
            return true;
        }
        return !isTypeNotLoaded(method.getReturnType()) && isExecutableLoaded(method);
    }

    public static boolean isFieldPresent(Field field) {
        if (field == null) {
            return true;
        }
        try {
            return !isTypeNotLoaded(field.getType()) || !isTypeNotLoaded(field.getGenericType());
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
            Objects.requireNonNull(annotation.toString());
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
            return isPresent(genericDeclaration.getTypeParameters());
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

    /**
     * When it comes to serializing the type variable, we only care about the name and bounds.
     * If the type variable is null, we return true, indicating that it is present.
     * @param type the TypeVariable to check
     * @return true if the TypeVariable is present, false otherwise
     */
    public static boolean isTypeVariablePresent(TypeVariable<?> type) {
        if (type == null) {
            return true;
        }
        try {
            Objects.requireNonNull(type.getName());
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
            Objects.requireNonNull(executable.getName());
            if (!isGenericDeclarationPresent(executable)) {
                return false;
            }
            Objects.requireNonNull(safelyGetParametersAndTypes(executable.getParameters(), executable.getGenericParameterTypes()));
            return true;
        } catch (final Throwable e) {
            LOG.warn("Skipping Executable {} that isn't fully loaded...", executable, e);
            return false;
        }
    }

    public static List<Pair<Parameter, Type>> safelyGetParametersAndTypes(Parameter[] parameters, Type[] genericTypes) {
        LinkedList<Pair<Parameter, Type>> pairs = new LinkedList<>();
        try {
            if (genericTypes.length < parameters.length) {
                Type[] newGenericTypes = new Type[parameters.length];
                int i;
                for (i = 0; i < genericTypes.length; i++) {
                    newGenericTypes[i] = genericTypes[i];
                }
                for (; i < parameters.length; i++) {
                    newGenericTypes[i] = parameters[i].getType();
                }
                genericTypes = newGenericTypes;
            }
            for (int i = 0; i < parameters.length; i++) {
                if (parameters[i] == null || genericTypes[i] == null) {
                    throw new NullPointerException("Parameter or generic type cannot be null at index " + i);
                }
                if (!SafeOperations.isParameterPresent(parameters[i]) || SafeOperations.isTypeNotLoaded(genericTypes[i])) {
                    throw new IllegalStateException("The full list of parameters is not loaded yet.");
                }
                pairs.add(new Pair<>(parameters[i], genericTypes[i]));
            }
        } catch (final Throwable e) {
            LOG.warn("Skipping Parameters that aren't fully loaded...", e);
            return null;
        }
        return pairs;
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
            return getRemappedClassName(clazz, false);
        }
        final var remap = getRemap().get().getMappedClass(clazz);
        if (remap.isBlank()) {
            return getRemappedClassName(clazz, false);
        }
        return remap;
    }

    public static String getSimpleRemappedClassName(Class<?> clazz) {
        String name = SafeOperations.safeRemap(clazz);
        String packageName = clazz.getPackageName();
        if (!packageName.isBlank()) {
            name = name.replace(packageName + ".", "");
        }
        if (name.contains("$")) {
            name = name.substring(name.lastIndexOf("$") + 1);
        }
        if (name.isBlank()) {
            if (clazz.isLocalClass()) {
                LOG.info("Local class {}'s simple name is blank.", clazz);
            }
            if (clazz.isAnonymousClass()) {
                LOG.info("Anonymous class {}'s simple name is blank.", clazz);
            }
            if (clazz.isSynthetic()) {
                LOG.info("Synthetic class {}'s simple name is blank.", clazz);
            }
            if (clazz.isHidden()) {
                LOG.info("Hidden class {}'s simple name is blank.", clazz);
            }

            throw new IllegalStateException("Name of %s is blank!".formatted(clazz));
        }
        return name;
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

    public static <T extends IndexGenerator> Optional<T> tryIndex(final T data) {
        if (null == data) {
            return Optional.empty();
        }
        try {
            data.index();
            return Optional.of(data);
        } catch (final Throwable e) {
            LOG.warn("An error occurred while executing the index", e);
            return Optional.empty();
        }
    }

    public static <T extends IndexGenerator> List<T> tryIndexDroppingFailures(final List<T> data) {
        if (null == data || data.isEmpty()) {
            return List.of();
        }
        return data
                .stream()
                .map(SafeOperations::tryIndex)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();
    }

    public static Type[] getAllNonObjects(Type[] bounds) {
        if (null == bounds || bounds.length == 0) {
            return new Type[]{};
        }
        return Arrays.stream(bounds).filter((bound) -> bound != Object.class).toArray(Type[]::new);
    }

    public static boolean isParameterPresent(Parameter parameter) {
        if (parameter == null) {
            return true;
        }
        try {
            if (isTypeNotLoaded(parameter.getType())) {
                return false;
            }
            return !isTypeNotLoaded(parameter.getParameterizedType());
        } catch (final Throwable e) {
            LOG.warn("Skipping Parameter that isn't fully loaded...", e);
            return false;
        }
    }

    @FunctionalInterface
    public interface ExceptionalSupplier<T> {
        T get() throws Exception;
    }

}
