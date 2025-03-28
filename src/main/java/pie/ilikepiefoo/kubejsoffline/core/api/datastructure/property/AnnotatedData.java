package pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property;

import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.AnnotationID;

import java.util.List;

public interface AnnotatedData extends JSONSerializable {
    List<AnnotationID> getAnnotations();
}
