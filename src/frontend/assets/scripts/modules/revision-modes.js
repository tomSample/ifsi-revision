/**
 * revision-modes.js
 * Gestion des modes de révision (Ciblée vs Quotidienne)
 * et de la logique de classification après première révision
 */

// État global pour le mode de révision
let revisionMode = {
    type: null, // 'targeted' | 'daily'
    scope: null, // { type: 'ue'|'course', id: string, name: string }
    intensity: null, // 'sprint' | 'discovery' | 'mastery'
    terms: []
};

// Tracking des premières rencontres
let firstEncounters = new Set(); // Set de termIds jamais vus

/**
 * Initialiser l'écran de sélection de mode
 */
function initializeModeSelection() {
    // Masquer les anciens écrans
    const startScreen = document.getElementById('startScreen');
    if (startScreen) startScreen.style.display = 'none';
    
    // Afficher l'écran de sélection de mode
    const modeScreen = document.getElementById('modeSelectionScreen');
    if (modeScreen) modeScreen.style.display = 'block';
    
    // Charger les statistiques de révision quotidienne
    loadDailyRevisionStats();
}

/**
 * Charger les statistiques pour la révision quotidienne
 */
async function loadDailyRevisionStats() {
    try {
        // Attendre que les termes soient chargés
        if (!allTerms || allTerms.length === 0) {
            await loadCoursesData();
        }
        
        // Calculer les termes dus aujourd'hui
        const dueTerms = getTermsDueToday();
        
        // Compter par importance
        const importanceCounts = {
            essential: 0,
            important: 0,
            supplementary: 0
        };
        
        dueTerms.forEach(term => {
            const importance = getTermImportance(term);
            if (importanceCounts.hasOwnProperty(importance)) {
                importanceCounts[importance]++;
            }
        });
        
        // Mettre à jour l'interface
        const dueCount = document.getElementById('dailyDueCount');
        const essential = document.getElementById('dailyEssential');
        const important = document.getElementById('dailyImportant');
        const supplementary = document.getElementById('dailySupplementary');
        const time = document.getElementById('dailyTime');
        
        if (dueCount) dueCount.textContent = dueTerms.length;
        if (essential) essential.textContent = importanceCounts.essential;
        if (important) important.textContent = importanceCounts.important;
        if (supplementary) supplementary.textContent = importanceCounts.supplementary;
        if (time) time.textContent = `${Math.ceil(dueTerms.length * 1.5)} min`;
        
        // Activer/désactiver le bouton selon le nombre de termes
        const btnStartDaily = document.getElementById('btnStartDaily');
        if (btnStartDaily) {
            btnStartDaily.disabled = dueTerms.length === 0;
            if (dueTerms.length === 0) {
                btnStartDaily.textContent = 'Aucun terme dû aujourd\'hui';
            }
        }
        
    } catch (error) {
        console.error('Erreur chargement stats quotidiennes:', error);
    }
}

/**
 * Obtenir les termes dus aujourd'hui (spaced repetition)
 */
function getTermsDueToday() {
    if (!spacedRepetition || !allTerms) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return allTerms.filter(term => {
        const termId = generateTermKey(term);
        const progress = userProgress[termId];
        
        if (!progress || !progress.nextReview) {
            // Terme jamais vu ou sans date de révision
            return true;
        }
        
        const nextReview = new Date(progress.nextReview);
        nextReview.setHours(0, 0, 0, 0);
        
        return nextReview <= today;
    });
}

/**
 * Afficher la configuration de révision quotidienne
 */
function showDailyRevisionConfig() {
    // Masquer sélection de mode
    document.getElementById('modeSelectionScreen').style.display = 'none';
    
    // Afficher config quotidienne
    const configScreen = document.getElementById('dailyRevisionConfig');
    if (configScreen) {
        configScreen.style.display = 'block';
    }
    
    // Charger les UE disponibles
    loadDailyUESelection();
}

/**
 * Charger la sélection des UE pour révision quotidienne
 */
function loadDailyUESelection() {
    if (!coursesData || !coursesData.courses) return;
    
    const ueList = document.getElementById('dailyUeList');
    if (!ueList) return;
    
    ueList.innerHTML = '';
    
    // Obtenir les UE uniques
    const ues = [...new Set(coursesData.courses.map(c => c.ue))].sort();
    
    ues.forEach(ue => {
        const ueTerms = allTerms.filter(t => t.ue === ue);
        const dueTerms = ueTerms.filter(t => {
            const termId = generateTermKey(t);
            const progress = userProgress[termId];
            if (!progress || !progress.nextReview) return true;
            const nextReview = new Date(progress.nextReview);
            nextReview.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return nextReview <= today;
        });
        
        const checkbox = document.createElement('div');
        checkbox.className = 'ue-checkbox-item';
        checkbox.innerHTML = `
            <label>
                <input type="checkbox" value="${ue}" checked onchange="updateDailyTermCount()">
                <span class="ue-name">UE ${ue}</span>
                <span class="ue-stats">${dueTerms.length} dus / ${ueTerms.length} total</span>
            </label>
        `;
        ueList.appendChild(checkbox);
    });
    
    // Mettre à jour le compteur initial
    updateDailyTermCount();
}

/**
 * Mettre à jour le compteur de termes pour révision quotidienne
 */
function updateDailyTermCount() {
    const selectedUEs = Array.from(
        document.querySelectorAll('#dailyUeList input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    
    const termCountSlider = document.getElementById('dailyTermCount');
    if (!termCountSlider) return;
    
    // Calculer les termes dus pour les UE sélectionnées
    const dueTerms = getTermsDueToday().filter(t => 
        selectedUEs.length === 0 || selectedUEs.includes(t.ue)
    );
    
    // Mettre à jour le max du slider
    termCountSlider.max = Math.max(1, dueTerms.length);
    if (parseInt(termCountSlider.value) > dueTerms.length) {
        termCountSlider.value = dueTerms.length;
    }
    
    // Afficher le compte
    const countDisplay = document.getElementById('dailyTermCountDisplay');
    if (countDisplay) {
        countDisplay.textContent = `${termCountSlider.value} termes`;
    }
    
    // Mettre à jour la répartition par importance
    updateDailyImportanceDistribution(dueTerms.slice(0, parseInt(termCountSlider.value)));
}

/**
 * Mettre à jour la distribution d'importance
 */
function updateDailyImportanceDistribution(terms) {
    const counts = {
        essential: 0,
        important: 0,
        supplementary: 0
    };
    
    terms.forEach(term => {
        const importance = getTermImportance(term);
        if (counts.hasOwnProperty(importance)) {
            counts[importance]++;
        }
    });
    
    const essentialEl = document.getElementById('dailyConfigEssential');
    const importantEl = document.getElementById('dailyConfigImportant');
    const supplementaryEl = document.getElementById('dailyConfigSupplementary');
    
    if (essentialEl) essentialEl.textContent = counts.essential;
    if (importantEl) importantEl.textContent = counts.important;
    if (supplementaryEl) supplementaryEl.textContent = counts.supplementary;
}

/**
 * Démarrer la révision quotidienne configurée
 */
function startConfiguredDailyRevision() {
    const selectedUEs = Array.from(
        document.querySelectorAll('#dailyUeList input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    
    if (selectedUEs.length === 0) {
        showNotification('Veuillez sélectionner au moins une UE', 'warning');
        return;
    }
    
    const termCount = parseInt(document.getElementById('dailyTermCount').value);
    
    revisionMode.type = 'daily';
    revisionMode.scope = { ues: selectedUEs };
    revisionMode.intensity = null;
    
    // Filtrer et limiter les termes
    let dueTerms = getTermsDueToday().filter(t => 
        selectedUEs.includes(t.ue)
    );
    
    if (dueTerms.length === 0) {
        showNotification('Aucun terme dû pour ces UE', 'info');
        return;
    }
    
    // Mélanger et limiter
    dueTerms = shuffleArray(dueTerms).slice(0, termCount);
    revisionMode.terms = dueTerms;
    
    // Démarrer la session
    startRevisionSession(revisionMode.terms);
}

/**
 * Afficher l'écran de configuration révision ciblée
 */
function showTargetedRevisionSetup() {
    // Masquer sélection de mode
    document.getElementById('modeSelectionScreen').style.display = 'none';
    
    // Afficher setup révision ciblée
    document.getElementById('targetedRevisionSetup').style.display = 'block';
    document.getElementById('scopeSelection').style.display = 'block';
    document.getElementById('intensitySelection').style.display = 'none';
    
    // Charger la liste des périmètres
    loadScopeList();
}

/**
 * Retour à la sélection de mode
 */
function backToModeSelection() {
    document.getElementById('targetedRevisionSetup').style.display = 'none';
    document.getElementById('modeSelectionScreen').style.display = 'block';
    
    // Réinitialiser le mode
    revisionMode = {
        type: null,
        scope: null,
        intensity: null,
        terms: []
    };
}

/**
 * Charger la liste des périmètres (UE et cours)
 */
function loadScopeList() {
    if (!coursesData || !coursesData.courses) {
        console.error('Données de cours non chargées');
        return;
    }
    
    const scopeList = document.getElementById('scopeList');
    if (!scopeList) return;
    
    scopeList.innerHTML = '';
    
    // Grouper par UE
    const ueMap = new Map();
    
    coursesData.courses.forEach(course => {
        if (!ueMap.has(course.ue)) {
            ueMap.set(course.ue, {
                id: course.ue,
                name: `UE ${course.ue}`,
                courses: [],
                termCount: 0
            });
        }
        
        const ue = ueMap.get(course.ue);
        ue.courses.push(course);
        
        // Vérifier si course.terms existe avant de compter
        if (course.terms && Array.isArray(course.terms)) {
            ue.termCount += course.terms.length;
        }
    });
    
    // Afficher les UE
    ueMap.forEach((ue, ueId) => {
        const ueItem = createScopeItem({
            type: 'ue',
            id: ueId,
            name: ue.name,
            courseCount: ue.courses.length,
            termCount: ue.termCount
        });
        scopeList.appendChild(ueItem);
        
        // Afficher les cours de cette UE
        ue.courses.forEach(course => {
            const courseTermCount = course.terms && Array.isArray(course.terms) ? course.terms.length : 0;
            const courseItem = createScopeItem({
                type: 'course',
                id: course.id || course.nom,
                name: course.nom,
                termCount: courseTermCount,
                isSubItem: true
            });
            scopeList.appendChild(courseItem);
        });
    });
}

/**
 * Créer un élément de périmètre
 */
function createScopeItem(scope) {
    const div = document.createElement('div');
    div.className = 'scope-item';
    if (scope.isSubItem) div.style.marginLeft = '30px';
    
    div.innerHTML = `
        <div class="scope-item-header">
            <span class="scope-icon">${scope.type === 'ue' ? '📚' : '📄'}</span>
            <h4>${scope.name}</h4>
        </div>
        <p>${scope.type === 'ue' ? `${scope.courseCount} cours` : ''}</p>
        <div class="scope-stats">
            <span>📊 ${scope.termCount} termes</span>
        </div>
    `;
    
    div.addEventListener('click', () => selectScope(scope));
    
    return div;
}

/**
 * Sélectionner un périmètre
 */
function selectScope(scope) {
    // Enregistrer le scope
    revisionMode.scope = scope;
    
    // Calculer les termes pour ce scope
    calculateScopeTerms(scope);
    
    // Afficher l'écran de sélection d'intensité
    document.getElementById('scopeSelection').style.display = 'none';
    document.getElementById('intensitySelection').style.display = 'block';
    
    // Mettre à jour l'affichage du scope sélectionné
    const scopeInfo = document.getElementById('selectedScopeInfo');
    if (scopeInfo) {
        scopeInfo.innerHTML = `
            <h3>${scope.type === 'ue' ? '📚' : '📄'} ${scope.name}</h3>
            <p>${scope.termCount} termes disponibles</p>
        `;
    }
    
    // Mettre à jour les compteurs d'intensité
    updateIntensityStats();
}

/**
 * Calculer les termes pour un scope donné
 */
function calculateScopeTerms(scope) {
    if (scope.type === 'ue') {
        // Filtrer tous les termes de cette UE
        revisionMode.terms = allTerms.filter(term => term.ue === scope.id);
    } else if (scope.type === 'course') {
        // Filtrer les termes de ce cours
        const course = coursesData.courses.find(c => c.id === scope.id);
        if (course) {
            revisionMode.terms = course.terms;
        }
    }
}

/**
 * Mettre à jour les statistiques d'intensité
 */
function updateIntensityStats() {
    const terms = revisionMode.terms;
    
    // Calculer pour chaque intensité
    const sprintTerms = terms.filter(t => getTermImportance(t) === 'essential');
    const discoveryTerms = terms.filter(t => 
        ['essential', 'important'].includes(getTermImportance(t))
    );
    const masteryTerms = terms;
    
    // Mettre à jour l'affichage
    updateIntensityCard('sprint', sprintTerms.length);
    updateIntensityCard('discovery', discoveryTerms.length);
    updateIntensityCard('mastery', masteryTerms.length);
}

/**
 * Mettre à jour une carte d'intensité
 */
function updateIntensityCard(mode, count) {
    const countEl = document.getElementById(`${mode}Count`);
    const timeEl = document.getElementById(`${mode}Time`);
    
    if (countEl) countEl.textContent = count;
    if (timeEl) timeEl.textContent = Math.ceil(count * 1.5);
    
    // Activer/désactiver le bouton
    const card = document.querySelector(`.intensity-card[data-mode="${mode}"]`);
    const btn = card?.querySelector('.btn-intensity');
    if (btn) {
        btn.disabled = count === 0;
        if (count === 0) {
            btn.textContent = 'Aucun terme';
        } else {
            btn.textContent = 'Commencer';
        }
    }
}

/**
 * Obtenir l'importance d'un terme
 */
function getTermImportance(term) {
    const termId = generateTermKey(term);
    const progress = userProgress[termId];
    
    if (progress && progress.personalImportance) {
        return progress.personalImportance;
    }
    
    // Par défaut, utiliser l'importance communautaire ou 'important'
    return term.communityImportance || 'important';
}

/**
 * Retour à la sélection de périmètre
 */
function backToScopeSelection() {
    document.getElementById('intensitySelection').style.display = 'none';
    document.getElementById('scopeSelection').style.display = 'block';
}

/**
 * Démarrer une révision ciblée avec intensité
 */
function startTargetedRevision(intensity) {
    revisionMode.type = 'targeted';
    revisionMode.intensity = intensity;
    
    let selectedTerms = [];
    
    // Filtrer selon l'intensité
    if (intensity === 'sprint') {
        selectedTerms = revisionMode.terms.filter(t => 
            getTermImportance(t) === 'essential'
        );
    } else if (intensity === 'discovery') {
        selectedTerms = revisionMode.terms.filter(t => 
            ['essential', 'important'].includes(getTermImportance(t))
        );
    } else if (intensity === 'mastery') {
        selectedTerms = revisionMode.terms;
    }
    
    if (selectedTerms.length === 0) {
        showNotification('Aucun terme disponible pour cette intensité', 'warning');
        return;
    }
    
    // Mélanger et démarrer
    selectedTerms = shuffleArray(selectedTerms);
    startRevisionSession(selectedTerms);
}

/**
 * Filtrer les scopes (tous/ue/cours)
 */
function filterScope(filter) {
    // Mettre à jour les boutons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filtrer la liste
    const items = document.querySelectorAll('.scope-item');
    items.forEach(item => {
        if (filter === 'all') {
            item.style.display = 'block';
        } else if (filter === 'ue') {
            // Afficher seulement les UE (pas de marginLeft)
            item.style.display = item.style.marginLeft ? 'none' : 'block';
        } else if (filter === 'course') {
            // Afficher seulement les cours (avec marginLeft)
            item.style.display = item.style.marginLeft ? 'block' : 'none';
        }
    });
}

/**
 * Mélanger un tableau (Fisher-Yates)
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Vérifier si c'est la première rencontre avec un terme
 */
function isFirstEncounter(termId) {
    const progress = userProgress[termId];
    
    // Première rencontre si :
    // - Aucune progression enregistrée
    // - Ou jamais révisé (reviewCount === 0)
    // - Ou pas de vote d'importance
    return !progress || 
           progress.reviewCount === 0 || 
           !progress.hasVoted || 
           !progress.personalImportance;
}

/**
 * Afficher l'interface pour première rencontre
 */
function showFirstEncounterUI(term) {
    // Afficher badge NOUVEAU
    const newBadge = document.getElementById('newTermBadge');
    if (newBadge) newBadge.style.display = 'block';
    
    // Afficher message de découverte
    const firstMessage = document.getElementById('firstEncounterMessage');
    if (firstMessage) firstMessage.style.display = 'block';
    
    // Masquer la classification (sera proposée à la 2ème fois)
    const classificationPrompt = document.getElementById('classification-prompt');
    if (classificationPrompt) classificationPrompt.style.display = 'none';
    
    // Enregistrer qu'on a rencontré ce terme
    const termId = generateTermKey(term);
    firstEncounters.add(termId);
}

/**
 * Afficher l'interface pour deuxième rencontre (classification)
 */
function showSecondEncounterUI(term) {
    // Masquer badge NOUVEAU
    const newBadge = document.getElementById('newTermBadge');
    if (newBadge) newBadge.style.display = 'none';
    
    // Masquer message de découverte
    const firstMessage = document.getElementById('firstEncounterMessage');
    if (firstMessage) firstMessage.style.display = 'none';
    
    // Afficher la classification AVANT le flip
    const classificationPrompt = document.getElementById('classification-prompt');
    if (classificationPrompt) classificationPrompt.style.display = 'block';
}

/**
 * Skip classification (classer plus tard)
 */
function skipClassification() {
    // Masquer le prompt
    const classificationPrompt = document.getElementById('classification-prompt');
    if (classificationPrompt) classificationPrompt.style.display = 'none';
    
    // Continuer sans voter (sera reproposé la prochaine fois)
    showNotification('Vous pourrez classer ce terme la prochaine fois', 'info');
}

// Export des fonctions pour utilisation globale
window.initializeModeSelection = initializeModeSelection;
window.showTargetedRevisionSetup = showTargetedRevisionSetup;
window.backToModeSelection = backToModeSelection;
window.showDailyRevisionConfig = showDailyRevisionConfig;
window.updateDailyTermCount = updateDailyTermCount;
window.startConfiguredDailyRevision = startConfiguredDailyRevision;
window.filterScope = filterScope;
window.backToScopeSelection = backToScopeSelection;
window.startTargetedRevision = startTargetedRevision;
window.isFirstEncounter = isFirstEncounter;
window.showFirstEncounterUI = showFirstEncounterUI;
window.showSecondEncounterUI = showSecondEncounterUI;
window.skipClassification = skipClassification;
