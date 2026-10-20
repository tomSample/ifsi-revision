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
    const formFilter = document.getElementById('formFilter');
    const routeFilter = document.getElementById('routeFilter');
    const authorizationFilter = document.getElementById('authorizationFilter');
    const resetFilters = document.getElementById('resetFilters');
    const status = document.getElementById('status');
    const visibleLimit = 100;
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

    function normalized(value) {
        return String(value || '').trim().toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function dosage(item) {
        const composition = state.compositions.get(item.cis);
        return [composition?.strength, composition?.unit].filter(Boolean).join(' ').trim();
    }

    function addOptions(select, values, emptyLabel) {
        select.innerHTML = `<option value="">${emptyLabel}</option>${values
            .sort((a, b) => a.localeCompare(b, 'fr-FR'))
            .map((value) => `<option value="${esc(value)}">${esc(value)}</option>`)
            .join('')}`;
    }

    function formCategory(form) {
        const value = normalized(form);
        if (value.includes('comprime') || value.includes('gelule') || value.includes('capsule')) return 'Solide oral';
        if (value.includes('injectable') || value.includes('perfusion') || value.includes('inject')) return 'Injectable';
        if (value.includes('buvable') || value.includes('sirop') || value.includes('solution')) return 'Liquide';
        if (value.includes('pommade') || value.includes('creme') || value.includes('gel') || value.includes('patch')) return 'Cutané';
        if (value.includes('collyre') || value.includes('ophtalm')) return 'Ophtalmique';
        if (value.includes('poudre') || value.includes('granule') || value.includes('suppositoire')) return 'Autre';
        return 'Autre';
    }

    function routeCategory(routes) {
        const value = normalized(routes);
        if (value.includes('orale') || value.includes('sublinguale') || value.includes('buccale')) return 'Orale';
        if (value.includes('intraveineuse') || value.includes('intramusculaire') || value.includes('sous-cutanee')) return 'Injectable';
        if (value.includes('cutanee') || value.includes('transdermique')) return 'Cutanée';
        if (value.includes('inhalee') || value.includes('nasale')) return 'Respiratoire / nasale';
        if (value.includes('ophtalmique')) return 'Ophtalmique';
        if (value.includes('rectale') || value.includes('vaginale')) return 'Autre muqueuse';
        return 'Autre';
    }

    function populateFilters() {
        addOptions(formFilter, [...new Set(state.specialties.map((item) => formCategory(item.form)))] , 'Toutes les formes');
        addOptions(routeFilter, [...new Set(state.specialties.map((item) => routeCategory(item.routes)))] , 'Toutes les voies');
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
        populateFilters();
        render();
    }

    function render() {
        if (state.selected) return renderDetail(state.selected);
        const query = normalized(search.value);
        const selectedForm = normalized(formFilter.value);
        const selectedRoute = normalized(routeFilter.value);
        const selectedAuthorization = authorizationFilter.value;
        const results = state.specialties.filter((item) => {
            const composition = state.compositions.get(item.cis);
            const atc = state.atc.get(item.cis);
            const searchable = [item.name, item.form, item.routes, item.laboratory, composition?.substance, atc?.code]
                .filter(Boolean).join(' ').toLocaleLowerCase('fr-FR');
            const isActive = normalized(item.administrativeStatus) === 'autorisation active';
            return (!query || searchable.includes(query))
                && (!selectedForm || normalized(formCategory(item.form)) === selectedForm)
                && (!selectedRoute || normalized(routeCategory(item.routes)) === selectedRoute)
                && (!selectedAuthorization || (selectedAuthorization === 'active' ? isActive : !isActive));
        });
        const groups = groupBySubstance(results).slice(0, visibleLimit);
        status.textContent = `${results.length} spécialité(s) regroupée(s) en ${groupBySubstance(results).length} substance(s). Export BDPM récupéré le ${state.source.retrievedAt}.`;
        content.innerHTML = groups.length ? `<div class="grid">${groups.map(groupCard).join('')}</div>` :
            '<div class="panel empty">Saisis un nom, une substance, un laboratoire ou un code ATC.</div>';
        content.querySelectorAll('[data-cis]').forEach((button) => button.addEventListener('click', () => {
            state.selected = state.specialties.find((item) => item.cis === button.dataset.cis);
            render();
        }));
    }

    function groupBySubstance(items) {
        const groups = new Map();
        items.forEach((item) => {
            const substance = state.compositions.get(item.cis)?.substance || 'Substance non renseignée';
            const key = normalized(substance);
            if (!groups.has(key)) groups.set(key, { substance, items: [] });
            groups.get(key).items.push(item);
        });
        return [...groups.values()].sort((a, b) => a.substance.localeCompare(b.substance, 'fr-FR'));
    }

    function groupCard(group) {
        const variants = group.items.map((item) => `<div class="variant">
            <span><strong>${esc(item.name)}</strong><br><span class="muted">${esc(item.form || 'Forme non renseignée')} · ${esc(dosage(item) || 'Dosage non renseigné')} · ${esc(item.routes || 'Voie non renseignée')}</span></span>
            <button class="btn btn-primary" type="button" data-cis="${esc(item.cis)}">Voir</button>
        </div>`).join('');
        return `<details class="card result-group">
            <summary><h2>${esc(group.substance)}</h2><span class="muted">${group.items.length} spécialité(s)</span></summary>
            <div class="variant-list">${variants}</div>
        </details>`;
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
    [formFilter, routeFilter, authorizationFilter].forEach((filter) => filter.addEventListener('change', render));
    resetFilters.addEventListener('click', () => {
        search.value = '';
        formFilter.value = '';
        routeFilter.value = '';
        authorizationFilter.value = '';
        render();
    });
    load().catch((error) => {
        status.textContent = 'La base officielle locale est indisponible.';
        content.innerHTML = `<div class="panel empty">${esc(error.message)}</div>`;
        console.error('[BDPM locale]', error);
    });
})();
