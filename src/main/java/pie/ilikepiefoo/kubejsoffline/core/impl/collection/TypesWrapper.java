package pie.ilikepiefoo.kubejsoffline.core.impl.collection;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Types;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.ParameterizedTypeData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.RawClassData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.TypeVariableData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.WildcardTypeData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.TypeData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeOrTypeVariableID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeVariableID;
import pie.ilikepiefoo.kubejsoffline.core.impl.TypeManager;
import pie.ilikepiefoo.kubejsoffline.core.impl.identifier.ArrayIdentifier;

import java.util.Map;
import java.util.NavigableMap;
import java.util.TreeMap;

public class TypesWrapper implements Types {
    protected TwoWayMap<TypeOrTypeVariableID, TypeData> data;
    protected NavigableMap<TypeID, RawClassData> rawTypes = new TreeMap<>();
    protected NavigableMap<TypeID, ParameterizedTypeData> parameterizedTypes = new TreeMap<>();
    protected NavigableMap<TypeID, WildcardTypeData> wildcardTypes = new TreeMap<>();
    protected NavigableMap<TypeVariableID, TypeData> typeVariables = new TreeMap<>();


    public TypesWrapper() {
        this.data = new TwoWayMap<>(TypeIdentifier::new);
    }

    @Override
    public NavigableMap<TypeOrTypeVariableID, TypeData> getAllTypes() {
        return this.data.getIndexToValueMap();
    }

    @Override
    public NavigableMap<TypeID, RawClassData> getAllRawTypes() {
        return this.rawTypes;
    }

    @Override
    public NavigableMap<TypeID, ParameterizedTypeData> getAllParameterizedTypes() {
        return this.parameterizedTypes;
    }

    @Override
    public NavigableMap<TypeID, WildcardTypeData> getAllWildcardTypes() {
        return this.wildcardTypes;
    }

    @Override
    public NavigableMap<TypeVariableID, TypeData> getAllTypeVariables() {
        return this.typeVariables;
    }

    @Override
    public synchronized TypeOrTypeVariableID addType(TypeData data) {
        if (this.data.contains(data)) {
            return this.data.get(data);
        }
        var index = this.data.add(data,
                (data.isTypeVariable()) ?
                        TypeVariableIdentifier::new :
                        TypeIdentifier::new
        );
        if (data.isRawType()) {
            this.rawTypes.put(index.asType(), data.asRawType());
        } else if (data.isParameterizedType()) {
            this.parameterizedTypes.put(index.asType(), data.asParameterizedType());
        } else if (data.isWildcardType()) {
            this.wildcardTypes.put(index.asType(), data.asWildcardType());
        } else if (data.isTypeVariable()) {
            this.typeVariables.put(index.asTypeVariable(), data);
        }
        return index;
    }

    @Override
    public boolean contains(TypeData data) {
        return this.data.contains(data);
    }

    @Override
    public TypeOrTypeVariableID getID(TypeData type) {
        if (type.isRawType()) {
            return getID(type.asRawType());
        } else if (type.isParameterizedType()) {
            return getID(type.asParameterizedType());
        } else if (type.isWildcardType()) {
            return getID(type.asWildcardType());
        } else if (type.isTypeVariable()) {
            return getID(type.asTypeVariable());
        }
        throw new UnsupportedOperationException("Unsupported TypeData.");
    }

    @Override
    public TypeID getID(RawClassData type) {
        return this.data.get(type).asType();
    }

    @Override
    public TypeID getID(ParameterizedTypeData type) {
        return this.data.get(type).asType();
    }

    @Override
    public TypeID getID(WildcardTypeData type) {
        return this.data.get(type).asType();
    }

    @Override
    public TypeVariableID getID(TypeVariableData type) {
        return this.data.get(type).asTypeVariable();
    }

    @Override
    public TypeData getType(TypeID id) {
        return this.data.get(id);
    }

    @Override
    public void clear() {
        this.data.clear();
        this.rawTypes.clear();
        this.parameterizedTypes.clear();
        this.wildcardTypes.clear();
        this.typeVariables.clear();
        TypeManager.INSTANCE.clear();
    }

    public void generateAllTypes() {
        int count = 0;
        int maxIterations = 100;
        TypeOrTypeVariableID currentType = this.data.getFirstIndex();
        TypeOrTypeVariableID lastType = this.data.getLastIndex();
        while (currentType != lastType && count < maxIterations) {
            LOG.info("Pre-Generating all types from {} to {}", currentType, lastType);
            for (var typeData : this.data.getValuesBetween(currentType, lastType).toArray(TypeData[]::new)) {
                try {
                    typeData.toJSON(); // Ensure the type data is initialized
                } catch (final Throwable e) {
                    LOG.error("Failed to initialize type data: {}", typeData, e);
                }
            }
            currentType = lastType;
            lastType = this.data.getLastIndex();
            count++;
        }
        if (count >= maxIterations) {
            LOG.warn("Reached maximum iterations while generating all types. Some types may not be fully initialized.");
        } else {
            LOG.info("Successfully Pre-generated all types from {} to {}", this.data.getFirstIndex(), lastType);
        }
    }

    @Override
    public JsonElement toJSON() {
        var json = new JsonArray();
        generateAllTypes();
        var entries = this.data
                .getValues()
                .stream()
                .parallel()
                .sorted()
                .map((typeData) -> Map.entry(typeData, typeData.getIndex()))
                .toList();
        for (int i = 0; i < entries.size(); i++) {
            var entry = entries.get(i);
            var typeData = entry.getKey();
            var index = entry.getValue();
            if (typeData == null || index == null) {
                LOG.error("Type data or index is null at index: {}", i);
                continue;
            }
            if (index.getArrayIndex() != i) {
                LOG.error("Type data index mismatch at index: {}, expected: {}", i, index.getArrayIndex());
                continue;
            }
            json.add(typeData.toJSON());
        }
        return json;
    }

    public static class TypeIdentifier extends ArrayIdentifier implements TypeID {

        public TypeIdentifier(int arrayIndex) {
            super(arrayIndex);
        }

        @Override
        public TypeIdentifier getSelfWithReference() {
            super.getSelfWithReference();
            return this;
        }
    }

    public static class TypeVariableIdentifier extends ArrayIdentifier implements TypeVariableID {

        public TypeVariableIdentifier(int arrayIndex) {
            super(arrayIndex);
        }

        @Override
        public TypeVariableIdentifier getSelfWithReference() {
            super.getSelfWithReference();
            return this;
        }
    }
}
