function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function searchRepositories(query) {
    try {
        const response = await fetch(
            `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5&sort=stars&order=desc`
        );

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error fetching repositories:', error);
        return [];
    }
}

function renderAutocomplete(repositories) {
    const autocompleteList = document.getElementById('autocompleteList');

    if (repositories.length === 0) {
        autocompleteList.classList.remove('active');
        autocompleteList.innerHTML = '';
        return;
    }

    autocompleteList.innerHTML = repositories
        .map(repo => `
            <div class="autocomplete-item" data-repo='${JSON.stringify(repo).replace(/'/g, "&apos;")}'>
                <strong>${escapeHtml(repo.name)}</strong>
                <div style="font-size: 12px; color: #586069;">
             
                </div>
            </div>
        `)
        .join('');

    autocompleteList.classList.add('active');


    autocompleteList.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            const repoData = JSON.parse(item.dataset.repo.replace(/&apos;/g, "'"));
            addRepository(repoData);
            clearInput();
            hideAutocomplete();
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function clearInput() {
    document.getElementById('searchInput').value = '';
}

function hideAutocomplete() {
    document.getElementById('autocompleteList').classList.remove('active');
}

function addRepository(repo) {
    const repositoriesList = document.getElementById('repositoriesList');

    const existingItems = repositoriesList.querySelectorAll('.repository-item');
    for (let item of existingItems) {
        if (item.dataset.repoId === repo.id.toString()) {
            return; // Repository already added
        }
    }

    const emptyMessage = repositoriesList.querySelector('.empty-message');
    if (emptyMessage) {
        emptyMessage.remove();
    }

    const repoElement = createRepositoryElement(repo);
    repositoriesList.appendChild(repoElement);
}

function createRepositoryElement(repo) {
    const div = document.createElement('div');
    div.className = 'repository-item';
    div.dataset.repoId = repo.id;

    div.innerHTML = `
        <div class="repository-info">
            <div class="repository-name">${escapeHtml(repo.name)}</div>
            <div class="repository-owner">Owner: ${escapeHtml(repo.owner.login)}</div>
        </div>
        <div class="repository-stars">
            <span class="star-icon">⭐</span>
            <span>${repo.stargazers_count.toLocaleString()}</span>
        </div>
        <button class="delete-btn" data-repo-id="${repo.id}">✕</button>
    `;

    // Add delete event listener
    const deleteBtn = div.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        removeRepository(repo.id, div);
    });

    return div;
}

function removeRepository(repoId, element) {
    element.remove();

    // Show empty message if no repositories
    const repositoriesList = document.getElementById('repositoriesList');
    if (repositoriesList.children.length === 0) {
        showEmptyMessage();
    }
}

function showEmptyMessage() {
    const repositoriesList = document.getElementById('repositoriesList');
    repositoriesList.innerHTML = '<div class="empty-message">No repositories added yet. Search and click to add.</div>';
}

const handleInputChange = debounce(async (event) => {
    const query = event.target.value.trim();

    if (query.length === 0) {
        hideAutocomplete();
        return;
    }

    const repositories = await searchRepositories(query);
    renderAutocomplete(repositories);
}, 300); // 300ms debounce delay

function init() {
    const searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('input', handleInputChange);

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.autocomplete-container')) {
            hideAutocomplete();
        }
    });

    showEmptyMessage();
}

document.addEventListener('DOMContentLoaded', init);


