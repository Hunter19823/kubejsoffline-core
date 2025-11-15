package pie.ilikepiefoo.kubejsoffline.core.api.datastructure;

import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.AnnotatedData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.ExecutableData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.IndexedData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.ModifierData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.ConstructorID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.IndexGenerator;

public interface ConstructorData extends ModifierData, AnnotatedData, ExecutableData, IndexGenerator, IndexedData<ConstructorID> {
    @Override
    default void index() {
        getAnnotations();
        getParameters();
        getTypeParameters();
        getExceptions();
    }
}
