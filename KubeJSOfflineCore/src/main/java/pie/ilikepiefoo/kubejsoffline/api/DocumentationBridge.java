package pie.ilikepiefoo.kubejsoffline.api;


import java.io.IOException;
import java.io.InputStream;

public interface DocumentationBridge {

    default InputStream getResource(String location) throws IOException {
        return this.getClass().getClassLoader().getResourceAsStream(location);
    }

    void sendMessage(final String message);

    void sendMessageWithLink(final String message, final String linkText, final String link);

}
