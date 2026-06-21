/**

 * Ambient globals for inline documentation scripts.

 * Extend this file as more `.js` assets are migrated to TypeScript.

 */

interface Window {

  isMobile(): boolean;

}



type EntityData = Record<string, unknown>;

type DocWrapper = Record<string, unknown> & { data?: EntityData };

interface LRUCacheInstance {
  maxSize: number;
  cache: Map<unknown, unknown>;
  get(key: unknown): unknown;
  set(key: unknown, value: unknown): void;
  has(key: unknown): boolean;
  clear(): void;
  size(): number;
}

declare function exists<T>(thing: T | null | undefined): thing is T;




declare function getAsArray<T>(value: T | T[] | null | undefined): T[];



declare const PROPERTY: Record<string, string>;



declare const MODIFIER: {

  toString(modifiers: unknown): string;

  isPublic(modifiers: unknown): boolean;

  isPrivate(modifiers: unknown): boolean;

  isProtected(modifiers: unknown): boolean;

  isStatic(modifiers: unknown): boolean;

  isFinal(modifiers: unknown): boolean;

};



declare const GLOBAL_SETTINGS: {

  cacheMaxSize?: number;

  showMethods?: boolean;

  showFields?: boolean;

  showConstructors?: boolean;

  showPrivate?: boolean;

  showProtected?: boolean;

  showRelationships?: boolean;

  debug?: boolean;

  defaultSearchPageSize?: number;

} | undefined;



declare const NEW_QUERY_TERMS: Record<string, string>;



declare const LINK_MAP: Record<string, () => void>;



declare function onHashChange(): void;



declare function focusElement(elementId: string): void;



declare function createPagedTable<T>(

  title: string,

  table_id: string,

  data: T[],

  addRowAction: (table: HTMLTableElement, data: T) => void,

  ...headers: string[]

): PageableSortableTable<T> | undefined;

/** Forward-declared in mod `constants.js`; defined in `pagination_tools.js`. */
declare let PageableSortableTable: {
  new (title: string, table_id: string, ...headers: (Node | string)[]): PageableSortableTable;
  [key: string]: unknown;
} | null;

interface PageableSortableTable<T = unknown> {

  data: T[];

  setURL(url: UrlData): PageableSortableTable<T>;

  setRowAction(action: (table: HTMLTableElement, data: T) => void): PageableSortableTable<T>;

  setHeaders(...headers: string[]): PageableSortableTable<T>;

  setData(data: T[]): PageableSortableTable<T>;

  sortableByMethod(comparator: (a: unknown) => unknown): PageableSortableTable<T>;

  sortableByField(comparator: (a: unknown) => unknown): PageableSortableTable<T>;

  sortableByConstructor(): PageableSortableTable<T>;

  sortableByRelatedClass(): PageableSortableTable<T>;

  sortableByRelation(): PageableSortableTable<T>;

  sortableByClass(comparator: (a: unknown) => unknown): PageableSortableTable<T>;

  sortableByName(): PageableSortableTable<T>;

  sortableByType(): PageableSortableTable<T>;

  addDefaultOptionPair(pair: unknown): PageableSortableTable<T>;

  addSortOptionPair(pair: unknown): PageableSortableTable<T>;

  create(): unknown;

}






declare function getAllRelations(id: number): Map<number, unknown[]>;



declare const LOOK_UP_CACHE: Map<string, number>;

declare const RELATIONSHIP_GRAPH: Map<unknown, Map<unknown, unknown>>;

declare const CLASS_CACHES: {
  fieldsShallow: LRUCacheInstance;
  fieldsDeep: LRUCacheInstance;
  methodsShallow: LRUCacheInstance;
  methodsDeep: LRUCacheInstance;
  constructors: LRUCacheInstance;
  packageNames: LRUCacheInstance;
  inheritedClasses: LRUCacheInstance;
};

declare const RELATIONS: string[];



declare const RELATIONSHIP: Record<string, number>;



declare const PROJECT_INFO: { minecraft_version: string; mod_version: string };

declare const GLOBAL_DATA: Record<string, unknown>;

declare const BINDINGS: Record<string, [string, number, unknown][]>;

declare function createSearchBar(): HTMLElement;

declare function dataFilter(): unknown;

declare let _last_search_parameters: URLSearchParams | undefined;

declare let _last_filter: unknown;

declare const TASKS: { OPTIMIZE: string };

declare const EVENTS: Record<string, number[]>;

declare function initIndexedDB(dataVersion?: string | null): Promise<IDBDatabase>;

declare function getDatabaseName(dataVersion: string | null | undefined): string;

declare function getCurrentDatabaseName(): string | null;

declare function calculateDataVersion(data: DocumentationData): string;

declare function checkOptimizationStatus(data?: DocumentationData | null): Promise<boolean>;

declare function readOptimizedData(key: string): Promise<unknown>;

declare function writeOptimizedDataBatch(
  data: Record<string, unknown>,
  progressCallback?: IndexedDbBatchProgressCallback | null
): Promise<void>;

declare function writeLookupCacheBatch(
  cache: Map<string, number> | Record<string, number>,
  progressCallback?: IndexedDbBatchProgressCallback | null
): Promise<void>;

declare function writeRelationshipGraphBatch(
  relationshipGraph: Map<unknown, Map<unknown, Set<unknown>>>,
  progressCallback?: IndexedDbBatchProgressCallback | null
): Promise<void>;

declare function readRelationshipGraphByType(
  relationshipType: unknown
): Promise<Map<number, Set<number>>>;

declare function writeMetadata(key: string, value: unknown): Promise<void>;

declare function storeDataVersion(version: string): Promise<void>;

declare function isDataVersionValid(data: DocumentationData): Promise<boolean>;

type IndexedDbBatchProgressCallback = (
  current: number,
  total: number,
  stage: string,
  progress: number
) => void;

type RelationshipProgressCallback = (data: {
  type: string;
  stage: string;
  message: string;
  progress: number;
  current: number;
  total: number;
}) => void;

declare function optimizeDataSearch(
  progressCallback?: RelationshipProgressCallback | null
): Promise<void>;

declare function decodeField(data: unknown): Record<string, unknown>;

declare function decodeMethod(data: unknown): Record<string, unknown>;

declare function decodeConstructor(data: unknown): Record<string, unknown>;

declare function decodeParameter(data: unknown): Record<string, unknown>;

declare function getRelationship(id: unknown): unknown;

declare function wipePage(): void;

declare function setToast(message: string, progress?: number | null): void;

declare function clearToast(): void;

declare function changeURL(url: string): void;

declare function applyToAllClasses(action: (subject: JavaType) => void): void;

declare function handleStickyElements(): void;

declare function createHomePage(): void;

declare function addLinkToElement(element: HTMLElement, id: string): void;

declare function changeURLFromElement(element: HTMLElement): void;

declare function createShortLink(id: unknown): HTMLElement;

declare function option(
  value: string,
  action: () => void,
  label: string
): HTMLOptionElement;

declare function createOptions(...options: HTMLOptionElement[]): HTMLSelectElement;

declare function addSortTables(): void;

declare function searchFromParameters(parameters: URLSearchParams): void;

declare function loadSearchResults(): void;

declare function createClassTable(title: string, table_id: string, data: unknown[]): unknown;

declare function createFieldTableFromList(title: string, fields: unknown[]): void;

declare function createMethodTableFromList(title: string, methods: unknown[]): void;

declare function addMethodToTable(
  table: HTMLTableElement,
  declaringClass: unknown,
  method: unknown
): void;

declare function createRelationshipTable(type: unknown): void;

declare function createFullSignature(
  type: number,
  typeVariableMap?: Record<string, number>
): HTMLElement;

declare function createTypeVariableMappingTable(type: unknown): void;

declare function createRelatedClassTable(type: unknown): void;

declare function createConstructorTable(type: unknown): void;

declare function createFieldTable(type: unknown): void;

declare function createMethodTable(type: unknown): void;

declare function loadWildcard(wildcard: unknown): void;

declare function loadTypeVariable(typeVariable: unknown): void;

declare function loadParameterizedType(parameterizedType: unknown): void;

declare function loadRawClass(data: unknown): void;

declare function loadClass(id: unknown): void;

declare function DecodeURL(): UrlData;

declare function createOptimizationWorkerThread(): Worker;

declare function loadRelationshipGraphIntoMemory(
  progressCallback?: (current: number, total: number, stage: string, progress: number) => void
): Promise<void>;

declare function onWindowLoad(): Promise<void>;

declare function scrollToText(text: string): void;

declare function header(text: string, level: number): HTMLElement;

interface UrlData {
  hash: string;
  params: URLSearchParams;
  chromeHighlightText?: string;
  hasFocus(): boolean;
  getFocus(): string | null;
  getFocusOrDefaultHeader(): string;
  getParamSize(): number;
  getParamSizeSafe(): number;
  isSearch(): boolean;
  isClass(): boolean;
  isHome(): boolean;
  href(): string;
  hrefHash(): string;
  clone(): UrlData;
}

declare let CURRENT_URL: UrlData;

declare function getBinding(entry: [string, number, unknown]): DocWrapper;

declare function readLookupCacheEntry(name: string): Promise<number | undefined>;



declare function writeLookupCacheEntry(name: string, id: number): Promise<void>;



declare function setRemapType<T>(target: T): T;

declare function setDataIndex<T>(target: T): T;

declare function setTypeVariableMap<T>(target: T): T;

declare function setModifiers<T>(target: T): T;

declare function setAnnotations<T>(target: T): T;

declare function setBasicName<T>(target: T): T;

declare function setDeclaringClass<T>(target: T): T;

declare function setDeclaringField<T>(target: T): T;

declare function setDeclaringMethod<T>(target: T): T;

declare function setDeclaringConstructor<T>(target: T): T;

declare function setDeclaringParameter<T>(target: T): T;

declare function setParameters<T>(

  target: T,

  sourceClassId: number,

  sourceMethodId: number | null,

  sourceConstructorId: number | null

): T;

declare function setTypeVariables<T>(target: T): T;

declare function setExceptions<T>(target: T): T;



declare function getGenericDefinition(

  id: number,

  typeVariableMap: unknown,

  includeGenerics: boolean

): string;

declare function getGenericName(id: number, typeVariableMap: unknown, includeGenerics: boolean): string;

declare function getGenericDefinitionWithoutPackage(

  id: number,

  typeVariableMap: unknown,

  includeGenerics: boolean

): string;

declare function createTypeVariableMap(id: number, existingMap?: Record<string, number>): Record<string, number>;

declare function clearAllCaches(): void;

declare function deobfuscateData(data: unknown): unknown;

declare function joiner<T>(
  values: T[],
  separator: string,
  transformer?: (value: T) => string,
  prefix?: string,
  suffix?: string
): string;

declare function tagJoiner<T>(
  values: T[],
  separator: string,
  transformer?: (value: T) => HTMLElement,
  prefix?: HTMLElement,
  suffix?: HTMLElement
): HTMLElement[];

declare function span(text: string): HTMLSpanElement;

declare function createLink(element: HTMLElement, id: number, rawId?: number | null, focus?: unknown): HTMLElement;

declare function createLinkableSignature(type: number | JavaType, config: unknown): HTMLElement;

declare let cachedGenericDefinition: (type: number | JavaType, config: unknown) => string;

declare function getGenericDefinitionLogic(type: number | JavaType, config: unknown): string;

declare function getPackageName(packageId: number): string;



declare function getRelation(relationship: number, id: number): Iterable<unknown>;



interface JavaType {

  data: Record<string, unknown>;

  id(): number;

  referenceName(typeVariableMap?: unknown): string;

  fullyQualifiedName(typeVariableMap?: unknown, includeGenerics?: boolean): string;

  getTypeVariableMap(): unknown;

  name(typeVariableMap?: unknown, includeGenerics?: boolean): string;

  simplename(typeVariableMap?: unknown): string;

  simpleName(typeVariableMap?: unknown): string;

  getSimpleName(typeVariableMap?: unknown): string;

  getReferenceName(typeVariableMap?: unknown): string;

  isTypeCompatibleWith(otherClass: JavaType): boolean;

  isRawClass(): boolean;

  isParameterized(): boolean;

  isParameterizedType(): boolean;

  isWildcard(): boolean;

  isTypeVariable(): boolean;

  isInnerClass(): boolean;

  getDeclaringClass(): number | null | undefined;

  getTypeVariables(): number[];

  getTypeVariableBounds(): number[];

  getLowerBound(): number[];

  getUpperBound(): number[];

  package(): string;

  getSuperClass(): number | null | undefined;

  getInterfaces(): unknown[];

  getEnclosingClass(): number | null | undefined;

  getInnerClasses(): unknown[];

  getRawType(): number | null | undefined;

  getOwnerType(): number | null | undefined;

  getArrayDepth(): number;

  getPackageId(): number | null;

  getPackageName(): string;

  getParameterizedArgs(): unknown[];

  getRelatedClasses(

    relations?: [number, string][],

    alreadySeen?: Set<number>

  ): [JavaType, string][];

  fields(shallow?: boolean): unknown[];

  methods(shallow?: boolean): unknown[];

  getMethods(): unknown[];

  constructors(): unknown[];

  getConstructors(): unknown[];

  getFields(): unknown[];

  getPackage(): string;

  modifiers(): number;

  _follow_inheritance(action: (data: JavaType, index: number) => void): void;

  withTypeVariableMap(map: unknown): void;

  hrefLink(): string;

  toString(): string;

  hasDependency(id: unknown): boolean;

  relation(index: number): unknown[] | undefined;

  toKubeJSLoad_1_18(): string;

  toKubeJSLoad_1_19(): string;

  toKubeJSLoad_1_20(): string;

  toKubeJSLoad(): string | undefined;

  _array_depth?: number;

  _relations?: unknown;

}



declare function getClass(id: unknown): JavaType | null;



declare function getTypeData(id: number): Record<string, unknown>;



declare function findClassByName(name: string): JavaType | null;



declare function getAnnotationData(id: number): unknown;



declare function getFieldData(id: number): unknown;



declare function getConstructorData(id: number): unknown;



declare function getParameterData(id: number): unknown;



declare function getMethodData(id: number): unknown;



declare function getNameData(id: number | string | number[]): string;



declare function getField(

  fieldID: number,

  typeVariableMap: unknown,

  sourceClassId: number,

  sourceFieldId: number

): unknown;



declare function getMethod(

  methodData: unknown,

  typeVariableMap: unknown,

  sourceClassId: number,

  sourceMethodId: number

): unknown;



declare function getConstructor(

  constructorID: number,

  typeVariableMap: unknown,

  sourceClassId: number,

  sourceConstructorId: number

): unknown;



declare function getParameter(

  parameterID: number,

  typeVariableMap: unknown,

  sourceClassId: number,

  sourceMethodId: number | null,

  sourceConstructorId: number | null,

  sourceParameterId: number | null

): unknown;



interface CompressedTypeEntry {

  _id?: number;

  [key: string]: unknown;

}



interface DocumentationData {

  annotations: unknown[];

  packages: unknown[];

  parameters: unknown[];

  methods: unknown[];

  fields: unknown[];

  constructors: unknown[];

  names: unknown[];

  types: CompressedTypeEntry[];

  _events?: Record<string, number[]>;

  _eventsIndexed?: boolean;

  _optimized?: boolean;

  _wildcard_types: number[];

  _parameterized_types: number[];

  _raw_types: number[];

  _type_variables: number[];

}



declare const DATA: DocumentationData;



interface String {

  equals(other: string): boolean;

}


