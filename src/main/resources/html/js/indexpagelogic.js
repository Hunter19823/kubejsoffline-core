function loadClass(id) {
    console.log("Loading class " + id);
    let data = getClass(id);
    if (!data) {
        console.error("No class data found for id " + id);
        createHomePage();
        return;
    }
    wipePage();
    if (data.isWildcard()) {
        loadWildcard(data);
        return;
    }
    if (data.isTypeVariable()) {
        loadTypeVariable(data);
        return;
    }
    if (data.isParameterizedType()) {
        loadParameterizedType(data);
        return;
    }
    if (data.isRawClass()) {
        loadRawClass(data);
        return;
    }
    throw new Error("Unknown class type.");
}

function loadWildcard(wildcard) {
    let bigText = document.createElement('h1');
    document.body.append(bigText);
    bigText.append("Wildcard Type (");
    bigText.append(createFullSignature(wildcard.id()));
    bigText.append(")");
    let text = document.createElement('p');
    document.body.append(text);
    text.append("This is a wildcard type. It is used to represent an unknown type. It is used in generics to allow for flexibility in the type system. ");
    text.append("For example, a List<?> can be used to represent a List of any type. ");
    text.append("The wildcard type is represented by a question mark (?). ");
    text.append("There are two types of wildcard types: Upper Bounded Wildcards and Lower Bounded Wildcards. ");
    text.append("An upper bounded wildcard is represented by ? extends T where T is a type. ");
    text.append("A lower bounded wildcard is represented by ? super T where T is a type. ");
    text.append("A wildcard type can also have multiple bounds. ");
    text.append("For example, a wildcard type that is bounded by two types T and S is represented by ? extends T & S. ");
    text.append("Wildcard types are used to provide flexibility in the type system. ");
    text.append("They are used to represent unknown types in the context of generics. ");
    createRelationshipTable(wildcard);
}

function loadTypeVariable(typeVariable) {
    let bigText = document.createElement('h1');
    document.body.append(bigText);
    bigText.append("Type Variable (");
    bigText.append(createFullSignature(typeVariable.id()));
    bigText.append(")");
    let text = document.createElement('p');
    document.body.append(text);
    text.append("This is a type variable. It is used to represent a type that is not known at compile time. ");
    text.append("It is used in generics to allow for flexibility in the type system. ");
    text.append("A type variable is represented by a name enclosed in angle brackets (< and >). ");
    text.append("For example, a List<T> can be used to represent a List of any type. ");
    text.append("A type variable can also have bounds. ");
    text.append("For example, a type variable, for instance T, is bounded by a type, for instance S, is represented by 'T extends S'. ");
    text.append("A type variable can have multiple bounds. ");
    text.append("For example, a type variable that is bounded by two types T and S is represented by 'T extends S & T'. ");
    text.append("Type variables can also be cyclic, meaning that a type variable can be bounded by itself. This can be a headache for us to handle at times.");
    createRelationshipTable(typeVariable);
}

function loadParameterizedType(parameterizedType) {
    // Because a parameterized Type is just a raw type with type variables replaced, we can just load the raw type
    // with a fake parameterized type.
    let rawType = getClass(parameterizedType.getRawType());
    // let typeVariableMap = {};
    // let actualTypeArguments = parameterizedType.getTypeVariables();
    // let typeVariables = rawType.getTypeVariables();
    // for (let i = 0; i < typeVariables.length; i++) {
    //     typeVariableMap[typeVariables[i]] = actualTypeArguments[i];
    // }
    rawType.withTypeVariableMap(parameterizedType.getTypeVariableMap());
    loadRawClass(rawType);
}

function loadRawClass(data) {
    if (!exists(data)) {
        throw new Error("No class data found for data: " + data);
    }
    let classNameTag = document.createElement('h3');
    document.body.append(classNameTag);
    classNameTag.append(createFullSignature(data));

    try {
        createRelatedClassTable(data);
    } catch (e) {
        console.error("Failed to create related class table.", e);
    }

    try {
        createConstructorTable(data);
    } catch (e) {
        console.error("Failed to create constructor table.", e);
    }
    try {
        createFieldTable(data);
    } catch (e) {
        console.error("Failed to create field table.", e);
    }
    try {
        createMethodTable(data);
    } catch (e) {
        console.error("Failed to create method table.", e);
    }
    try {
        createRelationshipTable(data);
    } catch (e) {
        console.error("Failed to create relationship table.", e);
    }
}

function focusElement(elementId) {
    if (!elementId) {
        elementId = "page-header";
    }
    let element = document.getElementById(elementId);
    if (element) {
        for (const e of document.getElementsByClassName("focused")) {
            e.classList.remove("focused");
        }
        element.classList.add("focused");
        if (element.tagName === "H1" || element.tagName === "H2" || element.tagName === "H3") {
            element.scrollIntoView();
        } else {
            const elementRect = element.getBoundingClientRect();
            const absoluteElementTop = elementRect.top + window.scrollY;
            const middle = absoluteElementTop - (window.innerHeight / 2);
            window.scrollTo(0, middle);
        }
    }
}

function scrollToText(text) {
    console.warn("Chrome Scroll to highlighted text is not implemented.");
}

function setToast(message) {
    let toast = document.getElementById("toast");
    if (toast) {
        document.body.removeChild(toast);
    }
    toast = document.createElement("div");
    toast.id = "toast";
    toast.classList.add("toast");
    toast.appendChild(header(message, 2));
    document.body.append(toast);
}

function clearToast() {
    let toast = document.getElementById("toast");
    if (toast) {
        document.body.removeChild(toast);
    }
}

function onHashChange() {
    // If we have a hash on the URL, determine the format:
    // # - Load the index page / home page.
    // #<int|qualifiedClassName|simpleClassName> - Load a specific class
    // Reroute the old way of searching to the new way of searching.

    // Old way of searching:
    // #<search-term>--<search-query> - Search for a term in the search query.
    // New way of searching:
    // #?<search-term>=<search-query> - Search using querystring behind the hash to prevent browser from refreshing.

    // All of these urls can also have :~:text=<url-encoded-text> appended to them to scroll to a specific part of the page.
    // This normally is done automatically by the browser but we do it manually due to the way we load pages.

    // If any of these urls have a query string, we need to parse it so we can use it later.
    // For example, if we have a url like #?focus=<id>, we need to parse the so we can jump to the element with that id on the
    // home page after it loads.


    // If we have a normal query string, just append it to the hash and reload.
    // This is to allow for the back button to work properly.
    let hash = null;
    let queryString = null;
    if (window.location.hash?.length > 0) {
        hash = window.location.hash.substring(1);
    }
    if (window.location.search?.length > 0) {
        queryString = window.location.search.substring(1);
    }
    if (!hash) {
        hash = "#";
    }
    if (hash.startsWith("#")) {
        hash = hash.substring(1);
    }
    if (!queryString) {
        queryString = "";
    }

    if (queryString) {
        console.log("Removing Query string from URL and reloading it as a hash for optimization purposes.");
        window.location.assign(window.location.pathname + "#" + hash + "?" + queryString);
        return;
    }
    if (hash.includes("%E2%80%94")) {
        console.log("Removing %E2%80%94 from URL and reloading it as a hash for optimization purposes.");
        window.location.assign(window.location.pathname + "#" + hash.replace("%E2%80%94", "--"));
        return;
    }


    // Let's quickly check if we have the old way of searching where we use -- instead of ?.
    // If we do, we need to convert it to the new way of searching.
    if (hash.includes("---")) {
        let split = hash.split("---");
        let page = split[0];
        let focus = split[1];
        console.log("Removing old focus format from URL and reloading it as a hash for optimization purposes.");
        window.location.assign(window.location.pathname + "#" + page + "?focus=" + focus);
        return;
    }

    if (hash.includes("--")) {
        let split = hash.split("--");
        let searchTerm = split[0];
        let searchQuery = split[1];
        console.log("Removing old search format from URL and reloading it as a hash for optimization purposes.");
        window.location.assign(window.location.pathname + "#?" + searchTerm + "=" + searchQuery);
        return;
    }

    let NEXT_URL = DecodeURL();

    // Check if the hash has changed.
    if (exists(CURRENT_URL) && exists(NEXT_URL) && CURRENT_URL.hash !== NEXT_URL.hash) {
        // Clear GLOBAL_DATA.
        for (const key in GLOBAL_DATA) {
            if (Object.hasOwnProperty.call(GLOBAL_DATA, key)) {
                delete GLOBAL_DATA[key];
            }
        }
        console.debug("Hash has changed. Clearing GLOBAL_DATA.");
    }

    // Now that we have our re-routing logic out of the way, we can rely on the page decoder to do the rest.
    CURRENT_URL = NEXT_URL;

    if (!CURRENT_URL) {
        console.error("Failed to decode URL.");
        return;
    }

    console.debug(`Decoded URL created in hash change. Raw Hash: '${window.location.hash}' Decoded Hash: '${CURRENT_URL.hash}' Hash Length: '${CURRENT_URL.hash.length}' Params: '${CURRENT_URL.params.toString()}' Href: '${CURRENT_URL.href()}' Is Homepage: '${CURRENT_URL.isHome()}' Is Class: '${CURRENT_URL.isClass()}' Is Search: '${CURRENT_URL.isSearch()}' Has Focus: '${CURRENT_URL.hasFocus()}' Focus: '${CURRENT_URL.getFocusOrDefaultHeader()}' Parameter Size: '${CURRENT_URL.getParamSize()}' Safe Parameter Size: '${CURRENT_URL.getParamSizeSafe()}'`);

    if (!DATA._optimized) {
        throw new Error("Data is not optimized. Please optimize the data before using the page.");
    }

    let hasState = false;

    // Is this the home page?
    if (CURRENT_URL.isHome() && !hasState) {
        console.debug("Loading Homepage.");

        // Load the home page.
        createHomePage();

        hasState = true;

    }

    // Is this a class page?
    if (CURRENT_URL.isClass() && !hasState) {
        if (hasState) {
            console.error("Error state in URL detected.Cannot be a class and a homepage at the same time.");
            return;
        }
        console.debug("Loading Class from URL.");

        // Load the class.
        loadClass(CURRENT_URL.hash);

        hasState = true;
    }

    // Is this a search page?
    if (CURRENT_URL.isSearch() && !hasState) {
        if (hasState) {
            console.error("Error state in URL detected. Cannot be a search and a class/homepage at the same time.");
            return;
        }
        console.debug("Loading search from URL.");

        // Load the search.
        searchFromParameters(CURRENT_URL.clone().params);

        hasState = true;
    }

    if (!hasState) {
        console.error("Error state in URL detected. Unable to determine what page to load.");
        return;
    }
    if (hasState) {
        // Add sort tables.
        // addSortTables();

        // Focus the element.
        focusElement(CURRENT_URL.getFocusOrDefaultHeader());

        // Add Sticky Headers.
        handleStickyElements();
    }

    // Now that we've loaded the page, we can scroll to the highlighted text.
    if (CURRENT_URL.chromeHighlightText) {
        // Decode the text.
        let text = decodeURIComponent(CURRENT_URL.chromeHighlightText);
        // Scroll to the text.
        scrollToText(text);
    }
}

/**
 * Creates a URLData object from the current URL.
 * @returns {URLData} URLData
 * @constructor URLData
 */
function DecodeURL() {
    const URL_PARAMETER_REGEX = /^(?<TypeDefinition>((\?|[a-zA-Z_0-9]+)( extends | super ))?(?<ClassDefinition>(?<package>([a-zA-Z_$0-9.])*\.)*(?<ClassName>([a-zA-Z$0-9])+)(?<Generic><.*>)?))?(?<QueryStringArgs>\?.*)/;

    /**
     * @type URLData
     */
    let output;
    output = {};
    let hash = location.hash;
    if (hash?.length > 0) {
        hash = hash.substring(1);
    }

    hash = decodeURI(hash);

    if (hash.includes(":~:")) {
        let split = hash.split(":~:");
        hash = split[0];
        output.chromeHighlightText = split[1];
    }
    output.params = new URLSearchParams("");
    // Regex hash to see if it has a query string.
    if (URL_PARAMETER_REGEX.test(hash)) {
        const regexArgs = URL_PARAMETER_REGEX.exec(hash);
        if (regexArgs.groups.TypeDefinition) {
            // console.debug("Found the following class definition in the hash: ", regexArgs.groups.TypeDefinition);
            output.hash = regexArgs.groups.TypeDefinition;
        } else {
            output.hash = "";
        }
        if (regexArgs.groups.QueryStringArgs) {
            // console.debug("Found the following query string in the hash: ", regexArgs.groups.QueryStringArgs);
            output.params = new URLSearchParams(regexArgs.groups.QueryStringArgs);
        }
    } else {
        output.hash = hash;
        // console.debug("Query did not match the URL Parameter Regex. Using the hash as the class definition.");
    }

    output.hasFocus = function () {
        return this.params.has("focus");
    }

    output.getFocus = function () {
        return this.params.get("focus");
    }

    output.getFocusOrDefaultHeader = function () {
        if (this.hasFocus()) {
            return this.getFocus();
        }
        return "page-header";
    }

    output.getParamSize = function () {
        return this.params.size;
    }

    output.getParamSizeSafe = function () {
        return [...this.params.keys()].length;
    }

    output.isSearch = function () {
        // If thee is no focus, then it's a search as the only parameter must be the search term.
        if (this.hash?.length !== 0)
            return false;
        if (this.getParamSizeSafe() === 0)
            return false;
        // Check if the parameters contain any search terms.
        // Check if params is shorter than NEW_QUERY_TERMS.
        if (this.getParamSizeSafe() < Object.keys(NEW_QUERY_TERMS).length) {
            // Check if the parameters contain any of the search terms.
            for (let key of this.params.keys()) {
                if (Object.keys(NEW_QUERY_TERMS).includes(key)) {
                    return true;
                }
            }
        } else {
            // Check if new query terms contain any of the parameters.
            for (let key of Object.keys(NEW_QUERY_TERMS)) {
                if (this.params.has(key)) {
                    return true;
                }
            }
        }
        return false;
    }

    output.isClass = function () {
        if (this.isSearch()) {
            return false;
        }
        return this.hash?.length > 0;
    }

    output.isHome = function () {
        if (this.isSearch()) {
            return false;
        }
        return this.hash?.length === 0;
    }

    output.href = function () {
        return `${window.location.origin}${window.location.pathname}#${this.hash}?${this.params.toString()}`;
    }

    output.hrefHash = function () {
        return `#${this.hash}?${this.params.toString()}`;
    }

    output.clone = function () {
        /**
         * @type URLData
         */
        let out;
        out = Object.assign({}, this);
        out.params = new URLSearchParams(this.params.toString());
        return out;
    }

    return output;
}

function createOptimizationWorkerThread() {
    const parts = [];

    parts.push(document.getElementById('data').innerText);
    parts.push(document.getElementById('bindings').innerText);
    parts.push(document.getElementById('property').innerText);
    parts.push(document.getElementById('constants').innerText);
    parts.push(document.getElementById('events').innerText);
    parts.push(document.getElementById('class-documentation-tools').innerText);
    parts.push(document.getElementById('compression-tools').innerText);
    parts.push(document.getElementById('relationship-graphs').innerText);
    [...document.getElementsByClassName('data-holding-script')].map((script => script.innerText)).forEach((script) => parts.push(script));
    parts.push(document.getElementById('worker-script').innerText);

    return new Worker(URL.createObjectURL(new Blob(parts, {type: 'application/javascript'})));
}

function onWindowLoad() {
    try {
        console.log("Window Loaded. Now optimizing data.");
        setToast("Please wait while data is being indexed. This should only take a few seconds.");
        const WORKER = createOptimizationWorkerThread();
        WORKER.onmessage = (e) => {
            console.log("Worker thread has sent data back.");
            const OPTIMIZED_DATA = e.data.data;
            Object.entries(OPTIMIZED_DATA).forEach(([key, value]) => {
                DATA[key] = value;
            });
            const NEW_CACHE = e.data.cache;
            Object.entries(NEW_CACHE).forEach(([key, value]) => {
                LOOK_UP_CACHE.set(key, value);
            });
            const NEW_RELATIONSHIP_GRAPH = e.data.RELATIONSHIP_GRAPH;
            loadJSONToRelationshipGraph(NEW_RELATIONSHIP_GRAPH);
            WORKER.terminate();
            clearToast();
            onHashChange();

            addEventListener('popstate', (event) => {
                console.debug("Popstate changed");
                onHashChange();
            });
            window.addEventListener('scroll', (e) => {
                if (GLOBAL_DATA['handleScroll']) {
                    GLOBAL_DATA['handleScroll']();
                }
            });
            window.addEventListener('resize', (e) => {
                if (GLOBAL_DATA['handleResize']) {
                    GLOBAL_DATA['handleResize']();
                }
            });

            console.debug("Hash Change Complete.");
        }
        WORKER.onerror = (e) => {
            console.error("Error occurred optimizing data: ", e);
            MESSAGES.push(
                {
                    level: 'error',
                    args: ["Error occurred optimizing data: ", e.message, e.stack, e.error, e.composedPath()]
                }
            );
            setToast("An error occurred while optimizing data. Please refresh the page to try again. Please report this issue if it persists.");
            flushLogs();
        }
        console.log("Now sending the optimize task...");
        WORKER.postMessage({task: TASKS.OPTIMIZE})
        console.log("Optimize task sent.");
    } catch (e) {
        console.error("Error occurred while loading the page: ", e);
        setToast("An error occurred while loading the page. Please refresh the page to try again. Please report this issue if it persists.");
        flushLogs();
    }
}


window.onload = () => {
    onWindowLoad();
}

document.onload = () => {
    console.debug("Document Loaded.");
    createInPageLog();
}



