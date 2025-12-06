// Version Management Module

// Fetch releases from GitHub API
async function fetchReleases() {
    try {
        const response = await fetch('https://api.github.com/repos/Ylianst/MeshCentral/releases');
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        const releases = await response.json();
        // Filter out pre-releases and drafts, return only published releases
        return releases.filter(r => !r.prerelease && !r.draft);
    } catch (error) {
        console.error('Error fetching releases:', error);
        return null;
    }
}

// Get the latest release
function getLatestRelease(releases) {
    if (!releases || releases.length === 0) return null;
    // Releases are already sorted by published date (newest first)
    return releases[0];
}

// Get saved version from localStorage
function getSavedVersion() {
    return localStorage.getItem('meshcentral-version');
}

// Save selected version to localStorage
function saveVersion(version) {
    localStorage.setItem('meshcentral-version', version);
}

// Build schema URL for a specific version
function getSchemaUrl(version) {
    if (!version || version === 'master') {
        return 'https://raw.githubusercontent.com/Ylianst/MeshCentral/master/meshcentral-config-schema.json';
    }
    return `https://raw.githubusercontent.com/Ylianst/MeshCentral/${version}/meshcentral-config-schema.json`;
}

// Populate version selector dropdown
function buildVersionSelector(releases, selectedVersion) {
    const dropdown = document.getElementById('versionSelectorDropdown');
    const optionsContainer = document.getElementById('versionSelectorOptions');
    const display = document.getElementById('versionSelectorDisplay');
    const textSpan = document.getElementById('versionText');
    if (!dropdown || !optionsContainer || !display || !textSpan) return;

    // Clear existing options
    optionsContainer.innerHTML = '';

    const createOption = (value, text, isSelected) => {
        const div = document.createElement('div');
        div.className = 'custom-select-option';
        if (isSelected) div.classList.add('selected');
        div.textContent = text;
        div.dataset.value = value;
        
        div.onclick = async (e) => {
            e.stopPropagation();
            
            // Update display
            textSpan.textContent = text;
            
            // Close dropdown
            dropdown.classList.remove('show');
            
            // Trigger load if changed
            const saved = getSavedVersion();
            if (saved !== value) {
                saveVersion(value);
                
                // Show loading indicator
                const validationMsg = document.getElementById('validationMsg');
                if (validationMsg) validationMsg.innerHTML = '<span style="color: #888;">Loading schema...</span>';

                if (typeof loadSchemaVersion === 'function') {
                    await loadSchemaVersion(value);
                }
                
                // Update selected class
                optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected'));
                div.classList.add('selected');
            }
        };
        return div;
    };

    if (!releases || releases.length === 0) {
        // Fallback
        const opt = createOption('master', 'master (latest development)', selectedVersion === 'master');
        optionsContainer.appendChild(opt);
        if (selectedVersion === 'master') textSpan.textContent = 'master (latest development)';
        return;
    }

    // Add all releases
    releases.forEach((release, index) => {
        const text = `${release.tag_name}${index === 0 ? ' (latest)' : ''}`;
        const isSelected = release.tag_name === selectedVersion;
        const opt = createOption(release.tag_name, text, isSelected);
        optionsContainer.appendChild(opt);
        if (isSelected) textSpan.textContent = text;
    });

    // Add master branch option at the end
    const masterText = 'master (development)';
    const isMaster = selectedVersion === 'master';
    const masterOpt = createOption('master', masterText, isMaster);
    optionsContainer.appendChild(masterOpt);
    if (isMaster) textSpan.textContent = masterText;
}

// Get version to load (saved or latest)
function getVersionToLoad(releases) {
    const savedVersion = getSavedVersion();

    // If there's a saved version, verify it exists in releases
    if (savedVersion) {
        if (savedVersion === 'master') return 'master';
        if (releases && releases.find(r => r.tag_name === savedVersion)) {
            return savedVersion;
        }
    }

    // Otherwise, use latest release
    const latest = getLatestRelease(releases);
    return latest ? latest.tag_name : 'master';
}

// Initialize version selector
async function initVersionSelector() {
    const container = document.getElementById('versionSelectorContainer');
    const display = document.getElementById('versionSelectorDisplay');
    const dropdown = document.getElementById('versionSelectorDropdown');
    const textSpan = document.getElementById('versionText');
    
    if (!container || !display || !dropdown) return null;

    // Show loading state
    if(textSpan) textSpan.textContent = 'Loading versions...';
    
    // Toggle dropdown
    display.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    };

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    // Fetch releases
    const releases = await fetchReleases();

    // Determine which version to load
    const versionToLoad = getVersionToLoad(releases);

    // Build selector with all versions
    buildVersionSelector(releases, versionToLoad);

    return { releases, versionToLoad };
}
