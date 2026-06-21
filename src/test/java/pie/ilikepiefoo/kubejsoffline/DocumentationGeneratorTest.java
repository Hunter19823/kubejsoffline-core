package pie.ilikepiefoo.kubejsoffline;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.junit.jupiter.api.Test;

import java.awt.Desktop;
import java.io.File;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class DocumentationGeneratorTest {
    private static final Logger LOG = LogManager.getLogger();

    @Test
    public void generateHtmlPage() {
        File output = DocumentationTestFixtures.generateSampleDocumentation(DocumentationTestFixtures.DEFAULT_OUTPUT);

        assertNotNull(output);
        assertTrue(output.isFile(), () -> "Expected documentation at " + output.getAbsolutePath());
        assertTrue(output.length() > 0, "Documentation file should not be empty");

        if (Boolean.getBoolean("kubejsoffline.openDocumentation")) {
            LOG.info("Opening file in browser: {}", output.getAbsolutePath());
            try {
                Desktop.getDesktop().browse(output.toURI());
            } catch (Exception e) {
                LOG.error("Error opening file in browser", e);
            }
        }
    }
}
