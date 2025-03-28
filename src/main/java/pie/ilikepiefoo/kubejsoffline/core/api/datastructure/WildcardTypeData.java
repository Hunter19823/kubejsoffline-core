package pie.ilikepiefoo.kubejsoffline.core.api.datastructure;

import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.TypeData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeOrTypeVariableID;

import java.util.List;

public interface WildcardTypeData extends TypeData {
    List<TypeOrTypeVariableID> getExtends();

    List<TypeOrTypeVariableID> getSuper();

    @Override
    default boolean isWildcardType() {
        return true;
    }

    @Override
    default WildcardTypeData asWildcardType() {
        return this;
    }
}
