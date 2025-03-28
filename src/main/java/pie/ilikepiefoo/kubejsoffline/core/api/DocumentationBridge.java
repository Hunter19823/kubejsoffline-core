package pie.ilikepiefoo.kubejsoffline.core.api;


import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;

public interface DocumentationBridge {

    default InputStream getResource(String location) throws IOException {
        var resource = getResourceByName(location);
        if (resource.isEmpty()) {
            resource = getResourceByName("./" + location);
        }
        return resource.orElseThrow(() -> new FileNotFoundException("Resource not found: " + location));
    }

    private Optional<InputStream> getResourceByName(String location) throws IOException {
        return Optional.ofNullable(DocumentationBridge.class.getModule().getResourceAsStream(location))
                .or(() -> Optional.ofNullable(getClass().getClassLoader().getResourceAsStream(location)));
    }

    void sendMessage(final String message);

    void sendMessageWithLink(final String message, final String linkText, final String link);

}
