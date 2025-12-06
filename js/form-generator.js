// Add domain with specific name
function addDomainWithName(content, domainName) {
    const section = document.createElement('div'); section.className = 'section';
    section.dataset.domainName = domainName;
    const header = document.createElement('div'); header.className = 'header';
    const title = document.createElement('div'); title.className = 'title';
    title.textContent = domainName;
    header.appendChild(title);
    const content2 = document.createElement('div'); content2.className = 'content';
    content2.style.display = 'flex';
    header.onclick = () => { content2.style.display = content2.style.display === 'none' ? 'flex' : 'none'; };
    section.appendChild(header); section.appendChild(content2);
    generateForm(schema.properties.domains.additionalProperties.properties, `domains.${domainName}`, content2, 0, true);
    content.insertBefore(section, document.getElementById('addDomainRow'));
}

// Add domain from input
function addDomain(content, addDomainRow) {
    const nameInput = document.getElementById('newDomainName');
    const domainName = nameInput.value.trim();
    if (!domainName) return;
    addDomainWithName(content, domainName);
    nameInput.value = '';
    updatePreview();
}

function positionTooltip(e, tooltip, text) {
    tooltip.textContent = text;
    tooltip.style.display = 'block';

    let left = e.pageX + 10;
    let top = e.pageY + 10;

    // Get tooltip dimensions after setting content
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Check if tooltip would overflow right edge
    if (left + tooltipRect.width > viewportWidth) {
        left = e.pageX - tooltipRect.width - 10;
    }

    // Check if tooltip would overflow bottom edge
    if (top + tooltipRect.height > viewportHeight) {
        top = e.pageY - tooltipRect.height - 10;
    }

    // Ensure tooltip doesn't go off left edge
    if (left < 0) {
        left = 10;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

// Main form generation function
function generateForm(props, parentKey, container, level = 0, expand = false) {
    Object.keys(props).forEach(key => {
        if (key.startsWith('_')) return; // Skip keys starting with _
        const prop = props[key];
        if (key === 'domains') {
            const section = document.createElement('div'); section.className = 'section';
            const header = document.createElement('div'); header.className = 'header';
            const title = document.createElement('div'); title.className = 'title';
            title.textContent = key;
            const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = prop.type;
            title.appendChild(badge);
            header.appendChild(title);

            if (prop.description) {
                const ti = document.createElement('span'); ti.className = 'tooltip-icon'; ti.textContent = '?';
                ti.onmouseenter = e => positionTooltip(e, tooltip, prop.description);
                ti.onmouseleave = () => { tooltip.style.display = 'none'; };
                header.appendChild(ti);
            }

            const content = document.createElement('div'); content.className = 'content';
            content.id = 'domainsContent';
            content.style.display = expand ? 'flex' : 'none';
            header.onclick = () => { content.style.display = content.style.display === 'none' ? 'flex' : 'none'; };
            section.appendChild(header); section.appendChild(content);

            // Default domain
            const defaultDomainSection = document.createElement('div'); defaultDomainSection.className = 'section';
            const dheader = document.createElement('div'); dheader.className = 'header';
            const dtitle = document.createElement('div'); dtitle.className = 'title';
            dtitle.textContent = 'Default Domain ("")';
            dheader.appendChild(dtitle);
            const dcontent = document.createElement('div'); dcontent.className = 'content';
            dcontent.style.display = 'flex';
            dheader.onclick = () => { dcontent.style.display = dcontent.style.display === 'none' ? 'flex' : 'none'; };
            defaultDomainSection.appendChild(dheader); defaultDomainSection.appendChild(dcontent);
            generateForm(prop.additionalProperties.properties, 'domains.', dcontent, level + 2, true);
            content.appendChild(defaultDomainSection);

            // Add Domain row
            const addDomainRow = document.createElement('div'); addDomainRow.className = 'field-row';
            addDomainRow.id = 'addDomainRow';
            const nameLabel = document.createElement('span'); nameLabel.textContent = 'New Domain Name: ';
            nameLabel.style.fontWeight = 'bold';
            const nameInput = document.createElement('input'); nameInput.type = 'text'; nameInput.id = 'newDomainName'; nameInput.placeholder = 'Enter domain name';
            const addBtn = document.createElement('button'); addBtn.textContent = 'Add Domain';
            addBtn.onclick = () => addDomain(content, addDomainRow);
            addDomainRow.appendChild(nameLabel);
            addDomainRow.appendChild(nameInput);
            addDomainRow.appendChild(addBtn);
            content.appendChild(addDomainRow);

            container.appendChild(section);
        } else if (key === 'sms') {
            const section = document.createElement('div'); section.className = 'section';
            const header = document.createElement('div'); header.className = 'header';
            const title = document.createElement('div'); title.className = 'title';
            title.textContent = key;
            const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = 'object';
            title.appendChild(badge);
            header.appendChild(title);

            if (prop.description) {
                const ti = document.createElement('span'); ti.className = 'tooltip-icon'; ti.textContent = '?';
                ti.onmouseenter = e => positionTooltip(e, tooltip, prop.description);
                ti.onmouseleave = () => { tooltip.style.display = 'none'; };
                header.appendChild(ti);
            }

            const content = document.createElement('div'); content.className = 'content';
            content.style.display = expand ? 'flex' : 'none';
            header.onclick = () => { content.style.display = content.style.display === 'none' ? 'flex' : 'none'; };
            section.appendChild(header); section.appendChild(content);

            // Provider select
            const providerRow = document.createElement('div'); providerRow.className = 'field-row';
            const providerLabel = document.createElement('span'); providerLabel.textContent = 'provider: ';
            providerLabel.style.fontWeight = 'bold';
            const providerSelect = document.createElement('select'); providerSelect.id = 'sms.provider';
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Select provider';
            providerSelect.appendChild(emptyOption);
            const providers = ['twilio', 'plivo', 'telnyx', 'url'];
            providers.forEach(p => {
                const option = document.createElement('option'); option.value = p; option.textContent = p;
                providerSelect.appendChild(option);
            });
            providerSelect.onchange = function () {
                content.querySelectorAll('.section[data-provider]').forEach(s => { s.style.display = 'none'; });
                const selectedSection = content.querySelector(`.section[data-provider="${this.value}"]`);
                if (selectedSection) {
                    selectedSection.style.display = 'flex';
                }
                updatePreview();
            };
            providerRow.appendChild(providerLabel);
            providerRow.appendChild(providerSelect);
            content.appendChild(providerRow);

            // Sections for each provider
            providers.forEach(provider => {
                const pSection = document.createElement('div'); pSection.className = 'section'; pSection.dataset.provider = provider;
                const pHeader = document.createElement('div'); pHeader.className = 'header';
                const pTitle = document.createElement('div'); pTitle.className = 'title'; pTitle.textContent = provider;
                pHeader.appendChild(pTitle);
                const pContent = document.createElement('div'); pContent.className = 'content'; pContent.style.display = 'none';
                pHeader.onclick = () => { pContent.style.display = pContent.style.display === 'none' ? 'flex' : 'none'; };
                pSection.appendChild(pHeader); pSection.appendChild(pContent);

                let fields = [];
                if (provider === 'twilio') {
                    fields = ['sid', 'auth', 'from'];
                } else if (provider === 'plivo') {
                    fields = ['id', 'token', 'from'];
                } else if (provider === 'telnyx') {
                    fields = ['apikey', 'from'];
                } else if (provider === 'url') {
                    fields = ['url'];
                }

                fields.forEach(f => {
                    const row = document.createElement('div'); row.className = 'field-row';
                    const label = document.createElement('span'); label.textContent = f + ': '; label.style.fontWeight = 'bold';
                    const input = document.createElement('input'); input.type = 'text'; input.id = `sms.${f}`;
                    input.oninput = updatePreview;
                    input.placeholder = f.toUpperCase();
                    row.appendChild(label);
                    row.appendChild(input);
                    pContent.appendChild(row);
                });

                content.appendChild(pSection);
            });

            container.appendChild(section);
        } else if (key === 'customFiles') {
            const section = document.createElement('div'); section.className = 'section';
            const header = document.createElement('div'); header.className = 'header';
            const title = document.createElement('div'); title.className = 'title';
            title.textContent = key;
            const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = 'object';
            title.appendChild(badge);
            header.appendChild(title);

            if (prop.description) {
                const ti = document.createElement('span'); ti.className = 'tooltip-icon'; ti.textContent = '?';
                ti.onmouseenter = e => positionTooltip(e, tooltip, prop.description);
                ti.onmouseleave = () => { tooltip.style.display = 'none'; };
                header.appendChild(ti);
            }

            const content = document.createElement('div'); content.className = 'content';
            content.id = parentKey + '.customFiles.content';
            content.style.display = expand ? 'flex' : 'none';
            header.onclick = () => { content.style.display = content.style.display === 'none' ? 'flex' : 'none'; };
            section.appendChild(header); section.appendChild(content);

            // Add Custom File Set button
            const addRow = document.createElement('div'); addRow.className = 'field-row';
            const addBtn = document.createElement('button');
            addBtn.className = 'add-custom-file-btn'; // Add specific class
            addBtn.textContent = 'Add Custom File Set';
            addBtn.onclick = () => addCustomFileSet(content, parentKey);
            addRow.appendChild(addBtn);
            content.appendChild(addRow);

            container.appendChild(section);
        } else if ((prop.type === 'object' || (Array.isArray(prop.type) && prop.type.includes('object'))) && prop.properties) {
            const section = document.createElement('div'); section.className = 'section';
            const header = document.createElement('div'); header.className = 'header';
            const title = document.createElement('div'); title.className = 'title';
            title.textContent = key;
            const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = prop.type;
            title.appendChild(badge);
            header.appendChild(title);

            if (prop.description) {
                const ti = document.createElement('span'); ti.className = 'tooltip-icon'; ti.textContent = '?';
                ti.onmouseenter = e => positionTooltip(e, tooltip, prop.description);
                ti.onmouseleave = () => { tooltip.style.display = 'none'; };
                header.appendChild(ti);
            }

            const content = document.createElement('div'); content.className = 'content';
            content.style.display = expand ? 'flex' : 'none';
            header.onclick = () => { content.style.display = content.style.display === 'none' ? 'flex' : 'none'; };
            section.appendChild(header); section.appendChild(content);
            const subParentKey = parentKey ? parentKey + '.' + key : key;
            generateForm(prop.properties, subParentKey, content, level + 1, false);
            container.appendChild(section);
        } else {
            const row = document.createElement('div'); row.className = 'field-row';

            const labelContainer = document.createElement('div');
            labelContainer.className = 'field-label-container';

            const keySpan = document.createElement('span'); keySpan.textContent = key + ': ';
            keySpan.style.fontWeight = 'bold';
            labelContainer.appendChild(keySpan);

            const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = prop.type;
            labelContainer.appendChild(badge);

            if (prop.description) {
                const ti = document.createElement('span'); ti.className = 'tooltip-icon'; ti.textContent = '?';
                ti.onmouseenter = e => positionTooltip(e, tooltip, prop.description);
                ti.onmouseleave = () => { tooltip.style.display = 'none'; };
                labelContainer.appendChild(ti);
            }

            row.appendChild(labelContainer);

            let input;
            const fullId = parentKey ? parentKey + '.' + key : key;
            let placeholder = prop.description || 'Value';

            if (prop.type === 'boolean' || (Array.isArray(prop.type) && prop.type.includes('boolean'))) {
                const toggle = document.createElement('div'); toggle.className = 'three-state-toggle'; toggle.id = fullId; toggle.dataset.state = 'unset'; toggle.tabIndex = 0;
                const labelSpan = document.createElement('span'); labelSpan.className = 'label'; labelSpan.textContent = 'unset';
                toggle.appendChild(labelSpan);
                const toggleState = function () {
                    const states = ['unset', 'true', 'false'];
                    let idx = states.indexOf(toggle.dataset.state);
                    let next = states[(idx + 1) % 3];
                    toggle.dataset.state = next;
                    labelSpan.textContent = next;
                    updatePreview();
                };
                toggle.addEventListener('click', toggleState);
                toggle.addEventListener('keydown', function (e) {
                    if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        toggleState();
                    }
                });
                row.appendChild(toggle);
            } else {
                if (prop.type === 'string' || (Array.isArray(prop.type) && prop.type.includes('string'))) {
                    input = document.createElement('input'); input.type = 'text'; input.id = fullId;
                } else if (prop.type === 'number' || (Array.isArray(prop.type) && prop.type.includes('number'))) {
                    input = document.createElement('input'); input.type = 'number'; input.id = fullId;
                } else if (prop.type === 'integer' || (Array.isArray(prop.type) && prop.type.includes('integer'))) {
                    input = document.createElement('input'); input.type = 'number'; input.id = fullId; input.step = '1';
                } else if (prop.type === 'array' || (Array.isArray(prop.type) && prop.type.includes('array'))) {
                    input = document.createElement('textarea'); input.id = fullId;
                    placeholder = prop.description || 'JSON array';
                } else {
                    input = document.createElement('textarea'); input.id = fullId;
                }
                input.placeholder = placeholder;
                input.oninput = updatePreview;
                row.appendChild(input);
            }

            if (prop.type === 'string' && (key.toLowerCase().includes('secret') || key.toLowerCase().includes('key')) && !key.toLowerCase().includes('cert')) {
                const genBtn = document.createElement('button'); genBtn.textContent = 'Generate Key';
                genBtn.onclick = e => { e.preventDefault(); input.value = randomKey(); updatePreview(); };
                row.appendChild(genBtn);
            }
            container.appendChild(row);
        }
    });
}

// CustomFiles management functions
let customFileSetCounter = 0;

function addCustomFileSet(content, parentKey) {
    customFileSetCounter++;
    const setName = `custom-files-${customFileSetCounter}`;

    const setSection = document.createElement('div');
    setSection.className = 'section';
    setSection.dataset.customfileSet = setName;

    const setHeader = document.createElement('div');
    setHeader.className = 'header';
    const setTitle = document.createElement('div');
    setTitle.className = 'title';
    setTitle.textContent = setName;
    setHeader.appendChild(setTitle);

    const setContent = document.createElement('div');
    setContent.className = 'content';
    setContent.style.display = 'flex';
    setHeader.onclick = () => { setContent.style.display = setContent.style.display === 'none' ? 'flex' : 'none'; };

    setSection.appendChild(setHeader);
    setSection.appendChild(setContent);

    // Name field
    const nameRow = document.createElement('div');
    nameRow.className = 'field-row';
    const nameLabel = document.createElement('span');
    nameLabel.textContent = 'Name: ';
    nameLabel.style.fontWeight = 'bold';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.dataset.field = 'name';
    nameInput.value = setName;
    nameInput.placeholder = 'Custom file set name';
    nameInput.oninput = () => {
        setTitle.textContent = nameInput.value || setName;
        updatePreview();
    };
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => {
        setSection.remove();
        updatePreview();
    };
    nameRow.appendChild(nameLabel);
    nameRow.appendChild(nameInput);
    nameRow.appendChild(removeBtn);
    setContent.appendChild(nameRow);

    // CSS field
    const cssRow = document.createElement('div');
    cssRow.className = 'field-row';
    const cssLabel = document.createElement('span');
    cssLabel.textContent = 'CSS: ';
    cssLabel.style.fontWeight = 'bold';
    const cssInput = document.createElement('input');
    cssInput.type = 'text';
    cssInput.dataset.field = 'css';
    cssInput.placeholder = 'file.css';
    cssInput.oninput = updatePreview;
    cssRow.appendChild(cssLabel);
    cssRow.appendChild(cssInput);
    setContent.appendChild(cssRow);

    // JS field
    const jsRow = document.createElement('div');
    jsRow.className = 'field-row';
    const jsLabel = document.createElement('span');
    jsLabel.textContent = 'JS: ';
    jsLabel.style.fontWeight = 'bold';
    const jsInput = document.createElement('input');
    jsInput.type = 'text';
    jsInput.dataset.field = 'js';
    jsInput.placeholder = 'file.js';
    jsInput.oninput = updatePreview;
    jsRow.appendChild(jsLabel);
    jsRow.appendChild(jsInput);
    setContent.appendChild(jsRow);

    // Scope field
    const scopeRow = document.createElement('div');
    scopeRow.className = 'field-row';
    const scopeLabel = document.createElement('span');
    scopeLabel.textContent = 'Scope: ';
    scopeLabel.style.fontWeight = 'bold';
    const scopeInput = document.createElement('input');
    scopeInput.type = 'text';
    scopeInput.dataset.field = 'scope';
    scopeInput.placeholder = 'scope';
    scopeInput.oninput = updatePreview;
    scopeRow.appendChild(scopeLabel);
    scopeRow.appendChild(scopeInput);
    setContent.appendChild(scopeRow);

    // Insert before the "Add Custom File Set" button
    const addButton = content.querySelector('.add-custom-file-btn');
    if (addButton) {
        content.insertBefore(setSection, addButton.parentElement);
    } else {
        content.appendChild(setSection);
    }

    updatePreview();
}

function loadCustomFileSets(content, customFilesData, parentKey) {
    if (!customFilesData) return;

    Object.keys(customFilesData).forEach(setName => {
        const setData = customFilesData[setName];
        customFileSetCounter++;

        const setSection = document.createElement('div');
        setSection.className = 'section';
        setSection.dataset.customfileSet = setName;

        const setHeader = document.createElement('div');
        setHeader.className = 'header';
        const setTitle = document.createElement('div');
        setTitle.className = 'title';
        setTitle.textContent = setName;
        setHeader.appendChild(setTitle);

        const setContent = document.createElement('div');
        setContent.className = 'content';
        setContent.style.display = 'flex';
        setHeader.onclick = () => { setContent.style.display = setContent.style.display === 'none' ? 'flex' : 'none'; };

        setSection.appendChild(setHeader);
        setSection.appendChild(setContent);

        // Name field
        const nameRow = document.createElement('div');
        nameRow.className = 'field-row';
        const nameLabel = document.createElement('span');
        nameLabel.textContent = 'Name: ';
        nameLabel.style.fontWeight = 'bold';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.dataset.field = 'name';
        nameInput.value = setName;
        nameInput.placeholder = 'Custom file set name';
        nameInput.oninput = () => {
            setTitle.textContent = nameInput.value || setName;
            updatePreview();
        };
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => {
            setSection.remove();
            updatePreview();
        };
        nameRow.appendChild(nameLabel);
        nameRow.appendChild(nameInput);
        nameRow.appendChild(removeBtn);
        setContent.appendChild(nameRow);

        // CSS field
        const cssRow = document.createElement('div');
        cssRow.className = 'field-row';
        const cssLabel = document.createElement('span');
        cssLabel.textContent = 'CSS: ';
        cssLabel.style.fontWeight = 'bold';
        const cssInput = document.createElement('input');
        cssInput.type = 'text';
        cssInput.dataset.field = 'css';
        cssInput.value = setData.css || '';
        cssInput.placeholder = 'file.css';
        cssInput.oninput = updatePreview;
        cssRow.appendChild(cssLabel);
        cssRow.appendChild(cssInput);
        setContent.appendChild(cssRow);

        // JS field
        const jsRow = document.createElement('div');
        jsRow.className = 'field-row';
        const jsLabel = document.createElement('span');
        jsLabel.textContent = 'JS: ';
        jsLabel.style.fontWeight = 'bold';
        const jsInput = document.createElement('input');
        jsInput.type = 'text';
        jsInput.dataset.field = 'js';
        jsInput.value = setData.js || '';
        jsInput.placeholder = 'file.js';
        jsInput.oninput = updatePreview;
        jsRow.appendChild(jsLabel);
        jsRow.appendChild(jsInput);
        setContent.appendChild(jsRow);

        // Scope field
        const scopeRow = document.createElement('div');
        scopeRow.className = 'field-row';
        const scopeLabel = document.createElement('span');
        scopeLabel.textContent = 'Scope: ';
        scopeLabel.style.fontWeight = 'bold';
        const scopeInput = document.createElement('input');
        scopeInput.type = 'text';
        scopeInput.dataset.field = 'scope';
        scopeInput.value = setData.scope || '';
        scopeInput.placeholder = 'scope';
        scopeInput.oninput = updatePreview;
        scopeRow.appendChild(scopeLabel);
        scopeRow.appendChild(scopeInput);
        setContent.appendChild(scopeRow);

        // Insert before the "Add Custom File Set" button
        const addButton = content.querySelector('.add-custom-file-btn');
        if (addButton) {
            content.insertBefore(setSection, addButton.parentElement);
        } else {
            content.appendChild(setSection);
        }
    });
}
