/**
 * Documentation entity shapes after {@link class_data_documentation.ts} mixins.
 * Kept in `.d.ts` so every script shares types without `import`/`export`.
 */

/** Values passed through {@link Filter} and search attribute readers. */
type FilterableSubject = EntityData | JavaType | FieldDoc | MethodDoc | ParameterDoc;

/** Bit flags from compressed modifier data. */
type JavaModifiers = number;

type TypeVariableMap = Record<string, number>;

interface IndexedClassData {
  _id: TypeIdentifier;
}

/** Decoded backing store for a wrapped entity or {@link JavaType}. */
type EntityData = Record<string, unknown> & {
  _id?: TypeIdentifier;
  _dataIndex?: number;
  _declaringClass?: number;
  _declaringField?: number;
  _declaringMethod?: number;
  _declaringConstructor?: number;
  _declaringParameter?: number | null;
  _type_variable_map_base?: TypeVariableMap;
  _array_depth?: number;
};

type DocWrapper = Record<string, unknown> & { data?: EntityData };

/**
 * Object returned from `getClass` after mixins are applied.
 * Used while building a type before all methods exist.
 */
type JavaTypeBuilder = DocWrapper & {
  data: EntityData;
  _array_depth?: number;
};

/** Accepted inputs for {@link getClass}. */
type ClassLookupInput =
  | TypeIdentifier
  | FullTypeName
  | TypeName
  | SimplifiedTypeName
  | IndexedClassData
  | JavaType
  | readonly [TypeIdentifier, number];

/** Runtime object after documentation mixins (methods appear as `set*` runs). */
interface CompressedDataHolder extends DocWrapper {
  data: EntityData;
  getRawType?: () => number | null | undefined;
  getTypeVariableMap?: () => TypeVariableMap;
  getTypeVariables?: () => number[] | unknown[];
  getTypeVariablesMapped?: () => JavaType[] | number[];
  type?: () => TypeIdentifier;
  getType?: () => TypeIdentifier;
  getTypeWrapped?: () => JavaType;
  modifiers?: () => JavaModifiers;
  getModifiers?: () => JavaModifiers;
  parameters?: () => ParameterDoc[] | DocWrapper[];
  getParameters?: () => ParameterDoc[] | DocWrapper[];
  annotations?: () => DocWrapper[];
  getAnnotations?: () => DocWrapper[];
  withTypeVariableMap?: (map: TypeVariableMap) => TypeVariableMap;
  name?: () => string;
  getName?: () => string;
  dataIndex?: () => number;
  getDataIndex?: () => number;
  declaringClass?: () => number;
  getDeclaringClass?: () => number;
  getDeclaringClassWrapped?: () => JavaType;
  declaringMethod?: () => number;
  getDeclaringMethod?: () => number;
  getDeclaringMethodWrapped?: () => MethodDoc | CompressedDataHolder | null;
  declaringConstructor?: () => number;
  getDeclaringConstructor?: () => number;
  getDeclaringConstructorWrapped?: () => ConstructorDoc | CompressedDataHolder | null;
  declaringParameter?: () => number;
  getDeclaringParameter?: () => number;
  declaringField?: () => number;
  getDeclaringField?: () => number;
  getExceptions?: () => TypeIdentifier[] | unknown[];
  getWrappedParameterHolder?: (
    sourceMethodId: number | null,
    sourceConstructorId: number | null
  ) => CompressedDataHolder;
  hrefLink?: () => string;
  getHrefLink?: () => string;
  id?: () => string;
  getId?: () => string;
  toString?: () => string;
}

/** Fully-resolved field documentation entity. */
interface FieldDoc extends CompressedDataHolder {
  getTypeWrapped(): JavaType;
  getTypeVariableMap(): TypeVariableMap;
  name(): string;
  getName(): string;
}

/** Fully-resolved parameter documentation entity. */
interface ParameterDoc extends CompressedDataHolder {
  getTypeWrapped(): JavaType;
  getTypeVariableMap(): TypeVariableMap;
  name(): string;
  type(): TypeIdentifier;
}

interface ConstructorDoc extends CompressedDataHolder {
  parameters(): ParameterDoc[];
  getDeclaringClassWrapped(): JavaType;
  getTypeVariableMap(): TypeVariableMap;
}

interface MethodDoc extends CompressedDataHolder {
  parameters(): ParameterDoc[];
  getTypeWrapped(): JavaType;
  getDeclaringClassWrapped(): JavaType;
  getTypeVariableMap(): TypeVariableMap;
  name(): string;
  getName(): string;
  areMethodsEqual(other: MethodDoc): boolean;
  isMethodMoreSpecificThan(other: MethodDoc): boolean;
}

/** Compressed row stored in {@link DocumentationData}. */
type CompressedEntityRow = string;

interface TypeDataRecord extends EntityData {
  _id: TypeIdentifier;
}

interface NameParametersInstance {
  setTypeVariableMap(typeVariableMap: TypeVariableMap): NameParametersInstance;
  setDefiningTypeVariable(isDefiningTypeVariable: boolean, typeVariable?: number | number[]): NameParametersInstance;
  setAppendPackageName(appendPackageName: boolean): NameParametersInstance;
  setIncludeGenerics(includeGenerics: boolean): NameParametersInstance;
  disableEnclosingName(isDefiningParameterizedType: boolean): NameParametersInstance;
  setOverrideID(overrideID: number | null): NameParametersInstance;
  getTypeVariableMap(): TypeVariableMap;
  getDefiningTypeVariable(typeVariable?: number | number[]): boolean;
  getAppendPackageName(): boolean;
  getIncludeGenerics(): boolean;
  getDefiningParameterizedType(): boolean;
  getOverrideID(): number | null;
  remapType(type: number | JavaType): JavaType;
}

interface SignatureParametersInstance {
  setTypeVariableMap(typeVariableMap: TypeVariableMap): SignatureParametersInstance;
  setDefiningTypeVariable(isDefiningTypeVariable: boolean, typeVariable?: number | number[]): SignatureParametersInstance;
  setAppendPackageName(appendPackageName: boolean): SignatureParametersInstance;
  setOverrideID(overrideID: number | null): SignatureParametersInstance;
  setDefiningParameterizedType(isDefiningParameterizedType: boolean): SignatureParametersInstance;
  disableDeclaringClass(): SignatureParametersInstance;
  disableEnclosingClass(): SignatureParametersInstance;
  getTypeVariableMap(): TypeVariableMap;
  getDefiningTypeVariable(typeVariable?: number | number[]): boolean;
  getAppendPackageName(): boolean;
  getOverrideID(): number | null;
  getLinkableID(fallbackId?: number): number;
  getDefiningParameterizedType(): boolean;
  getIncludeEnclosingClass(): boolean;
  remapType(type: number | JavaType): JavaType;
}

declare var name_parameters: {
  new (): NameParametersInstance;
};

declare var signature_parameters: {
  new (): SignatureParametersInstance;
};

interface LRUCacheInstance<K = string, V = unknown> {
  maxSize: number;
  cache: Map<K, V>;
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  has(key: K): boolean;
  clear(): void;
  size(): number;
}
