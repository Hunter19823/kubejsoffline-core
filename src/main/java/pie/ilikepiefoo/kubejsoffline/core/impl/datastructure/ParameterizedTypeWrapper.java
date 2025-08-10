package pie.ilikepiefoo.kubejsoffline.core.impl.datastructure;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.ParameterizedTypeData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeOrTypeVariableID;
import pie.ilikepiefoo.kubejsoffline.core.impl.CollectionGroup;
import pie.ilikepiefoo.kubejsoffline.core.util.json.JSONProperty;

import java.lang.reflect.ParameterizedType;
import java.util.List;
import java.util.Optional;

public class ParameterizedTypeWrapper implements ParameterizedTypeData {
    protected final CollectionGroup collectionGroup;
    protected final ParameterizedType parameterizedType;
    protected TypeID index;
    protected List<TypeOrTypeVariableID> actualTypeArguments;
    protected TypeID ownerType;
    protected TypeID rawType;

    public ParameterizedTypeWrapper(CollectionGroup collectionGroup, ParameterizedType parameterizedType) {
        this.collectionGroup = collectionGroup;
        this.parameterizedType = parameterizedType;
    }

    @Override
    public TypeID getIndex() {
        return index;
    }

    @Override
    public ParameterizedTypeData setIndex(TypeOrTypeVariableID index) {
        this.index = index.asType();
        return this;
    }

    @Override
    public JsonElement toJSON() {
        var json = new JsonObject();
        addTo(json, JSONProperty.RAW_PARAMETERIZED_TYPE.jsName, this::getRawType);
        addTo(json, JSONProperty.OWNER_TYPE.jsName, this::getOwnerType);
        json.add(JSONProperty.TYPE_VARIABLES.jsName, JSONSerializable.of(getActualTypeArguments()));
        if (json.size() == 0) {
            LOG.warn("Attempted to serialize an empty ParameterizedTypeWrapper, returning null.");
            return null; // No data to serialize
        }
        return json;
    }

    @Override
    public synchronized TypeID getRawType() {
        if (rawType != null) {
            return rawType;
        }
        return this.rawType = collectionGroup.of(parameterizedType.getRawType()).asType();
    }

    @Override
    public synchronized List<TypeOrTypeVariableID> getActualTypeArguments() {
        if (actualTypeArguments != null) {
            return actualTypeArguments;
        }
        this.actualTypeArguments = collectionGroup.of(parameterizedType.getActualTypeArguments());
        if (this.actualTypeArguments.size() != parameterizedType.getActualTypeArguments().length) {
            throw new IllegalStateException("Mismatch in actual type arguments size for " + parameterizedType);
        }
        return this.actualTypeArguments;
    }

    @Override
    public synchronized TypeID getOwnerType() {
        if (ownerType != null) {
            return ownerType;
        }

        if (parameterizedType.getOwnerType() == null) {
            return null;
        }

        return this.ownerType = collectionGroup.of(parameterizedType.getOwnerType()).asType();
    }

    @Override
    public int hashCode() {
        return Optional.ofNullable(this.index).map(TypeOrTypeVariableID::hashCode).orElse(super.hashCode());
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }
        if (this == obj) {
            return true;
        }
        return this.hashCode() == obj.hashCode();
    }
}
