package pie.ilikepiefoo.kubejsoffline.testclasses;

public class RootClass {
    public String rootField;

    public static class FirstInnerClass extends RootClass {
        public String firstInnerField;

        public static class SecondInnerClass extends FirstInnerClass {
            public String secondInnerField;

            public static class ThirdInnerClass extends SecondInnerClass {
                public String thirdInnerField;
            }
        }
    }
}
