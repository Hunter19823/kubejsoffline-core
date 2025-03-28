package pie.ilikepiefoo.kubejsoffline.api;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/**
 * This class allows for each platform to have a different set of event classes
 * and a different set of starting classes for searching.
 */
public interface ReflectionHelper {
    Logger LOG = LogManager.getLogger();

    /**
     * Retrieve all classes currently loaded by the JVM.
     *
     * @return All classes currently loaded by the JVM.
     */
    Class[] getClasses();

    default JsonElement getEventClassesAsJson() {
        JsonObject array = new JsonObject();
        for (Class clazz : getEventClasses()) {
            array.add(clazz.getName(), new JsonArray());
        }
        return array;
    }

    /**
     * Retrieve all classes that should be displayed on the documentation page as events.
     *
     * @return All parents of classes that should be displayed on the documentation page as events.
     */
    Class[] getEventClasses();
}
