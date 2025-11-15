package pie.ilikepiefoo.kubejsoffline.core.html.page;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import pie.ilikepiefoo.kubejsoffline.core.api.DocumentationBridge;
import pie.ilikepiefoo.kubejsoffline.core.html.tag.CustomAssetTag;
import pie.ilikepiefoo.kubejsoffline.core.html.tag.CustomTag;
import pie.ilikepiefoo.kubejsoffline.core.html.tag.collection.JSONDataTag;
import pie.ilikepiefoo.kubejsoffline.core.util.json.GlobalConstants;

import java.util.Map;
import java.util.function.Supplier;

public class IndexPage extends HTMLFile {

    public IndexPage(final Gson gson, final DocumentationBridge documentationBridge) {
        this.HEADER_TAG.add(new CustomAssetTag("title", "html/title.txt", documentationBridge));
        this.HEADER_TAG.add(new CustomTag("link").setAttributeString("rel", "icon").setAttributeString("type", "image/x-icon").href("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAABJ0AAASdAHeZh94AAADcklEQVR4nHSSb1DSBxjHebG9aLVrt12lebi17M61dss7S6qtqMypZG0oLE2ElMlgOMQE0eCnFiBtxR/TFBdCQL9KwAw4G5YLHYf0Z65cbV7eJZeVpXa3Vdf+3Oo7tt1x62rfu+eeF9/n83n1UCjPScbckjx6osCb/1bdDDdd+4uSYb+oyLZKYtWc593/JwteEr1n8p0mJnCoPAQd24PwF9P4se0x+lQT2EQVR5e/zE7/X/z9hDKPbGMnfHWjGDY9QEd5EMQWB4KaW/i++SH2bfOD9hp3KpP6WeIzcPqcouzNb9TAX3cNmgIXQrop9DfehCLnX2FIdxc24RCyk3Yi41VuxzMCOpVPcmiNCO6Pwlo+BCPPh+/MMzAVBlC1wQwdqxtaDolmcQ8+WCKYTn1l3eynBIzUiuHDrW4c2OnCYHMUOrENDoMXduIM2utdcKvD6G07j1DXFWxfvQuLXmC8/ZQg83V+xN85CMeeXgw6L+O09Rw6NT1wtQZwpLkbgdaLGLBcRX/7CKqKNI9fpKxYEodZopYFWbTqsDzfCu2nbkiLD+B40zAGWq+jixiGVnoSqh2dUG2zQM13Ipcmf5SZq0yNC0qUHk5JNdmyhWXC7tp+SCUnwC+1Qi38GsoPHdjBs2G3+BSqK33gMM0o4Jm9TKF+UVzAqT1eyJY56Sxex00eowUykQdSrhPtygsYqJ+AXf0D/HujUGnOgldq+7NE5jYyRV8mxwXM6hPMYpW3sUDhMaxJFkby6U1wKUdh0Y/CSVyCtmEIe0VnIPmk59pm8bH2DXyLZBatfl5coK+vTCNJMj8U7KZFIr1JG6kVRUSO2124WnuLniK+nZYg6BextK7o2Jj+/sx18lLkbPCgXl/2D2zRVO4LHVX/FiKJXy8HWn6/M9Z378mT8cDk5LmCv/uyjM/nT4+FjX/MXJi6MeLDlUE7fhpwIOI146i+po0StNbCKmfgK2kubPI8dGuLcd6jxv0bYfw8OaK4M/6tdzxsg7EiCwI6FZxVC1G27k2oCtPhbGCBYihdiYMCOg5JcnCkJg9du5iwy7bCb+Ciz9qAb0gNDhM5aPz4HRDsNMhzl6JyfTJEaxIgjG2KMm8ZmpjLYWAtg4n9LvZ/tBRGZgo0WxejYm0iqrJSYq88Hwr6PBCZCdizKTbrk6CMdTWr5uIvAAAA//8aRVSNAAAABklEQVQDAIPl8qr2Lqk5AAAAAElFTkSuQmCC"));
        this.HEADER_TAG.add(new CustomAssetTag("style", "html/css/styling.css", documentationBridge));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/console.js", documentationBridge).id("console-wrapper"));
        for (Map.Entry<String, Supplier<JsonElement>> entry : GlobalConstants.INSTANCE.getConstants().entrySet()) {
            this.HEADER_TAG.add(new JSONDataTag(entry.getKey(), entry.getValue().get(), gson).id(entry.getKey().toLowerCase())).setClass("constant");
        }
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/indexingworker.js", documentationBridge).id("worker-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/constants.js", documentationBridge).id("constants"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/class_data_documentation.js", documentationBridge).id("class-documentation-tools"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/relationship_graph.js", documentationBridge).id("relationship-graphs"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/stickytools.js", documentationBridge));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/pagination_tools.js", documentationBridge));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/compressiontools.js", documentationBridge).id("compression-tools"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/data/utils.js", documentationBridge).setClass("data-holding-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/data/compressed/annotation.js", documentationBridge).setClass("data-holding-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/data/compressed/package.js", documentationBridge).setClass("data-holding-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/data/compressed/parameter.js", documentationBridge).setClass("data-holding-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/data/compressed/method.js", documentationBridge).setClass("data-holding-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/data/compressed/text.js", documentationBridge).setClass("data-holding-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/data/compressed/type.js", documentationBridge).setClass("data-holding-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/data/annotation.js", documentationBridge).setClass("data-holding-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/data/binding.js", documentationBridge).setClass("data-holding-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/data/class.js", documentationBridge).setClass("data-holding-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/data/constructor.js", documentationBridge).setClass("data-holding-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/data/field.js", documentationBridge).setClass("data-holding-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/data/method.js", documentationBridge).setClass("data-holding-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/data/parameter.js", documentationBridge).setClass("data-holding-script"));
        this.HEADER_TAG.add(new CustomAssetTag("script", "html/js/data/relationship.js", documentationBridge).setClass("data-holding-script"));
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
