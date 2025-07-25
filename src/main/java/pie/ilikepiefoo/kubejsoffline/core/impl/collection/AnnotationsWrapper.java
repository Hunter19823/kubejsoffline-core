package pie.ilikepiefoo.kubejsoffline.core.impl.collection;

import com.google.gson.JsonElement;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Annotations;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.AnnotationData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.AnnotationID;
import pie.ilikepiefoo.kubejsoffline.core.impl.identifier.IdentifierBase;

import java.util.NavigableMap;

public class AnnotationsWrapper implements Annotations {
    protected final TwoWayMap<AnnotationID, AnnotationData> data = new TwoWayMap<>(AnnotationIdentifier::new);

    @Override
    public NavigableMap<AnnotationID, AnnotationData> getAllAnnotations() {
        return this.data.getIndexToValueMap();
    }

    @Override
    public boolean contains(AnnotationData annotation) {
        return this.data.contains(annotation);
    }

    @Override
    public synchronized AnnotationID addAnnotation(AnnotationData annotation) {
        var index = this.data.add(annotation);
        annotation.setIndex(index);
        return index;
    }

    @Override
    public void clear() {
        this.data.clear();
    }


    @Override
    public JsonElement toJSON() {
        return JSONSerializable.of(this.data.getValues());
    }

    public static class AnnotationIdentifier extends IdentifierBase implements AnnotationID {
        public AnnotationIdentifier(int arrayIndex) {
            super(arrayIndex);
        }

        @Override
        public AnnotationIdentifier getSelfWithReference() {
            super.getSelfWithReference();
            return this;
        }
    }

}
