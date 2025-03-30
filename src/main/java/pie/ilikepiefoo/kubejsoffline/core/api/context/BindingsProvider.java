package pie.ilikepiefoo.kubejsoffline.core.api.context;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import pie.ilikepiefoo.kubejsoffline.core.api.JSONSerializable;

import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Stack;

public interface BindingsProvider extends JSONSerializable {
    static BindingsProvider of(Iterable<Binding> bindings) {
        return () -> bindings;
    }

    static BindingsProvider of(Binding... bindings) {
        return () -> Arrays.asList(bindings);
    }

    default JsonElement toJSON() {
        JsonObject bindingsObject = new JsonObject();
        // Process the bindings
        var bindings = getBindings();
        Map<String, Set<Binding>> scopeBasedBindings = new HashMap<>();
        Stack<Binding> stack = new Stack<>();
        for (Binding binding : bindings) {
            for (String scope : binding.getScopes()) {
                scopeBasedBindings.computeIfAbsent(scope, k -> new HashSet<>()).add(binding);
            }
            stack.push(binding);
        }
        // Process the bindings
        for (Binding binding : stack) {
            // If the number of scopes for the binding is equal to the number of scopes in the map, then this is a global binding.
            // Otherwise, this is a scope-specific binding.
            boolean isGlobal = binding.getScopes().size() == scopeBasedBindings.size() || binding.getScopes().isEmpty();
            Iterable<String> scopes = isGlobal ? List.of("global") : binding.getScopes();
            for (String scope : scopes) {
                if (!bindingsObject.has(scope)) {
                    bindingsObject.add(scope, new JsonArray());
                }
                JsonArray array = bindingsObject.getAsJsonArray(scope);
                array.add(binding.toJSON());
            }
        }

        return bindingsObject;
    }

    /**
     * Get the list of bindings for this provider.
     *
     * @return The list of bindings for this provider.
     */
    Iterable<Binding> getBindings();
}
