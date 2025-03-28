package pie.ilikepiefoo.kubejsoffline.html.tag;

import pie.ilikepiefoo.kubejsoffline.html.tag.base.BaseTag;

public class CustomTag extends BaseTag<CustomTag> {
    private final StringBuilder builder = new StringBuilder();

    public CustomTag(String name) {
        super(name);
    }

    public CustomTag(String name, boolean closingTag) {
        super(name, closingTag);
    }

    @Override
    public CustomTag setClass(String name) {
        if (!builder.isEmpty()) {
            builder.append(" ");
        }
        builder.append(name);
        setAttributeString("class", builder.toString());
        return this;
    }
}
