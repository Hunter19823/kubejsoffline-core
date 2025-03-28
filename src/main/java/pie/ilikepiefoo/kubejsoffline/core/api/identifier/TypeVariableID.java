package pie.ilikepiefoo.kubejsoffline.core.api.identifier;

public interface TypeVariableID extends TypeOrTypeVariableID {

    @Override
    default boolean isTypeVariable() {
        return true;
    }

    @Override
    default TypeVariableID asTypeVariable() {
        return this;
    }
}