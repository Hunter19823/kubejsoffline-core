package pie.ilikepiefoo.kubejsoffline.core.impl;


import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Annotations;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Constructors;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Fields;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Methods;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Names;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Packages;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Parameters;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Types;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.AnnotationData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.ConstructorData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.FieldData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.MethodData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.PackagePart;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.ParameterData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.TypeData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.AnnotationID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.ConstructorID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.FieldID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.MethodID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.NameID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.PackageID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.ParameterID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeOrTypeVariableID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeVariableID;
import pie.ilikepiefoo.kubejsoffline.core.impl.collection.AnnotationsWrapper;
import pie.ilikepiefoo.kubejsoffline.core.impl.collection.ConstructorsWrapper;
import pie.ilikepiefoo.kubejsoffline.core.impl.collection.FieldsWrapper;
import pie.ilikepiefoo.kubejsoffline.core.impl.collection.MethodsWrapper;
import pie.ilikepiefoo.kubejsoffline.core.impl.collection.NamesWrapper;
import pie.ilikepiefoo.kubejsoffline.core.impl.collection.PackagesWrapper;
import pie.ilikepiefoo.kubejsoffline.core.impl.collection.ParametersWrapper;
import pie.ilikepiefoo.kubejsoffline.core.impl.collection.TypesWrapper;
import pie.ilikepiefoo.kubejsoffline.core.impl.datastructure.AnnotationWrapper;
import pie.ilikepiefoo.kubejsoffline.core.impl.datastructure.ConstructorWrapper;
import pie.ilikepiefoo.kubejsoffline.core.impl.datastructure.FieldWrapper;
import pie.ilikepiefoo.kubejsoffline.core.impl.datastructure.MethodWrapper;
import pie.ilikepiefoo.kubejsoffline.core.impl.datastructure.ParameterWrapper;
import pie.ilikepiefoo.kubejsoffline.core.util.SafeOperations;

import java.lang.annotation.Annotation;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.lang.reflect.Type;
import java.lang.reflect.TypeVariable;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Predicate;
import java.util.function.ToLongFunction;
import java.util.stream.Stream;

public record CollectionGroup(
        Types types,
        Parameters parameters,
        Methods methods,
        Fields fields,
        Constructors constructors,
        Packages packages,
        Names names,
        Annotations annotations) implements JSONSerializable {
    public static final Logger LOG = LogManager.getLogger();
    public static final CollectionGroup INSTANCE = new CollectionGroup();

    public CollectionGroup() {
        this(new TypesWrapper(), new ParametersWrapper(), new MethodsWrapper(), new FieldsWrapper(), new ConstructorsWrapper(), new PackagesWrapper(), new NamesWrapper(), new AnnotationsWrapper());
    }

    public List<AnnotationID> of(Annotation[] annotations) {
        return Stream
                .of(annotations)
                .filter(Objects::nonNull)
                .filter(SafeOperations::isAnnotationPresent)
                .map((annotation) -> new AnnotationWrapper(this, annotation))
                .map(SafeOperations::tryIndex)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(annotations()::addAnnotation)
                .toList();
    }

    public List<ParameterID> of(Parameter[] parameters, Type[] genericTypes) {
        return Objects
                .requireNonNull(SafeOperations.safelyGetParametersAndTypes(parameters, genericTypes))
                .stream()
                .map((pair) -> parameters().addParameter(new ParameterWrapper(this, pair.left(), pair.right())))
                .toList();
    }

    public List<MethodID> of(Method[] methods) {
        return Arrays.stream(methods)
                .filter(Objects::nonNull)
                .filter(SafeOperations::isMethodPresent)
                .map((method) -> new MethodWrapper(this, method))
                .map(SafeOperations::tryIndex)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(methods()::addMethod)
                .toList();
    }

    public List<FieldID> of(Field[] fields) {
        return Arrays.stream(fields)
                .filter(Objects::nonNull)
                .filter(SafeOperations::isFieldPresent)
                .map((field) -> new FieldWrapper(this, field))
                .map(SafeOperations::tryIndex)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(fields()::addField)
                .toList();
    }

    public List<ConstructorID> of(Constructor<?>[] constructors) {
        return Arrays.stream(constructors)
                .filter(Objects::nonNull)
                .filter(SafeOperations::isConstructorPresent)
                .map((constructor) -> new ConstructorWrapper(this, constructor))
                .map(SafeOperations::tryIndex)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(constructors()::addConstructor)
                .toList();
    }

    public List<TypeOrTypeVariableID> of(Type[] types) {
        return this.of(types, (type) -> false);
    }

    public List<TypeOrTypeVariableID> of(Type[] types, Predicate<Type> ignoreType) {
        return getLoadedTypes(types, ignoreType)
                .stream()
                .map(this::of)
                .toList();
    }

    public List<Type> getLoadedTypes(Type[] types, Predicate<Type> ignoreType) {
        return Stream
                .of(types)
                .filter(Objects::nonNull)
                .filter(SafeOperations::isTypeLoaded)
                .filter(ignoreType.negate())
                .toList();
    }

    public List<Type> getLoadedTypes(Type[] types) {
        return getLoadedTypes(types, (type) -> false);
    }

    public synchronized TypeOrTypeVariableID of(Type type) {
        return TypeManager.INSTANCE.getID(type);
    }

    public List<TypeID> ofTypes(Type[] types) {
        return Arrays.stream(types)
                .filter(Objects::nonNull)
                .filter(SafeOperations::isTypeLoaded)
                .map(this::of)
                .map(TypeOrTypeVariableID::asType)
                .toList();
    }

    public List<TypeID> of(Class<?>[] types) {
        return Arrays.stream(types)
                .filter(Objects::nonNull)
                .filter(SafeOperations::isTypeLoaded)
                .map(this::of)
                .map(TypeOrTypeVariableID::asType)
                .toList();
    }

    public List<TypeVariableID> of(TypeVariable<?>[] typeVariables) {
        LinkedList<TypeVariableID> typeVariableList = new LinkedList<>();
        for (TypeVariable<?> typeVariable : typeVariables) {
            if (typeVariable == null) {
                throw new NullPointerException("TypeVariable cannot be null");
            }
            if (SafeOperations.isTypeNotLoaded(typeVariable)) {
                throw new IllegalStateException("TypeVariable " + typeVariable + " is not fully loaded");
            }
            typeVariableList.add(of(typeVariable).asTypeVariable());
        }
        return typeVariableList;
    }

    public NameID nameOf(String name) {
        if (name == null) {
            throw new NullPointerException("Name cannot be null");
        }
        return names().addName(name);
    }

    public PackageID packageOf(Package pack) {
        if (pack == null) {
            throw new NullPointerException("Package cannot be null");
        }
        return packages().addPackage(pack.getName());
    }


    public void clear() {
        types().clear();
        parameters().clear();
        methods().clear();
        fields().clear();
        constructors().clear();
        packages().clear();
        names().clear();
        annotations().clear();
    }

    public synchronized void index() {
        for (var type : types) {
            type.index();
        }
        for (var method : methods) {
            method.index();
        }
        for (var field : fields) {
            field.index();
        }
        for (var constructor : constructors) {
            constructor.index();
        }
        for (var annotation : annotations) {
            annotation.index();
        }
        for (var parameter : parameters) {
            parameter.index();
        }
        for (var type : types) {
            type.index();
            for (var method : methods) {
                method.index();
            }
            for (var field : fields) {
                field.index();
            }
            for (var constructor : constructors) {
                constructor.index();
            }
            for (var annotation : annotations) {
                annotation.index();
            }
            for (var parameter : parameters) {
                parameter.index();
            }
        }
        for (var pkg : packages) {
            pkg.index();
        }
        types.getTwoWayMap().reorganize(Comparator.comparingLong((ToLongFunction<TypeData>) CollectionGroup::getWeight).reversed());
        annotations.getTwoWayMap().reorganize(Comparator.comparingLong((ToLongFunction<AnnotationData>) CollectionGroup::getWeight).reversed());
        methods.getTwoWayMap().reorganize(Comparator.comparingLong((ToLongFunction<MethodData>) CollectionGroup::getWeight).reversed());
        fields.getTwoWayMap().reorganize(Comparator.comparingLong((ToLongFunction<FieldData>) CollectionGroup::getWeight).reversed());
        constructors.getTwoWayMap().reorganize(Comparator.comparingLong((ToLongFunction<ConstructorData>) CollectionGroup::getWeight).reversed());
        parameters.getTwoWayMap().reorganize(Comparator.comparingLong((ToLongFunction<ParameterData>) CollectionGroup::getWeight).reversed());
        packages.getTwoWayMap().reorganize(Comparator.comparingLong((ToLongFunction<PackagePart>) CollectionGroup::getWeight).reversed());
        names.getTwoWayMap().reorganize(Comparator.comparing(String::length).thenComparing(Comparator.naturalOrder()));
        types.toggleLock();
        annotations.toggleLock();
        parameters.toggleLock();
        methods.toggleLock();
        fields.toggleLock();
        constructors.toggleLock();
        packages.toggleLock();
    }

    public static long getWeight(TypeData type) {
        long weight = type.getIndex().getReferenceCount();
        if (type.isRawType()) {
            weight += 100000000L;
        } else if (type.isParameterizedType()) {
            weight += 10000000L;
        } else if (type.isTypeVariable()) {
            weight += 1000000L;
        } else if (type.isWildcardType()) {
            weight += 100000L;
        }
        return weight;
    }

    public static long getWeight(AnnotationData annotation) {
        return annotation.getAnnotationType().getReferenceCount();
    }

    public static long getWeight(ParameterData parameter) {
        return parameter.getIndex().getReferenceCount();
    }

    public static long getWeight(PackagePart pkg) {
        return pkg.getIndex().getReferenceCount();
    }

    public static long getWeight(MethodData method) {
        return method.getIndex().getReferenceCount();
    }

    public static long getWeight(FieldData field) {
        return field.getIndex().getReferenceCount();
    }

    public static long getWeight(ConstructorData constructor) {
        return constructor.getIndex().getReferenceCount();
    }

    @Override
    public JsonElement toJSON() {
        var json = new JsonObject();
        json.add("types", types().toJSON());
        json.add("parameters", parameters().toJSON());
        json.add("methods", methods().toJSON());
        json.add("fields", fields().toJSON());
        json.add("constructors", constructors().toJSON());
        json.add("packages", packages().toJSON());
        json.add("names", names().toJSON());
        json.add("annotations", annotations().toJSON());
        return json;
    }
}
