// UI Event Handlers

// Toggle dropdown menu
function toggleDropdown() {
    document.getElementById("dropdown-menu").style.display =
        document.getElementById("dropdown-menu").style.display === "block" ? "none" : "block";
}

// Help tooltip hover functionality
function initHelpTooltip() {
    let timeout;
    const helpIcon = document.querySelector('.help-icon');
    const helpTooltip = document.querySelector('.help-tooltip');
    helpIcon.addEventListener('mouseenter', () => {
        helpTooltip.style.display = 'block';
    });
    helpIcon.addEventListener('mouseleave', () => {
        timeout = setTimeout(() => {
            helpTooltip.style.display = 'none';
        }, 300);
    });
    helpTooltip.addEventListener('mouseenter', () => {
        clearTimeout(timeout);
    });
    helpTooltip.addEventListener('mouseleave', () => {
        helpTooltip.style.display = 'none';
    });
}

// Resizer functionality
function initResizer() {
    let isResizing = false;
    let startX, startWidth;
    document.querySelector('.resizer').addEventListener('mousedown', e => {
        isResizing = true;
        startX = e.clientX;
        startWidth = document.querySelector('.left').offsetWidth;
        document.addEventListener('mousemove', onResize);
        document.addEventListener('mouseup', onStop);
    });
    function onResize(e) {
        if (!isResizing) return;
        const dx = e.clientX - startX;
        const newWidth = Math.max(300, Math.min(window.innerWidth - 10, startWidth + dx)); // Constrain width to prevent overflow
        document.querySelector('.left').style.flexBasis = newWidth + 'px';
    }
    function onStop() {
        isResizing = false;
        document.removeEventListener('mousemove', onResize);
        document.removeEventListener('mouseup', onStop);
    }
}

// TAB navigation
function initTabNavigation() {
    document.addEventListener('keydown', e => {
        if (e.key === 'Tab') {
            e.preventDefault();
            let current = document.activeElement;
            if (!current.matches('input[type="text"], input[type="number"], textarea, select, .three-state-toggle, button')) return;
            let allTabbables = Array.from(document.querySelectorAll('input[type="text"], input[type="number"], textarea, select, .three-state-toggle, button'));
            let index = allTabbables.indexOf(current);
            if (index === -1) return;
            let nextIndex = e.shiftKey ? (index - 1 + allTabbables.length) % allTabbables.length : (index + 1) % allTabbables.length;
            let next = allTabbables[nextIndex];
            next.focus();
            expandPathTo(next);
        }
    });
}

// Copy functionality
function initCopyButton() {
    document.getElementById('copyBtn').addEventListener('click', async function () {
        try {
            const jsonContent = editor.getValue();
            await navigator.clipboard.writeText(jsonContent);

            // Visual feedback
            const btn = this;
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            btn.classList.add('copied');

            // Reset after 2 seconds
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('copied');
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = editor.getValue();
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            // Visual feedback
            const btn = this;
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            btn.classList.add('copied');

            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('copied');
            }, 2000);
        }
    });
}

// Download functionality
function initDownloadButton() {
    document.getElementById('downloadBtn').addEventListener('click', function () {
        try {
            const data = collectData();
            const jsonString = JSON.stringify(data, null, 2);

            // Method 1: Try using data URI (works better in Chrome)
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "config.json");

            // Add to DOM, click, and remove
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

        } catch (error) {
            console.error('Download error:', error);

            // Fallback: Try blob method
            try {
                const data = collectData();
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: 'application/json;charset=utf-8'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'config.json';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 250);
            } catch (fallbackError) {
                console.error('Fallback download error:', fallbackError);
                alert('Error downloading file. Please try copying the JSON instead.');
            }
        }
    });
}

// Upload functionality
function initUploadButton() {
    document.getElementById('uploadConfig').addEventListener('change', function (e) {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                originalData = JSON.parse(JSON.stringify(data));
                // Add extra domains if they exist in the data
                const domainsContent = document.getElementById('domainsContent');
                if (domainsContent && data.domains) {
                    Object.keys(data.domains).forEach(domainName => {
                        if (domainName === '') return;
                        if (!domainsContent.querySelector(`[data-domain-name="${domainName}"]`)) {
                            addDomainWithName(domainsContent, domainName);
                        }
                    });
                }
                populateForm(data);
                updatePreview();
            } catch (err) { document.getElementById('validationMsg').innerHTML = '<span style="color:red">' + err.message + '</span>'; }
        };
        reader.readAsText(file);
    });
}

// Format toggle (JSON/YAML)
function initFormatToggle() {
    document.getElementById('formatToggle').addEventListener('click', () => {
        // If switching to YAML: render current collected data as YAML and allow editing
        if (currentFormat === 'json') {
            const data = collectData();
            try {
                const yamlText = jsyaml.dump(data, { indent: 2, lineWidth: -1 });
                editor.setOption('mode', 'yaml');
                editor.setValue(yamlText);
                editor.setOption('readOnly', false); // allow edit when in YAML
                document.getElementById('formatToggle').textContent = 'JSON';
                currentFormat = 'yaml';
            } catch (e) {
                alert('Error generating YAML: ' + e.message);
            }
        } else {
            // Switching back to JSON: try to parse YAML from editor and update preview (and underlying form)
            try {
                const parsed = jsyaml.load(editor.getValue());
                // merge parsed into originalData to keep form fields intact where possible
                originalData = deepMerge(originalData || {}, parsed || {}, true);
                editor.setOption('mode', { name: "javascript", json: true });
                editor.setValue(JSON.stringify(parsed, null, 2));
                editor.setOption('readOnly', true);
                document.getElementById('formatToggle').textContent = 'YAML';
                currentFormat = 'json';
                // populate form with new JSON (so accordion fields reflect changes)
                if (parsed) populateForm(parsed);
                updatePreview();
            } catch (err) {
                alert('Error converting YAML to JSON: ' + err.message);
            }
        }
    });
}

// Theme toggle
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const html = document.documentElement;

    const moon = "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z";
    const sun = "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m15.364 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z";

    // Apply saved theme
    const saved = localStorage.getItem('meshcentral-theme') || 'dark';
    html.dataset.theme = saved;
    themeIcon.innerHTML = `<path d="${saved === 'light' ? sun : moon}"></path>`;
    if (editor) editor.setOption('theme', saved === 'light' ? 'default' : 'dracula');

    // Toggle
    themeToggle.addEventListener('click', () => {
        const isLight = html.dataset.theme === 'light';
        const newTheme = isLight ? 'dark' : 'light';
        html.dataset.theme = newTheme;
        localStorage.setItem('meshcentral-theme', newTheme);
        themeIcon.innerHTML = `<path d="${newTheme === 'light' ? sun : moon}"></path>`;
        if (editor) editor.setOption('theme', newTheme === 'light' ? 'default' : 'dracula');
    });
}

// Initialize all UI handlers
function initUIHandlers() {
    initHelpTooltip();
    initResizer();
    initTabNavigation();
    initCopyButton();
    initDownloadButton();
    initUploadButton();
    initFormatToggle();
    initThemeToggle();
    initDropdownOutsideClick();
}
function initDropdownOutsideClick() {
    document.addEventListener('click', function(event) {
        const profileDropdown = document.querySelector('.profile-dropdown');
        const dropdownMenu = document.getElementById("dropdown-menu");
        
        if (profileDropdown && !profileDropdown.contains(event.target)) {
            if (dropdownMenu && dropdownMenu.style.display === 'block') {
                dropdownMenu.style.display = 'none';
            }
        }
    });
}
