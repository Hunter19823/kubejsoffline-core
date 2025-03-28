package pie.ilikepiefoo.kubejsoffline.api;


import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;

public interface DocumentationBridge {

    default InputStream getResource(String location) throws IOException {
        return getResourceByName(location).or(() -> getResourceByName("./" + location))
                .orElseThrow(() -> new FileNotFoundException("Resource not found: %s".formatted(location)));
    }

    private Optional<InputStream> getResourceByName(String location) {
        return Optional.ofNullable(getClass().getClassLoader().getResourceAsStream(location));
    }

    void sendMessage(final String message);

    void sendMessageWithLink(final String message, final String linkText, final String link);

}
