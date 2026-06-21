package pie.ilikepiefoo.kubejsoffline;

import pie.ilikepiefoo.kubejsoffline.core.api.DocumentationProvider;
import pie.ilikepiefoo.kubejsoffline.core.api.context.Binding;
import pie.ilikepiefoo.kubejsoffline.core.api.context.BindingsProvider;
import pie.ilikepiefoo.kubejsoffline.core.impl.DefaultReflectionHelper;
import pie.ilikepiefoo.kubejsoffline.core.impl.SimpleDocumentationProvider;
import pie.ilikepiefoo.kubejsoffline.core.impl.TypeManager;
import pie.ilikepiefoo.kubejsoffline.core.impl.context.SimpleBinding;
import pie.ilikepiefoo.kubejsoffline.testclasses.AClass;
import pie.ilikepiefoo.kubejsoffline.testclasses.AnonymousClassExample;
import pie.ilikepiefoo.kubejsoffline.testclasses.BaseGenericType;
import pie.ilikepiefoo.kubejsoffline.testclasses.BlockEventExample;
import pie.ilikepiefoo.kubejsoffline.testclasses.ClientEventExample;
import pie.ilikepiefoo.kubejsoffline.testclasses.EventExample;
import pie.ilikepiefoo.kubejsoffline.testclasses.LifecycleEventExample;
import pie.ilikepiefoo.kubejsoffline.testclasses.RootClass;
import pie.ilikepiefoo.kubejsoffline.testclasses.TestData;
import pie.ilikepiefoo.kubejsoffline.testclasses.ThirdClass;
import pie.ilikepiefoo.kubejsoffline.testclasses.ZClass;

import java.awt.MultipleGradientPaint;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Shared documentation HTML used by {@link DocumentationGeneratorTest} and browser E2E tests.
 */
public final class DocumentationTestFixtures {

    public static final File DEFAULT_OUTPUT = new File("build/output.html");

    private DocumentationTestFixtures() {
    }

    public static File generateSampleDocumentation(File outputFile) {
        SimpleDocumentationProvider.Builder builder = new SimpleDocumentationProvider.Builder();
        builder.setReflectionHelper(
                new DefaultReflectionHelper(
                        TestData.class,
                        ThirdClass.class,
                        RootClass.class,
                        BaseGenericType.class,
                        AnonymousClassExample.class,
                        BlockEventExample.class,
                        ClientEventExample.class,
                        EventExample.class,
                        LifecycleEventExample.class
                )
        );

        List<Binding> bindings = new ArrayList<>();
        bindings.add(SimpleBinding.Builder.from("GlobalMap", Map.of("key1", "value1", "key2", "value2")).build());
        bindings.add(SimpleBinding.Builder.from("GlobalClass", TypeManager.class).build());
        bindings.add(SimpleBinding.Builder.from("GlobalEnumClass", MultipleGradientPaint.ColorSpaceType.class).build());
        bindings.add(SimpleBinding.Builder.from("GlobalEnumValue", MultipleGradientPaint.ColorSpaceType.LINEAR_RGB).build());
        bindings.add(SimpleBinding.Builder.from("GlobalBoolean", true).build());
        bindings.add(SimpleBinding.Builder.from("GlobalByte", (byte) 100).build());
        bindings.add(SimpleBinding.Builder.from("GlobalShort", (short) 100).build());
        bindings.add(SimpleBinding.Builder.from("GlobalInt", 100).build());
        bindings.add(SimpleBinding.Builder.from("GlobalTestData", TestData.class).build());
        bindings.add(SimpleBinding.Builder.from("GlobalLong", 100L).build());
        bindings.add(SimpleBinding.Builder.from("GlobalFloat", 1.5f).build());
        bindings.add(SimpleBinding.Builder.from("GlobalDouble", 1.5).build());
        bindings.add(SimpleBinding.Builder.from("GlobalString", "Hello World").build());
        bindings.add(SimpleBinding.Builder.from("GlobalListOfStrings", List.of("Hello World")).build());
        bindings.add(SimpleBinding.Builder.from("GlobalSetOfStrings", Set.of("Hello World")).build());
        bindings.add(SimpleBinding.Builder.from("GlobalArrayOfStrings", new String[]{"Hello World"}).build());
        bindings.add(SimpleBinding.Builder.from("Global2DArrayOfStrings", new String[][]{{"Hello World"}}).build());
        bindings.add(SimpleBinding.Builder.from("Global3DArrayOfStrings", new String[][][]{{{"Hello World"}}}).build());
        bindings.add(SimpleBinding.Builder.from("ClientEnumValue", MultipleGradientPaint.ColorSpaceType.LINEAR_RGB).addScope("client").build());
        bindings.add(SimpleBinding.Builder.from("ServerEnumValue", MultipleGradientPaint.ColorSpaceType.SRGB).addScope("server").build());
        var simpleBinding = new SimpleBinding("StartupData", String.class, Set.of("startup"), null);
        bindings.add(SimpleBinding.Builder.from(simpleBinding).setData(simpleBinding).build());
        bindings.add(SimpleBinding.Builder.from("Z-AClass", AClass.class).build());
        bindings.add(SimpleBinding.Builder.from("A-ZClass", ZClass.class).build());
        bindings.add(SimpleBinding.Builder.from("AClass", AClass.class).build());
        bindings.add(SimpleBinding.Builder.from("ZClass", ZClass.class).build());

        builder.setBindingsProvider(BindingsProvider.of(bindings));
        DocumentationProvider documentationProvider = builder.build();
        return documentationProvider.generateDocumentation(outputFile);
    }
}
