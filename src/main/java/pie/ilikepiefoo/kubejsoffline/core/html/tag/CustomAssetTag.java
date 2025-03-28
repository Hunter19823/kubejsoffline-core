package pie.ilikepiefoo.kubejsoffline.core.html.tag;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import pie.ilikepiefoo.kubejsoffline.core.api.DocumentationBridge;

import java.io.InputStream;
import java.io.Writer;

public class CustomAssetTag extends CustomTag {
    public static final Logger LOG = LogManager.getLogger();
    private final String file;
    private final DocumentationBridge documentationBridge;

    public CustomAssetTag(String tagName, String contentLocation, DocumentationBridge documentationBridge) {
        super(tagName, true);
        file = contentLocation;
        this.documentationBridge = documentationBridge;
    }

    @Override
    public void writeContent(Writer writer) {
        try (InputStream stream = documentationBridge.getResource(file)) {
            // Read the file and write it to the writer.
            int c;
            while ((c = stream.read()) != -1) {
                writer.write(c);
            }
            writer.flush();
        } catch (Exception e) {
            LOG.error("Error writing {} tag from file: {}", this.name, file, e);
        }
    }
}
