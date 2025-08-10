package pie.ilikepiefoo.kubejsoffline.core.api;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import pie.ilikepiefoo.kubejsoffline.core.api.context.BindingsProvider;
import pie.ilikepiefoo.kubejsoffline.core.api.context.TypeWrapperProvider;
import pie.ilikepiefoo.kubejsoffline.core.html.page.IndexPage;
import pie.ilikepiefoo.kubejsoffline.core.impl.CollectionGroup;
import pie.ilikepiefoo.kubejsoffline.core.impl.TypeManager;
import pie.ilikepiefoo.kubejsoffline.core.util.SafeOperations;
import pie.ilikepiefoo.kubejsoffline.core.util.json.GlobalConstants;
import pie.ilikepiefoo.kubejsoffline.core.util.json.JSONProperty;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.Writer;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Optional;
import java.util.stream.StreamSupport;

public interface DocumentationProvider {

    Logger LOG = LogManager.getLogger();

    /**
     * Generates the HTML page for the documentation.
     *
     * @param outputFile The output file to write the documentation to.
     * @return The output file that was written to. Null if the file could not be written.
     */
    @Nullable
    default File generateDocumentation(File outputFile) {
        Gson GSON = getGson();
        ReflectionHelper reflectionHelper = getReflectionHelper();
        DocumentationBridge bridge = getDocumentationBridge();
        TypeNameMapper mapper = getTypeNameMapper();
        SafeOperations.setTypeMapper(mapper);
        CollectionGroup.INSTANCE.clear();

        // Set the global constants
        GlobalConstants.INSTANCE.setConstant("BINDINGS", getBindingsProvider()::toJSON);
        GlobalConstants.INSTANCE.setConstant("EVENTS", reflectionHelper::getEventClassesAsJson);
        GlobalConstants.INSTANCE.setConstant("TYPE_WRAPPER", getTypeWrapperProvider()::toJSON);
        GlobalConstants.INSTANCE.setConstant("DATA", CollectionGroup.INSTANCE::toJSON);
        GlobalConstants.INSTANCE.setConstant("PROPERTY", JSONProperty::createTranslation);
        // Log the bindings.
        int step = 0;
        final int totalSteps = 8;
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

        StreamSupport
                .stream(getBindingsProvider().getBindings().spliterator(), true)
                .forEach((binding) -> SafeOperations.tryGet(() -> TypeManager.INSTANCE.getID(binding.getType())));
        StreamSupport
                .stream(getTypeWrapperProvider().getTypeWrappers().spliterator(), true)
                .forEach((wrapper) -> {
                    SafeOperations.tryGet(() -> TypeManager.INSTANCE.getID(wrapper.getWrappedType()));
                    long supportedTypes = SafeOperations.tryGet(wrapper::getSupportedTypes)
                            .stream()
                            .parallel()
                            .flatMap((types) -> Arrays.stream(types.toArray(Type[]::new)))
                            .map((type) -> SafeOperations.tryGet(() -> TypeManager.INSTANCE.getID(type)))
                            .filter(Optional::isPresent)
                            .count();
                    if (supportedTypes == 0) {
                        LOG.info("Type wrapper {} has no supported types!", wrapper.getWrappedType());
                    }
                });

        Arrays.stream(reflectionHelper.getEventClasses()).parallel().forEach((clazz) -> SafeOperations.tryGet(() -> TypeManager.INSTANCE.getID(clazz)));

        Arrays.stream(classes).parallel().forEach((clazz) -> SafeOperations.tryGet(() -> TypeManager.INSTANCE.getID(clazz)));

        timeMillis = System.currentTimeMillis() - timeMillis;
        int totalClasses = CollectionGroup.INSTANCE.types().getAllTypes().size();
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Finished adding classes to indexer in %,dms. A total of %,d classes were found. Now searching classes for all nested connections...", ++step, totalSteps, timeMillis, CollectionGroup.INSTANCE.types().getAllTypes().size()));
        timeMillis = System.currentTimeMillis();

        CollectionGroup.INSTANCE.index();

        timeMillis = System.currentTimeMillis() - timeMillis;
        int newClasses = CollectionGroup.INSTANCE.types().getAllTypes().size();
        int difference = newClasses - totalClasses;
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Finished adding %s classes to indexer in %,dms. A total of %,d additional classes were found.", step, totalSteps, classes.length, timeMillis, difference));

        // Create index.html
        bridge.sendMessage(String.format("[KJS Offline] [Step %d/%d] Generating index.html and transforming all dependants... (this may take a while)", ++step, totalSteps));
        timeMillis = System.currentTimeMillis();
        File output;
        final IndexPage page = new IndexPage(GSON, bridge);
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
        GlobalConstants.INSTANCE.clear();
        SafeOperations.setTypeMapper(null);
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

    /**
     * The Gson instance to use for this provider.
     *
     * @return The Gson instance to use for this provider.
     * @see Gson
     * @see GsonBuilder
     */
    @Nonnull
    default Gson getGson() {
        return new GsonBuilder().create();
    }

    /**
     * Gets the reflection helper for this provider.
     *
     * @return The reflection helper for this provider.
     */
    @Nonnull
    ReflectionHelper getReflectionHelper();

    /**
     * Gets the documentation bridge for this provider.
     *
     * @return The documentation bridge for this provider.
     */
    @Nonnull
    DocumentationBridge getDocumentationBridge();

    /**
     * Gets the type name mapper for this provider.
     *
     * @return The type name mapper for this provider.
     */
    @Nullable
    default TypeNameMapper getTypeNameMapper() {
        return null;
    }

    /**
     * Gets the bindings provider for this provider.
     *
     * @return The bindings provider for this provider.
     */
    @Nonnull
    default BindingsProvider getBindingsProvider() {
        return BindingsProvider.of();
    }

    /**
     * Gets the type wrapper provider for this provider.
     *
     * @return The type wrapper provider for this provider.
     */
    @Nonnull
    default TypeWrapperProvider getTypeWrapperProvider() {
        return TypeWrapperProvider.of();
    }
}
