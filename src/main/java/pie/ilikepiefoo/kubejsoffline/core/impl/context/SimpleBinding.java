package pie.ilikepiefoo.kubejsoffline.core.impl.context;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import pie.ilikepiefoo.kubejsoffline.core.api.context.Binding;
import pie.ilikepiefoo.kubejsoffline.core.impl.TypeManager;

import java.lang.reflect.Executable;
import java.lang.reflect.Type;
import java.util.HashSet;
import java.util.Set;
import java.util.function.Supplier;

public record SimpleBinding(String getName, Type getType, Set<String> getScopes, Supplier<JsonElement> data) implements Binding {

    @Override
    public JsonElement getData() {
        return data != null ? data.get() : null;
    }

    public static class Builder {
        private String name;
        private Type type;
        private Set<String> scopes = Set.of();
        private Supplier<JsonElement> data;

        public Builder(String name, Type type) {
            this.name = name;
            this.type = type;
        }

        public static Builder from(String name, Type type) {
            return new Builder(name, type);
        }

        public static Builder from(String name, Executable executable) {
            if (executable == null) {
                throw new NullPointerException("Executable cannot be null");
            }
            var data = TypeManager.INSTANCE.getData(executable);
            return new Builder(name, data.getClass())
                    .setData(data::toJSON);
        }

        public Builder setData(Supplier<JsonElement> data) {
            this.data = data;
            return this;
        }

        public static Builder from(String name, Object object) {
            if (object == null) {
                throw new NullPointerException("Object cannot be null");
            }
            return new Builder(name, object.getClass())
                    .setData(() -> new Gson().toJsonTree(object));
        }

        public static Builder from(String name, Class<? extends Enum<?>> enumClass) {
            if (enumClass == null) {
                throw new NullPointerException("Enum class cannot be null");
            }
            return new Builder(name, enumClass)
                    .setData(() -> new Gson().toJsonTree(enumClass.getEnumConstants()));
        }

        public static Builder from(Binding binding) {
            return new Builder(binding.getName(), binding.getType())
                    .setScopes(binding.getScopes())
                    .setData(binding.getData());
        }

        public Builder setData(JsonElement data) {
            this.data = () -> data;
            return this;
        }

        public Builder setScopes(Set<String> scopes) {
            this.scopes = scopes;
            return this;
        }

        public Builder setName(String name) {
            this.name = name;
            return this;
        }

        public Builder setType(Type type) {
            this.type = type;
            return this;
        }

        public Builder addScope(String scope) {
            this.scopes = new HashSet<>(this.scopes);
            this.scopes.add(scope);
            return this;
        }

        public SimpleBinding build() {
            return new SimpleBinding(name, type, scopes, data);
        }
    }
}
