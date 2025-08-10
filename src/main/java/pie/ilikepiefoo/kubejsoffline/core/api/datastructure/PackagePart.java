package pie.ilikepiefoo.kubejsoffline.core.api.datastructure;

import pie.ilikepiefoo.kubejsoffline.core.api.collection.Packages;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.IndexedData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.IndexGenerator;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.PackageID;

public interface PackagePart extends IndexedData<PackageID>, IndexGenerator {
    default String getFullName(Packages packages) {
        if (getPrefix() != null) {
            return packages.getPackage(getPrefix()).getFullName(packages) + "." + getName();
        }
        return getName();
    }

    @Override
    default void index() {
        getName();
        getPrefix();
    }

    String getName();

    PackageID getPrefix();
}
