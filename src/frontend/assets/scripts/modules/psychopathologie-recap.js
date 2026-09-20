(() => {
    'use strict';

    const DATA_URL = '../../data/psychopathologie/psychopathologie.normalized.json';
    let rows = [];
    const input = document.getElementById('psychopathologieRecapSearch');
    const container = document.getElementById('psychopathologieRecapResults');
    const count = document.getElementById('psychopathologieRecapCount');

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

    function matches(row, query) {
        if (!query) return true;
        const searchable = [
            row.categorie,
            row.sousCategorie,
            row.prevalence,
            ...row.symptomes
        ].map(normalize).join(' ');
        return normalize(query).split(' ').every(token => searchable.includes(token));
    }

    function render() {
        const query = input.value;
        const filtered = rows.filter(row => matches(row, query));
        count.textContent = `${filtered.length} sous-catégorie(s) affichée(s)`;

        if (!filtered.length) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔎</div><h3>Aucun résultat</h3><p>Essayez un autre terme.</p></div>';
            return;
        }

        const categories = new Map();
        filtered.forEach(row => {
            if (!categories.has(row.categorie)) categories.set(row.categorie, []);
            categories.get(row.categorie).push(row);
        });

        container.innerHTML = [...categories.entries()].map(([category, categoryRows]) => `
            <section class="recap-category">
                <h2 class="recap-category-title">${escapeHtml(category)}</h2>
                <div class="recap-subcategories">
                    ${categoryRows.map(row => `
                        <article class="recap-subcategory">
                            <div class="recap-subcategory-heading">
                                <h3>${escapeHtml(row.sousCategorie)}</h3>
                                ${row.prevalence ? `<span class="prevalence">Prévalence : ${escapeHtml(row.prevalence)}</span>` : ''}
                            </div>
                            <ul class="recap-symptoms">
                                ${row.symptomes.map(symptom => `<li>${escapeHtml(symptom)}</li>`).join('')}
                            </ul>
                        </article>
                    `).join('')}
                </div>
            </section>
        `).join('');
    }

    async function load() {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Impossible de charger le récapitulatif.');
        rows = await response.json();
        render();
    }

    input.addEventListener('input', render);
    load().catch(error => {
        console.error(error);
        count.textContent = 'Données indisponibles';
        container.innerHTML = '<div class="notice">Le récapitulatif n’a pas pu être chargé. Rechargez la page pour réessayer.</div>';
    });
})();
