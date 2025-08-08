package pie.ilikepiefoo.kubejsoffline.testclasses;

import java.util.Comparator;

public class AnonymousClassExample {

    public class InnerGenericClass<VAR_ARG> implements Comparator<VAR_ARG> {
        @Override
        public int compare(VAR_ARG o1, VAR_ARG o2) {
            return 0;
        }
    }
    public Comparator<String> listOfStrings = new Comparator<String>() {
        @Override
        public int compare(String o1, String o2) {
            return 0;
        }
    };

    public Comparator<String> listOfStringsWithLambda = (o1, o2) -> 0;
    public Comparator<String> listOfStringsWithMethodReference = String::compareTo;

    public InnerGenericClass<String> innerGenericClass = new InnerGenericClass<>();
    public InnerGenericClass<String> anonymousClassExtension = new InnerGenericClass<String>() {
        @Override
        public int compare(String o1, String o2) {
            return 0;
        }
    };
}
