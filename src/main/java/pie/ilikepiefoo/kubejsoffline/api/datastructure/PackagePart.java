package pie.ilikepiefoo.kubejsoffline.api.datastructure;

import pie.ilikepiefoo.kubejsoffline.api.collection.Packages;
import pie.ilikepiefoo.kubejsoffline.api.datastructure.property.IndexedData;
import pie.ilikepiefoo.kubejsoffline.api.identifier.PackageID;

public interface PackagePart extends IndexedData<PackageID> {
    String getName();


    PackageID getPrefix();

    default String getFullName(Packages packages) {
        if (getPrefix() != null) {
            return packages.getPackage(getPrefix()).getFullName(packages) + "." + getName();
        }
        return getName();
    }
}
