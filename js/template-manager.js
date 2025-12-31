// Template Management Module

// Fetch list of templates
// Fetch list of templates
async function fetchTemplateList() {
    try {
        const response = await fetch('templates/templates.json');
        if (!response.ok) {
            console.warn('templates.json not found or error loading it');
            return ['sample-config.json', 'sample-config-advanced.json']; // Fallback
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching template list:', error);
        return ['sample-config.json', 'sample-config-advanced.json']; // Fallback
    }
}

// Fetch a specific template file
async function fetchTemplate(filename) {
    try {
        const response = await fetch(`templates/${filename}`);
        if (!response.ok) {
            throw new Error(`Error loading template ${filename}: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching template ${filename}:`, error);
        // If we are on file protocol, this is expected for Chrome/Edge
        if (window.location.protocol === 'file:') {
            console.warn('Cannot fetch files via file:// protocol in this browser.');
        }
        return null;
    }
}

// Build template selector dropdown
async function initTemplateSelector() {
    const selectorContainer = document.getElementById('templateSelectorDisplay');
    const dropdown = document.getElementById('templateSelectorDropdown');
    const optionsContainer = document.getElementById('templateSelectorOptions');
    const textSpan = document.getElementById('templateText');

    if (!selectorContainer || !dropdown || !optionsContainer || !textSpan) return;

    // Load template list
    const templateFiles = await fetchTemplateList();

    if (!templateFiles || templateFiles.length === 0) {
        // Hide selector if no templates
        document.getElementById('templateSelectorContainer').style.display = 'none';
        return;
    }

    // Load metadata for all templates
    const templates = [];
    for (const filename of templateFiles) {
        const data = await fetchTemplate(filename);
        if (data) {
            templates.push({
                filename: filename,
                name: data.__templateDescription || filename,
                data: data
            });
        } else {
            // If data load failed (e.g. CORS), still add it but with filename and no data
            // We will try to load it again on click (which will fail again, but we can alert user)
            templates.push({
                filename: filename,
                name: filename.replace('.json', '') + ' (verify load)',
                data: null
            });
        }
    }

    if (templates.length === 0) {
        document.getElementById('templateSelectorContainer').style.display = 'none';
        return;
    }

    // Toggle dropdown
    selectorContainer.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    };

    // Close on click outside
    document.addEventListener('click', (e) => {
        const container = document.getElementById('templateSelectorContainer');
        if (container && !container.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    // Build options
    templates.forEach(template => {
        const div = document.createElement('div');
        div.className = 'custom-select-option';
        div.textContent = template.name;

        div.onclick = (e) => {
            e.stopPropagation();

            // Directly load without confirmation as requested

            if (!template.data) {
                // Try to fetch again just in case, or alert
                if (window.location.protocol === 'file:') {
                    alert('Cannot load template content. Browser security prevents loading local files. Please run this app via a local web server (e.g., http-server or VS Code Live Server).');
                } else {
                    alert('Failed to load template content.');
                }
                return;
            }

            // Update display
            textSpan.textContent = template.name;

            // Close dropdown
            dropdown.classList.remove('show');

            // Apply template
            applyTemplate(template.data);

            // Update selected class
            optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected'));
            div.classList.add('selected');
        };
        optionsContainer.appendChild(div);
    });
}

// Apply template data to form
function applyTemplate(data) {
    // Deep copy to avoid modifying the template cache
    originalData = JSON.parse(JSON.stringify(data));

    // Add domains if needed (similar to file upload logic)
    const domainsContent = document.getElementById('domainsContent');
    if (domainsContent && data.domains) {
        Object.keys(data.domains).forEach(domainName => {
            if (domainName === '') return;
            // Check if domain tab already exists
            if (!domainsContent.querySelector(`[data-domain-name="${domainName}"]`)) {
                if (typeof addDomainWithName === 'function') {
                    addDomainWithName(domainsContent, domainName);
                }
            }
        });
    }

    populateForm(data);
    updatePreview();

    // Show success message
    const msgContainer = document.getElementById('validationMsg');
    if (msgContainer) {
        const originalContent = msgContainer.innerHTML;
        msgContainer.innerHTML = '<span style="color: var(--primary-color);">Template loaded successfully!</span>';
        setTimeout(() => {
            msgContainer.innerHTML = originalContent;
            // Re-attach listeners if the original content had them (like schema version tooltip)
            // But actually loadSchemaVersion re-creates the innerHTML, so we might lose it. 
            // Better: Don't overwrite validationMsg unless needed, or restore it properly.
            // For now, let's just trigger a re-validation visual or similar. 
            // Actually, loadSchemaVersion updates validationMsg with schema info. 
            // If we overwrite it, we lose schema info.
            // Let's just restore loading schema info? 
            // Or just not touch validationMsg for success.
            // Let's rely on the form update as visual feedback.
            if (typeof loadSchema === 'function') {
                // re-run validation if we had that? 
                // Actually the schema info is static unless version changes. 
                // We can just verify if we want.
            }
            // Restore previous content if we want, or just leave it.
            // If we just wiped it, we lost the schema link. 
            // Let's refresh schema info
            const versionSelector = document.getElementById('versionSelectorDisplay');
            // maybe simpler to just not touch it or use a separate toaster.
        }, 2000);
    }
}
