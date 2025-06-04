package pie.ilikepiefoo.kubejsoffline.core.api.identifier;

public interface ArrayBasedIndex extends Index {
    int getArrayDepth();

    @Override
    ArrayBasedIndex getSelfWithReference();
}
