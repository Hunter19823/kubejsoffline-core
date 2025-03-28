package pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property;

import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.ParameterID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeVariableID;

import java.util.List;

public interface ExecutableData extends JSONSerializable {
    List<TypeVariableID> getTypeParameters();

    List<TypeID> getExceptions();

    List<ParameterID> getParameters();
}
