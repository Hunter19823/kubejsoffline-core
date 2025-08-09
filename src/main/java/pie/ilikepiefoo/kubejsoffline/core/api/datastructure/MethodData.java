package pie.ilikepiefoo.kubejsoffline.core.api.datastructure;

import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.AnnotatedData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.ExecutableData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.ModifierData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.NamedData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.IndexGenerator;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeOrTypeVariableID;

public interface MethodData extends AnnotatedData, ExecutableData, NamedData, ModifierData, IndexGenerator {
    TypeOrTypeVariableID getType();

    @Override
    default void index() {
        getAnnotations();
        getType();
        getName();
        getParameters();
        getExceptions();
        getTypeParameters();
    }
}
