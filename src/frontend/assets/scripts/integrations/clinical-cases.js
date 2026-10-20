(() => {
    const list = document.getElementById('caseList');
    if (!list) return;
    const esc = (value) => String(value || '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[c]));
    function renderList() {
        const query = new URLSearchParams(window.location.search).get('q') || '';
        list.innerHTML = `<h1>Études cliniques externes</h1><p class="muted">Ces résultats proviennent de ClinicalTrials.gov. Ce ne sont pas des cas cliniques pédagogiques validés.</p><form id="studyForm"><input id="studyInput" value="${esc(query)}" placeholder="Ex. pneumonia, diabetes, stroke"><button class="btn btn-primary">Rechercher</button></form><div id="studyStatus" class="muted"></div><div id="studyResults"></div>`;
        document.getElementById('studyForm').addEventListener('submit', (event) => { event.preventDefault(); loadStudies(document.getElementById('studyInput').value.trim()); });
        if (query) loadStudies(query);
    }
    async function loadStudies(query) {
        const status = document.getElementById('studyStatus');
        const results = document.getElementById('studyResults');
        if (!query || query.length < 2) { status.textContent = 'Saisis au moins deux caractères.'; return; }
        status.textContent = 'Recherche ClinicalTrials.gov en cours…';
        try {
            const response = await fetch(`/api/integrations/clinical-cases?q=${encodeURIComponent(query)}`);
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Service indisponible');
            results.innerHTML = payload.studies.map((study) => `<article class="panel"><h2>${esc(study.title)}</h2><p>${esc(study.summary)}</p><p class="muted">${esc(study.id)} · ${esc(study.studyType)} · ${esc(study.status)} · ${esc(study.phases.join(', '))}</p><a href="${esc(study.url)}" target="_blank" rel="noopener noreferrer">Voir l’étude sur ClinicalTrials.gov ↗</a></article>`).join('') || '<p class="muted">Aucune étude trouvée.</p>';
            status.textContent = `${payload.studies.length} étude(s) trouvée(s).`;
        } catch (error) { results.innerHTML = ''; status.textContent = `Impossible de charger les études : ${error.message}`; }
    }
    renderList();
})();
