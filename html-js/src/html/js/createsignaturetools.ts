type EntityDoc = DocWrapper & Record<string, (...args: never[]) => unknown>;

function changeURL(url: string) {
    console.debug('Changing URL to: ' + url);
    const oldScrollY = window.scrollY;
    const oldScrollX = window.scrollX;
    history.pushState('', document.title, window.location.pathname + url);

    onHashChange();
    window.scrollTo(oldScrollX, window.scrollY);
}

function changeURLFromElement(element: Element) {
    changeURL(element.getAttribute('href') ?? '');
}

function createLink(element: HTMLElement, id: number, rawId: number | null = null, focus: unknown = null) {
    element.classList.add('link');
    let redirect: number | string = id;
    if (rawId) {
        redirect = rawId;
    }
    redirect = getClass(redirect)!.fullyQualifiedName();

    if (!String(redirect).match(/([a-z][a-z_0-9]*\.)+[A-Z_]($[A-Z_]|[\w_])*/)) {
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

function addStringTooltip(tag: HTMLElement, type: unknown) {
    tag.classList.add('tooltip');
    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltiptext');
    tooltip.appendChild(span(String(type)));
    const existingTooltip = tag.querySelector('.tooltiptext');
    if (existingTooltip && existingTooltip.parentNode) {
        existingTooltip.parentNode.removeChild(existingTooltip);
    }
    tag.appendChild(tooltip);
    return tag;
}

function createShortLink(id: number, typeVariableMap: Record<string, number> = {}) {
    const target = getClass(id)!;
    target.withTypeVariableMap(typeVariableMap);
    const shortSignature = createLinkableSignature(
        id,
        new signature_parameters()
            .setTypeVariableMap(typeVariableMap)
            .setAppendPackageName(false)
            .setDefiningTypeVariable(false)
    );
    if (target.isRawClass()) {
        const typeVariables = target.getTypeVariables();
        if (typeVariables.length === 0) {
            return shortSignature;
        }
    }
    return shortSignature;
}

function createFullSignature(id: number, typeVariableMap: Record<string, number> = {}) {
    return createLinkableSignature(
        id,
        new signature_parameters()
            .setTypeVariableMap(typeVariableMap)
            .setAppendPackageName(true)
            .setDefiningTypeVariable(false)
    );
}

function createMethodSignature(method: EntityDoc) {
    const out = document.createElement('span');
    const parameters = method.parameters() as EntityDoc[];
    const name = span(method.name() as string);
    appendAnnotationToolTip(name, method.annotations() as unknown[]);
    out.append(span(MODIFIER.toString(method.modifiers()) + ' '));
    out.append(createShortLink(method.getTypeWrapped() as number, method.getTypeVariableMap() as Record<string, number>));
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

function createParameterSignature(parameter: EntityDoc) {
    const output = span('');
    output.append(
        createShortLink(
            parameter.getTypeWrapped() as number,
            parameter.getTypeVariableMap() as Record<string, number>
        )
    );
    output.append(' ');
    output.append(appendAnnotationToolTip(span(parameter.getName() as string), parameter.getAnnotations() as unknown[]));
    return output;
}

function createFieldSignature(field: EntityDoc) {
    const out = document.createElement('span');
    const name = span(field.getName() as string);
    appendAnnotationToolTip(name, field.getAnnotations() as unknown[]);
    out.append(span(MODIFIER.toString(field.getModifiers()) + ' '));
    const type = field.getTypeWrapped() as number;
    out.append(createShortLink(type, field.getTypeVariableMap() as Record<string, number>));
    out.append(' ');
    out.append(name);
    return out;
}

function createParametersSignature(holder: EntityDoc) {
    const output = span('');
    tagJoiner(holder.getParameters() as EntityDoc[], ', ', (param) => createParameterSignature(param)).forEach((node) =>
        output.append(node)
    );
    return output;
}

function createConstructorSignature(constructor: EntityDoc) {
    const type = constructor.getDeclaringClassWrapped() as EntityDoc;
    const out = document.createElement('span');
    const parameters = constructor.getParameters() as EntityDoc[];
    out.append(span(MODIFIER.toString(constructor.getModifiers()) + ' '));
    out.append(
        createShortLink(
            (type as unknown as JavaType).id(),
            (type as unknown as JavaType).getTypeVariableMap() as Record<string, number>
        )
    );
    out.append('(');
    for (let i = 0; i < parameters.length; i++) {
        const param = parameters[i];
        out.appendChild(createShortLink(param.getTypeWrapped() as number, param.getTypeVariableMap() as Record<string, number>));
        const name = span(param.name() as string);
        appendAnnotationToolTip(name, param.annotations() as unknown[]);
        out.append(' ');
        out.append(name);
        if (i < parameters.length - 1) {
            out.append(', ');
        }
    }
    out.append(')');
    return out;
}

function createAnnotationSignature(annotation: EntityDoc | unknown) {
    const ann = annotation as EntityDoc;
    const out = document.createElement('span');
    const type = getClass(ann.getTypeWrapped() as number)!;
    const annotation_string = `@${type.fullyQualifiedName()}(${ann.string()})`;
    out.append(annotation_string);
    return out;
}

function createTypeVariableSignature(holder: EntityDoc, full = true) {
    const outputSpan = span('');
    tagJoiner(
        holder.getTypeVariables() as number[],
        ', ',
        (typeVariable) =>
            full
                ? createFullSignature(typeVariable, holder.getTypeVariableMap() as Record<string, number>)
                : createShortLink(typeVariable, holder.getTypeVariableMap() as Record<string, number>)
    ).forEach((node) => outputSpan.append(node));
    return outputSpan;
}

function appendAttributesToClassTableRow(row: HTMLTableRowElement, table_id: string, clazz: JavaType) {
    row.setAttribute('mod', String(clazz.modifiers()));
    row.setAttribute('name', clazz.referenceName());
    row.setAttribute('type', String(clazz.id()));
    row.setAttribute('row-type', 'class');
    row.id = `${table_id}-${clazz.getReferenceName()}`;
    addLinkToTableRow(row, row.id);
}

function appendAttributesToBindingTableRow(row: HTMLTableRowElement, table_id: string, binding: EntityDoc) {
    const clazz = binding.getTypeWrapped() as JavaType;
    row.setAttribute('mod', String(clazz.modifiers()));
    row.setAttribute('name', binding.getName() as string);
    row.setAttribute('type', String(binding.getType()));
    row.setAttribute('row-type', 'binding');
    row.id = `${table_id}-${binding.getName()}`;
    addLinkToTableRow(row, row.id);
}

function appendAttributesToMethodTableRow(
    row: HTMLTableRowElement,
    table_id: string,
    class_id: number,
    method: EntityDoc
) {
    row.setAttribute('mod', String(method.modifiers()));
    row.setAttribute('name', method.name() as string);
    row.setAttribute('type', String(method.getType()));
    row.setAttribute('declared-in', String(class_id));
    row.setAttribute('parameters', String((method.parameters() as unknown[]).length));
    row.setAttribute('row-type', 'method');
    row.setAttribute('dataIndex', String(method.dataIndex()));
    row.id = `${table_id}-${getClass(class_id)!.getReferenceName()}-${method.id()}`;
    addLinkToTableRow(row, row.id);
}

function appendAttributesToFieldTableRow(row: HTMLTableRowElement, table_id: string, field: EntityDoc) {
    row.setAttribute('mod', String(field.modifiers()));
    row.setAttribute('name', field.name() as string);
    row.setAttribute('type', String(field.getType()));
    row.setAttribute('declared-in', String(field.getDeclaringClass()));
    row.setAttribute('row-type', 'field');
    row.setAttribute('dataIndex', String(field.dataIndex()));
    row.id = `${table_id}-${field.id()}`;
    addLinkToTableRow(row, row.id);
}

function appendAttributesToConstructorTableRow(row: HTMLTableRowElement, table_id: string, constructor: EntityDoc) {
    row.setAttribute('mod', String(constructor.modifiers()));
    row.setAttribute('parameters', String((constructor.parameters() as unknown[]).length));
    row.setAttribute('declared-in', String(constructor.getDeclaringClass()));
    row.setAttribute('row-type', 'constructor');
    row.setAttribute('dataIndex', String(constructor.dataIndex()));
    row.id = `${table_id}-${constructor.id()}`;
    addLinkToTableRow(row, row.id);
}

function appendAttributesToRelationshipToTableRow(
    row: HTMLTableRowElement,
    class_id: number,
    relationshipName: unknown,
    _declaredIn?: number
) {
    const clazz = getClass(class_id)!;
    row.setAttribute('type', String(clazz.id()));
    row.setAttribute('mod', String(clazz.modifiers()));
    row.setAttribute('name', clazz.referenceName());
    row.setAttribute('row-type', 'relationship');

    row.id = String(clazz.id());
    addLinkToTableRow(row, String(class_id));
}

function appendAttributesToTypeVariableMapTableRow(
    row: HTMLTableRowElement,
    table_id: string,
    typeVariableName: string,
    mappedTypeVariable: string
) {
    row.setAttribute('name', typeVariableName);
    row.setAttribute('mapped-type', mappedTypeVariable);
    row.setAttribute('row-type', 'type-variable-map');
}

function handleClickLink(element: HTMLElement) {
    LINK_MAP[element.id]();
}

function createLinkSpan(action: () => void) {
    let clipboard = span('\u{1F517}');
    clipboard.setAttribute('class', 'clickable');
    clipboard.setAttribute('title', 'Copy Link to clipboard');
    clipboard.setAttribute('onclick', 'handleClickLink(this)');
    clipboard.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    LINK_MAP[clipboard.id] = () => {
        const el = document.getElementById(clipboard.id);
        if (el) {
            clipboard = el as HTMLSpanElement;
        }
        action();
        clipboard.innerText = '\u{2714}';
        setTimeout(() => {
            clipboard.innerText = '\u{1F517}';
        }, 2000);
    };
    return clipboard;
}

function copyLinkToClipboard(link: string, currentElementID: string | null = null) {
    return createLinkSpan(() => {
        navigator.clipboard.writeText(link).then(() => console.debug('Successfully Copied link to clipboard'));
        if (currentElementID) {
            console.debug('Focusing link element: ' + currentElementID);
            focusElement(currentElementID);
        }
    });
}

function addMethodToTable(table: HTMLTableElement, classID: number, method: EntityDoc) {
    const row = addRow(
        table,
        href(span(String(classID)), `#${getClass(classID)!.fullyQualifiedName()}`),
        createMethodSignature(method),
        createFullSignature(classID)
    );
    appendAttributesToMethodTableRow(row, table.id, classID, method);
}

function addFieldToTable(table: HTMLTableElement, field: EntityDoc) {
    const row = addRow(
        table,
        href(
            span(String(field.getDeclaringClass() as number)),
            `#${getClass(field.getDeclaringClass() as number)!.fullyQualifiedName(field.getTypeVariableMap())}`
        ),
        createFieldSignature(field),
        createFullSignature(field.getDeclaringClass() as number, field.getTypeVariableMap() as Record<string, number>)
    );
    appendAttributesToFieldTableRow(row, table.id, field);
}
