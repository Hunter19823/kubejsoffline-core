/** Search builder from {@link dataFilter} in searchingtools.ts. */

type SearchQueryOptions = (
  query: string,
  exact?: boolean,
  includes?: boolean
) => DataFilter;

type ClassFilterPredicate = (subject: JavaType) => boolean;
type FieldFilterPredicate = (subject: FieldDoc) => boolean;
type MethodFilterPredicate = (subject: MethodDoc) => boolean;
type ParameterFilterPredicate = (subject: ParameterDoc) => boolean;

interface SearchResults {
  classes: JavaType[];
  fields: FieldDoc[];
  methods: MethodDoc[];
  /** Methods whose parameters matched (see {@link loadSearchResults}). */
  parameters: MethodDoc[];
}

interface DataFilter {
  results: SearchResults;
  _classFilters: ClassFilterPredicate[];
  _fieldFilters: FieldFilterPredicate[];
  _methodFilters: MethodFilterPredicate[];
  _paramFilters: ParameterFilterPredicate[];

  withClassFilter(filter: ClassFilterPredicate): DataFilter;
  withFieldFilter(filter: FieldFilterPredicate): DataFilter;
  withMethodFilter(filter: MethodFilterPredicate): DataFilter;
  withParamFilter(filter: ParameterFilterPredicate): DataFilter;

  withAny: SearchQueryOptions;
  withClassAny: SearchQueryOptions;
  withFieldAny: SearchQueryOptions;
  withMethodAny: SearchQueryOptions;
  withMethodParameterAny: SearchQueryOptions;

  withClassAttribute(
    query: string,
    attribute: string,
    exact?: boolean,
    includes?: boolean
  ): DataFilter;
  withFieldAttribute(
    query: string,
    attribute: string,
    exact?: boolean,
    includes?: boolean
  ): DataFilter;
  withMethodAttribute(
    query: string,
    attribute: string,
    exact?: boolean,
    includes?: boolean
  ): DataFilter;
  withParameterAttribute(
    query: string,
    attribute: string,
    exact?: boolean,
    includes?: boolean
  ): DataFilter;

  withClassId(query: string): DataFilter;
  withClassReferenceName: SearchQueryOptions;
  withFieldTypeId: SearchQueryOptions;
  withFieldReferenceName: SearchQueryOptions;
  withMethodReturnTypeId: SearchQueryOptions;
  withMethodReferenceName: SearchQueryOptions;
  withMethodParameterTypeId: SearchQueryOptions;
  withMethodParameterReferenceName: SearchQueryOptions;

  withName: SearchQueryOptions;
  withClassName: SearchQueryOptions;
  withFieldName: SearchQueryOptions;
  withFieldTypeName: SearchQueryOptions;
  withMethodName: SearchQueryOptions;
  withMethodReturnTypeName: SearchQueryOptions;
  withMethodParameterName: SearchQueryOptions;
  withMethodParameterTypeName: SearchQueryOptions;

  withSimpleName: SearchQueryOptions;
  withClassSimpleName: SearchQueryOptions;
  withFieldTypeSimpleName: SearchQueryOptions;
  withMethodReturnTypeSimpleName: SearchQueryOptions;
  withMethodParameterTypeSimpleName: SearchQueryOptions;

  withRawType: SearchQueryOptions;
  withClassRawType: SearchQueryOptions;
  withPackage: SearchQueryOptions;
  withClassPackage: SearchQueryOptions;
  withFieldTypePackage: SearchQueryOptions;
  withMethodReturnTypePackage: SearchQueryOptions;
  withMethodParameterTypePackage: SearchQueryOptions;

  withFieldRawType: SearchQueryOptions;
  withMethodReturnRawType: SearchQueryOptions;
  withMethodParameterRawType: SearchQueryOptions;

  withType: SearchQueryOptions;
  withClassType: SearchQueryOptions;
  withFieldTypeTypeName: SearchQueryOptions;
  withMethodReturnTypeTypeName: SearchQueryOptions;
  withMethodParameterTypeTypeName: SearchQueryOptions;

  withMethodParameterCount(count: number, exact?: boolean, includes?: boolean): DataFilter;

  withIgnoreClasses: SearchQueryOptions;
  withIgnoreMethods: SearchQueryOptions;
  withIgnoreFields: SearchQueryOptions;
  withIgnoreParameters: SearchQueryOptions;

  withRawClassOnly(): DataFilter;
  withNonRawClassOnly(): DataFilter;
  withTypeVariableOnly(): DataFilter;
  withNonTypeVariableOnly(): DataFilter;
  withWildcardOnly(): DataFilter;
  withNonWildcardOnly(): DataFilter;

  matchesClass(data: JavaType): boolean;
  matchesField(data: FieldDoc): boolean;
  matchesMethod(data: MethodDoc): boolean;
  matchesParam(data: ParameterDoc): boolean;

  analyzeFields(subject: JavaType): void;
  analyzeOnlyParameters(subject: JavaType): void;
  analyzeOnlyMethod(subject: JavaType): void;
  analyzeMethodAndParameters(subject: JavaType): void;
  analyzeMethods(subject: JavaType): void;
  findMatchingProperties(subject: JavaType): void;
  findAllThatMatch(): DataFilter;

  getResults(): SearchResults;
  sortResults(): DataFilter;
}

/** Names of {@link DataFilter} query methods referenced from {@link NEW_QUERY_TERMS}. */
type DataFilterQueryMethodName = keyof Pick<
  DataFilter,
  | 'withAny'
  | 'withClassAny'
  | 'withFieldAny'
  | 'withMethodAny'
  | 'withMethodParameterAny'
  | 'withClassId'
  | 'withClassReferenceName'
  | 'withFieldTypeId'
  | 'withMethodReturnTypeId'
  | 'withMethodParameterTypeId'
  | 'withName'
  | 'withClassName'
  | 'withFieldName'
  | 'withFieldTypeName'
  | 'withMethodName'
  | 'withMethodReturnTypeName'
  | 'withMethodParameterName'
  | 'withMethodParameterTypeName'
  | 'withSimpleName'
  | 'withClassSimpleName'
  | 'withFieldTypeSimpleName'
  | 'withMethodReturnTypeSimpleName'
  | 'withMethodParameterTypeSimpleName'
  | 'withRawType'
  | 'withClassRawType'
  | 'withPackage'
  | 'withClassPackage'
  | 'withFieldTypePackage'
  | 'withMethodReturnTypePackage'
  | 'withMethodParameterTypePackage'
  | 'withFieldRawType'
  | 'withMethodReturnRawType'
  | 'withMethodParameterRawType'
  | 'withType'
  | 'withClassType'
  | 'withFieldTypeTypeName'
  | 'withMethodReturnTypeTypeName'
  | 'withMethodParameterTypeTypeName'
  | 'withMethodParameterCount'
  | 'withIgnoreClasses'
  | 'withIgnoreMethods'
  | 'withIgnoreFields'
  | 'withIgnoreParameters'
  | 'withRawClassOnly'
  | 'withNonRawClassOnly'
  | 'withTypeVariableOnly'
  | 'withNonTypeVariableOnly'
  | 'withWildcardOnly'
  | 'withNonWildcardOnly'
>;