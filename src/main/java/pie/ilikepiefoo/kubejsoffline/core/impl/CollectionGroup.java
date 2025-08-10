package pie.ilikepiefoo.kubejsoffline.core.impl;


import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Annotations;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Names;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Packages;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Parameters;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Types;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.ConstructorData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.FieldData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.MethodData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.AnnotationID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.NameID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.PackageID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.ParameterID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeOrTypeVariableID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeVariableID;
import pie.ilikepiefoo.kubejsoffline.core.impl.collection.AnnotationsWrapper;
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
import java.util.LinkedList;
import java.util.List;
import java.util.Objects;
import java.util.function.Predicate;
import java.util.stream.Stream;

public record CollectionGroup(
        Types types,
        Parameters parameters,
        Packages packages,
        Names names,
        Annotations annotations) implements JSONSerializable {
    public static final Logger LOG = LogManager.getLogger();
    public static final CollectionGroup INSTANCE = new CollectionGroup();

    public CollectionGroup() {
        this(new TypesWrapper(), new ParametersWrapper(), new PackagesWrapper(), new NamesWrapper(), new AnnotationsWrapper());
    }

    public List<AnnotationID> of(Annotation[] annotations) {
        return Stream
                .of(annotations)
                .filter(SafeOperations::isAnnotationPresent)
                .map(annotation -> annotations().addAnnotation(new AnnotationWrapper(this, annotation)))
                .toList();
    }

    public List<ParameterID> of(Parameter[] parameters, Type[] genericTypes) {
        return Objects
                .requireNonNull(SafeOperations.safelyGetParametersAndTypes(parameters, genericTypes))
                .stream()
                .map((pair) -> parameters().addParameter(new ParameterWrapper(this, pair.left(), pair.right())))
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
                .filter(type -> !SafeOperations.isTypeNotLoaded(type))
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
        LinkedList<TypeID> typeList = new LinkedList<>();
        for (Type type : types) {
            if (type == null) {
                continue;
            }
            if (SafeOperations.isTypeNotLoaded(type)) {
                continue;
            }
            typeList.add(of(type).asType());
        }
        return typeList;
    }

    public List<TypeID> of(Class<?>[] types) {
        LinkedList<TypeID> typeList = new LinkedList<>();
        for (Class<?> type : types) {
            if (type == null) {
                continue;
            }
            if (SafeOperations.isTypeNotLoaded(type)) {
                continue;
            }
            typeList.add(of(type).asType());
        }
        return typeList;
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

    public List<FieldData> of(Field[] fields) {
        LinkedList<FieldData> fieldList = new LinkedList<>();
        for (Field field : fields) {
            if (field == null) {
                continue;
            }
            if (!SafeOperations.isFieldPresent(field)) {
                continue;
            }
            fieldList.add(new FieldWrapper(this, field));
        }
        return fieldList;
    }

    public List<MethodData> of(Method[] methods) {
        LinkedList<MethodData> methodList = new LinkedList<>();
        for (Method method : methods) {
            if (method == null) {
                continue;
            }
            if (!SafeOperations.isMethodPresent(method)) {
                continue;
            }
            methodList.add(new MethodWrapper(this, method));
        }
        return methodList;
    }

    public List<ConstructorData> of(Constructor<?>[] constructors) {
        LinkedList<ConstructorData> constructorList = new LinkedList<>();
        for (Constructor<?> constructor : constructors) {
            if (constructor == null) {
                continue;
            }
            if (!SafeOperations.isConstructorPresent(constructor)) {
                continue;
            }
            constructorList.add(new ConstructorWrapper(this, constructor));
        }
        return constructorList;
    }


    public void clear() {
        types().clear();
        parameters().clear();
        packages().clear();
        names().clear();
        annotations().clear();
    }

    public synchronized void index() {
        for (var type : types) {
            type.index();
        }
        for (var annotation : annotations) {
            annotation.index();
        }
        for (var parameter : parameters) {
            parameter.index();
        }
        for (var type : types) {
            type.index();
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
        types.toggleLock();
        annotations.toggleLock();
        parameters.toggleLock();
        packages.toggleLock();
    }

    @Override
    public JsonElement toJSON() {
        var json = new JsonObject();
        json.add("types", types().toJSON());
        json.add("parameters", parameters().toJSON());
        json.add("packages", packages().toJSON());
        json.add("names", names().toJSON());
        json.add("annotations", annotations().toJSON());
        return json;
    }
}
