package pie.ilikepiefoo.kubejsoffline.core.api.collection;

import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.AnnotationData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.AnnotationID;

import java.util.NavigableMap;

public interface Annotations extends JSONSerializable, Iterable<AnnotationData>, Lockable {
    NavigableMap<AnnotationID, AnnotationData> getAllAnnotations();

    boolean contains(AnnotationData annotation);

    AnnotationID addAnnotation(AnnotationData annotation);

    void clear();
}
