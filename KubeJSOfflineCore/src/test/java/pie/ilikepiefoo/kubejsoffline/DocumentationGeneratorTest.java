package pie.ilikepiefoo.kubejsoffline;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.junit.jupiter.api.Test;
import pie.ilikepiefoo.kubejsoffline.api.DocumentationBridge;
import pie.ilikepiefoo.kubejsoffline.api.ReflectionHelper;
import pie.ilikepiefoo.kubejsoffline.html.tag.Tag;
import pie.ilikepiefoo.kubejsoffline.impl.DefaultReflectionHelper;
import pie.ilikepiefoo.kubejsoffline.impl.ResourceDocumentationBridge;

import java.io.File;

import static org.junit.jupiter.api.Assertions.assertNotNull;

public class DocumentationGeneratorTest {
    private static final Logger LOG = LogManager.getLogger();

    @Test
    public void generateHtmlPage() {
        File file = new File("output.html");
        ReflectionHelper reflectionHelper = new DefaultReflectionHelper(Tag.class);
        DocumentationBridge documentationBridge = new ResourceDocumentationBridge();
        File output = DocumentationGenerator.generateHtmlPage(reflectionHelper, documentationBridge, null, file);
        assertNotNull(output);
    }
}