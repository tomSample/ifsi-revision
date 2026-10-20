(() => {
    const form = document.getElementById('medicationForm');
    const input = document.getElementById('medicationInput');
    const status = document.getElementById('medicationStatus');
    const results = document.getElementById('medicationResults');
    if (!form || !input || !status || !results) return;
    const params = new URLSearchParams(window.location.search);
    input.value = params.get('q') || params.get('name') || '';
    const esc = (value) => String(value || '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[c]));
    const list = (values) => `<ul>${values.filter(Boolean).map((value) => `<li>${esc(value)}</li>`).join('') || '<li>Non renseigné par la source externe</li>'}</ul>`;
    const render = (medications) => {
        results.innerHTML = medications.map((medication) => `
            <article class="medication">
                <h2>${esc(medication.name)}</h2>
                <p><strong>Substances actives :</strong> ${esc(medication.activeIngredients.join(', ')) || 'Non renseigné'}</p>
                <div class="grid">
                    <div><div class="label">Indications</div>${list(medication.indications)}</div>
                    <div><div class="label">Noms commerciaux</div>${list(medication.brandNames)}</div>
                    <div><div class="label">Indications</div>${list(medication.indications)}</div>
                    <div><div class="label">Mises en garde</div>${list(medication.warnings)}</div>
                    <div><div class="label">Effets indésirables</div>${list(medication.adverseReactions)}</div>
                    <div><div class="label">Posologie et administration</div>${list(medication.dosageAndAdministration)}</div>
                </div>
                <p><a href="${esc(medication.sourceUrl)}" target="_blank" rel="noopener noreferrer">Consulter la source externe ↗</a></p>
                <p><a href="./references.html?q=${encodeURIComponent(medication.name)}">🔬 Voir des références scientifiques</a></p>
                <small>Ressource pédagogique : vérifier la notice officielle et les protocoles de l’établissement.</small>
            </article>`).join('');
    };
    async function search() {
        const query = input.value.trim();
        if (query.length < 2) {
            status.textContent = 'Saisis au moins deux caractères pour interroger la source externe.';
            results.innerHTML = '';
            return;
        }
        status.textContent = 'Recherche OpenFDA en cours…';
        try {
            const response = await fetch(`/api/integrations/medications?q=${encodeURIComponent(query)}`);
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Service indisponible');
            render(payload.medications);
            status.textContent = `${payload.medications.length} fiche(s) affichée(s).`;
        } catch (error) {
            results.innerHTML = '';
            status.textContent = `Impossible de charger les fiches : ${error.message}`;
        }
    }
    form.addEventListener('submit', (event) => { event.preventDefault(); search(); });
    if (input.value) search();
})();
