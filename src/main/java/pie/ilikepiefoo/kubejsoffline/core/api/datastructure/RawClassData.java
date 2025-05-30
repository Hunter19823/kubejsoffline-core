package pie.ilikepiefoo.kubejsoffline.core.api.datastructure;

import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.AnnotatedData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.ModifierData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.NamedData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.TypeData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.PackageID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeVariableID;

import java.util.List;


public interface RawClassData extends AnnotatedData, NamedData, ModifierData, TypeData {
    List<TypeVariableID> getTypeParameters();

    PackageID getPackage();

    TypeID getSuperClass();

    List<TypeID> getInterfaces();

    List<TypeID> getInnerClasses();

    TypeID getEnclosingClass();

    TypeID getDeclaringClass();

    List<FieldData> getFields();

    List<ConstructorData> getConstructors();

    List<MethodData> getMethods();


    @Override
    default boolean isRawType() {
        return true;
    }

    @Override
    default RawClassData asRawType() {
        return this;
    }

}
