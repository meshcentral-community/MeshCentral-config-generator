// Data Collection Functions

// Collect top-level leaf values
function collectTopLeaf(fullId) {
    let val;
    const element = document.getElementById(fullId);
    if (element) {
        if (element.classList && element.classList.contains('three-state-toggle')) {
            const state = element.dataset.state;
            if (state !== 'unset') {
                val = state === 'true';
            }
        } else if (element.value && element.value.trim() !== '' && element.id !== 'newDomainName') {
            if (element.type === 'number') {
                val = Number(element.value);
            } else if (element.tagName.toLowerCase() === 'textarea') {
                try {
                    val = JSON.parse(element.value);
                } catch (e) {
                    val = element.value;
                }
            } else {
                val = element.value;
            }
            // For top-level, we don't have prop, so simple conversion
            val = convertStringValue(val, { type: 'string' }); // default to string, but convert booleans and integers and json
        }
    }
    return val;
}

// Collect sub-object data
function collectSub(props, parentKey) {
    const sub = {};
    Object.keys(props).forEach(key => {
        if (key.startsWith('_')) return;
        const fullId = parentKey + '.' + key;
        const prop = props[key];

        if (key === 'customFiles') {
            const content = document.getElementById(fullId + '.content');
            if (content) {
                const customFilesObj = {};
                const sets = content.querySelectorAll('.section[data-customfile-set]');
                sets.forEach(set => {
                    const nameInput = set.querySelector('input[data-field="name"]');
                    const cssInput = set.querySelector('input[data-field="css"]');
                    const jsInput = set.querySelector('input[data-field="js"]');
                    const scopeInput = set.querySelector('input[data-field="scope"]');

                    if (nameInput && nameInput.value) {
                        const name = nameInput.value;
                        const fileSet = {};
                        if (cssInput && cssInput.value) fileSet.css = cssInput.value;
                        if (jsInput && jsInput.value) fileSet.js = jsInput.value;
                        if (scopeInput && scopeInput.value) fileSet.scope = scopeInput.value;

                        if (Object.keys(fileSet).length > 0) {
                            customFilesObj[name] = fileSet;
                        }
                    }
                });
                if (Object.keys(customFilesObj).length > 0) {
                    sub[key] = customFilesObj;
                }
            }
            return; // Skip default processing for customFiles
        }

        if ((prop.type === 'object' || (Array.isArray(prop.type) && prop.type.includes('object'))) && prop.properties) {
            const subSub = collectSub(prop.properties, fullId);
            if (Object.keys(subSub).length > 0) {
                sub[key] = subSub;
            }
        } else {
            let val;
            const element = document.getElementById(fullId);
            if (element) {
                if (element.classList && element.classList.contains('three-state-toggle')) {
                    const state = element.dataset.state;
                    if (state !== 'unset') {
                        val = state === 'true';
                    }
                } else if (element.value && element.value.trim() !== '' && element.id !== 'newDomainName') {
                    if (element.type === 'number') {
                        val = Number(element.value);
                    } else if (element.tagName.toLowerCase() === 'textarea') {
                        try {
                            val = JSON.parse(element.value);
                        } catch (e) {
                            val = element.value;
                        }
                    } else {
                        val = element.value;
                    }
                    // Convert string values
                    val = convertStringValue(val, prop);
                }
            }
            if (val !== undefined) {
                sub[key] = val;
            }
        }
    });
    return sub;
}

// Collect SMS-specific data
function collectSubForSms() {
    const smsObj = {};
    const providerVal = collectTopLeaf('sms.provider');
    if (providerVal && providerVal !== '') {
        smsObj.provider = providerVal;
    }
    const fields = ['sid', 'auth', 'from', 'id', 'token', 'apikey', 'url'];
    fields.forEach(f => {
        const fullId = 'sms.' + f;
        const val = collectTopLeaf(fullId);
        if (val !== undefined && (typeof val !== 'string' || val.trim() !== '')) {
            smsObj[f] = val;
        }
    });
    if (smsObj.provider) {
        return smsObj;
    } else {
        return undefined;
    }
}

// Main data collection function
function collectData() {
    // Start with a clean base. If originalData exists, use it after cleaning.
    // Otherwise, start with an empty object.
    let obj = {};
    if (originalData) {
        obj = JSON.parse(JSON.stringify(originalData)); // Deep copy originalData
        delete obj["$schema"]; // Remove schema if present
        obj = cleanUnderscore(obj); // Clean keys starting with '_'
    }

    const topProps = schema.properties;
    Object.keys(topProps).forEach(key => {
        if (key.startsWith('_')) return; // Skip internal properties

        // Special handling for 'domains'
        if (key === 'domains') {
            const domainProps = topProps.domains.additionalProperties.properties;
            // Initialize domains object if it doesn't exist
            if (!obj.domains) obj.domains = {};

            // Collect default domain values
            const defaultCollected = collectSub(domainProps, 'domains.');
            obj.domains[''] = deepMerge(obj.domains[''] || {}, defaultCollected, true);

            // Collect values for dynamically added domains
            const domainsContent = document.getElementById('domainsContent');
            if (domainsContent) {
                const sections = domainsContent.querySelectorAll('div[data-domain-name]'); // Select div.section
                sections.forEach(section => {
                    const domainName = section.dataset.domainName;
                    const collected = collectSub(domainProps, `domains.${domainName}`);
                    obj.domains[domainName] = deepMerge(obj.domains[domainName] || {}, collected, true);
                });
            }
        }
        // Special handling for 'settings'
        else if (key === 'settings') {
            const settingsProps = topProps.settings.properties;
            const subObj = collectSub(settingsProps, 'settings');
            obj.settings = deepMerge(obj.settings || {}, subObj, true);
        }
        // Special handling for 'sms'
        else if (key === 'sms') {
            const sub = collectSubForSms();
            if (sub !== undefined) {
                obj.sms = deepMerge(obj.sms || {}, sub, true);
            }
        }
        // General handling for other properties
        else {
            const prop = topProps[key];
            // If it's an object with sub-properties
            if ((prop.type === 'object' || (Array.isArray(prop.type) && prop.type.includes('object'))) && prop.properties) {
                const subObj = collectSub(prop.properties, key);
                if (Object.keys(subObj).length > 0) {
                    obj[key] = deepMerge(obj[key] || {}, subObj, true);
                }
            }
            // If it's a leaf property (not an object with sub-properties)
            else {
                const val = collectTopLeaf(key);
                if (val !== undefined) {
                    obj[key] = val; // Direct assignment for top-level leaves
                } else if (obj.hasOwnProperty(key)) {
                    delete obj[key]; // Remove if the form field is empty and it existed in originalData
                }
            }
        }
    });

    return { "$schema": schema.id, ...obj };
}
