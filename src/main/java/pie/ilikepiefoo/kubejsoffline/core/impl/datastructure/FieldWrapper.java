package pie.ilikepiefoo.kubejsoffline.core.impl.datastructure;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.FieldData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.IndexedData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.AnnotationID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.FieldID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.NameID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeOrTypeVariableID;
import pie.ilikepiefoo.kubejsoffline.core.impl.CollectionGroup;
import pie.ilikepiefoo.kubejsoffline.core.util.SafeOperations;

import java.lang.reflect.Field;
import java.util.List;

public class FieldWrapper implements FieldData {
    protected final CollectionGroup collectionGroup;
    protected final Field field;
    protected TypeOrTypeVariableID type;
    protected NameID name;
    protected List<AnnotationID> annotations;
    protected FieldID fieldID;


    public FieldWrapper(CollectionGroup collectionGroup, Field field) {
        this.collectionGroup = collectionGroup;
        this.field = field;
    }

    @Override
    public FieldID getIndex() {
        return fieldID;
    }

    @Override
    public IndexedData<FieldID> setIndex(FieldID index) {
        this.fieldID = index;
        return this;
    }

    @Override
    public JsonElement toJSON() {
//        JsonObject json = new JsonObject();
//        json.add(JSONProperty.FIELD_NAME.jsName, getName().toJSON());
//        json.add(JSONProperty.FIELD_TYPE.jsName, getType().toJSON());
//        if (getModifiers() != 0) {
//            json.addProperty(JSONProperty.MODIFIERS.jsName, getModifiers());
//        }
//        addAllTo(json, JSONProperty.ANNOTATIONS.jsName, true, this::getAnnotations);

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
        return this.name = collectionGroup.names().addName(SafeOperations.safeRemap(field));
    }

    @Override
    public TypeOrTypeVariableID getType() {
        if (type != null) {
            return type;
        }
        return this.type = collectionGroup.of(SafeOperations.tryGetFirst(field::getGenericType, field::getType).orElseThrow(NullPointerException::new));
    }

    @Override
    public int getModifiers() {
        return field.getModifiers();
    }

    @Override
    public List<AnnotationID> getAnnotations() {
        if (annotations != null) {
            return annotations;
        }
        return this.annotations = SafeOperations.tryGet(field::getAnnotations).map(collectionGroup::of).orElse(List.of());
    }

    @Override
    public int hashCode() {
        return this.field.hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }
        if (this == obj) {
            return true;
        }
        if (!(obj instanceof FieldWrapper)) {
            return false;
        }
        return this.hashCode() == obj.hashCode();
    }
}
