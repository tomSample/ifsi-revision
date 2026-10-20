(() => {
    const form = document.getElementById('healthForm'), input = document.getElementById('healthInput'), status = document.getElementById('healthStatus'), results = document.getElementById('healthResults');
    if (!form || !input || !status || !results) return;
    const esc = (value) => String(value || '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[c]));
    async function load() {
        status.textContent = 'Chargement…';
        try {
            const response = await fetch(`/api/integrations/public-health?q=${encodeURIComponent(input.value.trim())}`);
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Service indisponible');
            results.innerHTML = payload.indicators.map((item) => `<article class="indicator"><h2>${esc(item.title)}</h2><div class="meta">Code : ${esc(item.code)} · Langue : ${esc(item.language)} · Source : ${esc(payload.source)}</div><p><a href="${esc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">Ouvrir la source OMS ↗</a></p></article>`).join('') || '<p class="meta">Aucun indicateur externe trouvé.</p>';
            status.textContent = `${payload.indicators.length} thème(s) affiché(s).`;
        } catch (error) { results.innerHTML = ''; status.textContent = `Impossible de charger les indicateurs : ${error.message}`; }
    }
    form.addEventListener('submit', (event) => { event.preventDefault(); load(); });
    input.value = new URLSearchParams(window.location.search).get('q') || '';
    if (input.value) load();
})();
