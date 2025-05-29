package pie.ilikepiefoo.kubejsoffline.testclasses;

public class EnclosingClassExample<EnclosingClassVariable> {
    public EnclosingClassVariable enclosingClassVariableDefinedInEnclosingClass;

    public class InnerClassExample<InnerClassVariable> {
        public EnclosingClassVariable enclosingClassVariableDefinedInInnerClass;
        public InnerClassVariable innerClassVariableDefinedInInnerClass;
    }

    public class InnerClassWithMultipleTypeVariablesExample<InnerClassVariable1, InnerClassVariable2> {
        public EnclosingClassVariable enclosingClassVariableDefinedInInnerClass;
        public InnerClassVariable1 innerClassVariable1DefinedInInnerClass;
        public InnerClassVariable2 innerClassVariable2DefinedInInnerClass;
    }

    public class InnerClassExtendingInnerClassExample<InnerClassVariable1, InnerClassVariable2> extends InnerClassExample<InnerClassVariable1> {
        public EnclosingClassVariable enclosingClassVariableDefinedInInnerClass;
        public InnerClassVariable1 innerClassVariable1DefinedInInnerClass;
        public InnerClassVariable2 innerClassVariable2DefinedInInnerClass;
    }
}
