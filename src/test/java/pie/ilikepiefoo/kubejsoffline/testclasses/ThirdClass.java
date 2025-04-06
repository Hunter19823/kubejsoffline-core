package pie.ilikepiefoo.kubejsoffline.testclasses;

public class ThirdClass extends SecondClass<ThirdClass> {
    @Override
    public ThirdClass getSelf() {
        return null;
    }

    @Override
    public void setSelf(FirstClass<ThirdClass> self) {
        // Do nothing
    }

    @Override
    public ThirdClass getGenericType() {
        return null;
    }

    @Override
    public void setGenericType(ThirdClass genericType) {
        // Do nothing
    }
}
