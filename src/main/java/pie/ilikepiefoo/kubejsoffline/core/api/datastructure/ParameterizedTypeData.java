package pie.ilikepiefoo.kubejsoffline.core.api.datastructure;

import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.TypeData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.IndexGenerator;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeOrTypeVariableID;

import java.util.List;

public interface ParameterizedTypeData extends TypeData, IndexGenerator {
    @Override
    default boolean isParameterizedType() {
        return true;
    }

    @Override
    default ParameterizedTypeData asParameterizedType() {
        return this;
    }

    @Override
    default void index() {
        getRawType();
        getActualTypeArguments();
        getOwnerType();
    }

    TypeID getRawType();

    List<TypeOrTypeVariableID> getActualTypeArguments();

    TypeID getOwnerType();

}
