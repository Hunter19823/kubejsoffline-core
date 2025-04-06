package pie.ilikepiefoo.kubejsoffline.testclasses;

public abstract class FirstClass<GenericType extends FirstClass<GenericType>> {

    public abstract FirstClass<GenericType> getSelf();

    public abstract void setSelf(FirstClass<GenericType> self);

    public abstract GenericType getGenericType();

    public abstract void setGenericType(GenericType genericType);
}
