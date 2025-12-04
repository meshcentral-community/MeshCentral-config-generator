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
    const selector = document.getElementById('versionSelector');
    if (!selector) return;

    // Clear existing options
    selector.innerHTML = '';

    if (!releases || releases.length === 0) {
        // Fallback to master if no releases found
        const option = document.createElement('option');
        option.value = 'master';
        option.textContent = 'master (latest development)';
        selector.appendChild(option);
        return;
    }

    // Add all releases
    releases.forEach((release, index) => {
        const option = document.createElement('option');
        option.value = release.tag_name;
        option.textContent = `${release.tag_name}${index === 0 ? ' (latest)' : ''}`;
        if (release.tag_name === selectedVersion) {
            option.selected = true;
        }
        selector.appendChild(option);
    });

    // Add master branch option at the end
    const masterOption = document.createElement('option');
    masterOption.value = 'master';
    masterOption.textContent = 'master (development)';
    if (selectedVersion === 'master') {
        masterOption.selected = true;
    }
    selector.appendChild(masterOption);
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
    const selector = document.getElementById('versionSelector');
    if (!selector) return null;

    // Show loading state
    selector.innerHTML = '<option>Loading versions...</option>';
    selector.disabled = true;

    // Fetch releases
    const releases = await fetchReleases();

    // Determine which version to load
    const versionToLoad = getVersionToLoad(releases);

    // Build selector with all versions
    buildVersionSelector(releases, versionToLoad);
    selector.disabled = false;

    // Add change event listener
    selector.addEventListener('change', async function () {
        const newVersion = this.value;
        saveVersion(newVersion);

        // Show loading indicator
        const validationMsg = document.getElementById('validationMsg');
        validationMsg.innerHTML = '<span style="color: #888;">Loading schema...</span>';

        // Reload schema with new version
        await loadSchemaVersion(newVersion);
    });

    return { releases, versionToLoad };
}
