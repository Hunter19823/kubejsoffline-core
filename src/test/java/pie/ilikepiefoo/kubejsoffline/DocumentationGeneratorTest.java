package pie.ilikepiefoo.kubejsoffline;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.junit.jupiter.api.Test;
import pie.ilikepiefoo.kubejsoffline.core.api.DocumentationProvider;
import pie.ilikepiefoo.kubejsoffline.core.api.context.Binding;
import pie.ilikepiefoo.kubejsoffline.core.api.context.BindingsProvider;
import pie.ilikepiefoo.kubejsoffline.core.impl.DefaultReflectionHelper;
import pie.ilikepiefoo.kubejsoffline.core.impl.SimpleDocumentationProvider;
import pie.ilikepiefoo.kubejsoffline.core.impl.TypeManager;
import pie.ilikepiefoo.kubejsoffline.core.impl.context.SimpleBinding;

import java.awt.MultipleGradientPaint;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;

public class DocumentationGeneratorTest {
    private static final Logger LOG = LogManager.getLogger();

    @Test
    public void generateHtmlPage() {
        File file = new File("build/output.html");
        SimpleDocumentationProvider.Builder builder = new SimpleDocumentationProvider.Builder();
        builder.setReflectionHelper(new DefaultReflectionHelper());
        // Create some sample bindings.
        // This is just a placeholder for the actual bindings.
        List<Binding> bindings = new ArrayList<>();

        // Add some sample bindings to the list.
        bindings.add(SimpleBinding.Builder.from("GlobalMap", Map.of("key1", "value1", "key2", "value2")).build());
        bindings.add(SimpleBinding.Builder.from("GlobalClass", TypeManager.class).build());
        bindings.add(SimpleBinding.Builder.from("GlobalEnumClass", MultipleGradientPaint.ColorSpaceType.class).build());
        bindings.add(SimpleBinding.Builder.from("GlobalEnumValue", MultipleGradientPaint.ColorSpaceType.LINEAR_RGB).build());
        bindings.add(SimpleBinding.Builder.from("ClientEnumValue", MultipleGradientPaint.ColorSpaceType.LINEAR_RGB).addScope("client").build());
        bindings.add(SimpleBinding.Builder.from("ServerEnumValue", MultipleGradientPaint.ColorSpaceType.SRGB).addScope("server").build());

        // Set the bindings' provider.
        builder.setBindingsProvider(BindingsProvider.of(bindings));

        // Build the documentation provider.
        DocumentationProvider documentationProvider = builder.build();

        // Generate the HTML page.
        File output = documentationProvider.generateDocumentation(file);

        // Check if the output file is not null.
        assertNotNull(output);
    }
}