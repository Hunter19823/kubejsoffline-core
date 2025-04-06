package pie.ilikepiefoo.kubejsoffline.testclasses;

public abstract class SecondClass<SecondGenericType extends SecondClass<SecondGenericType>> extends FirstClass<SecondGenericType> {
    @Override
    public SecondClass<SecondGenericType> getSelf() {
        return null;
    }

    @Override
    public void setSelf(FirstClass<SecondGenericType> self) {
        // Do nothing
    }

    @Override
    public SecondGenericType getGenericType() {
        return null;
    }

    @Override
    public void setGenericType(SecondGenericType genericType) {
        // Do nothing
    }
}
