(() => {
    'use strict';

    const state = {
        specialties: [],
        compositions: new Map(),
        presentations: new Map(),
        atc: new Map(),
        smr: new Map(),
        asmr: new Map(),
        availability: new Map(),
        source: null,
        selected: null
    };

    const content = document.getElementById('content');
    const search = document.getElementById('searchInput');
    const status = document.getElementById('status');
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[character]));

    async function fetchText(file) {
        const response = await fetch(`../../data/pharmacologie-ide/bdpm/${file}`);
        if (!response.ok) throw new Error(`Impossible de charger ${file} (${response.status})`);
        const decoder = new TextDecoder('windows-1252');
        return decoder.decode(await response.arrayBuffer());
    }

    function rows(text) {
        return text.split(/\r?\n/).filter(Boolean).map((line) => line.split('\t'));
    }

    function indexByCis(text, mapper) {
        const index = new Map();
        rows(text).forEach((columns) => {
            const value = mapper(columns);
            if (value) index.set(columns[0], value);
        });
        return index;
    }

    async function load() {
        const files = {
            specialties: 'CIS_bdpm.txt',
            compositions: 'CIS_COMPO_bdpm.txt',
            presentations: 'CIS_CIP_bdpm.txt',
            atc: 'CIS_MITM.txt',
            smr: 'CIS_HAS_SMR_bdpm.txt',
            asmr: 'CIS_HAS_ASMR_bdpm.txt',
            availability: 'CIS_CIP_Dispo_Spec.txt'
        };
        state.source = await fetch('../../data/pharmacologie-ide/bdpm/source.json').then((response) => {
            if (!response.ok) throw new Error(`Impossible de charger la provenance (${response.status})`);
            return response.json();
        });
        const data = {};
        for (const [key, file] of Object.entries(files)) data[key] = await fetchText(file);
        state.specialties = rows(data.specialties).map((columns) => ({
            cis: columns[0],
            name: columns[1],
            form: columns[2],
            routes: columns[3],
            administrativeStatus: columns[4],
            procedure: columns[5],
            commercialStatus: columns[6],
            authorizationDate: columns[7],
            laboratory: columns[10],
            enhancedMonitoring: columns[11]
        })).filter((item) => item.cis && item.name);
        state.compositions = indexByCis(data.compositions, (columns) => ({
            form: columns[1],
            substance: columns[3],
            strength: columns[4],
            unit: columns[5]
        }));
        state.presentations = indexByCis(data.presentations, (columns) => ({
            cip: columns[1],
            description: columns[2],
            status: columns[3]
        }));
        state.atc = indexByCis(data.atc, (columns) => ({
            code: columns[1],
            url: columns[6]
        }));
        state.smr = indexByCis(data.smr, (columns) => ({ code: columns[1], level: columns[4], text: columns[5] }));
        state.asmr = indexByCis(data.asmr, (columns) => ({ code: columns[1], level: columns[4], text: columns[5] }));
        state.availability = indexByCis(data.availability, (columns) => ({ status: columns[2], start: columns[3], end: columns[4] }));
        render();
    }

    function render() {
        if (state.selected) return renderDetail(state.selected);
        const query = search.value.trim().toLocaleLowerCase('fr-FR');
        const results = state.specialties.filter((item) => {
            const composition = state.compositions.get(item.cis);
            const atc = state.atc.get(item.cis);
            const searchable = [item.name, item.form, item.routes, item.laboratory, composition?.substance, atc?.code]
                .filter(Boolean).join(' ').toLocaleLowerCase('fr-FR');
            return !query || searchable.includes(query);
        }).slice(0, 100);
        status.textContent = `${results.length} résultat(s) affiché(s), maximum 100. Export BDPM récupéré le ${state.source.retrievedAt}.`;
        content.innerHTML = results.length ? `<div class="grid">${results.map(card).join('')}</div>` :
            '<div class="panel empty">Saisis un nom, une substance, un laboratoire ou un code ATC.</div>';
        content.querySelectorAll('[data-cis]').forEach((button) => button.addEventListener('click', () => {
            state.selected = state.specialties.find((item) => item.cis === button.dataset.cis);
            render();
        }));
    }

    function card(item) {
        const composition = state.compositions.get(item.cis);
        const atc = state.atc.get(item.cis);
        return `<article class="card">
            <h2>${esc(item.name)}</h2>
            <p><strong>Forme :</strong> ${esc(item.form)}<br><strong>Voie :</strong> ${esc(item.routes || 'Non renseignée')}</p>
            <p><strong>Substance :</strong> ${esc(composition?.substance || 'Non renseignée')} ${esc(composition?.strength || '')}</p>
            <p class="muted"><strong>Code ATC :</strong> ${esc(atc?.code || 'Non renseigné')}</p>
            <button class="btn btn-primary" type="button" data-cis="${esc(item.cis)}">Voir les données officielles</button>
        </article>`;
    }

    function renderDetail(item) {
        const composition = state.compositions.get(item.cis);
        const presentation = state.presentations.get(item.cis);
        const atc = state.atc.get(item.cis);
        const smr = state.smr.get(item.cis);
        const asmr = state.asmr.get(item.cis);
        const availability = state.availability.get(item.cis);
        status.textContent = `Spécialité CIS ${item.cis}`;
        content.innerHTML = `<button class="btn btn-secondary back-button" type="button" id="back">← Retour au catalogue</button>
            <article class="panel">
                <h2>${esc(item.name)}</h2>
                <div class="badges">
                    <span class="badge">CIS ${esc(item.cis)}</span>
                    <span class="badge">${esc(item.administrativeStatus)}</span>
                    <span class="badge">${esc(item.commercialStatus)}</span>
                </div>
                <div class="detail">
                    <div>
                        <div class="detail-section"><h3>Spécialité</h3>
                            <p><strong>Forme :</strong> ${esc(item.form)}</p>
                            <p><strong>Voie(s) :</strong> ${esc(item.routes || 'Non renseignée')}</p>
                            <p><strong>Laboratoire :</strong> ${esc(item.laboratory || 'Non renseigné')}</p>
                            <p><strong>Procédure :</strong> ${esc(item.procedure || 'Non renseignée')}</p>
                            <p><strong>Date d'autorisation :</strong> ${esc(item.authorizationDate || 'Non renseignée')}</p>
                            <p><strong>Surveillance renforcée :</strong> ${esc(item.enhancedMonitoring || 'Non renseignée')}</p>
                        </div>
                        <div class="detail-section"><h3>Composition officielle</h3>
                            <p><strong>Substance :</strong> ${esc(composition?.substance || 'Non renseignée')}</p>
                            <p><strong>Dosage :</strong> ${esc(composition?.strength || 'Non renseigné')} ${esc(composition?.unit || '')}</p>
                        </div>
                        <div class="detail-section"><h3>Présentation</h3>
                            <p><strong>Code CIP :</strong> ${esc(presentation?.cip || 'Non renseigné')}</p>
                            <p>${esc(presentation?.description || 'Présentation non renseignée')}</p>
                            <p><strong>Statut :</strong> ${esc(presentation?.status || 'Non renseigné')}</p>
                        </div>
                    </div>
                    <aside>
                        <div class="alert"><strong>Provenance</strong>
                            <p>${esc(state.source.name)}</p>
                            <p>Organismes : ${esc(state.source.organization)}</p>
                            <p>Export local récupéré le ${esc(state.source.retrievedAt)}.</p>
                        </div>
                        <div class="detail-section"><h3>Classement et avis HAS disponibles dans l'export</h3>
                            <p><strong>Code ATC :</strong> ${esc(atc?.code || 'Non renseigné')}</p>
                            <p><strong>SMR :</strong> ${esc(smr?.level || 'Non renseigné')}</p>
                            <p><strong>ASMR :</strong> ${esc(asmr?.level || 'Non renseigné')}</p>
                            <p class="muted">${esc(smr?.text || asmr?.text || 'Aucun texte d’avis associé dans les fichiers locaux pour cette spécialité.')}</p>
                        </div>
                        ${availability ? `<div class="alert"><strong>Disponibilité signalée</strong><p>Statut : ${esc(availability.status)}<br>Période : ${esc(availability.start)} - ${esc(availability.end)}</p></div>` : ''}
                    </aside>
                </div>
                <p class="muted"><small>${esc(state.source.notice)}</small></p>
            </article>`;
        document.getElementById('back').addEventListener('click', () => {
            state.selected = null;
            render();
        });
    }

    search.addEventListener('input', render);
    load().catch((error) => {
        status.textContent = 'La base officielle locale est indisponible.';
        content.innerHTML = `<div class="panel empty">${esc(error.message)}</div>`;
        console.error('[BDPM locale]', error);
    });
})();
