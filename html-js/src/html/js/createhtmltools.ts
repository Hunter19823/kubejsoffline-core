interface SelectOption {
    text: string;
    action: () => void;
    group?: string;
}

function addRow(table: HTMLTableElement, ...data: HTMLElement[]) {
    const tr = document.createElement('tr');
    table.appendChild(tr);
    for (let i = 0; i < data.length; i++) {
        const td = document.createElement('td');
        tr.appendChild(td);
        if (typeof data[i] === 'number') {
            throw new Error('Id passed instead of element: ' + data[i]);
        } else {
            td.appendChild(data[i]);
        }
    }
    return tr;
}

function div(...args: (string | HTMLElement)[]) {
    const divEl = document.createElement('div');
    for (let arg of args) {
        if (typeof arg === 'string') {
            arg = span(arg);
        }
        divEl.appendChild(arg);
    }
    return divEl;
}

function span(text: string) {
    const spanEl = document.createElement('span');
    if (!exists(text)) return spanEl;
    spanEl.innerText = text;
    return spanEl;
}

function header(text: string, level = 2) {
    const headerEl = document.createElement('h' + level);
    headerEl.innerText = text;
    return headerEl;
}

function breakLine() {
    document.body.appendChild(br());
}

function br() {
    return document.createElement('br');
}

function option(text: string, action: () => void, group?: string): SelectOption {
    return {
        text: text,
        action: action,
        group: group,
    };
}

function createOptions(...args: SelectOption[]) {
    const output = document.createElement('select');
    const groupMap = new Map<string, HTMLOptGroupElement>();
    const actionMap = new Map<string, () => void>();
    for (const opt of args) {
        const optionEl = document.createElement('option');
        optionEl.value = opt.text;
        optionEl.innerText = opt.text;
        actionMap.set(opt.text, opt.action);
        if (opt.group && opt.group !== 'Misc') {
            if (!groupMap.has(opt.group)) {
                const groupEl = document.createElement('optgroup');
                groupEl.label = opt.group;
                groupMap.set(opt.group, groupEl);
                output.appendChild(groupEl);
            }
            groupMap.get(opt.group)!.appendChild(optionEl);
        } else {
            if (!groupMap.has('Misc')) {
                const miscGroup = document.createElement('optgroup');
                miscGroup.label = 'Misc';
                groupMap.set('Misc', miscGroup);
            }
            groupMap.get('Misc')!.appendChild(optionEl);
        }
    }
    if (groupMap.has('Misc')) {
        output.appendChild(groupMap.get('Misc')!);
    }
    output.onchange = () => {
        const action = actionMap.get(output.value);
        if (action) {
            action();
        } else {
            console.error('No action for ' + output.value);
        }
    };
    return output;
}

function li(content: string) {
    const tag = document.createElement('li');
    tag.innerText = content;
    return tag;
}

function href(element: HTMLElement, url: string) {
    element.classList.add('link');
    element.setAttribute('href', url);
    element.setAttribute('onclick', 'handleClickLink(this)');
    element.onclick = () => {
        changeURL(url);
    };
    return element;
}

function appendAnnotationToolTip(tag: HTMLElement, annotations: unknown[]) {
    if (!annotations || annotations.length === 0) return tag;

    tag.classList.add('tooltip');
    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltiptext');
    tagJoiner(annotations, '<br>', (annotation) => createAnnotationSignature(annotation)).forEach(
        (node) => tooltip.append(node)
    );
    tag.appendChild(tooltip);
    return tag;
}

function createRoundedToggleSwitch(
    name: string,
    initialValue: boolean,
    onChange: (this: GlobalEventHandlers, ev: Event) => void
) {
    const label = document.createElement('label');
    label.classList.add('switch');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = initialValue;
    input.onchange = onChange;
    const sliderSpan = document.createElement('span');
    sliderSpan.classList.add('slider', 'round');
    label.appendChild(input);
    label.appendChild(sliderSpan);
    const nameSpan = document.createElement('span');
    nameSpan.innerText = name;
    label.appendChild(nameSpan);
    return label;
}

function persistElement(element: HTMLElement) {
    element.classList.add('refresh-persistent');
}
