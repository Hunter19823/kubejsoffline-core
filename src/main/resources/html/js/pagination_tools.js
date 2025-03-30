/**
 * Creates a new paged table.
 * @template {any} T The data type of the table
 * @param title {string} The title of the table
 * @param table_id {string} The id of the table
 * @param data {Array<T>} The data to be displayed in the table
 * @param addRowAction {function(table: HTMLTableElement, data: T): void} The function to add a row to the table
 * @param headers {...string} The headers of the table
 * @returns {PageableSortableTable<T>|undefined} The created table
 */
function createPagedTable(title, table_id, data, addRowAction, ...headers) {
    if (data.length === 0) {
        return;
    }
    if (exists(GLOBAL_DATA[table_id])) {
        /**
         * @type{PageableSortableTable}
         */
        const table = GLOBAL_DATA[table_id];
        // TODO: Detect changes to URL.
        table.setURL(CURRENT_URL.clone());
        table.setRowAction(addRowAction);
        table.setHeaders(...headers);
        if (table.data.length !== data.length) {
            table.setData(data);
        }
        return table;
    }
    GLOBAL_DATA[table_id] = new PageableSortableTable(
        title,
        table_id,
        ...headers
    ).setRowAction(addRowAction).setData(data);
    return GLOBAL_DATA[table_id];
}

function hasAttribute(element, attribute) {
    if (!exists(element)) {
        return false;
    }
    if (!exists(element[attribute])) {
        return false;
    }
    if (typeof element[attribute] === 'function') {
        return exists(element[attribute]());
    } else {
        return exists(element[attribute]);
    }
}

function attributeComparator(attribute, comparator, mutator = (a) => a) {

    function mapAttribute(element, attribute) {
        if (typeof element[attribute] === 'function') {
            return mutator(element[attribute]());
        } else {
            return mutator(element[attribute]);
        }
    }

    return (a, b) => {
        if (!hasAttribute(a, attribute) && !hasAttribute(b, attribute)) {
            return 0;
        }
        if (!hasAttribute(a, attribute)) {
            return -1;
        }
        if (!hasAttribute(b, attribute)) {
            return 1;
        }
        return comparator(mapAttribute(a, attribute), mapAttribute(b, attribute));
    };
}

function sortByModifier(a, b) {
    // If a is public and b is not
    if (MODIFIER.isPublic(a) && !MODIFIER.isPublic(b)) {
        // a goes before b
        return -1;
    }
    // If b is public and a is not
    if (MODIFIER.isPublic(b) && !MODIFIER.isPublic(a)) {
        // b goes before a
        return 1;
    }

    // If a is protected and b is not
    if (MODIFIER.isProtected(a) && !MODIFIER.isProtected(b)) {
        // a goes before b
        return -1;
    }
    // If b is protected and a is not
    if (MODIFIER.isProtected(b) && !MODIFIER.isProtected(a)) {
        // b goes before a
        return 1;
    }

    // If a is private and b is not
    if (MODIFIER.isPrivate(a) && !MODIFIER.isPrivate(b)) {
        // a goes before b
        return -1;
    }
    // If b is private and a is not
    if (MODIFIER.isPrivate(b) && !MODIFIER.isPrivate(a)) {
        // b goes before a
        return 1;
    }

    // if a is static and b is not
    if (MODIFIER.isStatic(a) && !MODIFIER.isStatic(b)) {
        // a goes before b
        return -1;
    }
    // if b is static and a is not
    if (MODIFIER.isStatic(b) && !MODIFIER.isStatic(a)) {
        // b goes before a
        return 1;
    }
    // if a and b are both static
    return 0;
}

function sortByName(a, b) {
    return a.localeCompare(b);
}

function defaultSort(a, b) {
    let modSort = sortByModifier(a.getModifiers(), b.getModifiers());
    if (modSort !== 0) {
        return modSort;
    }
    return sortByName(a.getName(), b.getName());
}

function wrapComparator(comparator, wrapper) {
    return (a, b) => {
        return comparator(wrapper(a), wrapper(b));
    };
}

function getSizeOfElement(element) {
    const tempElement = document.createElement(element.tagName);
    tempElement.style.cssText = `
        position: absolute;
        visibility: hidden;
        width: auto !important;
        height: auto !important;
        max-width: none !important;
        max-height: none !important;
        padding: 0 !important;
        margin: 0 !important;
        border: 0 !important;
    `;
    tempElement.innerHTML = element.innerHTML;
    document.body.appendChild(tempElement);
    const rect = tempElement.getBoundingClientRect();
    const size = {
        width: rect.width,
        height: rect.height
    };
    document.body.removeChild(tempElement);
    return size;
}


function matchAllHeadersToSameWidth(table) {
    let max_width = 0;
    let children = [...table.table_header_pages_div.children].filter((item, index) => index !== 0);
    for (let item of children) {
        const size = getSizeOfElement(item);
        max_width = Math.max(max_width, size.width);
    }
    for (let item of children) {
        item.style.width = `calc(${max_width}px + 0.25em)`;
    }
}

/**
 * A pageable and sortable table.
 * @template {any} T The data type of the table
 * @template {any} R The mapped type of the table used for sorting
 * @class
 * @public
 */
PageableSortableTable = class {
    static SORTABLE_DEFAULT = ['default', defaultSort];
    static SORTABLE_BY_NAME = ['name', attributeComparator('getName', sortByName)];
    static SORTABLE_BY_PACKAGE = ['package', attributeComparator('getPackage', sortByName)];
    static SORTABLE_BY_MOD = ['mod', attributeComparator('getModifier', sortByModifier)];
    static SORTABLE_BY_TYPE = ['type', attributeComparator('getType', sortByName, (a) => getClass(a).name().toLowerCase())];
    static SORTABLE_BY_DECLARING_CLASS = ['declaring-class', attributeComparator('getDeclaringClass', sortByName, (a) => getClass(a).name().toLowerCase())];
    static SORTABLE_BY_PARAMETERS = ['parameters', attributeComparator('getParameters', sortByName, (a) => {
        return joiner(a, ", ",
            /** @param p{Parameter} */
            (p) => {
                return getClass(p.getType()).simpleName() + " " + p.name();
            })
    })];
    static SORTABLE_BY_TYPE_VARIABLES = ['type-variables', attributeComparator('getTypeVariables', sortByName, (a) => {
        return joiner(a, ", ",
            /** @param p{TypeIdentifier} */
            (p) => {
                return createShortLink(p).innerText;
            })
    })];
    static SORTABLE_BY_RELATIONSHIP = ['relationships', attributeComparator('_relations', sortByName, (a) => {
        return a.join(",");
    })]

    /**
     * Creates a pageable and sortable table.
     * @param {string} title
     * @param {string} table_id
     * @param {Node | string} headers
     */
    constructor(title, table_id, ...headers) {
        this.title = title;
        this.table_id = table_id;
        this.headers = headers;
        this.url = CURRENT_URL.clone();
        this.PARAMETER_PAGE_NUMBER = `${this.table_id}-page`;
        this.PARAMETER_PAGE_SIZE = `${this.table_id}-page-size`;
        this.PARAMETER_EXPANDED = `${this.table_id}-expanded`;
        this.PARAMETER_FOCUS = 'focus';
        this.TABLE_HEADER = `${this.table_id}-header`;
        this.PARAMETER_SORT_BY = `${this.table_id}-sort-by`;
        this.PARAMETER_SORT_DIRECTION = `${this.table_id}-sort-direction`;

        this.data = [];
        this.page = 0;
        this.page_size = 25;
        this.expand = false;
        this.sort_by = (this.url.params.has(this.PARAMETER_SORT_BY)) ? this.url.params.get(this.PARAMETER_SORT_BY) : 'default';
        this.sort = (a, b) => 0;
        this.sort_order = (this.url.params.has(this.PARAMETER_SORT_DIRECTION)) ?
            this._normalizeSortDirection(parseInt(this.url.params.get(this.PARAMETER_SORT_DIRECTION))) : 1;
        this.sort_options = {};
        this.sort_option_names = [];

        this.table_items = [];
        this.table_header_element = null;
        this.table_header_pages_div = null;
        this.table_element = null;
        this.table_header_row = null;
        this.table_body = null;
        this._sort_changed = true;
    }

    _normalizeSortDirection(direction) {
        if (direction < 0) {
            return -1;
        }
        if (direction > 0) {
            return 1;
        }
        return 1;
    }

    setHeaders(...headers) {
        this.headers = headers;
        return this;
    }

    setRowAction(rowAction) {
        this.rowAction = rowAction;
        return this;
    }

    setURL(url) {
        this.url = url;
        return this;
    }

    /**
     * Set the data for the table.
     * @param data {Array<T>} The data to be displayed in the table
     * @returns {PageableSortableTable<T>} The table object
     */
    setData(data) {
        this.data = data;
        return this;
    }

    /**
     * Set the page number for the table.
     * @param page {number} The page number to be displayed
     * @returns {PageableSortableTable<T>} The table object
     */
    setPage(page) {
        this.page = page;
        return this;
    }

    setPageSize(page_size) {
        this.page_size = page_size;
        return this;
    }

    setExpand(expand) {
        this.expand = expand;
        return this;
    }

    /**
     * Set the sort function for the table.
     * @param sort {function(a: T, b: T): number} The sort function to be used
     * @returns {PageableSortableTable<T>} The table object
     */
    setSort(sort) {
        this.sort = sort;
        return this;
    }

    setSortOrder(sort_order) {
        this.sort_order = sort_order;
        return this;
    }

    setSortOptions(sort_options) {
        this.sort_options = sort_options;
        return this;
    }

    hasSortChanged() {
        if (this.url.params.has(this.PARAMETER_SORT_BY)) {
            let sort_by = this.url.params.get(this.PARAMETER_SORT_BY);
            if (this.sort_by !== sort_by) {
                this.sort_by = sort_by;
                this._sort_changed = true;
            }
        } else {
            if (this.sort_by !== 'default') {
                this.sort_by = 'default';
                this.sort_order = 1;
                this._sort_changed = true;
            }
        }
        if (this.url.params.has(this.PARAMETER_SORT_DIRECTION)) {
            let sort_dir_normalized = this._normalizeSortDirection(parseInt(this.url.params.get(this.PARAMETER_SORT_DIRECTION)));
            if (this.sort_order !== sort_dir_normalized) {
                this.sort_order = sort_dir_normalized;
                this._sort_changed = true;
            }
        } else {
            if (this.sort_by === 'default' && this.sort_order !== 1) {
                this.sort_order = 1;
                this._sort_changed = true;
            }
        }
    }

    updatePageData() {
        this.page = (this.url.params.has(this.PARAMETER_PAGE_NUMBER)) ? parseInt(this.url.params.get(this.PARAMETER_PAGE_NUMBER)) : 0;
        this.page_size = (this.url.params.has(this.PARAMETER_PAGE_SIZE)) ? parseInt(this.url.params.get(this.PARAMETER_PAGE_SIZE)) : GLOBAL_SETTINGS.defaultSearchPageSize;
        this.expand = (this.url.params.has(this.PARAMETER_EXPANDED)) ? this.url.params.get(this.PARAMETER_EXPANDED) === 'true' : false;
        return this;
    }

    getCurrentSort() {
        this.hasSortChanged();
        if (this.sort_options.hasOwnProperty(this.sort_by)) {
            this.setSort(this.sort_options[this.sort_by]);
        }

        return this.sort;
    }

    getCurrentData() {
        let data = this.data;
        let sort = this.getCurrentSort();
        if (exists(sort) && this._sort_changed) {
            data.sort(sort);
        }
        if (this.sort_order < 0 && this._sort_changed) {
            data.reverse();
        }
        this._sort_changed = false;
        if (this.expand) {
            return data;
        }
        let start = Math.max(
            0,
            Math.min(
                this.page * this.page_size,
                data.length - 1
            )
        );
        let end = Math.min(
            start + this.page_size,
            data.length
        );

        data = data.slice(start, end);

        return data;
    }

    /**
     * Add a sort option to the table.
     * @param option {string} The name of the sort option
     * @param sort {function(a: T, b: T): number} The sort function to be used
     * @returns {PageableSortableTable<T>} The table object
     */
    addSortOption(option, sort) {
        this.sort_options[option] = sort;
        if (!this.sort_option_names.includes(option)) {
            this.sort_option_names.push(option);
        }
        return this;
    }

    /**
     * Add a sort option to the table with a wrapper function.
     * @param option {string} The name to look for the sort-able option
     * @param sort {function(a: R, b: R): number} The sort function to be used
     * @param wrapper {(function(a: T): R)|undefined} The wrapper function to be used
     * @returns {PageableSortableTable<T>}
     */
    addSortOptionPair([option, sort], wrapper = undefined) {
        if (exists(wrapper)) {
            sort = wrapComparator(sort, wrapper);
        }
        return this.addSortOption(option, sort);
    }

    getTableHeader() {
        return this.table_header_element;
    }

    getTable() {
        return this.table_element;
    }

    getTableHeaderRow() {
        return this.table_header_row;
    }

    getTableBody() {
        return this.table_body;
    }

    getTableDiv() {
        return this.table_items;
    }

    createTableLabel() {
        let HEADER_URL = this.url.clone();
        // Create the pagination header
        this.table_header_element = document.createElement('h2');
        this.table_header_pages_div = document.createElement('div');
        this.table_header_pages_div.classList.add('pagination-div');
        const max_page_count = Math.ceil(this.data.length / this.page_size);

        let headerTitle = document.createElement('h3');
        headerTitle.innerText = this.title;
        headerTitle.id = this.TABLE_HEADER;
        headerTitle.style.fontSize = 'revert';
        addLinkToElement(headerTitle, this.TABLE_HEADER);
        this.table_header_element.append(headerTitle);
        this.table_header_element.append(this.table_header_pages_div);

        this.table_header_element.classList.add('search-pagination');
        this.table_header_element.classList.add('stick-able');

        HEADER_URL.params.set(this.PARAMETER_FOCUS, this.TABLE_HEADER);
        let count = span(`${this.data.length} Items`);
        this.table_header_pages_div.append(count);

        if (max_page_count <= 1) return this;
        HEADER_URL.params.set(this.PARAMETER_EXPANDED, 'false');

        // Add a previous button, if needed
        let lastPage = max_page_count - 1;
        let currentPage = Math.min(this.page, lastPage);
        let prev = span("<");
        this.table_header_pages_div.append(prev);
        if (currentPage > 0 && !this.expand) {
            const PREV_PAGE_URL = HEADER_URL.clone();
            // The Previous button should go to the minimum of the last page and the previous page
            PREV_PAGE_URL.params.set(this.PARAMETER_PAGE_NUMBER, `${Math.min(currentPage - 1, lastPage)}`);
            PREV_PAGE_URL.params.set(this.PARAMETER_PAGE_SIZE, `${this.page_size}`);
            PREV_PAGE_URL.params.set(this.PARAMETER_FOCUS, this.TABLE_HEADER);
            const PREV_PAGE = PREV_PAGE_URL.hrefHash();
            prev.setAttribute('href', `${PREV_PAGE}`)
            prev.setAttribute('onclick', 'changeURLFromElement(this);');
            prev.classList.add('link-but-no-underline');
        }

        const max_page_index = max_page_count - 1;
        const window_radius = 3;
        const left_window_index = Math.max(0, currentPage - (window_radius + 1));
        const right_window_index = Math.min(max_page_index, currentPage + window_radius + 1);
        const window_size = right_window_index - left_window_index;
        const distance_to_end = max_page_count - currentPage;
        const distance_to_start = currentPage;
        const on_left_side = distance_to_start < distance_to_end;
        const total_seen_count = window_size + (left_window_index === 0 ? 0 : 1) + (right_window_index === max_page_index ? 0 : 1);
        // Add an ellipsis if: current index - (window_radius + 2) > 0
        // Add an ellipsis if: current index + (window_radius + 2) < max_page_index
        const ellipsis_count =
            (left_window_index - 1 > 0 ? 1 : 0) +
            (right_window_index + 1 < max_page_count ? 1 : 0);
        let extra_space = 11 - total_seen_count - ellipsis_count;
        const PADDING_WIDTH = Math.max((max_page_count < 10) ? 1 : 2, max_page_count.toString().length)
        // TODO: implement spans being identical widths.

        // Add the number of results and how many total results there are
        function addPageNumber(i, self) {
            let text = `${i + 1}`;
            // Pad the text based on the maximum page count width using spaces.
            // This is to prevent the pagination from jumping around when the page number changes.
            let pad = PADDING_WIDTH - text.length;
            if (pad > 0) {
                text = "0".repeat(pad) + text;
            }
            let page = span(text);
            self.table_header_pages_div.append(page);
            if (self.expand) return;
            const clonedURL = HEADER_URL.clone();
            clonedURL.params.set(self.PARAMETER_PAGE_NUMBER, `${i}`);
            clonedURL.params.set(self.PARAMETER_PAGE_SIZE, `${self.page_size}`);
            clonedURL.params.set(self.PARAMETER_FOCUS, self.TABLE_HEADER);
            const PAGE = clonedURL.hrefHash();
            page.setAttribute('href', `${PAGE}`);
            page.setAttribute('onclick', 'changeURLFromElement(this);');
            page.classList.add('link');
            if (i === currentPage) page.classList.add('active');
        }

        let total_count = 0;
        for (let i = 0; i < max_page_count; i++) {
            let page = null;
            if (max_page_count <= 11) {
                addPageNumber(i, this);
                total_count++;
                continue;
            }
            // Expected Page Numbering
            // *01* 02 03 04 .. 11 12 13 14 15 = f([0,1,...,15], 0)
            // 01 *02* 03 04 05 .. 12 13 14 15 = f([0,1,...,15], 1)
            // 01 02 *03* 04 05 06 .. 13 14 15 = f([0,1,...,15], 2)
            // 01 02 03 *04* 05 06 07 .. 14 15 = f([0,1,...,15], 3)
            // 01 02 03 04 *05* 06 07 08 .. 15 = f([0,1,...,15], 4)
            // 01 .. 03 04 05 *06* 07 08 09 .. 15 = f([0,1,...,15], 5)
            // 01 .. 04 05 06 *07* 08 09 10 .. 15 = f([0,1,...,15], 6)
            // 01 .. 05 06 07 *08* 09 10 11 .. 15 = f([0,1,...,15], 7)
            // 01 .. 06 07 08 *09* 10 11 12 .. 15 = f([0,1,...,15], 8)
            // 01 .. 07 08 09 *10* 11 12 13 .. 15 = f([0,1,...,15], 9)
            // 01 02 .. 08 09 10 *11* 12 13 14 15 = f([0,1,...,15], 10)
            // 01 02 03 .. 09 10 11 *12* 13 14 15 = f([0,1,...,15], 11)
            // 01 02 03 04 .. 10 11 12 *13* 14 15 = f([0,1,...,15], 12)
            // 01 02 03 04 05 .. 11 12 13 *14* 15 = f([0,1,...,15], 13)
            // 01 02 03 04 05 06 .. 12 13 14 *15* = f([0,1,...,15], 14)
            // If the page is the first or last page, add it
            if (i === 0 || i === max_page_index) {
                addPageNumber(i, this);
                total_count++;
                continue;
            }
            // If the page is in the window, add it
            if (i > left_window_index && i < right_window_index) {
                addPageNumber(i, this);
                total_count++;
                continue;
            }
            if (i === left_window_index && i !== 0) {
                page = span(".".repeat(PADDING_WIDTH));
                this.table_header_pages_div.append(page);
                page.classList.add('ellipsis');
                total_count++;
                continue;
            }
            if (i === right_window_index && i !== max_page_index) {
                page = span(".".repeat(PADDING_WIDTH));
                this.table_header_pages_div.append(page);
                page.classList.add('ellipsis');
                total_count++;
                continue;
            }
            if (!on_left_side && extra_space > 0 && i <= extra_space) {
                addPageNumber(i, this);
                total_count++;
                continue;
            }
            if (on_left_side && extra_space > 0 && i >= max_page_index - extra_space) {
                addPageNumber(i, this);
                total_count++;
            }
        }
        if (total_count !== 11 && max_page_count > 11) {
            console.error("Expected 11 pages, but got ", total_count, " pages.");
        }
        let next = span(">");
        this.table_header_pages_div.append(next);
        // Add a next button, if needed
        if (this.data.length > (currentPage + 1) * this.page_size && !this.expand) {
            const NEXT_PAGE_URL = HEADER_URL.clone();
            // The Previous button should go to the minimum of the last page and the previous page
            NEXT_PAGE_URL.params.set(this.PARAMETER_PAGE_NUMBER, `${currentPage + 1}`);
            NEXT_PAGE_URL.params.set(this.PARAMETER_PAGE_SIZE, `${this.page_size}`);
            NEXT_PAGE_URL.params.set(this.PARAMETER_FOCUS, this.TABLE_HEADER);
            const NEXT_PAGE = NEXT_PAGE_URL.hrefHash();
            next.setAttribute('href', `${NEXT_PAGE}`)
            next.setAttribute('onclick', 'changeURLFromElement(this);');
            next.classList.add('link-but-no-underline');
        }


        // If the url has `expand-{table_id}` then add a link to collapse the table
        if (this.expand) {
            const COLLAPSE_TABLE_URL = HEADER_URL.clone();
            COLLAPSE_TABLE_URL.params.set(this.PARAMETER_EXPANDED, 'false');
            const COLLAPSE_TABLE = COLLAPSE_TABLE_URL.hrefHash();
            let collapse = span("\u{21B4}");
            this.table_header_pages_div.append(collapse);
            collapse.setAttribute('href', `${COLLAPSE_TABLE}`)
            collapse.setAttribute('onclick', 'changeURLFromElement(this);');
            collapse.classList.add('link-but-no-underline');
            collapse.classList.add('active');
            collapse.style.rotate = '90deg';
            matchAllHeadersToSameWidth(this);
            return this;
        } else if (!(this.page_size >= this.data.length)) {
            const EXPAND_TABLE_URL = HEADER_URL.clone();
            EXPAND_TABLE_URL.params.set(this.PARAMETER_EXPANDED, 'true');
            const EXPAND_TABLE = EXPAND_TABLE_URL.hrefHash();
            let expand = span("\u{21B4}");
            this.table_header_pages_div.append(expand);
            expand.setAttribute('href', `${EXPAND_TABLE}`)
            expand.setAttribute('onclick', 'changeURLFromElement(this);');
            expand.classList.add('link-but-no-underline');
        }

        matchAllHeadersToSameWidth(this);

        return this;
    }

    getSortState(header, index = -1) {
        // This will return either:
        // 1, 2, 3
        // 1 meaning default, not being sorted.
        // 2 meaning sort ascended
        // 3 meaning sort descended
        if (this.sort_by !== this.getSortForHeader(header) || (index === 1 && this.getSortForHeader(header) === this.sort_by)) {
            return 1;
        }
        if (this.sort_order === 1) {
            return 2;
        }
        return 3;
    }

    getSortForHeader(header_name) {
        // Assume header was provided.
        for (let i = 1; i < this.headers.length && i <= this.sort_option_names.length; i++) {
            let header = this.headers[i];
            if (header.toLowerCase() === header_name.toLowerCase()) {
                return this.sort_option_names[i - 1];
            }
        }
        console.debug("Header ", header_name, " was not found in the sort options. It cannot be sorted.", this.sort_option_names, this.headers);
        return null;
    }

    createTableHeader(header, index) {
        let th = document.createElement('th');
        let sort_header_name = this.getSortForHeader(header);
        th.append(span(header));
        if (!exists(sort_header_name) || index > this.sort_option_names.length) {
            console.log("Header of ", this.table_id, " does not have a sort option for ", header);
            return th;
        }
        const clonedURL = this.url.clone();
        clonedURL.params.set(this.PARAMETER_FOCUS, this.TABLE_HEADER);
        clonedURL.params.set(this.PARAMETER_SORT_BY, sort_header_name);
        let currentSortState = this.getSortState(header);
        switch (currentSortState) {
            case 1:
                // Default Ascending
                clonedURL.params.set(this.PARAMETER_SORT_DIRECTION, "1");
                break
            case 2:
                // Switch to Descending
                clonedURL.params.set(this.PARAMETER_SORT_DIRECTION, "-1");
                break;
            case 3:
                // Switch to default
                clonedURL.params.delete(this.PARAMETER_SORT_DIRECTION);
                clonedURL.params.delete(this.PARAMETER_SORT_BY);
                break;
            default:
                throw new Error("Invalid sort state provided: " + this.getSortState(header) + " for header: " + header);
        }
        const REFERENCE = clonedURL.hrefHash();
        th.setAttribute('href', `${REFERENCE}`);
        th.setAttribute('onclick', 'changeURLFromElement(this);');
        let arrow = null;
        if (currentSortState === 1) {
            arrow = span("\u{21C5}");
        } else if (currentSortState === 2) {
            arrow = span("\u{25BC}");
            th.classList.add('sorting-header');
        } else if (currentSortState === 3) {
            arrow = span("\u{25B2}");
            th.classList.add('sorting-header');
        }
        if (exists(arrow)) {
            arrow.style.textAlign = 'right';
            arrow.style.float = 'right';
            th.append(arrow);
        }
        return th;
    }

    createTable() {
        // Create a class table
        this.table_element = document.createElement('table');
        this.table_element.id = this.table_id;
        this.table_element.classList.add('sortable-table');
        this.table_element.classList.add('sortable');
        this.table_element.classList.add('searchable');

        // Create the table body and rows
        this.table_body = document.createElement('tbody');
        this.table_element.appendChild(this.table_body);

        // Create the table header row
        this.table_header_row = document.createElement("tr");
        this.table_body.appendChild(this.table_header_row);

        this.hasSortChanged();
        // Create the table headers
        for (let i = 0; i < this.headers.length; i++) {
            this.table_header_row.appendChild(this.createTableHeader(this.headers[i], i));
        }

        let data = this.getCurrentData();

        // Add the rows
        for (let i = 0; i < data.length; i++) {
            this.rowAction(this.table_body, data[i]);
        }

        return this;
    }

    createDiv() {
        this.table_items = [
            document.createElement('br'),
            this.table_header_element,
            this.table_element
        ];
        return this;
    }

    addToDocument() {
        for (let item of this.table_items) {
            document.body.appendChild(item);
        }
        return this;
    }

    create() {
        this.updatePageData();
        this.createTableLabel().createTable().createDiv().addToDocument();
        GLOBAL_DATA[this.table_id] = this;
        return this;
    }

    /**
     * Adds the class related sort options to the table.
     * @param mutator {function(a: T): R} The function to map the data to the sort option
     * @returns {PageableSortableTable<T>}
     */
    sortableByClass(mutator = getClass) {
        return this
            .addSortOptionPair(PageableSortableTable.SORTABLE_DEFAULT, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_MOD, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_PACKAGE, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_NAME, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_TYPE_VARIABLES, mutator)
            // .addSortOptionPair(PageableSortableTable.SORTABLE_BY_TYPE, mutator)
            // .addSortOptionPair(PageableSortableTable.SORTABLE_BY_DECLARING_CLASS, mutator)
            ;
    }

    /**
     * Adds the named related sort options to the table.
     * @param mutator {function(a: T): R} The function to map the data to the sort option
     * @returns {PageableSortableTable<T>}
     */
    sortableByName(mutator = getName) {
        return this
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_NAME, mutator)
    }

    /**
     * Adds the method related sort options to the table.
     * @param mutator {function(a: T): R} The function to map the data to the sort option
     * @returns {PageableSortableTable<T>}
     */
    sortableByMethod(mutator = getMethod) {
        return this
            .addSortOptionPair(PageableSortableTable.SORTABLE_DEFAULT, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_MOD, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_TYPE, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_NAME, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_PARAMETERS, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_TYPE_VARIABLES, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_DECLARING_CLASS, mutator)
            ;
    }

    /**
     * Adds the constructor related sort options to the table.
     * @param mutator {function(a: T): R} The function to map the data to the sort option
     * @returns {PageableSortableTable<T>}
     */
    sortableByConstructor(mutator = getConstructor) {
        return this
            .addSortOptionPair(PageableSortableTable.SORTABLE_DEFAULT, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_MOD, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_PARAMETERS, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_TYPE_VARIABLES, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_DECLARING_CLASS, mutator)
            ;
    }

    /**
     * Adds the field related sort options to the table.
     * @param mutator {function(a: T): R} The function to map the data to the sort option
     * @returns {PageableSortableTable<T>}
     */
    sortableByField(mutator = getField) {
        return this
            .addSortOptionPair(PageableSortableTable.SORTABLE_DEFAULT, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_MOD, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_TYPE, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_NAME, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_DECLARING_CLASS, mutator);
    }

    /**
     * Adds the relation sort options to the table.
     * @param mutator {function(a: T): R} The function to map the data to the sort option
     * @returns {PageableSortableTable<T>}
     */
    sortableByRelation(mutator = getRelationship) {
        return this
            .addSortOptionPair(PageableSortableTable.SORTABLE_DEFAULT, mutator)
            .addSortOptionPair(PageableSortableTable.SORTABLE_BY_RELATIONSHIP, mutator);
    }
}