function changeURL(url) {
    console.log("Changing URL to: " + url);
    const oldScrollY = window.scrollY;
    const oldScrollX = window.scrollX;
    history.pushState("", document.title, window.location.pathname + url);

    onHashChange();
    window.scrollTo(oldScrollX, window.scrollY);
}

function changeURLFromElement(element) {
    changeURL(element.getAttribute('href'));
}

function createLink(element, id, rawId = null, focus = null) {
    element.classList.add('link');
    let redirect = id;
    if (rawId) {
        redirect = rawId;
    }
    redirect = getClass(redirect).fullyQualifiedName();

    if (!redirect.match(/([a-z][a-z_0-9]*\.)+[A-Z_]($[A-Z_]|[\w_])*/)) {
        if (rawId) {
            redirect = rawId;
        } else {
            redirect = id;
        }
    }

    if (focus) {
        redirect += `?focus=${focus}`;
    }
    element.setAttribute('href', `#${redirect}`);
    element.setAttribute('onclick', 'changeURLFromElement(this);');

    return element;
}

function createShortLink(id, typeVariableMap = {}) {
    const target = getClass(id);
    target.withTypeVariableMap(typeVariableMap);
    const shortSignature = createLinkableSignature(
        id,
        new signature_parameters()
            .setTypeVariableMap(target.getTypeVariableMap())
            .setAppendPackageName(false)
            .setDefiningTypeVariable(false),
    );
    if (target.isRawClass()) {
        const typeVariables = target.getTypeVariables();
        if (typeVariables.length === 0) {
            return shortSignature;
        }
    }
    return shortSignature;
}

function createFullSignature(id, typeVariableMap = {}) {
    const target = getClass(id);
    target.withTypeVariableMap(typeVariableMap);
    const fullSignature = createLinkableSignature(
        id,
        new signature_parameters()
            .setTypeVariableMap(target.getTypeVariableMap())
            .setAppendPackageName(true)
            .setDefiningTypeVariable(false)
    );
    return fullSignature;
}

/**
 * This function creates a html element representing a method.
 * @param method{Method} The method being represented
 * @returns {HTMLSpanElement} The html element representing the method
 */
function createMethodSignature(method) {
    let out = document.createElement('span');
    let parameters = method.parameters();
    let name = span(method.name());
    appendAnnotationToolTip(name, method.annotations());
    out.append(span(MODIFIER.toString(method.modifiers()) + " "));
    out.append(createShortLink(method.type(), method.getTypeVariableMap()));
    out.append(' ');
    out.append(name);
    out.append('(');
    for (let i = 0; i < parameters.length; i++) {
        out.append(createParameterSignature(parameters[i]));
        if (i < parameters.length - 1) {
            out.append(', ');
        }
    }
    out.append(')');
    return out;
}

/**
 * Creates a parameter signature HTML element.
 * @param parameter {Parameter} The parameter to create a signature for.
 * @returns {HTMLSpanElement} the html element representing the parameter
 */
function createParameterSignature(parameter) {
    let output = span();
    output.append(createShortLink(parameter.getType(), parameter.getTypeVariableMap()));
    output.append(' ');
    output.append(appendAnnotationToolTip(span(parameter.getName()), parameter.getAnnotations()));
    return output;
}

/**
 * This function creates a html element representing a field.
 * @param {Field} field Created from the Field class
 * @returns {HTMLSpanElement}
 */
function createFieldSignature(field) {
    let out = document.createElement('span');
    let name = span(field.getName());
    appendAnnotationToolTip(name, field.getAnnotations());
    out.append(span(MODIFIER.toString(field.getModifiers()) + " "));
    out.append(createShortLink(field.getType(), field.getTypeVariableMap()));
    out.append(' ');
    out.append(name);
    return out;
}

/**
 * This function creates a html element representing list of parameters.
 * @param holder {ParametersHolder} The parameters to create a signature for.
 * @returns {HTMLSpanElement} the html element representing the parameters
 */
function createParametersSignature(holder) {
    return tagJoiner(
        holder.getParameters(),
        ", ",
        (param) => createParameterSignature(param)
    )
}

/**
 * Creates a constructor signature HTML element.
 * @param constructor {Constructor} The constructor to create a signature for.
 * @returns {HTMLSpanElement} the html element representing the constructor
 */
function createConstructorSignature(constructor) {
    let type = constructor.getDeclaringClassWrapped();
    let out = document.createElement('span');
    let parameters = constructor.getParameters();
    let param = null;
    let name = null;
    out.append(span(MODIFIER.toString(constructor.getModifiers()) + " "));
    out.append(createShortLink(type.id(), type.getTypeVariableMap()));
    out.append('(');
    for (let i = 0; i < parameters.length; i++) {
        param = parameters[i];
        out.appendChild(createShortLink(param.type(), param.getTypeVariableMap()));
        name = span(param.name());
        appendAnnotationToolTip(name, param.annotations());
        out.append(' ');
        out.append(name);
        if (i < parameters.length - 1) {
            out.append(', ');
        }
    }
    out.append(')');
    return out;
}

/**
 * This function creates a html element representing an annotation.
 *
 * @param {Annotation} annotation
 * @returns {HTMLSpanElement}
 */
function createAnnotationSignature(annotation) {
    let out = document.createElement('span');
    let type = getClass(annotation.type());
    let annotation_string = `@${type.getFullyQualifiedName()}(${annotation.string()})`;
    out.append(annotation_string);
    return out;
}

/**
 * Creates a full type variable signature HTML element.
 *
 * @param holder {TypeVariablesHolder & TypeVariableMapHolder} The type variable and type variable map holder
 * @param full {boolean} Whether to create a full signature or a short one
 * @returns {HTMLSpanElement}
 */
function createTypeVariableSignature(holder, full = true) {
    return tagJoiner(
        holder.getTypeVariables(),
        ", ",
        (typeVariable) => full ? createFullSignature(typeVariable, holder.getTypeVariableMap()) : createShortLink(typeVariable, holder.getTypeVariableMap()),
    )
}

function appendAttributesToClassTableRow(row, table_id, clazz) {
    row.setAttribute('mod', clazz.modifiers());
    row.setAttribute('name', clazz.referenceName());
    row.setAttribute('type', clazz.id());
    row.setAttribute('row-type', 'class');
    row.id = `${table_id}-${clazz.getReferenceName()}`;
    // Add a link td to the row
    addLinkToTableRow(row, row.id);
    // row.setAttribute('declared-in', clazz);
}


function appendAttributesToBindingTableRow(row, table_id, binding) {
    let clazz = getClass(binding.getType());
    row.setAttribute('mod', clazz.modifiers());
    row.setAttribute('name', binding.getName());
    row.setAttribute('type', binding.getType());
    row.setAttribute('row-type', 'binding');
    row.id = `${table_id}-${binding.getName()}`;
    // Add a link td to the row
    addLinkToTableRow(row, row.id);
    // row.setAttribute('declared-in', clazz);
}

function appendAttributesToMethodTableRow(row, table_id, class_id, method) {
    row.setAttribute('mod', method.modifiers());
    row.setAttribute('name', method.name());
    row.setAttribute('type', method.type());
    row.setAttribute('declared-in', class_id);
    row.setAttribute('parameters', method.parameters().length);
    row.setAttribute('row-type', 'method');
    row.setAttribute('dataIndex', method.dataIndex());

    row.id = `${table_id}-${getClass(class_id).getReferenceName()}-${method.id()}`;
    addLinkToTableRow(row, row.id);
}

function appendAttributesToFieldTableRow(row, table_id, field) {
    row.setAttribute('mod', field.modifiers());
    row.setAttribute('name', field.name());
    row.setAttribute('type', field.type());
    row.setAttribute('declared-in', field.getDeclaringClass());
    row.setAttribute('row-type', 'field');
    row.setAttribute('dataIndex', field.dataIndex());
    row.id = `${table_id}-${field.id()}`;
    addLinkToTableRow(row, row.id);
}

function appendAttributesToConstructorTableRow(row, table_id, constructor) {
    row.setAttribute('mod', constructor.modifiers());
    row.setAttribute('parameters', constructor.parameters().length);
    row.setAttribute('declared-in', constructor.getDeclaringClass());
    row.setAttribute('row-type', 'constructor');
    row.setAttribute('dataIndex', constructor.dataIndex());
    row.id = `${table_id}-${constructor.id()}`;
    addLinkToTableRow(row, row.id);
}

function appendAttributesToRelationshipToTableRow(row, class_id, relationshipName) {
    const clazz = getClass(class_id);
    row.setAttribute('type', clazz.id());
    row.setAttribute('mod', clazz.modifiers());
    row.setAttribute('name', clazz.referenceName());
    row.setAttribute('row-type', 'relationship');

    row.id = clazz.id();
    addLinkToTableRow(row, class_id);
}

function handleClickLink(element) {
    LINK_MAP[element.id]();
}

function createLinkSpan(action) {
    let clipboard = span('\u{1F517}');
    clipboard.setAttribute('class', 'clickable');
    clipboard.setAttribute('title', 'Copy Link to clipboard');
    clipboard.setAttribute('onclick', 'handleClickLink(this)');
    // Assign a random ID to the span
    clipboard.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Add the action to the map
    LINK_MAP[clipboard.id] = () => {
        clipboard = document.getElementById(clipboard.id);
        action();
        // Change the innerHTML to a checkmark
        clipboard.innerText = '\u{2714}';
        // Wait 2 seconds
        setTimeout(() => {
            // Change the innerHTML back to a clipboard
            clipboard.innerText = '\u{1F517}';
        }, 2000);
    };
    return clipboard;
}

function copyLinkToClipboard(link, currentElementID = null) {
    return createLinkSpan(() => {
        navigator.clipboard.writeText(link).then(r => console.log("Successfully Copied link to clipboard"));
        if (currentElementID) {
            console.log("Focusing link element: " + currentElementID);
            focusElement(currentElementID);
        }
    });
}


function addMethodToTable(table, classID, method) {
    let row = addRow(table, href(span(classID), `#${getClass(classID).fullyQualifiedName()}`), createMethodSignature(method), createFullSignature(classID));
    appendAttributesToMethodTableRow(row, table.id, classID, method);
}

function addFieldToTable(table, field) {
    let row = addRow(table, href(span(field.getDeclaringClass()), `#${getClass(field.getDeclaringClass()).fullyQualifiedName(field.getTypeVariableMap())}`), createFieldSignature(field), createFullSignature(field.getDeclaringClass()));
    appendAttributesToFieldTableRow(row, table.id, field);
}