package pie.ilikepiefoo.kubejsoffline.core.html.tag.base;

import pie.ilikepiefoo.kubejsoffline.core.html.tag.Tag;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@SuppressWarnings("unchecked")
public abstract class BaseTag<TYPE extends Tag<TYPE>> implements Tag<TYPE> {
    protected final String name;
    protected String content = "";
    protected boolean closingTag;
    protected List<Tag<?>> children = new ArrayList<>();
    protected Tag<?> parent = null;
    protected Map<String, String> attributes = new HashMap<>();

    public BaseTag(String name, boolean closingTag) {
        this.name = name;
        this.closingTag = closingTag;
    }

    public BaseTag(String name) {
        this.name = name;
        this.closingTag = true;
    }

    @Override
    public String getContent() {
        return this.content;
    }

    @Override
    public List<Tag<?>> getChildren() {
        return this.children;
    }

    @Override
    public boolean hasClosingTag() {
        return this.closingTag;
    }

    @Override
    public String getName() {
        return this.name;
    }

    @Override
    public Map<String, String> getAttributes() {
        return this.attributes;
    }


    @Override
    public Tag<?> getParent() {
        return this.parent;
    }

    @Override
    public void setParent(Tag<?> parent) {
        this.parent = parent;
    }

    @Override
    public <T extends Tag<T>> Tag<T> add(Tag<T> tag) {
        tag.setParent(this);

        this.children.add(tag);
        return tag;
    }

    public TYPE setContent(String content) {
        this.content = content;
        return (TYPE) this;
    }
}
