package pie.ilikepiefoo.kubejsoffline.core.impl.datastructure;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.ParameterData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.AnnotationID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.NameID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.ParameterID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeOrTypeVariableID;
import pie.ilikepiefoo.kubejsoffline.core.impl.CollectionGroup;
import pie.ilikepiefoo.kubejsoffline.core.util.SafeOperations;

import java.lang.reflect.Parameter;
import java.lang.reflect.Type;
import java.util.List;
import java.util.Objects;

public class ParameterWrapper implements ParameterData {
    protected CollectionGroup collectionGroup;
    protected Parameter parameter;
    protected Type genericType;
    protected ParameterID parameterID;
    protected List<AnnotationID> annotations;
    protected TypeOrTypeVariableID type;
    protected NameID name;

    public ParameterWrapper(CollectionGroup collectionGroup, Parameter parameter, Type genericType) {
        this.collectionGroup = collectionGroup;
        this.parameter = parameter;
        this.genericType = genericType;
    }

    @Override
    public ParameterID getIndex() {
        return parameterID;
    }

    @Override
    public ParameterData setIndex(ParameterID index) {
        this.parameterID = index;
        return this;
    }

    @Override
    public JsonElement toJSON() {
        return compressObject(
                getName().toJSON(),
                getType().toJSON(),
                getModifiers() != 0 ? new JsonPrimitive(getModifiers()) : null,
                JSONSerializable.of(getAnnotations())
        );
    }

    @Override
    public NameID getName() {
        if (name != null) {
            return name;
        }
        return name = collectionGroup.nameOf(parameter.getName());
    }

    @Override
    public TypeOrTypeVariableID getType() {
        if (type != null) {
            return type;
        }
        return type = collectionGroup.of(genericType);
    }

    @Override
    public int getModifiers() {
        return parameter.getModifiers();
    }

    @Override
    public List<AnnotationID> getAnnotations() {
        if (annotations != null) {
            return annotations;
        }
        return annotations = SafeOperations.tryGet(parameter::getAnnotations).map(collectionGroup::of).orElse(List.of());
    }

    @Override
    public int hashCode() {
        return Objects.hash(
                getName(),
                getModifiers(),
                getType(),
                getAnnotations()
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
        if (obj instanceof ParameterWrapper other) {
            return Objects.equals(this.getName(), other.getName())
                    && Objects.equals(this.getModifiers(), other.getModifiers())
                    && Objects.equals(this.getType(), other.getType())
                    && Objects.equals(this.getAnnotations(), other.getAnnotations());
        }
        return false;
    }
}
