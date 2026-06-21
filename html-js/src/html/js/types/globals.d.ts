/**

 * Ambient globals for inline documentation scripts.

 * Extend this file as more `.js` assets are migrated to TypeScript.

 */

interface Window {

  isMobile(): boolean;

}



/** Fully qualified Java type name (e.g. `java.util.List<java.lang.String>`). */
type FullTypeName = string;
/** Java type name without package (e.g. `List<String>`). */
type TypeName = string;
/** Simple name without generics or bounds (e.g. `List`). */
type SimplifiedTypeName = string;
type JavaTypeName = FullTypeName | TypeName | SimplifiedTypeName;
type PackageName = string;

type DataArrayIndex = number | [number, number];
type TypeIdentifier = DataArrayIndex;
type ParameterIdentifier = DataArrayIndex;
type PackageIdentifier = DataArrayIndex;
type NameIdentifier = DataArrayIndex;
type AnnotationIdentifier = DataArrayIndex;

type ConstructorDefinition = string;
type MethodDefinition = string;
type FieldDefinition = string;
/** Historical spelling preserved for compressed-data ids. */
type ParameterDefintion = string;
type ClassDefinition = string;

declare function exists<T>(thing: T | null | undefined): thing is T;




declare function getAsArray<T>(value: T | T[] | null | undefined): T[];



declare const PROPERTY: Record<string, string>;



declare const MODIFIER: {

  toString(modifiers: JavaModifiers): string;

  isPublic(modifiers: JavaModifiers): boolean;

  isPrivate(modifiers: JavaModifiers): boolean;

  isProtected(modifiers: JavaModifiers): boolean;

  isStatic(modifiers: JavaModifiers): boolean;

  isFinal(modifiers: JavaModifiers): boolean;

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



declare const NEW_QUERY_TERMS: Record<string, DataFilterQueryMethodName>;

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

interface ClassCachesGlobal {
  fieldsShallow: LRUCacheInstance<string, FieldDoc[]>;
  fieldsDeep: LRUCacheInstance<string, FieldDoc[]>;
  methodsShallow: LRUCacheInstance<string, MethodDoc[]>;
  methodsDeep: LRUCacheInstance<string, MethodDoc[]>;
  constructors: LRUCacheInstance<string, ConstructorDoc[]>;
  packageNames: LRUCacheInstance<string, string>;
  inheritedClasses: LRUCacheInstance<string, Set<number>>;
}

declare const RELATIONS: string[];



declare const RELATIONSHIP: Record<string, number>;



declare const PROJECT_INFO: { minecraft_version: string; mod_version: string };

declare const GLOBAL_DATA: Record<string, unknown>;

declare const BINDINGS: Record<string, [string, number, unknown][]>;

declare function createSearchBar(): HTMLElement;

declare function dataFilter(): DataFilter;

declare let _last_search_parameters: URLSearchParams | undefined;

declare let _last_filter: DataFilter;

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

declare function decodeField(data: string | EntityData): EntityData;

declare function decodeMethod(data: string | MethodDefinition | EntityData): EntityData;

declare function decodeConstructor(data: string | ConstructorDefinition | EntityData): EntityData;

declare function decodeParameter(data: string | ParameterDefintion | EntityData): EntityData;

declare function getRelationship(id: number): DocWrapper | null;

declare function wipePage(): void;

declare function setToast(message: string, progress?: number | null): void;

declare function clearToast(): void;

declare function changeURL(url: string): void;

declare function applyToAllClasses(action: (subject: JavaType) => void): void;

declare function handleStickyElements(): void;

declare function createHomePage(): void;

declare function addLinkToElement(element: HTMLElement, id: string): void;

declare function changeURLFromElement(element: HTMLElement): void;

declare function createShortLink(id: DataArrayIndex, typeVariableMap?: TypeVariableMap): HTMLElement;

declare function createFullSignature(
  type: DataArrayIndex,
  typeVariableMap?: TypeVariableMap
): HTMLElement;

declare function option(
  value: string,
  action: () => void,
  label: string
): HTMLOptionElement;

declare function createOptions(...options: HTMLOptionElement[]): HTMLSelectElement;

declare function addSortTables(): void;

declare function searchFromParameters(parameters: URLSearchParams): void;

declare function loadSearchResults(): void;

declare function createClassTable(title: string, table_id: string, data: JavaType[]): PageableSortableTable<JavaType> | undefined;

declare function createFieldTableFromList(title: string, fields: FieldDoc[]): void;

declare function createMethodTableFromList(title: string, methods: MethodDoc[]): void;

declare function addMethodToTable(
  table: HTMLTableElement,
  declaringClass: JavaType,
  method: MethodDoc
): void;

declare function createRelationshipTable(type: JavaType): void;

declare function createTypeVariableMappingTable(type: JavaType): void;

declare function createRelatedClassTable(type: JavaType): void;

declare function createConstructorTable(type: JavaType): void;

declare function createFieldTable(type: JavaType): void;

declare function createMethodTable(type: JavaType): void;

declare function loadWildcard(wildcard: JavaType): void;

declare function loadTypeVariable(typeVariable: JavaType): void;

declare function loadParameterizedType(parameterizedType: JavaType): void;

declare function loadRawClass(data: EntityData): void;

declare function loadClass(id: ClassLookupInput): void;

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
  typeVariableMap: TypeVariableMap,
  includeGenerics: boolean
): string;

declare function getGenericName(id: number, typeVariableMap: TypeVariableMap, includeGenerics: boolean): string;

declare function getGenericDefinitionWithoutPackage(
  id: number,
  typeVariableMap: TypeVariableMap,
  includeGenerics: boolean
): string;

declare function createTypeVariableMap(id: number, existingMap?: Record<string, number>): Record<string, number>;

declare function clearAllCaches(): void;

declare function deobfuscateData(data: DocumentationData | EntityData): DocumentationData | EntityData;

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

declare function createLink(element: HTMLElement, id: number, rawId?: number | null, focus?: string | null): HTMLElement;

declare function createLinkableSignature(
  type: DataArrayIndex | JavaType,
  config: NameParametersInstance | SignatureParametersInstance
): HTMLElement;

declare let cachedGenericDefinition: (
  type: DataArrayIndex | JavaType,
  config: NameParametersInstance | SignatureParametersInstance
) => string;

declare function getGenericDefinitionLogic(
  type: DataArrayIndex | JavaType,
  config: NameParametersInstance | SignatureParametersInstance
): string;

declare function getPackageName(packageId: number): string;



declare function getRelation(relationship: number, id: number): Iterable<unknown>;



interface JavaType {

  data: EntityData;

  id(): number;

  referenceName(typeVariableMap?: TypeVariableMap): string;

  fullyQualifiedName(typeVariableMap?: TypeVariableMap, includeGenerics?: boolean): string;

  getTypeVariableMap(): TypeVariableMap;

  name(typeVariableMap?: TypeVariableMap, includeGenerics?: boolean): string;

  simplename(typeVariableMap?: TypeVariableMap): string;

  simpleName(typeVariableMap?: TypeVariableMap): string;

  getSimpleName(typeVariableMap?: TypeVariableMap): string;

  getReferenceName(typeVariableMap?: TypeVariableMap): string;

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

  getInterfaces(): TypeIdentifier[];

  getEnclosingClass(): number | null | undefined;

  getInnerClasses(): TypeIdentifier[];

  getRawType(): number | null | undefined;

  getOwnerType(): number | null | undefined;

  getArrayDepth(): number;

  getPackageId(): number | null;

  getPackageName(): string;

  getParameterizedArgs(): TypeIdentifier[];

  getRelatedClasses(

    relations?: [number, string][],

    alreadySeen?: Set<number>

  ): [JavaType, string][];

  fields(shallow?: boolean): FieldDoc[];

  methods(shallow?: boolean): MethodDoc[];

  getMethods(): MethodDoc[];

  constructors(): ConstructorDoc[];

  getConstructors(): ConstructorDoc[];

  getFields(): FieldDoc[];

  getPackage(): string;

  modifiers(): JavaModifiers;

  _follow_inheritance(action: (data: JavaType, index: number) => void): void;

  withTypeVariableMap(map: TypeVariableMap): void;

  hrefLink(): string;

  toString(): string;

  hasDependency(id: TypeIdentifier | number): boolean;

  relation(index: number): Iterable<number> | undefined;

  toKubeJSLoad_1_18(): string;

  toKubeJSLoad_1_19(): string;

  toKubeJSLoad_1_20(): string;

  toKubeJSLoad(): string | undefined;

  _array_depth?: number;

  _relations?: Record<string, unknown>;

}



declare function getClass(id: ClassLookupInput): JavaType | null;



declare function getTypeData(id: number): EntityData;



declare function findClassByName(name: string): JavaType | null;



declare function getAnnotationData(id: number): CompressedEntityRow;



declare function getFieldData(id: number): CompressedEntityRow;



declare function getConstructorData(id: number): CompressedEntityRow;



declare function getParameterData(id: number): CompressedEntityRow;



declare function getMethodData(id: number): CompressedEntityRow;



declare function getNameData(id: number | string | number[]): string;



declare function getField(

  fieldID: number,

  typeVariableMap: TypeVariableMap,

  sourceClassId: number,

  sourceFieldId: number

): FieldDoc;



declare function getMethod(

  methodData: MethodDefinition | EntityData,

  typeVariableMap: TypeVariableMap,

  sourceClassId: number,

  sourceMethodId: number

): MethodDoc;



declare function getConstructor(

  constructorID: number,

  typeVariableMap: TypeVariableMap,

  sourceClassId: number,

  sourceConstructorId: number

): ConstructorDoc;



declare function getParameter(

  parameterID: number,

  typeVariableMap: TypeVariableMap,

  sourceClassId: number,

  sourceMethodId: number | null,

  sourceConstructorId: number | null,

  sourceParameterId: number | null

): ParameterDoc;



interface CompressedTypeEntry {

  _id?: number;

  [key: string]: unknown;

}



interface DocumentationData {

  annotations: CompressedEntityRow[];

  packages: CompressedEntityRow[];

  parameters: CompressedEntityRow[];

  methods: CompressedEntityRow[];

  fields: CompressedEntityRow[];

  constructors: CompressedEntityRow[];

  names: CompressedEntityRow[];

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


