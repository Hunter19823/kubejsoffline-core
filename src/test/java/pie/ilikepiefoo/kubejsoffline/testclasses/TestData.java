package pie.ilikepiefoo.kubejsoffline.testclasses;

public record TestData(
    EnclosingClassExample<String> enclosingClassExample,
    EnclosingClassExample<String>.InnerClassExample<Integer> innerClassExample,
    EnclosingClassExample<String>.InnerClassWithMultipleTypeVariablesExample<Double, Boolean> innerClassWithMultipleTypeVariablesExample,
    EnclosingClassExample<String>.InnerClassExtendingInnerClassExample<Float, Character> innerClassExtendingInnerClassExample
) {
}
