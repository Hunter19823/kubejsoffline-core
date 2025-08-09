package pie.ilikepiefoo.kubejsoffline.core.api.collection;

import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.PackagePart;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.PackageID;

import java.util.NavigableMap;

public interface Packages extends JSONSerializable, Iterable<PackagePart>, Lockable {

    NavigableMap<PackageID, PackagePart> getAllPackages();

    PackageID addPackage(String packageName);

    boolean contains(String packageName);

    PackageID getID(String packageName);

    PackageID getID(PackagePart part);

    PackagePart getPackage(PackageID id);

    PackagePart getPackage(String packageName);

    void clear();
}
