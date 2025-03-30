package pie.ilikepiefoo.kubejsoffline.core.html.page;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import pie.ilikepiefoo.kubejsoffline.core.api.DocumentationBridge;
import pie.ilikepiefoo.kubejsoffline.core.html.tag.CustomAssetTag;
import pie.ilikepiefoo.kubejsoffline.core.html.tag.collection.JSONDataTag;
import pie.ilikepiefoo.kubejsoffline.core.util.json.GlobalConstants;

import java.util.Map;
import java.util.function.Supplier;

public class IndexPage extends HTMLFile {

    public IndexPage(final Gson gson, final DocumentationBridge documentationBridge) {
        this.HEADER_TAG.add(new CustomAssetTag("title", "html/title.txt", documentationBridge));
        this.HEADER_TAG.add(new CustomAssetTag("style", "html/css/styling.css", documentationBridge));
        for (Map.Entry<String, Supplier<JsonElement>> entry : GlobalConstants.INSTANCE.getConstants().entrySet()) {
            this.HEADER_TAG.add(new JSONDataTag(entry.getKey(), entry.getValue().get(), gson).id(entry.getKey().toLowerCase()));
        }
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/indexingworker.js", documentationBridge).id("worker-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/constants.js", documentationBridge).id("constants"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/class_data_documentation.js", documentationBridge).id("class-documentation-tools"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/relationship_graph.js", documentationBridge).id("relationship-graphs"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/stickytools.js", documentationBridge));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/pagination_tools.js", documentationBridge));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/compressiontools.js", documentationBridge).id("compression-tools"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/classdatatools.js", documentationBridge).id("class-data-tools"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/createhtmltools.js", documentationBridge));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/createsignaturetools.js", documentationBridge));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/createhomepagetools.js", documentationBridge));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/createtabletools.js", documentationBridge));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/sortingtools.js", documentationBridge));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/filters.js", documentationBridge));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/searchingtools.js", documentationBridge));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/searching_and_sorting_constants.js", documentationBridge));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/indexpagelogic.js", documentationBridge));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/contextmenu.js", documentationBridge));
    }
}
