package pie.ilikepiefoo.kubejsoffline.impl;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.reflections.Configuration;
import org.reflections.Reflections;
import org.reflections.scanners.Scanners;
import org.reflections.util.ConfigurationBuilder;
import pie.ilikepiefoo.kubejsoffline.api.ReflectionHelper;

import java.util.Arrays;

public class DefaultReflectionHelper implements ReflectionHelper {
    public static final Logger LOG = LogManager.getLogger();
    private final Class[] eventClasses;

    public DefaultReflectionHelper(Class<?>... eventClasses) {
        this.eventClasses = eventClasses;
    }

    @Override
    public Class[] getClasses() {
        LOG.info("Loading all packages...");
        Package[] packages = Package.getPackages();
        LOG.info("Retrieved {} packages...", packages.length);
        String[] packageNames = Arrays.stream(packages).parallel().map(Package::getName).toList().toArray(new String[0]);
        LOG.info("Finished mapping all package names...");
        Configuration configuration = new ConfigurationBuilder()
                .setParallel(true)
                .forPackages(packageNames)
                .setScanners(Scanners.SubTypes.filterResultsBy(pred -> true), Scanners.Resources);
        LOG.info("Finished building configuration...");
        Reflections reflections = new Reflections(configuration);
        LOG.info("Finished building reflections...");
        LOG.info("Now retrieving all SubTypes...");
        return reflections.getSubTypesOf(Object.class).toArray(new Class[0]);
    }

    @Override
    public Class[] getEventClasses() {
        return eventClasses;
    }
}
