(() => {
    'use strict';

    const DATA_URL = '../../data/psychopathologie/psychopathologie.normalized.json';
    const SYNONYMS_URL = '../../data/psychopathologie/synonymes.json';
    const state = {
        rows: [],
        synonyms: {},
        catalog: [],
        selected: [],
        query: ''
    };

    const elements = {};

    function normalize(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    function symptomMatchesQuery(symptom, query) {
        const normalizedSymptom = normalize(symptom);
        const normalizedQuery = normalize(query);
        if (!normalizedQuery) return false;
        return normalizedSymptom.includes(normalizedQuery)
            || normalizedQuery.split(' ').every(token => normalizedSymptom.includes(token));
    }

    function buildCatalog() {
        const catalog = new Map();
        state.rows.forEach(row => {
            row.symptomes.forEach(symptom => {
                const key = normalize(symptom);
                if (!key) return;
                if (!catalog.has(key)) {
                    catalog.set(key, symptom);
                }
            });
        });

        Object.entries(state.synonyms).forEach(([canonical, aliases]) => {
            const canonicalKey = normalize(canonical);
            if (!catalog.has(canonicalKey)) catalog.set(canonicalKey, canonical);
            aliases.forEach(alias => {
                catalog.set(normalize(alias), alias);
            });
        });

        state.catalog = [...catalog.values()].sort((a, b) => a.localeCompare(b, 'fr'));
    }

    function getCanonicalSymptom(value) {
        const normalizedValue = normalize(value);
        const synonymEntry = Object.entries(state.synonyms).find(([canonical, aliases]) =>
            normalize(canonical) === normalizedValue
            || aliases.some(alias => normalize(alias) === normalizedValue)
        );
        return synonymEntry ? synonymEntry[0] : value;
    }

    function showSuggestions() {
        const query = state.query.trim();
        if (query.length < 2) {
            elements.suggestions.classList.remove('active');
            elements.suggestions.innerHTML = '';
            return;
        }

        const selectedKeys = new Set(state.selected.map(normalize));
        const suggestions = state.catalog
            .filter(symptom => symptomMatchesQuery(symptom, query))
            .filter(symptom => !selectedKeys.has(normalize(getCanonicalSymptom(symptom))))
            .slice(0, 10);

        if (!suggestions.length) {
            elements.suggestions.innerHTML = '<div class="symptom-suggestion" aria-live="polite">Aucun symptôme local correspondant.</div>';
        } else {
            elements.suggestions.innerHTML = suggestions.map((symptom, index) => `
                <button type="button" class="symptom-suggestion" data-index="${index}">
                    <span>${escapeHtml(symptom)}</span>
                    ${normalize(symptom) === normalize(getCanonicalSymptom(symptom))
                        ? ''
                        : '<span class="symptom-match-type">terme associé</span>'}
                </button>
            `).join('');
            elements.suggestions.querySelectorAll('[data-index]').forEach(button => {
                button.addEventListener('click', () => selectSymptom(suggestions[Number(button.dataset.index)]));
            });
        }
        elements.suggestions.classList.add('active');
    }

    function selectSymptom(value) {
        const canonical = getCanonicalSymptom(value);
        if (!state.selected.some(symptom => normalize(symptom) === normalize(canonical))) {
            state.selected.push(canonical);
        }
        state.query = '';
        elements.input.value = '';
        elements.suggestions.classList.remove('active');
        renderSelected();
        renderResults();
    }

    function removeSymptom(symptom) {
        state.selected = state.selected.filter(item => normalize(item) !== normalize(symptom));
        renderSelected();
        renderResults();
    }

    function findMatchedSymptoms(row) {
        return state.selected.filter(selected => row.symptomes.some(symptom =>
            symptomMatchesQuery(symptom, selected)
            || normalize(symptom) === normalize(selected)
        ));
    }

    function renderSelected() {
        if (!state.selected.length) {
            elements.selected.innerHTML = '<span class="empty-state">Aucun symptôme sélectionné.</span>';
            elements.clear.disabled = true;
            return;
        }

        elements.clear.disabled = false;
        elements.selected.innerHTML = state.selected.map(symptom => `
            <span class="symptom-chip">
                ${escapeHtml(symptom)}
                <button type="button" data-remove="${escapeHtml(symptom)}" aria-label="Supprimer ${escapeHtml(symptom)}">×</button>
            </span>
        `).join('');
        elements.selected.querySelectorAll('[data-remove]').forEach(button => {
            button.addEventListener('click', () => removeSymptom(button.dataset.remove));
        });
    }

    function renderResults() {
        if (!state.selected.length) {
            elements.summary.textContent = 'Sélectionnez un ou plusieurs symptômes pour afficher les correspondances.';
            elements.results.innerHTML = '<div class="empty-state">Les catégories et sous-catégories correspondantes apparaîtront ici.</div>';
            return;
        }

        const matches = state.rows
            .map(row => ({ row, matched: findMatchedSymptoms(row) }))
            .filter(item => item.matched.length > 0);

        elements.summary.textContent = `${matches.length} ligne(s) correspondent à au moins un symptôme sélectionné.`;
        if (!matches.length) {
            elements.results.innerHTML = '<div class="notice">Aucune correspondance trouvée dans le tableau pour cette sélection.</div>';
            return;
        }

        elements.results.innerHTML = matches.map(({ row, matched }) => `
            <article class="psychopathology-result ${matched.length > 1 ? 'multiple-match' : ''}">
                <div class="result-heading">
                    <div>
                        <h2 class="result-category">${escapeHtml(row.categorie)}</h2>
                        <p class="result-subcategory">${escapeHtml(row.sousCategorie)}</p>
                    </div>
                    ${row.prevalence ? `<span class="prevalence">Prévalence : ${escapeHtml(row.prevalence)}</span>` : ''}
                </div>
                <div class="matched-symptoms" aria-label="Symptômes correspondants">
                    ${matched.map(symptom => `<span class="matched-symptom">${escapeHtml(symptom)}</span>`).join('')}
                </div>
                <ul class="symptom-list">
                    ${row.symptomes.map(symptom => `<li>${escapeHtml(symptom)}</li>`).join('')}
                </ul>
            </article>
        `).join('');
    }

    async function loadData() {
        const [dataResponse, synonymsResponse] = await Promise.all([
            fetch(DATA_URL),
            fetch(SYNONYMS_URL)
        ]);
        if (!dataResponse.ok || !synonymsResponse.ok) {
            throw new Error('Impossible de charger les données de psychopathologie.');
        }
        state.rows = await dataResponse.json();
        state.synonyms = await synonymsResponse.json();
        buildCatalog();
        renderSelected();
        renderResults();
    }

    function initialize() {
        elements.input = document.getElementById('symptomSearch');
        elements.suggestions = document.getElementById('symptomSuggestions');
        elements.selected = document.getElementById('selectedSymptoms');
        elements.results = document.getElementById('psychopathologyResults');
        elements.summary = document.getElementById('resultsSummary');
        elements.clear = document.getElementById('clearSymptoms');

        elements.input.addEventListener('input', event => {
            state.query = event.target.value;
            showSuggestions();
        });
        elements.input.addEventListener('focus', showSuggestions);
        elements.input.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                elements.suggestions.classList.remove('active');
            }
        });
        elements.clear.addEventListener('click', () => {
            state.selected = [];
            renderSelected();
            renderResults();
        });
        document.addEventListener('click', event => {
            if (!event.target.closest('.psychopathologie-search-wrapper')) {
                elements.suggestions.classList.remove('active');
            }
        });

        loadData().catch(error => {
            console.error(error);
            elements.summary.textContent = 'Les données n’ont pas pu être chargées.';
            elements.results.innerHTML = '<div class="notice">Une erreur est survenue lors du chargement des données. Réessayez après avoir rechargé la page.</div>';
        });
    }

    document.addEventListener('DOMContentLoaded', initialize);
})();
