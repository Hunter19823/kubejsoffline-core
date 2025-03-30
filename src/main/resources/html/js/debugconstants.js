// This file does not get included in the build, but is used for
// ide Type hinting and debugging.

function Props() {
    // Compression Tag Properties
    this.VERSION = "v";

    // NEW DATA TAG Properties
    this.TYPE_NAME = "type_name";
    this.TYPE_VARIABLES = "v";
    this.TYPE_VARIABLE_NAME = "n";
    this.TYPE_VARIABLE_BOUNDS = "b";

    this.ARRAY_TYPE = "array_type";
    this.ARRAY_NAME = "array_name";

    this.WILDCARD_TYPE = "w";
    this.WILDCARD_UPPER_BOUNDS = "u";
    this.WILDCARD_LOWER_BOUNDS = "l";

    this.CLASS_REFERENCE = "class_reference";
    this.CLASS_PARAMETERIZED_ARGUMENTS = "class_parameterized_arguments";
    this.CLASS_NAME = "n";

    // DATA TAG Properties
    this.TYPE_ID = "type_id";
    this.TYPE_IDENTIFIER = "type_identifier";
    this.RAW_CLASS = "r";
    this.OUTER_CLASS = "outer_class";
    this.SUPER_CLASS = "s";
    this.GENERIC_SUPER_CLASS = "S";
    this.INTERFACES = "i";
    this.GENERIC_INTERFACES = "I";
    this.PACKAGE_NAME = "P";
    this.ANNOTATIONS = "a";
    this.MODIFIERS = "M";
    this.CONSTRUCTORS = "c";
    this.FIELDS = "f";
    this.METHODS = "m";
    this.PARAMETERS = "p";
    this.VALUE = "raw_value";

    this.ARRAY_DEPTH = "depth";
    this.PARAMETERIZED_ARGUMENTS = PARAMETERS.jsName;
    this.RAW_PARAMETERIZED_TYPE = "r";
    this.OWNER_TYPE = "o";

    this.PARAMETER_NAME = "n";
    this.PARAMETER_TYPE = "t";
    this.PARAMETER_ANNOTATIONS = "parameter_annotations";

    this.CONSTRUCTOR_ANNOTATIONS = ANNOTATIONS.jsName;

    this.METHOD_NAME = "n";
    this.METHOD_RETURN_TYPE = "t";

    this.FIELD_NAME = "n";
    this.FIELD_TYPE = "t";

    this.ANNOTATION_TYPE = "t";
    this.ANNOTATION_STRING = "s";

    this.BINDING_TYPE = "btype";
    this.BINDING_TYPE_CLASS = "class";
    this.BINDING_TYPE_ENUM = "enum";
    this.BINDING_TYPE_MAP = "map";
    this.BINDING_TYPE_PRIMITIVE = "primitive";
    this.BINDING_STRING = "s";
    this.BINDING_FUNCTION = "f";
    this.BINDING_OBJECT = "o";
    this.EXCEPTIONS = "e";
    this.INNER_CLASSES = "I";
    this.ENCLOSING_CLASS = "E";
    this.DECLARING_CLASS = "D";
}

const PROPERTY = new Props();

const DATA = {
    types: [],
    parameters: [],
    packages: [],
    names: [],
    annotations: []
}

const STRING_COMPRESSION_DATA = []

const RELATIONS = [
    "UNKNOWN",
    "TYPE_VARIABLE_OF",
    "COMPONENT_OF",
    "INNER_TYPE_OF",
    "SUPER_CLASS_OF",
    "IMPLEMENTATION_OF",
    "ANNOTATION_OF",
    "DECLARED_FIELD_TYPE_OF",
    "DECLARED_METHOD_RETURN_TYPE_OF",
    "DECLARED_METHOD_PARAMETER_TYPE_OF",
    "DECLARED_METHOD_EXCEPTION_TYPE_OF",
    "CONSTRUCTOR_PARAMETER_TYPE_OF",
    "CONSTRUCTOR_EXCEPTION_TYPE_OF",
]

const PACKAGE_COMPRESSION_DATA = [
    "java.lang",
    "java.util"
]


const EVENTS = {
    "dev.latvian.mods.kubejs.event.EventJS": [],
    "net.fabricmc.fabric.api.event.Event": [],
    "dev.architectury.event.Event": [],
    "dev.latvian.mods.kubejs.recipe.RecipeJS": [],
    "net.minecraftforge.eventbus.api.Event": []
}

BINDINGS = {
    "global": [
        [
            "GlobalMap",
            1828,
            {
                "key1": "value1",
                "key2": "value2"
            }
        ],
        [
            "GlobalClass",
            229
        ]
    ]
}