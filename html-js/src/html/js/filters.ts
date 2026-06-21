type FilterPredicate = (data: unknown) => boolean;

class Filter {
    predicate: FilterPredicate;

    constructor(predicate: FilterPredicate) {
        this.predicate = predicate;
    }

    filter(data: unknown[] | unknown): unknown[] {
        if (Array.isArray(data)) {
            return data.filter(this.predicate);
        }
        if (this.predicate(data)) {
            return [data];
        }
        return [];
    }

    or(filter: Filter): Filter {
        return new OrFilter([this, filter]);
    }

    and(filter: Filter): Filter {
        return new AndFilter([this, filter]);
    }

    not(): Filter {
        return new NotFilter(this);
    }
}

class OrFilter extends Filter {
    constructor(filters: Filter[]) {
        super((data) => filters.some((filter) => filter.predicate(data)));
    }
}

class AndFilter extends Filter {
    constructor(filters: Filter[]) {
        super((data) => filters.every((filter) => filter.predicate(data)));
    }
}

class NotFilter extends Filter {
    constructor(filter: Filter) {
        super((data) => !filter.predicate(data));
    }
}

class FilterBuilder {
    filters: Filter[] = [];

    addFilter(filter: Filter): this {
        this.filters.push(filter);
        return this;
    }

    build(): AndFilter {
        return new AndFilter(this.filters);
    }
}

function readFilterAttribute(data: Record<string, unknown>, attribute: string): unknown {
    const value = data[attribute];
    if (value === undefined || value === null) {
        return value;
    }
    if (typeof value === 'function') {
        return (value as () => unknown)();
    }
    return value;
}

function createAttributeFilter(
    attribute: string,
    value: unknown,
    inclusive = true,
    case_sensitive = false
): Filter {
    if (case_sensitive && inclusive) {
        return new Filter((data) => {
            const record = data as Record<string, unknown>;
            const attr = readFilterAttribute(record, attribute);
            if (attr === undefined || attr === null) {
                return false;
            }
            return `${attr}` === `${value}`;
        });
    }
    if (case_sensitive && !inclusive) {
        return new Filter((data) => {
            const record = data as Record<string, unknown>;
            const attr = readFilterAttribute(record, attribute);
            if (attr === undefined || attr === null) {
                return true;
            }
            return `${attr}`.includes(`${value}`);
        });
    }
    const lowerValue = `${value}`.toLowerCase();
    if (inclusive) {
        return new Filter((data) => {
            const record = data as Record<string, unknown>;
            const attr = readFilterAttribute(record, attribute);
            if (attr === undefined || attr === null) {
                return false;
            }
            return `${attr}`.toLowerCase() === lowerValue;
        });
    }
    return new Filter((data) => {
        const record = data as Record<string, unknown>;
        const attr = readFilterAttribute(record, attribute);
        if (attr === undefined || attr === null) {
            return true;
        }
        return `${attr}`.toLowerCase().includes(lowerValue);
    });
}

function createFilterFromJSON(
    json: Record<string, unknown> | string,
    value: string,
    inclusive: boolean,
    exact: boolean
): AndFilter {
    const filterBuilder = new FilterBuilder();
    for (const [key, filterAttribute] of Object.entries(json as Record<string, unknown>)) {
        if (key === 'or') {
            const orFilter = new FilterBuilder();
            if (!Array.isArray(filterAttribute)) {
                orFilter.addFilter(
                    createFilterFromJSON(filterAttribute as Record<string, unknown>, value, inclusive, exact)
                );
            } else {
                for (const filter of filterAttribute) {
                    orFilter.addFilter(
                        createFilterFromJSON(filter as Record<string, unknown>, value, inclusive, exact)
                    );
                }
            }
            filterBuilder.addFilter(orFilter.build());
            continue;
        }
        if (key === 'and') {
            const andFilter = new FilterBuilder();
            if (!Array.isArray(filterAttribute)) {
                andFilter.addFilter(
                    createFilterFromJSON(filterAttribute as Record<string, unknown>, value, inclusive, exact)
                );
            } else {
                for (const filter of filterAttribute) {
                    andFilter.addFilter(
                        createFilterFromJSON(filter as Record<string, unknown>, value, inclusive, exact)
                    );
                }
            }
            filterBuilder.addFilter(andFilter.build());
            continue;
        }
        if (key === 'not') {
            const notFilter = new FilterBuilder();
            if (!Array.isArray(filterAttribute)) {
                notFilter.addFilter(
                    createFilterFromJSON(filterAttribute as Record<string, unknown>, value, inclusive, exact)
                );
            } else {
                for (const filter of filterAttribute) {
                    notFilter.addFilter(
                        createFilterFromJSON(filter as Record<string, unknown>, value, inclusive, exact)
                    );
                }
            }
            filterBuilder.addFilter(notFilter.build().not());
        }
        if (NEW_QUERY_TERMS[key] !== undefined) {
            const term = NEW_QUERY_TERMS[key];
            filterBuilder.addFilter(
                createFilterFromJSON(term as Record<string, unknown> | string, value, inclusive, exact)
            );
            continue;
        }
        filterBuilder.addFilter(createAttributeFilter(key, value, inclusive, exact));
    }
    return filterBuilder.build();
}

class FilterSerializer {
    filterBuilder: FilterBuilder;

    constructor(filterBuilder: FilterBuilder) {
        this.filterBuilder = filterBuilder;
    }

    static fromURLParams(params: URLSearchParams): AndFilter {
        const filterBuilder = new FilterBuilder();
        for (const [key, value] of params) {
            if (NEW_QUERY_TERMS[key] !== undefined) {
                filterBuilder.addFilter(
                    createFilterFromJSON(
                        NEW_QUERY_TERMS[key] as Record<string, unknown> | string,
                        value,
                        FilterSerializer.isInclusive(params),
                        FilterSerializer.isCaseSensitive(params)
                    )
                );
            }
        }
        return filterBuilder.build();
    }

    static isInclusive(params: URLSearchParams): boolean {
        if (params.has('inclusive')) return params.get('inclusive') === 'true';
        return true;
    }

    static isCaseSensitive(params: URLSearchParams): boolean {
        if (params.has('case_sensitive')) return params.get('case_sensitive') === 'true';
        if (params.has('exact')) return params.get('exact') === 'true';
        return false;
    }
}
