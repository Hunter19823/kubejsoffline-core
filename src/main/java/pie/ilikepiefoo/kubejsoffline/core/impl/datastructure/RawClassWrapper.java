package pie.ilikepiefoo.kubejsoffline.core.impl.datastructure;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.RawClassData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.AnnotationID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.ConstructorID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.FieldID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.MethodID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.NameID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.PackageID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeOrTypeVariableID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeVariableID;
import pie.ilikepiefoo.kubejsoffline.core.impl.CollectionGroup;
import pie.ilikepiefoo.kubejsoffline.core.util.SafeOperations;
import pie.ilikepiefoo.kubejsoffline.core.util.json.JSONProperty;

import java.lang.reflect.Type;
import java.util.List;
import java.util.Objects;
import java.util.function.Predicate;

public class RawClassWrapper implements RawClassData {
    protected final Class<?> clazz;
    protected final CollectionGroup collectionGroup;
    protected List<AnnotationID> annotations;
    protected NameID name;
    protected List<TypeVariableID> typeParameters;
    protected PackageID packageID;
    protected TypeID superClass;
    protected List<TypeID> interfaces;
    protected List<TypeID> innerClasses;
    protected TypeID enclosingClass;
    protected TypeID declaringClass;
    protected List<FieldID> fields;
    protected List<ConstructorID> constructors;
    protected List<MethodID> methods;
    protected TypeID index;

    public RawClassWrapper(CollectionGroup group, Class<?> clazz) {
        this.collectionGroup = group;
        this.clazz = clazz;
    }

    @Override
    public TypeID getIndex() {
        return index;
    }

    @Override
    public RawClassData setIndex(TypeOrTypeVariableID index) {
        this.index = index.asType();
        return this;
    }

    @Override
    public JsonElement toJSON() {
        var json = new JsonObject();
        // If getName() returns null, it will throw an exception
        json.add(JSONProperty.CLASS_NAME.jsName, Objects.requireNonNull(getName().toJSON()));
        addAllTo(json, JSONProperty.ANNOTATIONS.jsName, true, this::getAnnotations);

        if (getModifiers() != 0) {
            json.addProperty(JSONProperty.MODIFIERS.jsName, getModifiers());
        }
        addAllTo(json, JSONProperty.TYPE_VARIABLES.jsName, false, this::getTypeParameters);
        addTo(json, JSONProperty.PACKAGE_NAME.jsName, this::getPackage);
        addTo(json, JSONProperty.SUPER_CLASS.jsName, this::getSuperClass);
        addAllTo(json, JSONProperty.INTERFACES.jsName, true, this::getInterfaces);
        addAllTo(json, JSONProperty.INNER_CLASSES.jsName, true, this::getInnerClasses);
        addTo(json, JSONProperty.ENCLOSING_CLASS.jsName, this::getEnclosingClass);
        addTo(json, JSONProperty.DECLARING_CLASS.jsName, this::getDeclaringClass);
        addAllTo(json, JSONProperty.FIELDS.jsName, true, this::getFields);
        addAllTo(json, JSONProperty.CONSTRUCTORS.jsName, true, this::getConstructors);
        addAllTo(json, JSONProperty.METHODS.jsName, true, this::getMethods);
        return json;
    }

    @Override
    public NameID getName() {
        if (name != null) {
            return name;
        }
        return this.name = collectionGroup.names().addName(SafeOperations.getSimpleRemappedClassName(clazz));
    }

    @Override
    public List<AnnotationID> getAnnotations() {
        if (annotations != null) {
            return annotations;
        }
        return this.annotations = SafeOperations.tryGet(clazz::getAnnotations).map(collectionGroup::of).orElse(List.of());
    }

    @Override
    public int getModifiers() {
        return this.clazz.getModifiers();
    }

    @Override
    public PackageID getPackage() {
        if (packageID != null) {
            return packageID;
        }
        if (clazz.getPackage() == null) {
            return null;
        }
        return this.packageID = SafeOperations.tryGet(() -> collectionGroup.packageOf(clazz.getPackage())).orElse(null);
    }

    @Override
    public TypeID getSuperClass() {
        if (superClass != null) {
            return superClass;
        }
        return this.superClass = SafeOperations.getSuperClass(clazz, ((Predicate<Type>) SafeOperations::isTypeNotLoaded).negate()).map(collectionGroup::of).map(TypeOrTypeVariableID::asType).orElse(null);
    }

    @Override
    public List<TypeID> getInterfaces() {
        if (interfaces != null) {
            return interfaces;
        }
        return this.interfaces = SafeOperations.tryGet(() -> collectionGroup.ofTypes(clazz.getGenericInterfaces())).orElse(List.of());
    }

    @Override
    public List<TypeID> getInnerClasses() {
        if (innerClasses != null) {
            return innerClasses;
        }
        return this.innerClasses = SafeOperations.tryGet(() -> collectionGroup.ofTypes(clazz.getDeclaredClasses())).orElse(List.of());
    }

    @Override
    public TypeID getEnclosingClass() {
        if (enclosingClass != null) {
            return enclosingClass;
        }
        if (clazz.getEnclosingClass() == null) {
            return null;
        }
        return this.enclosingClass = SafeOperations.tryGet(() -> collectionGroup.of(clazz.getEnclosingClass()).asType()).orElse(null);
    }

    @Override
    public TypeID getDeclaringClass() {
        if (declaringClass != null) {
            return declaringClass;
        }
        if (clazz.getDeclaringClass() == null) {
            return null;
        }
        return this.declaringClass = SafeOperations.tryGet(() -> collectionGroup.of(clazz.getDeclaringClass()).asType()).orElse(null);
    }

    @Override
    public List<TypeVariableID> getTypeParameters() {
        if (typeParameters != null) {
            return typeParameters;
        }
        return this.typeParameters = SafeOperations.tryGet(() -> collectionGroup.of(clazz.getTypeParameters())).orElse(List.of());
    }

    @Override
    public List<ConstructorID> getConstructors() {
        if (constructors != null) {
            return constructors;
        }
        return this.constructors = SafeOperations.tryGet(() -> collectionGroup.of(clazz.getDeclaredConstructors())).orElse(List.of());
    }

    @Override
    public List<FieldID> getFields() {
        if (fields != null) {
            return fields;
        }
        return this.fields = SafeOperations.tryGet(() -> collectionGroup.of(clazz.getDeclaredFields())).orElse(List.of());
    }

    @Override
    public List<MethodID> getMethods() {
        if (methods != null) {
            return methods;
        }
        return this.methods = SafeOperations.tryGet(() -> collectionGroup.of(clazz.getDeclaredMethods())).orElse(List.of());
    }

    @Override
    public int hashCode() {
        return this.clazz.hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }
        if (this == obj) {
            return true;
        }
        return this.hashCode() == obj.hashCode();
    }
}
