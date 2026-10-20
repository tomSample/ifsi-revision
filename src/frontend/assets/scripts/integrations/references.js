(() => {
    const form = document.getElementById('referenceForm');
    const input = document.getElementById('referenceInput');
    const status = document.getElementById('referenceStatus');
    const results = document.getElementById('referenceResults');
    if (!form || !input || !status || !results) return;
    input.value = new URLSearchParams(window.location.search).get('q') || '';
    const esc = (value) => String(value || '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[c]));
    const render = (articles) => {
        results.innerHTML = articles.length ? articles.map((article) => `
            <article class="article">
                <h2><a href="${esc(article.url)}" target="_blank" rel="noopener noreferrer">${esc(article.title)}</a></h2>
                <div class="meta">${esc(article.year)} · ${esc(article.journal)}</div>
                <p class="abstract">${esc(article.abstract) || 'Résumé non disponible.'}</p>
                <a href="${esc(article.url)}" target="_blank" rel="noopener noreferrer">Lire la notice Europe PMC ↗</a>
            </article>`).join('') : '<p class="meta">Aucune référence trouvée pour ce terme.</p>';
    };
    async function search() {
        const query = input.value.trim();
        if (query.length < 2) { status.textContent = 'Saisis au moins deux caractères.'; results.innerHTML = ''; return; }
        status.textContent = 'Recherche Europe PMC en cours…';
        try {
            const response = await fetch(`/api/integrations/references?q=${encodeURIComponent(query)}`);
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Service indisponible');
            render(payload.articles);
            status.textContent = `${payload.articles.length} référence(s) trouvée(s).`;
        } catch (error) {
            results.innerHTML = '';
            status.textContent = `Les références ne sont pas disponibles : ${error.message}`;
        }
    }
    form.addEventListener('submit', (event) => { event.preventDefault(); search(); });
    if (input.value) search();
})();
