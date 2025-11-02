package pie.ilikepiefoo.kubejsoffline.core.impl.datastructure;

import com.google.gson.JsonElement;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.AnnotationData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.AnnotationID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.NameID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeID;
import pie.ilikepiefoo.kubejsoffline.core.impl.CollectionGroup;

import java.lang.annotation.Annotation;
import java.util.Objects;
import java.util.Optional;

public class AnnotationWrapper implements AnnotationData {

    protected Annotation annotation;
    protected TypeID annotationType;
    protected CollectionGroup collectionGroup;
    protected AnnotationID index;
    protected NameID valueId;

    public AnnotationWrapper(CollectionGroup collectionGroup, Annotation annotation) {
        this.annotation = annotation;
        this.collectionGroup = collectionGroup;
    }

    @Override
    public AnnotationID getIndex() {
        return index;
    }

    @Override
    public AnnotationData setIndex(AnnotationID index) {
        this.index = index;
        return this;
    }

    @Override
    public JsonElement toJSON() {
//        var json = new JsonObject();
//        json.add(JSONProperty.ANNOTATION_TYPE.jsName, getAnnotationType().toJSON());
//        if (!getAnnotationValue().isBlank()) {
//            json.addProperty(JSONProperty.ANNOTATION_STRING.jsName, getAnnotationValue());
//        }
        return compressObject(
                getAnnotationType().toJSON(),
                getAnnotationValue().isBlank() ? null : getAnnotationValueId().toJSON()
        );
    }

    @Override
    public String getAnnotationValue() {
        var value = annotation.toString();
//        // Substring from first and last parenthesis.
//        int start = value.indexOf('(');
//        int end = value.lastIndexOf(')');
//        if (start != -1 && end != -1) {
//            return value.substring(start + 1, end);
//        }
        return value;
    }

    @Override
    public NameID getAnnotationValueId() {
        if (valueId != null) {
            return valueId;
        }

        return valueId = Optional.ofNullable(getAnnotationValue()).map(collectionGroup::nameOf).orElse(null);
    }

    @Override
    public TypeID getAnnotationType() {
        if (annotationType != null) {
            return annotationType;
        }
        return annotationType = collectionGroup.of(annotation.annotationType()).asType();
    }

    @Override
    public int hashCode() {
        return Objects.hash(
                getAnnotationType(),
                getAnnotationValue()
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
        return this.hashCode() == obj.hashCode();
    }
}
