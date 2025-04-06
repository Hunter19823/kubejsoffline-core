package pie.ilikepiefoo.kubejsoffline.testclasses;

public class BaseGenericType<A extends Boolean> {
    public A booleanField;

    public class ParameterizedType<B extends Byte> extends BaseGenericType<A> {
        public B byteField;
//        public class NestedParameterizedType<C extends Short> extends ParameterizedType<B> {
//            public C shortField;
//            public class DeepNestedParameterizedType<D extends Integer> extends NestedParameterizedType<C> {
//                public D integerField;
//            }
//        }
    }
}
