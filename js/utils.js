// Utility Functions

// Function to recursively remove keys starting with '_'
function cleanUnderscore(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(cleanUnderscore);
    const newObj = {};
    for (let key in obj) {
        if (key.startsWith('_')) continue;
        newObj[key] = cleanUnderscore(obj[key]);
    }
    return newObj;
}

// Case insensitive deep merge
function deepMerge(target, source, ignoreCase = true) {
    if (typeof target !== 'object' || target === null || typeof source !== 'object' || source === null) {
        return source;
    }
    for (let key in source) {
        if (source.hasOwnProperty(key)) {
            let targetKey = key;
            if (ignoreCase) {
                const lowerKey = key.toLowerCase();
                targetKey = Object.keys(target).find(k => k.toLowerCase() === lowerKey) || key;
            }
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                if (!target.hasOwnProperty(targetKey)) {
                    target[targetKey] = {};
                }
                deepMerge(target[targetKey], source[key], ignoreCase);
            } else if (Array.isArray(source[key])) {
                target[targetKey] = [...source[key]];
            } else {
                target[targetKey] = source[key];
            }
        }
    }
    return target;
}

// Case insensitive get nested value
function getNestedValue(obj, path, ignoreCase = true) {
    const keys = path.split('.');
    let val = obj;
    for(let k of keys) {
        if (k === '') {
            val = val?.[''];
            if (val === undefined) return undefined;
            continue;
        }
        if (ignoreCase) {
            const lowerK = k.toLowerCase();
            const found = Object.keys(val).find(key => key.toLowerCase() === lowerK);
            if (found === undefined) return undefined;
            val = val[found];
        } else {
            val = val?.[k];
        }
        if (val === undefined) return undefined;
    }
    return val;
}

// Generate random key
function randomKey(){ 
    const array=new Uint8Array(32); crypto.getRandomValues(array);
    return Array.from(array).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// Convert string values to appropriate types
function convertStringValue(val, prop) {
    if (typeof val !== 'string') return val;
    // Boolean conversion
    if (val === 'true') return true;
    if (val === 'false') return false;
    // Integer number conversion
    if (/^-?\d+$/.test(val)) {
        return Number(val);
    }
    // JSON array/object conversion
    const trimmed = val.trim();
    if (trimmed && (trimmed.startsWith('[') || trimmed.startsWith('{'))) {
        try {
            return JSON.parse(trimmed);
        } catch (e) {
            // Keep as string
        }
    }
    return val;
}

// Expand accordion path to element
function expandPathTo(el) {
    let parent = el.closest('.content');
    while (parent) {
        parent.style.display = 'flex';
        parent = parent.parentNode.closest('.content');
    }
}
