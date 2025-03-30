package pie.ilikepiefoo.kubejsoffline.core.impl;

import pie.ilikepiefoo.kubejsoffline.core.api.DocumentationBridge;
import pie.ilikepiefoo.kubejsoffline.core.api.DocumentationProvider;
import pie.ilikepiefoo.kubejsoffline.core.api.ReflectionHelper;
import pie.ilikepiefoo.kubejsoffline.core.api.TypeNameMapper;
import pie.ilikepiefoo.kubejsoffline.core.api.context.BindingsProvider;
import pie.ilikepiefoo.kubejsoffline.core.api.context.TypeWrapperProvider;

public record SimpleDocumentationProvider(
        ReflectionHelper getReflectionHelper,
        DocumentationBridge getDocumentationBridge,
        TypeNameMapper getTypeNameMapper,
        BindingsProvider getBindingsProvider,
        TypeWrapperProvider getTypeWrapperProvider
) implements DocumentationProvider {
    public SimpleDocumentationProvider(
            ReflectionHelper reflectionHelper,
            DocumentationBridge bridge,
            TypeNameMapper mapper
    ) {
        this(reflectionHelper, bridge, mapper, BindingsProvider.of(), TypeWrapperProvider.of());
    }

    public static class Builder {
        private ReflectionHelper reflectionHelper;
        private DocumentationBridge bridge;
        private TypeNameMapper mapper;
        private BindingsProvider bindingsProvider;
        private TypeWrapperProvider typeWrapperProvider;

        public Builder() {
            this.reflectionHelper = new DefaultReflectionHelper();
            this.bridge = new ResourceDocumentationBridge();
            this.mapper = null;
            this.bindingsProvider = BindingsProvider.of();
            this.typeWrapperProvider = TypeWrapperProvider.of();
        }

        public static Builder create() {
            return new Builder();
        }

        public Builder setReflectionHelper(ReflectionHelper reflectionHelper) {
            this.reflectionHelper = reflectionHelper;
            return this;
        }

        public Builder setDocumentationBridge(DocumentationBridge bridge) {
            this.bridge = bridge;
            return this;
        }

        public Builder setTypeNameMapper(TypeNameMapper mapper) {
            this.mapper = mapper;
            return this;
        }

        public Builder setBindingsProvider(BindingsProvider bindingsProvider) {
            this.bindingsProvider = bindingsProvider;
            return this;
        }

        public Builder setTypeWrapperProvider(TypeWrapperProvider typeWrapperProvider) {
            this.typeWrapperProvider = typeWrapperProvider;
            return this;
        }

        public SimpleDocumentationProvider build() {
            return new SimpleDocumentationProvider(reflectionHelper, bridge, mapper, bindingsProvider, typeWrapperProvider);
        }
    }
}
