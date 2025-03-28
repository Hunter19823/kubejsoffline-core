package pie.ilikepiefoo.kubejsoffline.core.api.datastructure;

import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.IndexedData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.AnnotationID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeID;

public interface AnnotationData extends IndexedData<AnnotationID> {
    TypeID getAnnotationType();

    String getAnnotationValue();
}
