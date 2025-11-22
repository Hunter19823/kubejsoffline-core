package pie.ilikepiefoo.kubejsoffline.core.impl.datastructure;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.ConstructorData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.IndexedData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.AnnotationID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.ConstructorID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.ParameterID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeVariableID;
import pie.ilikepiefoo.kubejsoffline.core.impl.CollectionGroup;
import pie.ilikepiefoo.kubejsoffline.core.util.SafeOperations;

import java.lang.reflect.Constructor;
import java.lang.reflect.Type;
import java.util.List;
import java.util.Objects;

public class ConstructorWrapper implements ConstructorData {
    protected final CollectionGroup collectionGroup;
    protected final Constructor<?> constructor;
    protected List<AnnotationID> annotations;
    protected List<TypeVariableID> typeParameters;
    protected List<TypeID> exceptions;
    protected List<ParameterID> parameters;
    protected ConstructorID constructorID;

    public ConstructorWrapper(CollectionGroup collectionGroup, Constructor<?> constructor) {
        this.collectionGroup = collectionGroup;
        this.constructor = constructor;
    }

    @Override
    public ConstructorID getIndex() {
        return constructorID;
    }

    @Override
    public IndexedData<ConstructorID> setIndex(ConstructorID index) {
        this.constructorID = index;
        return this;
    }

    @Override
    public JsonElement toJSON() {
        return compressObject(
                getModifiers() != 0 ? new JsonPrimitive(getModifiers()) : null,
                JSONSerializable.of(getAnnotations()),
                JSONSerializable.of(getExceptions()),
                JSONSerializable.of(getTypeParameters()),
                JSONSerializable.of(getParameters())
        );
    }

    @Override
    public int getModifiers() {
        return constructor.getModifiers();
    }

    @Override
    public List<AnnotationID> getAnnotations() {
        if (annotations != null) {
            return annotations;
        }
        return this.annotations = SafeOperations.tryGet(constructor::getAnnotations).map(collectionGroup::of).orElse(List.of());
    }

    @Override
    public List<TypeVariableID> getTypeParameters() {
        if (typeParameters != null) {
            return typeParameters;
        }
        return this.typeParameters = collectionGroup.of(constructor.getTypeParameters());
    }

    @Override
    public List<TypeID> getExceptions() {
        if (exceptions != null) {
            return exceptions;
        }
        return this.exceptions = collectionGroup.of(constructor.getExceptionTypes());
    }

    @Override
    public List<ParameterID> getParameters() {
        if (parameters != null) {
            return parameters;
        }
        return this.parameters = collectionGroup.of(constructor.getParameters(), SafeOperations.tryGet(constructor::getGenericParameterTypes).orElse(new Type[0]));
    }

    @Override
    public int hashCode() {
        return Objects.hash(
                getModifiers(),
                getAnnotations(),
                getExceptions(),
                getTypeParameters(),
                getParameters()
        );
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }
        if (this == obj) {
            return true;
        }
        if (obj instanceof ConstructorWrapper other) {
            return Objects.equals(this.getModifiers(), other.getModifiers())
                    && Objects.equals(this.getAnnotations(), other.getAnnotations())
                    && Objects.equals(this.getExceptions(), other.getExceptions())
                    && Objects.equals(this.getTypeParameters(), other.getTypeParameters())
                    && Objects.equals(this.getParameters(), other.getParameters());
        }
        return false;
    }
}
