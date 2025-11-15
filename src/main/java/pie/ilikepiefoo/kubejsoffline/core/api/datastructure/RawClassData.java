package pie.ilikepiefoo.kubejsoffline.core.api.datastructure;

import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.AnnotatedData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.ModifierData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.NamedData;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.TypeData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.IndexGenerator;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.MethodID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.PackageID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeID;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.TypeVariableID;

import java.util.List;


public interface RawClassData extends AnnotatedData, NamedData, ModifierData, TypeData, IndexGenerator {
    @Override
    default boolean isRawType() {
        return true;
    }

    @Override
    default RawClassData asRawType() {
        return this;
    }

    @Override
    default void index() {
        getPackage();
        getName();
        getSuperClass();
        getInterfaces();
        getInnerClasses();
        getEnclosingClass();
        getDeclaringClass();
        getAnnotations();
        getTypeParameters();
        getConstructors();
        getFields();
        getMethods();
    }

    PackageID getPackage();

    TypeID getSuperClass();

    List<TypeID> getInterfaces();

    List<TypeID> getInnerClasses();

    TypeID getEnclosingClass();

    TypeID getDeclaringClass();

    List<TypeVariableID> getTypeParameters();

    List<ConstructorData> getConstructors();

    List<FieldData> getFields();

    List<MethodID> getMethods();
}
