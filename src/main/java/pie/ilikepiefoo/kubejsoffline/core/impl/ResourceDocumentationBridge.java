package pie.ilikepiefoo.kubejsoffline.core.impl;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import pie.ilikepiefoo.kubejsoffline.core.api.DocumentationBridge;

public class ResourceDocumentationBridge implements DocumentationBridge {
    private static final Logger LOG = LogManager.getLogger();

    @Override
    public void sendMessage(String message) {
        LOG.info(message);
    }

    @Override
    public void sendMessageWithLink(String message, String linkText, String link) {
        LOG.info(message);
    }
}
