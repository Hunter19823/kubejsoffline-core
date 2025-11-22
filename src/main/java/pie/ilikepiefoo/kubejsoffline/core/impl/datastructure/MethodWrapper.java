package pie.ilikepiefoo.kubejsoffline.core.impl.datastructure;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.MethodData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.IndexedData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.AnnotationID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.MethodID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.NameID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.ParameterID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeOrTypeVariableID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeVariableID;
import pie.ilikepiefoo.kubejsoffline.core.impl.CollectionGroup;
import pie.ilikepiefoo.kubejsoffline.core.util.SafeOperations;

import java.lang.reflect.Method;
import java.lang.reflect.Type;
import java.util.List;
import java.util.Objects;

public class MethodWrapper implements MethodData {
    protected final CollectionGroup collectionGroup;
    protected final Method method;
    protected List<AnnotationID> annotations;
    protected List<TypeVariableID> typeParameters;
    protected List<TypeID> exceptions;
    protected List<ParameterID> parameters;
    protected TypeOrTypeVariableID type;
    protected NameID name;
    protected MethodID methodID;


    public MethodWrapper(CollectionGroup collectionGroup, Method method) {
        this.collectionGroup = collectionGroup;
        this.method = method;
    }

    @Override
    public MethodID getIndex() {
        return methodID;
    }

    @Override
    public IndexedData<MethodID> setIndex(MethodID index) {
        this.methodID = index;
        return this;
    }

    @Override
    public JsonElement toJSON() {
        return compressObject(
                getName().toJSON(),
                getModifiers() != 0 ? new JsonPrimitive(getModifiers()) : null,
                getType().toJSON(),
                JSONSerializable.of(getAnnotations()),
                JSONSerializable.of(getParameters()),
                JSONSerializable.of(getTypeParameters()),
                JSONSerializable.of(getExceptions())
        );
    }

    @Override
    public NameID getName() {
        if (name != null) {
            return name;
        }
        return this.name = collectionGroup.names().addName(SafeOperations.safeRemap(method));
    }

    @Override
    public int getModifiers() {
        return method.getModifiers();
    }

    @Override
    public TypeOrTypeVariableID getType() {
        if (type != null) {
            return type;
        }
        return this.type = collectionGroup.of(method.getGenericReturnType());
    }

    @Override
    public List<AnnotationID> getAnnotations() {
        if (annotations != null) {
            return annotations;
        }
        return this.annotations = SafeOperations.tryGet(method::getAnnotations).map(collectionGroup::of).orElse(List.of());
    }

    @Override
    public List<TypeVariableID> getTypeParameters() {
        if (typeParameters != null) {
            return typeParameters;
        }
        return this.typeParameters = collectionGroup.of(method.getTypeParameters());
    }

    @Override
    public List<TypeID> getExceptions() {
        if (exceptions != null) {
            return exceptions;
        }
        return this.exceptions = collectionGroup.of(method.getExceptionTypes());
    }

    @Override
    public List<ParameterID> getParameters() {
        if (parameters != null) {
            return parameters;
        }
        return this.parameters = collectionGroup.of(method.getParameters(), SafeOperations.tryGet(method::getGenericParameterTypes).orElse(new Type[0]));
    }

    @Override
    public int hashCode() {
        return Objects.hash(
                getName(),
                getModifiers(),
                getType(),
                getAnnotations(),
                getParameters(),
                getTypeParameters(),
                getExceptions()
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
        if (obj instanceof MethodWrapper other) {
            return Objects.equals(this.getName(), other.getName())
                    && Objects.equals(this.getModifiers(), other.getModifiers())
                    && Objects.equals(this.getType(), other.getType())
                    && Objects.equals(this.getAnnotations(), other.getAnnotations())
                    && Objects.equals(this.getParameters(), other.getParameters())
                    && Objects.equals(this.getTypeParameters(), other.getTypeParameters())
                    && Objects.equals(this.getExceptions(), other.getExceptions());
        }
        return false;
    }
}
