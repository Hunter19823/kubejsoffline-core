package pie.ilikepiefoo.kubejsoffline.core.impl.collection;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonNull;
import com.google.gson.JsonPrimitive;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;
import pie.ilikepiefoo.kubejsoffline.core.api.collection.Names;
import pie.ilikepiefoo.kubejsoffline.core.api.datastructure.property.IndexedData;
import pie.ilikepiefoo.kubejsoffline.core.api.identifier.NameID;
import pie.ilikepiefoo.kubejsoffline.core.impl.identifier.IdentifierBase;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Objects;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class SplitNameCollection implements Names {
    protected final TwoWayMap<NameID, NamePartIdentifier> data = new TwoWayMap<>(SplitNameCollection.NameIdentifier::new);
    protected Map<String, NameID> parts = new HashMap<>();

    private static int findEndIndexForPart(String name) {
        if (name.length() == 1) {
            return 0; // If the name is a single character, return 0 as the end index.
        }
        char previous = name.charAt(name.length() - 1);
        int lastIndex = name.length();
        for (int i = name.length() - 2; i >= 0; i--) {
            char current = name.charAt(i);

            boolean isCurrentAlphabetic = Character.isAlphabetic(current);
            boolean isCurrentUpperCase = Character.isUpperCase(current);
            boolean isCurrentDigit = Character.isDigit(current);
            boolean isCurrentNonAlphaNumeric = !(isCurrentAlphabetic || isCurrentDigit);

            boolean isPreviousAlphabetic = Character.isAlphabetic(previous);
            boolean isPreviousUpperCase = Character.isUpperCase(previous);
            boolean isPreviousDigit = Character.isDigit(previous);
            boolean isPreviousNonAlphaNumeric = !(isPreviousAlphabetic || isPreviousDigit);

            boolean isAlphabetic = isCurrentAlphabetic && isPreviousAlphabetic;
            boolean isDigit = isCurrentDigit && isPreviousDigit;
            boolean isNonAlphaNumeric = isCurrentNonAlphaNumeric && isPreviousNonAlphaNumeric;
            boolean isSameCase = (isPreviousUpperCase == isCurrentUpperCase);
            boolean isContinuation = isNonAlphaNumeric || isDigit || (isAlphabetic && isSameCase);
            if (!isContinuation) {
                // Scenarios where we change the lastIndex:
                // getName -> get|Name -> don't change lastIndex to include the 'N'
                // Rule, going from a lower case to an upper case character, we don't change the lastIndex.
                // getJWT -> get|JWT -> add one character to the lastIndex to include the 'J'
                // Rule, going from an upper case to a lower case character, we change the lastIndex.
                // DERIVATION_LIST -> DERIVATION|_|LIST -> add one character to the lastIndex to include the '_'
                // Rule, going from an alphabetic to a non-alphabetic character, we change the lastIndex.
                // get1234 -> get|1234 -> don't change lastIndex to include the '1'
                // Rule, going from a digit to non-alphanumeric, we don't change the lastIndex.

                if ((isCurrentUpperCase && !isPreviousUpperCase) && isAlphabetic) {
                    // Left to right, going from upper case to lower case, we do not change the lastIndex.
                    lastIndex = i;
                } else if (!isCurrentUpperCase && isPreviousUpperCase) {
                    // Left to right, going from lower case to upper case, we change the lastIndex.
                    lastIndex = i + 1;
                } else if (!isCurrentAlphabetic && isPreviousAlphabetic) {
                    // Left to right, going from non-alphabetic to alphabetic, we change the lastIndex.
                    lastIndex = i + 1;
                } else if (!isCurrentDigit && isPreviousDigit) {
                    // Left to right, going from non-digit to digit, we do not change the lastIndex.
                    lastIndex = i + 1;
                } else if (!isCurrentNonAlphaNumeric && isPreviousNonAlphaNumeric) {
                    // Left to right, going from non-alphanumeric to alphanumeric, we change the lastIndex.
                    lastIndex = i + 1;
                } else {
                    throw new IllegalArgumentException("States has not been implemented.");
                }

                break;
            }
            previous = current;
            if (i == 0) {
                lastIndex = i;
            }
        }
        return lastIndex;
    }

    private static String[] getSplitName(String name) {
        // Split the name into parts based on the last index found
        List<String> parts = new ArrayList<>();

        int leftIndex = findEndIndexForPart(name);
        String prefix = name.substring(0, leftIndex);
        String partName = name.substring(leftIndex);
        parts.add(partName);
        while (leftIndex > 0) {
            leftIndex = findEndIndexForPart(prefix);
            partName = prefix.substring(leftIndex);
            prefix = prefix.substring(0, leftIndex);
            parts.add(partName);
        }
        String[] reversedParts = parts.toArray(new String[0]);
        // Reverse the parts to maintain the original order
        for (int i = 0; i < reversedParts.length; i++) {
            reversedParts[i] = parts.get(reversedParts.length - i - 1);
        }
        parts.clear();
        return reversedParts;
    }

    @Override
    public NavigableMap<NameID, String> getAllNames() {
        return this.data.getIndexToValueMap().entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, entry -> entry.getValue().toString(), (e1, e2) -> e1, // In case of duplicates, keep the first one
                TreeMap::new));
    }

    @Override
    public boolean contains(String name) {
        return this.parts.containsKey(name);
    }

    @Override
    public synchronized NameID addName(String name) {
        if (name == null) {
            throw new IllegalArgumentException("Name cannot be null!");
        }
        if (name.isBlank()) {
            throw new IllegalArgumentException("Name cannot be blank!");
        }
        if (this.parts.containsKey(name)) {
            return this.parts.get(name);
        }
        var result =  indexName(name);
        if (result == null) {
            throw new IllegalArgumentException("Failed to index name: " + name);
        }
        if (!result.toString().equalsIgnoreCase(name)) {
            throw new IllegalArgumentException("Indexed name does not match original name: " + name + " != " + result);
        }
        return result;
    }

    @Override
    public void clear() {
        this.data.clear();
        this.parts.clear();
    }

    private synchronized NameID indexName(String name) {
        // If the name is already in the parts map, return the ID.
        if (this.parts.containsKey(name)) {
            return this.parts.get(name);
        }
        if (name.length() <= 5) {
            // If the name is 3 characters or less, treat it as a SimpleName.
            var namePart = new NamePartIdentifier(name);
            this.data.put(namePart.index, namePart);
            this.parts.put(name, namePart.index);
            return namePart.index;
        }
        String[] splitParts = getSplitName(name);

        if (splitParts.length == 1) {
            String part = splitParts[0];
            if (contains(part)) {
                return this.parts.get(part);
            }

            var namePart = new NamePartIdentifier(name);
            this.data.put(namePart.index, namePart);
            this.parts.put(part, namePart.index);
            return namePart.index;
        }
        // If the name is split into multiple parts, create a NamePartIdentifier for each part.
        // Each part is either a SimpleName or a NamePartIdentifier.
        Either<SimpleName, NameID>[] parts = new Either[splitParts.length];
        for (int i = 0; i < splitParts.length; i++) {
            String part = splitParts[i];
            if (contains(part)) {
                parts[i] = Either.ofRight(this.parts.get(part));
            } else if (part.length() <= 3) {
                parts[i] = Either.ofLeft(new SimpleName(part));
            } else {
                parts[i] = Either.ofRight(indexName(part));
            }
        }

        var namePart = new NamePartIdentifier(parts);
        this.data.put(namePart.index, namePart);
        this.parts.put(name, namePart.index);
        return namePart.index;
    }

    @Override
    public JsonElement toJSON() {
        return JSONSerializable.of(this.data.getValues());
    }

    public class NameIdentifier extends IdentifierBase implements NameID {
        public NameIdentifier(int arrayIndex) {
            super(arrayIndex);
        }

        @Override
        public String toString() {
            return data.get(this).toString();
        }
    }

    public record Either<L extends JSONSerializable, R extends JSONSerializable>(L left, R right) implements JSONSerializable {

        public static <A extends JSONSerializable, B extends JSONSerializable> Either<A, B> ofLeft(A left) {
            return new Either<>(left, null);
        }

        public static <A extends JSONSerializable, B extends JSONSerializable> Either<A, B> ofRight(B right) {
            return new Either<>(null, right);
        }

        @Override
        public JsonElement toJSON() {
            if (left != null) {
                return left.toJSON();
            } else if (right != null) {
                return right.toJSON();
            } else {
                return JsonNull.INSTANCE;
            }
        }

        @Override
        public boolean equals(Object o) {
            if (o == null || getClass() != o.getClass()) {
                return false;
            }

            Either<?, ?> either = (Either<?, ?>) o;
            return Objects.equals(left, either.left) && Objects.equals(right, either.right);
        }

        @Override
        public int hashCode() {
            int result = Objects.hashCode(left);
            result = 31 * result + Objects.hashCode(right);
            return result;
        }
    }

    public record SimpleName(String name) implements JSONSerializable {

        @Override
        public JsonElement toJSON() {
            return new JsonPrimitive(name);
        }
    }

    public class NamePartIdentifier implements IndexedData<NameID> {
        private final Either<SimpleName, NameID>[] parts;
        private NameID index;


        public NamePartIdentifier(String name) {
            this(new Either[]{Either.ofLeft(new SimpleName(name))});
        }

        public NamePartIdentifier(Either<SimpleName, NameID>[] parts) {
            this(data.getIndexFactory().createIndex(data.size()), parts);
        }

        public NamePartIdentifier(NameID index, Either<SimpleName, NameID>[] parts) {
            this.index = index;
            this.parts = parts;
        }

        @Override
        public NameID getIndex() {
            return this.index;
        }

        @Override
        public NamePartIdentifier setIndex(NameID index) {
            this.index = index;
            return this;
        }

        public Either<SimpleName, NameID>[] getParts() {
            return parts;
        }

        @Override
        public JsonElement toJSON() {
            if (parts == null || parts.length == 0) {
                throw new IllegalArgumentException("Parts cannot be null or empty for ID: " + index);
            }
            if (parts.length == 1) {
                return parts[0].toJSON();
            }
            JsonArray json = new JsonArray();
            for (Either<SimpleName, NameID> part : parts) {
                if (part == null) {
                    throw new IllegalArgumentException("No part found for ID: " + index);
                }
                json.add(part.toJSON());
            }
            return json;
        }

        public String getName() {
            if (parts == null || parts.length == 0) {
                throw new IllegalArgumentException("Parts cannot be null or empty for ID: " + index);
            }
            if (parts.length != 1) {
                throw new IllegalArgumentException("Cannot get name from multiple parts for ID: " + index);
            }
            if (parts[0].left == null) {
                throw new IllegalArgumentException("No name found for ID: " + index);
            }
            return parts[0].left.name;
        }

        @Override
        public int hashCode() {
            int result = Objects.hashCode(index);
            result = 31 * result + Arrays.hashCode(parts);
            return result;
        }

        @Override
        public boolean equals(Object o) {
            if (o == null || getClass() != o.getClass()) {
                return false;
            }

            NamePartIdentifier that = (NamePartIdentifier) o;
            return Objects.equals(index, that.index) && Arrays.equals(parts, that.parts);
        }

        @Override
        public String toString() {
            StringBuilder builder = new StringBuilder();

            for (Either<SimpleName, NameID> part : parts) {
                if (part.left != null) {
                    builder.append(part.left.name);
                } else if (part.right != null) {
                    builder.append(data.get(part.right).toString());
                }
            }
            return builder.toString();
        }
    }

}
