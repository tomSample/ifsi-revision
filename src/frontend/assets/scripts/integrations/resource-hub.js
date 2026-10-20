(() => {
    const form = document.getElementById('resourceSearchForm');
    const input = document.getElementById('resourceSearchInput');
    const status = document.getElementById('resourceSearchStatus');
    const panel = document.getElementById('resourceResults');
    const list = document.getElementById('resourceResultsList');

    if (!form || !input || !status || !panel || !list) return;

    const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#039;'
    }[character]));

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const query = input.value.trim();
        if (query.length < 2) {
            status.textContent = 'Saisis au moins deux caractères.';
            panel.hidden = true;
            return;
        }
        status.textContent = 'Recherche en cours…';
        try {
            const response = await fetch(`/api/integrations/search?q=${encodeURIComponent(query)}`);
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Recherche indisponible');
            list.innerHTML = payload.results.length
                ? payload.results.map((result) => `
                    <div class="result">
                        <div><strong>${escapeHtml(result.title)}</strong><div class="muted">${escapeHtml(result.subtitle || '')}</div></div>
                        <a href="${escapeHtml(result.url)}">Ouvrir →</a>
                    </div>`).join('') + `<p class="muted"><a href="./references.html?q=${encodeURIComponent(query)}">🔬 Rechercher aussi des références scientifiques</a></p>`
                : '<p class="muted">Aucun résultat local. Essaie un autre terme ou ouvre une ressource dédiée.</p>';
            panel.hidden = false;
            status.textContent = `${payload.results.length} résultat(s) trouvé(s).`;
        } catch (error) {
            panel.hidden = true;
            status.textContent = `Impossible de rechercher pour le moment : ${error.message}`;
        }
    });
})();
