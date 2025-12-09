/**
 * Script pour la révision quotidienne
 * Gestion de la sélection UE et nombre de termes avec presets
 */

let coursesData = null;
let allTerms = [];
let selectedUEs = new Set();
let userProgress = {};
let spacedRepetition = null;
let syncManager = null;

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', async () => {
    await initializeFirebase();
    await loadCoursesData();
    loadUESelection();
    updatePreview();
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
                        courseTitle: courseData.title
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
            updatePreview(); // Refresh avec les données de progression
        } catch (error) {
            console.error('Erreur chargement progression:', error);
        }
    }
}

/**
 * Charger la sélection des UE
 */
function loadUESelection() {
    if (!coursesData || !coursesData.courses) return;
    
    const grid = document.getElementById('ueSelectionGrid');
    if (!grid) return;
    
    // Obtenir les UE uniques
    const ues = [...new Set(coursesData.courses.map(([key, data]) => data.ue))].sort();
    
    grid.innerHTML = '';
    
    // Sélectionner toutes les UE par défaut
    ues.forEach(ue => selectedUEs.add(ue));
    
    ues.forEach(ue => {
        const ueTerms = allTerms.filter(t => t.ue === ue);
        const dueTerms = ueTerms.filter(t => isTermDueToday(t));
        
        const checkbox = document.createElement('label');
        checkbox.className = 'ue-checkbox';
        checkbox.innerHTML = `
            <input type="checkbox" 
                   value="${ue}" 
                   checked 
                   onchange="toggleUE('${ue}')">
            <div class="ue-card">
                <div class="ue-header">
                    <span class="ue-icon">📚</span>
                    <span class="ue-name">UE ${ue}</span>
                </div>
                <div class="ue-stats">
                    <span class="stat-due">${dueTerms.length} dus</span>
                    <span class="stat-total">/ ${ueTerms.length} total</span>
                </div>
            </div>
        `;
        grid.appendChild(checkbox);
    });
    
    updatePreview();
}

/**
 * Vérifier si un terme est dû aujourd'hui
 */
function isTermDueToday(term) {
    const termKey = `${term.term}_${term.ue}`.replace(/\s+/g, '_').toLowerCase();
    const progress = userProgress[termKey];
    
    if (!progress || !progress.nextReview) return true;
    
    const nextReview = new Date(progress.nextReview);
    nextReview.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return nextReview <= today;
}

/**
 * Basculer la sélection d'une UE
 */
function toggleUE(ue) {
    if (selectedUEs.has(ue)) {
        selectedUEs.delete(ue);
    } else {
        selectedUEs.add(ue);
    }
    updatePreview();
}

/**
 * Définir le nombre de termes (boutons presets)
 */
function setTermCount(count) {
    const input = document.getElementById('termCountInput');
    if (input) {
        input.value = count;
        
        // Mettre à jour les boutons actifs
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.textContent) === count) {
                btn.classList.add('active');
            }
        });
        
        updatePreview();
    }
}

/**
 * Ajuster le nombre de termes
 */
function adjustTermCount(delta) {
    const input = document.getElementById('termCountInput');
    if (input) {
        const current = parseInt(input.value) || 20;
        const newValue = Math.max(1, Math.min(100, current + delta));
        input.value = newValue;
        
        // Vérifier si correspond à un preset
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.textContent) === newValue) {
                btn.classList.add('active');
            }
        });
        
        updatePreview();
    }
}

/**
 * Mettre à jour l'aperçu
 */
function updatePreview() {
    const input = document.getElementById('termCountInput');
    const termCount = input ? parseInt(input.value) || 20 : 20;
    
    // Obtenir les termes dus des UE sélectionnées
    const dueTerms = allTerms.filter(t => {
        if (!selectedUEs.has(t.ue)) return false;
        return isTermDueToday(t);
    });
    
    // Limiter au nombre demandé
    const availableCount = dueTerms.length;
    const selectedCount = Math.min(termCount, availableCount);
    const selectedDueTerms = dueTerms.slice(0, selectedCount);
    
    // Mettre à jour max du input
    if (input) {
        input.max = availableCount;
        if (termCount > availableCount) {
            input.value = availableCount;
        }
    }
    
    // Mettre à jour l'affichage
    const termCountMax = document.getElementById('termCountMax');
    if (termCountMax) {
        termCountMax.textContent = `sur ${availableCount} disponibles`;
    }
    
    const previewTermCount = document.getElementById('previewTermCount');
    if (previewTermCount) {
        previewTermCount.textContent = `${selectedCount} termes`;
    }
    
    // Durée: 15 secondes par terme
    const durationMinutes = Math.ceil(selectedCount * 15 / 60);
    const previewDuration = document.getElementById('previewDuration');
    if (previewDuration) {
        previewDuration.textContent = `${durationMinutes} min`;
    }
    
    // Répartition par importance
    updateImportanceDistribution(selectedDueTerms);
    
    // Activer/désactiver le bouton
    const btnStart = document.getElementById('btnStartRevision');
    if (btnStart) {
        btnStart.disabled = selectedCount === 0;
    }
}

/**
 * Mettre à jour la distribution d'importance
 */
function updateImportanceDistribution(terms) {
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
    
    const total = terms.length || 1;
    
    // Mettre à jour les barres
    const barEssential = document.getElementById('barEssential');
    const barImportant = document.getElementById('barImportant');
    const barSupplementary = document.getElementById('barSupplementary');
    
    if (barEssential) barEssential.style.width = `${(counts.essential / total) * 100}%`;
    if (barImportant) barImportant.style.width = `${(counts.important / total) * 100}%`;
    if (barSupplementary) barSupplementary.style.width = `${(counts.supplementary / total) * 100}%`;
    
    // Mettre à jour les légendes
    const legendEssential = document.getElementById('legendEssential');
    const legendImportant = document.getElementById('legendImportant');
    const legendSupplementary = document.getElementById('legendSupplementary');
    
    if (legendEssential) legendEssential.textContent = counts.essential;
    if (legendImportant) legendImportant.textContent = counts.important;
    if (legendSupplementary) legendSupplementary.textContent = counts.supplementary;
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

/**
 * Démarrer la révision quotidienne
 */
function startDailyRevision() {
    const input = document.getElementById('termCountInput');
    const termCount = input ? parseInt(input.value) || 20 : 20;
    
    // Obtenir les termes dus
    const dueTerms = allTerms.filter(t => {
        if (!selectedUEs.has(t.ue)) return false;
        return isTermDueToday(t);
    });
    
    if (dueTerms.length === 0) {
        alert('Aucun terme à réviser aujourd\'hui pour les UE sélectionnées');
        return;
    }
    
    // Limiter et mélanger
    const selectedTerms = dueTerms
        .slice(0, termCount)
        .sort(() => Math.random() - 0.5);
    
    // Stocker en sessionStorage et rediriger
    sessionStorage.setItem('revisionTerms', JSON.stringify(selectedTerms));
    sessionStorage.setItem('revisionMode', 'daily');
    window.location.href = './revision.html';
}

// Export pour utilisation globale
window.toggleUE = toggleUE;
window.setTermCount = setTermCount;
window.adjustTermCount = adjustTermCount;
window.updatePreview = updatePreview;
window.startDailyRevision = startDailyRevision;
