(() => {
    'use strict';

    const DATA_URL = '../../data/psychopathologie/psychopathologie.normalized.json';
    const state = {
        rows: [],
        categories: [],
        selectedCategory: ''
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

    function getCategories() {
        return [...new Set(state.rows.map(row => row.categorie))];
    }

    function rowMatches(row, query) {
        const normalizedQuery = normalize(query);
        if (!normalizedQuery) return true;
        const searchable = [
            row.categorie,
            row.sousCategorie,
            row.prevalence,
            ...row.symptomes
        ].map(normalize).join(' ');
        return normalizedQuery.split(' ').every(token => searchable.includes(token));
    }

    function renderCategoryNavigation() {
        const query = elements.search.value;
        const visibleCategories = state.categories.filter(category =>
            state.rows.some(row =>
                row.categorie === category
                && rowMatches(row, query)
            )
        );

        elements.categoryList.innerHTML = visibleCategories.map((category, index) => {
            const categoryIndex = state.categories.indexOf(category) % 6 + 1;
            const active = state.selectedCategory === category;
            return `
                <button type="button"
                    class="psychopathologie-category-item category-color-${categoryIndex}${active ? ' active' : ''}"
                    data-category="${escapeHtml(category)}">
                    <span>${escapeHtml(category)}</span>
                </button>
            `;
        }).join('');

        elements.categoryList.querySelectorAll('[data-category]').forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.category;
                state.selectedCategory = state.selectedCategory === category ? '' : category;
                elements.mobileCategory.value = state.selectedCategory;
                renderCategoryNavigation();
                renderContent();
            });
        });

        elements.mobileCategory.innerHTML = '<option value="">Toutes les catégories</option>'
            + visibleCategories.map(category =>
                `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
            ).join('');
        elements.mobileCategory.value = state.selectedCategory;
    }

    function renderContent() {
        const query = elements.search.value;
        const filtered = state.rows.filter(row =>
            (!state.selectedCategory || row.categorie === state.selectedCategory)
            && rowMatches(row, query)
        );
        elements.count.textContent = `${filtered.length} sous-catégorie(s) affichée(s)`;

        if (!filtered.length) {
            elements.content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <h3>Aucun résultat trouvé</h3>
                    <p>Essayez une autre recherche ou sélectionnez une autre catégorie.</p>
                </div>
            `;
            return;
        }

        const grouped = new Map();
        filtered.forEach(row => {
            if (!grouped.has(row.categorie)) grouped.set(row.categorie, []);
            grouped.get(row.categorie).push(row);
        });

        elements.content.innerHTML = [...grouped.entries()].map(([category, rows]) => {
            const categoryIndex = state.categories.indexOf(category) % 6 + 1;
            return rows.map((row, index) => `
                <article class="psychopathologie-accordion category-border-${categoryIndex}">
                    <button type="button" class="psychopathologie-accordion-header"
                        aria-expanded="${index === 0 && grouped.size === 1 ? 'true' : 'false'}">
                        <span class="psychopathologie-accordion-title">
                            <span class="psychopathologie-category-label category-color-${categoryIndex}">${escapeHtml(category)}</span>
                            <strong>${escapeHtml(row.sousCategorie)}</strong>
                        </span>
                        <span class="psychopathologie-accordion-toggle" aria-hidden="true">▼</span>
                    </button>
                    <div class="psychopathologie-accordion-body" ${index === 0 && grouped.size === 1 ? '' : 'hidden'}>
                        <div class="psychopathologie-detail">
                            ${row.prevalence ? `<div class="prevalence">Prévalence : ${escapeHtml(row.prevalence)}</div>` : ''}
                            <h3>Symptomatologie</h3>
                            <ul class="recap-symptoms">
                                ${row.symptomes.map(symptom => `<li>${escapeHtml(symptom)}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </article>
            `).join('');
        }).join('');

        elements.content.querySelectorAll('.psychopathologie-accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const body = header.nextElementSibling;
                const expanded = header.getAttribute('aria-expanded') === 'true';
                header.setAttribute('aria-expanded', String(!expanded));
                body.hidden = expanded;
                header.parentElement.classList.toggle('open', !expanded);
            });
        });
    }

    function render() {
        renderCategoryNavigation();
        renderContent();
    }

    async function load() {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Impossible de charger le récapitulatif.');
        state.rows = await response.json();
        state.categories = getCategories();
        render();
    }

    function initialize() {
        elements.search = document.getElementById('psychopathologieRecapSearch');
        elements.categoryList = document.getElementById('psychopathologieCategoryList');
        elements.mobileCategory = document.getElementById('psychopathologieMobileCategory');
        elements.content = document.getElementById('psychopathologieRecapResults');
        elements.count = document.getElementById('psychopathologieRecapCount');

        elements.search.addEventListener('input', render);
        elements.mobileCategory.addEventListener('change', event => {
            state.selectedCategory = event.target.value;
            render();
        });

        load().catch(error => {
            console.error(error);
            elements.count.textContent = 'Données indisponibles';
            elements.content.innerHTML = '<div class="notice">Le récapitulatif n’a pas pu être chargé. Rechargez la page pour réessayer.</div>';
        });
    }

    document.addEventListener('DOMContentLoaded', initialize);
})();
