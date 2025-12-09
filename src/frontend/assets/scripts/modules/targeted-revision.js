/**
 * Script pour la révision ciblée
 * Gestion de la sélection multiple de cours/UE et intensité
 */

let coursesData = null;
let allTerms = [];
let selectedScopes = new Set(); // Pour sélection multiple
let selectedTerms = [];
let userProgress = {};
let spacedRepetition = null;
let syncManager = null;

// État de la configuration
const targetedConfig = {
    selectedItems: [],
    intensity: null,
    terms: []
};

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', async () => {
    await initializeFirebase();
    await loadCoursesData();
    loadScopeList();
});

/**
 * Initialisation Firebase
 */
async function initializeFirebase() {
    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const app = initializeApp(window.firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        
        syncManager = new SyncManager(auth, db);
        spacedRepetition = new SpacedRepetition();
        
        onAuthStateChanged(auth, (user) => {
            if (user) {
                loadUserProgress();
            }
        });
    } catch (error) {
        console.error('Erreur initialisation Firebase:', error);
    }
}

/**
 * Charger les données des cours
 */
async function loadCoursesData() {
    try {
        if (typeof getCoursesData === 'function') {
            coursesData = await getCoursesData();
        } else {
            const url = window.resolvePath ? window.resolvePath('/src/data/courses.json') : '/src/data/courses.json';
            const response = await fetch(url);
            coursesData = await response.json();
        }
        
        // Extraire tous les termes
        allTerms = [];
        coursesData.courses.forEach(([courseKey, courseData]) => {
            if (courseData.definitions && Array.isArray(courseData.definitions)) {
                courseData.definitions.forEach(def => {
                    allTerms.push({
                        term: def.term,
                        definition: def.definition,
                        ue: courseData.ue,
                        courseTitle: courseData.title,
                        courseKey: courseKey
                    });
                });
            }
        });
        
        console.log(`✅ ${allTerms.length} termes chargés`);
    } catch (error) {
        console.error('Erreur chargement données:', error);
    }
}

/**
 * Charger la progression utilisateur
 */
async function loadUserProgress() {
    if (syncManager) {
        try {
            userProgress = await syncManager.getAllProgress();
        } catch (error) {
            console.error('Erreur chargement progression:', error);
        }
    }
}

/**
 * Charger la liste des scopes (UE et cours)
 */
function loadScopeList() {
    if (!coursesData || !coursesData.courses) return;
    
    const scopeList = document.getElementById('scopeList');
    if (!scopeList) return;
    
    scopeList.innerHTML = '';
    
    // Grouper par UE
    const ueMap = new Map();
    
    coursesData.courses.forEach(([courseKey, courseData]) => {
        if (!courseData || !courseData.ue) return;
        
        if (!ueMap.has(courseData.ue)) {
            ueMap.set(courseData.ue, {
                id: courseData.ue,
                type: 'ue',
                name: `UE ${courseData.ue}`,
                courses: [],
                termCount: 0
            });
        }
        
        const ue = ueMap.get(courseData.ue);
        const courseInfo = {
            key: courseKey,
            type: 'course',
            ...courseData
        };
        ue.courses.push(courseInfo);
        
        if (courseData.definitions && Array.isArray(courseData.definitions)) {
            ue.termCount += courseData.definitions.length;
        }
    });
    
    // Afficher les UE et leurs cours
    ueMap.forEach((ue) => {
        const ueItem = createScopeItem(ue);
        scopeList.appendChild(ueItem);
        
        ue.courses.forEach(course => {
            const courseTermCount = course.definitions ? course.definitions.length : 0;
            const courseItem = createScopeItem({
                type: 'course',
                id: course.key,
                name: course.title,
                termCount: courseTermCount,
                isSubItem: true,
                ue: course.ue
            });
            scopeList.appendChild(courseItem);
        });
    });
}

/**
 * Créer un élément de scope (UE ou cours)
 */
function createScopeItem(scope) {
    const div = document.createElement('div');
    div.className = 'scope-item' + (scope.isSubItem ? ' scope-subitem' : '');
    div.dataset.scopeId = scope.id;
    div.dataset.scopeType = scope.type;
    
    const isSelected = selectedScopes.has(scope.id);
    if (isSelected) div.classList.add('selected');
    
    div.innerHTML = `
        <div class="scope-checkbox">
            <input type="checkbox" 
                   id="scope_${scope.id}" 
                   ${isSelected ? 'checked' : ''}
                   onchange="toggleScope('${scope.id}', '${scope.type}')">
        </div>
        <div class="scope-content">
            <div class="scope-header">
                <span class="scope-icon">${scope.type === 'ue' ? '📚' : '📄'}</span>
                <h4>${scope.name}</h4>
            </div>
            <div class="scope-stats">
                <span>📊 ${scope.termCount} termes</span>
            </div>
        </div>
    `;
    
    return div;
}

/**
 * Basculer la sélection d'un scope
 */
function toggleScope(scopeId, scopeType) {
    if (selectedScopes.has(scopeId)) {
        selectedScopes.delete(scopeId);
        
        // Si c'est une UE, désélectionner tous ses cours
        if (scopeType === 'ue') {
            coursesData.courses.forEach(([key, data]) => {
                if (data.ue === scopeId) {
                    selectedScopes.delete(key);
                    const courseCheckbox = document.getElementById(`scope_${key}`);
                    if (courseCheckbox) courseCheckbox.checked = false;
                }
            });
        }
    } else {
        selectedScopes.add(scopeId);
    }
    
    updateSelectionDisplay();
}

/**
 * Mettre à jour l'affichage de la sélection
 */
function updateSelectionDisplay() {
    const summary = document.getElementById('selectionSummary');
    const selectedItems = document.getElementById('selectedItems');
    const selectedCount = document.getElementById('selectedCount');
    const totalTermsSelected = document.getElementById('totalTermsSelected');
    const btnNext = document.getElementById('btnNextStep');
    
    if (selectedScopes.size === 0) {
        summary.style.display = 'none';
        btnNext.disabled = true;
        return;
    }
    
    summary.style.display = 'block';
    btnNext.disabled = false;
    
    // Calculer les termes sélectionnés
    selectedTerms = allTerms.filter(term => {
        // Vérifier si l'UE est sélectionnée
        if (selectedScopes.has(term.ue)) return true;
        // Vérifier si le cours est sélectionné
        if (selectedScopes.has(term.courseKey)) return true;
        return false;
    });
    
    // Afficher les items sélectionnés
    const items = Array.from(selectedScopes).map(id => {
        // Chercher si c'est une UE ou un cours
        const [key, data] = coursesData.courses.find(([k, d]) => 
            d.ue === id || k === id
        ) || [];
        
        if (data && data.ue === id) {
            return `<span class="selected-tag ue">📚 UE ${id}</span>`;
        } else if (data) {
            return `<span class="selected-tag course">📄 ${data.title}</span>`;
        }
        return '';
    }).filter(Boolean).join('');
    
    selectedItems.innerHTML = items;
    selectedCount.textContent = selectedScopes.size;
    totalTermsSelected.textContent = selectedTerms.length;
}

/**
 * Filtrer les scopes
 */
function filterScope(filter) {
    // Mettre à jour les boutons actifs
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter || btn.textContent.toLowerCase().includes(filter)) {
            btn.classList.add('active');
        }
    });
    
    // Filtrer l'affichage
    document.querySelectorAll('.scope-item').forEach(item => {
        const type = item.dataset.scopeType;
        if (filter === 'all') {
            item.style.display = '';
        } else if (filter === 'ue' && type === 'ue') {
            item.style.display = '';
        } else if (filter === 'course' && type === 'course') {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

/**
 * Passer à l'étape intensité
 */
function nextToIntensityStep() {
    if (selectedTerms.length === 0) {
        alert('Veuillez sélectionner au moins un cours ou une UE');
        return;
    }
    
    targetedConfig.selectedItems = Array.from(selectedScopes);
    targetedConfig.terms = selectedTerms;
    
    // Masquer étape 1, afficher étape 2
    document.getElementById('selectionStep').style.display = 'none';
    document.getElementById('intensityStep').style.display = 'block';
    
    // Afficher les cours sélectionnés
    updateSelectedScopeInfo();
    
    // Calculer les stats d'intensité
    updateIntensityStats();
}

/**
 * Retour à l'étape de sélection
 */
function backToSelectionStep() {
    document.getElementById('intensityStep').style.display = 'none';
    document.getElementById('selectionStep').style.display = 'block';
}

/**
 * Afficher les scopes sélectionnés
 */
function updateSelectedScopeInfo() {
    const info = document.getElementById('selectedScopeInfo');
    const items = Array.from(selectedScopes).map(id => {
        const [key, data] = coursesData.courses.find(([k, d]) => 
            d.ue === id || k === id
        ) || [];
        
        if (data && data.ue === id) {
            return `<span class="info-tag">📚 UE ${id}</span>`;
        } else if (data) {
            return `<span class="info-tag">📄 ${data.title}</span>`;
        }
        return '';
    }).filter(Boolean).join('');
    
    info.innerHTML = `
        <h4>Sélection:</h4>
        <div class="info-tags">${items}</div>
        <p class="info-total">${selectedTerms.length} termes au total</p>
    `;
}

/**
 * Mettre à jour les statistiques d'intensité
 */
function updateIntensityStats() {
    const essential = selectedTerms.filter(t => getTermImportance(t) === 'essential');
    const important = selectedTerms.filter(t => ['essential', 'important'].includes(getTermImportance(t)));
    const all = selectedTerms;
    
    // Sprint (15s par terme)
    document.getElementById('sprintCount').textContent = essential.length;
    document.getElementById('sprintTime').textContent = Math.ceil(essential.length * 15 / 60);
    
    // Discovery
    document.getElementById('discoveryCount').textContent = important.length;
    document.getElementById('discoveryTime').textContent = Math.ceil(important.length * 15 / 60);
    
    // Mastery
    document.getElementById('masteryCount').textContent = all.length;
    document.getElementById('masteryTime').textContent = Math.ceil(all.length * 15 / 60);
}

/**
 * Sélectionner une intensité et démarrer
 */
function selectIntensity(mode) {
    let terms;
    
    switch(mode) {
        case 'sprint':
            terms = selectedTerms.filter(t => getTermImportance(t) === 'essential');
            break;
        case 'discovery':
            terms = selectedTerms.filter(t => ['essential', 'important'].includes(getTermImportance(t)));
            break;
        case 'mastery':
            terms = selectedTerms;
            break;
    }
    
    if (terms.length === 0) {
        alert('Aucun terme disponible pour cette intensité');
        return;
    }
    
    // Mélanger les termes
    terms = terms.sort(() => Math.random() - 0.5);
    
    // Stocker en sessionStorage et lancer la session
    sessionStorage.setItem('revisionTerms', JSON.stringify(terms));
    sessionStorage.setItem('revisionMode', 'targeted');
    sessionStorage.setItem('revisionConfig', JSON.stringify({
        selectedItems: targetedConfig.selectedItems,
        intensity: intensity,
        totalTerms: terms.length
    }));
    
    // Charger le moteur de révision et démarrer
    window.location.href = './revision-session.html';
}

/**
 * Obtenir l'importance d'un terme
 */
function getTermImportance(term) {
    const termKey = `${term.term}_${term.ue}`.replace(/\s+/g, '_').toLowerCase();
    const progress = userProgress[termKey];
    
    if (!progress) return 'supplementary';
    if (progress.importance) return progress.importance;
    
    // Par défaut selon répétition
    if (progress.repetitions === 0) return 'essential';
    if (progress.repetitions < 3) return 'important';
    return 'supplementary';
}

// Export pour utilisation globale
window.toggleScope = toggleScope;
window.filterScope = filterScope;
window.nextToIntensityStep = nextToIntensityStep;
window.backToSelectionStep = backToSelectionStep;
window.selectIntensity = selectIntensity;
window.setTermCount = (count) => {};
window.adjustTermCount = (delta) => {};
