package pie.ilikepiefoo.kubejsoffline.core;

import pie.ilikepiefoo.kubejsoffline.core.api.DocumentationBridge;
import pie.ilikepiefoo.kubejsoffline.core.api.DocumentationProvider;
import pie.ilikepiefoo.kubejsoffline.core.api.ReflectionHelper;
import pie.ilikepiefoo.kubejsoffline.core.api.TypeNameMapper;
import pie.ilikepiefoo.kubejsoffline.core.impl.DefaultReflectionHelper;
import pie.ilikepiefoo.kubejsoffline.core.impl.ResourceDocumentationBridge;
import pie.ilikepiefoo.kubejsoffline.core.impl.SimpleDocumentationProvider;

import java.io.File;

public class DocumentationGenerator {

    public static File generateHtmlPage(File outputFile) {
        return generateHtmlPage(new DefaultReflectionHelper(), new ResourceDocumentationBridge(), null, outputFile);
    }
    public static File generateHtmlPage(ReflectionHelper reflectionHelper, DocumentationBridge bridge, TypeNameMapper mapper, File outputFile) {
        DocumentationProvider documentationProvider = new SimpleDocumentationProvider(reflectionHelper, bridge, mapper);
        return documentationProvider.generateDocumentation(outputFile);
    }
}
