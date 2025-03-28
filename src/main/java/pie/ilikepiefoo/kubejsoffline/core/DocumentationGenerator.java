package pie.ilikepiefoo.kubejsoffline.core;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import pie.ilikepiefoo.kubejsoffline.core.api.DocumentationBridge;
import pie.ilikepiefoo.kubejsoffline.core.api.ReflectionHelper;
import pie.ilikepiefoo.kubejsoffline.core.api.TypeNameMapper;
import pie.ilikepiefoo.kubejsoffline.core.html.page.IndexPage;
import pie.ilikepiefoo.kubejsoffline.core.impl.CollectionGroup;
import pie.ilikepiefoo.kubejsoffline.core.impl.TypeManager;
import pie.ilikepiefoo.kubejsoffline.core.util.SafeOperations;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public class DocumentationGenerator {
    private static final Logger LOG = LogManager.getLogger();
    private static final Gson GSON = new GsonBuilder().create();

    public static File generateHtmlPage(ReflectionHelper reflectionHelper, DocumentationBridge bridge, File outputFile) {
        return generateHtmlPage(reflectionHelper, bridge, null, outputFile);
    }

    public static File generateHtmlPage(ReflectionHelper reflectionHelper, DocumentationBridge bridge, TypeNameMapper mapper, File outputFile) {
        SafeOperations.setTypeMapper(mapper);
        CollectionGroup.INSTANCE.clear();
        // Log the bindings.
        int step = 0;
        final int totalSteps = 7;
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Initializing Reflections Library...", ++step, totalSteps));
        final long start = System.currentTimeMillis();
        long timeMillis = System.currentTimeMillis();

        // Initialize the Reflections Library
        var classes = reflectionHelper.getClasses();

        timeMillis = System.currentTimeMillis() - timeMillis;
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Reflections Library setup in %,dms", ++step, totalSteps, timeMillis));

        // Start the ClassFinder
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Now adding classes to indexer...", ++step, totalSteps));
        timeMillis = System.currentTimeMillis();

        Arrays.stream(classes).parallel().forEach((clazz) -> SafeOperations.tryGet(() -> TypeManager.INSTANCE.getID(clazz)));

        timeMillis = System.currentTimeMillis() - timeMillis;
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Finished adding %s classes to indexer in %,dms", step, totalSteps, classes.length, timeMillis));

        // Create index.html
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Generating index.html and transforming all dependants... (this may take a while)", ++step, totalSteps));
        timeMillis = System.currentTimeMillis();
        File output;
        final IndexPage page = new IndexPage(GSON, bridge, reflectionHelper);
        try (final Writer writer = new FileWriter(outputFile, StandardCharsets.UTF_8)) {
            page.writeHTML(writer);
            writer.flush();
            output = outputFile;
        } catch (final IOException e) {
            LOG.error("Failed to write file: index.html to {}", outputFile.toString(), e);
            output = null;
        }
        timeMillis = System.currentTimeMillis() - timeMillis;
        if (null != output) {
            bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] index.html generated in %,dms", step, totalSteps, timeMillis));
        } else {
            bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] index.html failed to generate after %,dms!", step, totalSteps, timeMillis));
        }

        final int totalTypesSize = CollectionGroup.INSTANCE.types().getAllTypes().size();
        final int totalRawClassSize = CollectionGroup.INSTANCE.types().getAllRawTypes().size();
        final int totalWildcardSize = CollectionGroup.INSTANCE.types().getAllWildcardTypes().size();
        final int totalParameterizedTypeSize = CollectionGroup.INSTANCE.types().getAllParameterizedTypes().size();
        final int totalTypeVariableSize = CollectionGroup.INSTANCE.types().getAllTypeVariables().size();
        final int totalParameterSize = CollectionGroup.INSTANCE.parameters().getAllParameters().size();
        final int totalNameSize = CollectionGroup.INSTANCE.names().getAllNames().size();
        final int totalAnnotationSize = CollectionGroup.INSTANCE.annotations().getAllAnnotations().size();
        final int totalPackageSize = CollectionGroup.INSTANCE.packages().getAllPackages().size();


        // Clear and de-reference any data that is no longer needed.
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Clearing and de-referencing data...", ++step, totalSteps));
        timeMillis = System.currentTimeMillis();
        CollectionGroup.INSTANCE.clear();
        timeMillis = System.currentTimeMillis() - timeMillis;
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Data cleared and de-referenced in %,dms", step, totalSteps, timeMillis));
        final long end = System.currentTimeMillis();
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Documentation Thread finished in %,dms", ++step, totalSteps, end - start));
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Data Collection Summary: %d", step, totalSteps, totalTypesSize));
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Total Types: %d", step, totalSteps, totalTypesSize));
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Total Raw Types: %d", step, totalSteps, totalRawClassSize));
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Total Wildcard Types: %d", step, totalSteps, totalWildcardSize));
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Total Parameterized Types: %d", step, totalSteps, totalParameterizedTypeSize));
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Total Type Variables: %d", step, totalSteps, totalTypeVariableSize));
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Total Parameters: %d", step, totalSteps, totalParameterSize));
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Total Names: %d", step, totalSteps, totalNameSize));
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Total Packages: %d", step, totalSteps, totalPackageSize));
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Total Annotations: %d", step, totalSteps, totalAnnotationSize));
        if (null != output) {
            bridge.sendMessageWithLink(String.format("[KJS Offline] [Step %d/%d] The Documentation page can be found at kubejs/documentation/index.html or by clicking ", step, totalSteps), "here", "kubejs/documentation/index.html");
            bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Total File Size: ~%,.3fMb", ++step, totalSteps, (double) output.length() / 1024.0 / 1024.0));
        } else {
            bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Documentation page failed to generate!", step, totalSteps - 1));
        }
        return output;
    }
}
