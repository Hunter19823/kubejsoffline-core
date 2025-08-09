package pie.ilikepiefoo.kubejsoffline.core.api.datastructure;

import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.AnnotatedData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.ModifierData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.NamedData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.IndexGenerator;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeOrTypeVariableID;

public interface FieldData extends ModifierData, AnnotatedData, NamedData, IndexGenerator {
    TypeOrTypeVariableID getType();

    @Override
    default void index() {
        getAnnotations();
        getName();
        getType();
    }
}
