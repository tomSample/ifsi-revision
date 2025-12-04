// Variables globales pour la gestion des révisions
let allTerms = [];
let filteredTerms = []; // Termes filtrés selon les UE
let availableUEs = []; // Liste des UE disponibles
let selectedUEs = []; // UE sélectionnées
let currentSession = [];
let currentTermIndex = 0;
let sessionResults = [];
let coursesData = null;
let sessionStartTime = null;

// État de la révision actuelle
let currentState = 'thinking'; // 'thinking' → 'revealed' → 'ready'

// Statistiques globales
let globalStats = {
    totalTerms: 0,
    correctAnswers: 0,
    wrongAnswers: 0
};

// Système de signalement
let reportedTerms = [];
let pendingReports = [];

// Firebase et gestion de progression
let auth = null;
let db = null;
let syncManager = null;
let spacedRepetition = null;
let userProgress = {};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async function() {
    await initializeFirebase();
    loadCoursesData();
    await loadUserProgressFromFirestore();
    loadReportedTerms();
    setupEventListeners();
});

/**
 * Initialiser Firebase et les modules de progression
 */
async function initializeFirebase() {
    try {
        // Import dynamique de Firebase
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
        const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        // Initialiser Firebase
        const app = initializeApp(window.firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        
        // Initialiser les gestionnaires
        syncManager = new SyncManager(auth, db);
        spacedRepetition = new SpacedRepetition();
        
        // Charger les synchronisations en attente
        syncManager.loadPendingFromLocalStorage();
        
        // Écouter les changements d'authentification
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log('✅ Utilisateur connecté:', user.email);
                // Recharger la progression si l'utilisateur vient de se connecter
                loadUserProgressFromFirestore();
            } else {
                console.log('ℹ️ Mode invité - progression locale uniquement');
                userProgress = {};
            }
        });
        
    } catch (error) {
        console.error('Erreur initialisation Firebase:', error);
        console.log('ℹ️ Utilisation du mode hors ligne');
    }
}

/**
 * Charger la progression utilisateur depuis Firestore
 */
async function loadUserProgressFromFirestore() {
    if (!syncManager || !auth?.currentUser) {
        console.log('Mode invité - pas de progression synchronisée');
        return;
    }
    
    try {
        userProgress = await syncManager.getAllProgress();
        console.log(`✅ Progression chargée: ${Object.keys(userProgress).length} termes`);
    } catch (error) {
        console.error('Erreur chargement progression:', error);
        userProgress = {};
    }
}

// Charger les signalements existants
function loadReportedTerms() {
    const savedReports = localStorage.getItem('reportedTerms');
    if (savedReports) {
        try {
            reportedTerms = JSON.parse(savedReports);
        } catch (e) {
            console.error('Erreur lors du chargement des signalements:', e);
            reportedTerms = [];
        }
    } else {
        reportedTerms = [];
    }
}

// Afficher une notification
function showNotification(message, type = 'info') {
    // Supprimer les anciennes notifications
    const existingNotifs = document.querySelectorAll('.notification');
    existingNotifs.forEach(notif => notif.remove());
    
    // Créer la nouvelle notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            ${message}
        </div>
    `;
    
    // Ajouter au body
    document.body.appendChild(notification);
    
    // Afficher avec animation
    setTimeout(() => {
        notification.classList.add('notification-active');
    }, 10);
    
    // Masquer après 3 secondes
    setTimeout(() => {
        notification.classList.remove('notification-active');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Configuration des événements
function setupEventListeners() {
    // Boutons de la révision - nouveaux IDs
    const checkAnswerBtn = document.getElementById('checkAnswerBtn');
    const nextTermBtn = document.getElementById('nextTermBtn');
    const reportTermBtn = document.getElementById('reportTermBtn');
    
    if (checkAnswerBtn) checkAnswerBtn.addEventListener('click', revealDefinition);
    if (nextTermBtn) nextTermBtn.addEventListener('click', nextTerm);
    if (reportTermBtn) reportTermBtn.addEventListener('click', showReportModal);
    
    // Raccourcis clavier
    document.addEventListener('keydown', function(event) {
        if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') {
            return; // Ne pas intercepter si on tape dans un champ
        }
        
        switch(event.key) {
            case ' ':
            case 'Enter':
                event.preventDefault();
                if (currentState === 'thinking') {
                    revealDefinition();
                } else if (currentState === 'revealed') {
                    nextTerm();
                }
                break;
            case 'r':
            case 'R':
                if (currentState === 'revealed') {
                    event.preventDefault();
                    showReportModal();
                }
                break;
        }
    });
}

// Charger les données des cours
async function loadCoursesData() {
    try {
        const response = await fetch('/src/data/courses.json');
        coursesData = await response.json();
        
        // Extraire tous les termes et UE
        allTerms = [];
        const ueSet = new Set();
        
        coursesData.courses.forEach(course => {
            const [courseKey, courseData] = course;
            if (courseData.definitions) {
                ueSet.add(courseData.ue);
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
        
        // Trier les UE
        availableUEs = Array.from(ueSet).sort((a, b) => {
            const parseUE = (ue) => {
                const match = ue.match(/(\d+)\.(\d+)\.S(\d+)/);
                return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [999, 999, 999];
            };
            
            const [a1, a2, a3] = parseUE(a);
            const [b1, b2, b3] = parseUE(b);
            
            if (a1 !== b1) return a1 - b1;
            if (a2 !== b2) return a2 - b2;
            return a3 - b3;
        });
        
        // Initialiser avec toutes les UE sélectionnées
        selectedUEs = [...availableUEs];
        filteredTerms = [...allTerms];
        
        globalStats.totalTerms = allTerms.length;
        
        // Initialiser le filtre UE
        initUEFilter();
        updateStatsDisplay();
        
        console.log(`${allTerms.length} termes chargés depuis ${coursesData.courses.length} cours`);
        console.log(`${availableUEs.length} UE disponibles:`, availableUEs);
        
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        alert('Erreur lors du chargement des données. Vérifiez votre connexion.');
    }
}

// Charger la progression de l'utilisateur depuis localStorage
function loadUserProgress() {
    // Mode session simple - pas de progression sauvegardée à charger
    console.log('Mode session simple - chaque session est indépendante');
    updateStatsDisplay();
}

// Sauvegarder la progression de l'utilisateur
function saveUserProgress() {
    // Optionnel : garder juste un compteur de sessions pour les stats
    const totalSessions = parseInt(localStorage.getItem('totalSessions') || '0') + 1;
    localStorage.setItem('totalSessions', totalSessions.toString());
    console.log(`Session ${totalSessions} complétée`);
}

// Mettre à jour l'affichage des statistiques
function updateStatsDisplay() {
    const totalTermsElement = document.getElementById('totalTermsPreview');
    const filteredTermsElement = document.getElementById('filteredTermsCount');
    
    if (totalTermsElement) {
        totalTermsElement.textContent = globalStats.totalTerms;
    }
    
    if (filteredTermsElement) {
        filteredTermsElement.textContent = filteredTerms.length;
    }
}

// ===== FILTRAGE UE SIMPLE =====

// Initialiser le filtre UE
function initUEFilter() {
    generateUEOptions();
    updateUEDisplay();
}

// Générer les options UE
function generateUEOptions() {
    const container = document.getElementById('ueOptions');
    if (!container) return;
    
    const totalTerms = allTerms.length;
    
    let html = `
        <div class="ue-option all" onclick="toggleAllUEs()">
            <input type="checkbox" class="ue-checkbox" id="allUEs" checked>
            <span class="ue-name">✅ Toutes les UE</span>
            <span class="ue-count">(${totalTerms} termes)</span>
        </div>
    `;
    
    availableUEs.forEach(ue => {
        const count = getTermCountForUE(ue);
        const checked = selectedUEs.includes(ue) ? 'checked' : '';
        html += `
            <div class="ue-option" onclick="toggleUE('${ue}')">
                <input type="checkbox" class="ue-checkbox" id="ue_${ue.replace(/\./g, '_')}" ${checked}>
                <span class="ue-name">UE ${ue}</span>
                <span class="ue-count">(${count} termes)</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Compter les termes pour une UE
function getTermCountForUE(ue) {
    return allTerms.filter(term => term.ue === ue).length;
}

// Basculer le dropdown UE
function toggleUEDropdown() {
    const dropdown = document.querySelector('.ue-dropdown');
    const options = document.getElementById('ueOptions');
    
    if (options.style.display === 'none') {
        options.style.display = 'block';
        dropdown.classList.add('active');
    } else {
        options.style.display = 'none';
        dropdown.classList.remove('active');
    }
}

// Fermer le dropdown si on clique ailleurs
document.addEventListener('click', function(event) {
    const ueFilter = document.querySelector('.ue-filter-simple');
    if (ueFilter && !ueFilter.contains(event.target)) {
        const options = document.getElementById('ueOptions');
        const dropdown = document.querySelector('.ue-dropdown');
        if (options && dropdown) {
            options.style.display = 'none';
            dropdown.classList.remove('active');
        }
    }
});

// Basculer toutes les UE
function toggleAllUEs() {
    const allCheckbox = document.getElementById('allUEs');
    const isChecked = !allCheckbox.checked;
    
    allCheckbox.checked = isChecked;
    
    // Mettre à jour toutes les autres checkboxes
    availableUEs.forEach(ue => {
        const checkbox = document.getElementById(`ue_${ue.replace(/\./g, '_')}`);
        if (checkbox) checkbox.checked = isChecked;
    });
    
    // Mettre à jour la sélection
    selectedUEs = isChecked ? [...availableUEs] : [];
    updateFilteredTerms();
    updateUEDisplay();
    
    event.stopPropagation();
}

// Basculer une UE spécifique
function toggleUE(ue) {
    const checkbox = document.getElementById(`ue_${ue.replace(/\./g, '_')}`);
    const allCheckbox = document.getElementById('allUEs');
    
    // Inverser l'état de la checkbox
    checkbox.checked = !checkbox.checked;
    
    if (checkbox.checked) {
        // Ajouter l'UE si elle n'est pas déjà sélectionnée
        if (!selectedUEs.includes(ue)) {
            selectedUEs.push(ue);
        }
        // Vérifier si toutes les UE sont sélectionnées
        if (selectedUEs.length === availableUEs.length) {
            allCheckbox.checked = true;
        }
    } else {
        // Retirer l'UE
        selectedUEs = selectedUEs.filter(selectedUE => selectedUE !== ue);
        allCheckbox.checked = false;
    }
    
    updateFilteredTerms();
    updateUEDisplay();
    
    event.stopPropagation();
}

// Mettre à jour les termes filtrés
function updateFilteredTerms() {
    if (selectedUEs.length === 0) {
        filteredTerms = [];
    } else {
        filteredTerms = allTerms.filter(term => selectedUEs.includes(term.ue));
    }
    updateStatsDisplay();
}

// Mettre à jour l'affichage UE
function updateUEDisplay() {
    const text = document.getElementById('ueFilterText');
    if (!text) return;
    
    const filteredCount = filteredTerms.length;
    
    if (selectedUEs.length === availableUEs.length) {
        text.textContent = `Toutes les UE (${filteredCount} termes)`;
    } else if (selectedUEs.length === 1) {
        text.textContent = `UE ${selectedUEs[0]} (${filteredCount} termes)`;
    } else if (selectedUEs.length === 0) {
        text.textContent = 'Aucune UE sélectionnée (0 termes)';
    } else {
        text.textContent = `${selectedUEs.length} UE sélectionnées (${filteredCount} termes)`;
    }
}

// Démarrer une session de révision
async function startRevision() {
    if (filteredTerms.length === 0) {
        alert('Aucun terme disponible avec les UE sélectionnées. Veuillez sélectionner au moins une UE.');
        return;
    }
    
    // Récupérer le nombre de termes choisi
    const termCountInput = document.getElementById('termCount');
    const termCount = parseInt(termCountInput.value) || 10;
    
    // Validation du nombre de termes par rapport aux termes filtrés
    const maxTerms = Math.min(50, filteredTerms.length);
    if (termCount < 1 || termCount > maxTerms) {
        alert(`Veuillez choisir entre 1 et ${maxTerms} termes avec la sélection d'UE actuelle.`);
        return;
    }
    
    // Sélectionner les termes pour cette session depuis les termes filtrés
    currentSession = await selectTermsForSession(termCount);
    currentTermIndex = 0;
    sessionResults = [];
    sessionStartTime = new Date();
    
    // Masquer l'écran de démarrage et afficher l'écran de révision
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('revisionScreen').style.display = 'block';
    
    // Démarrer le premier terme
    showCurrentTerm();
}

// Sélectionner des termes pour la session (avec priorisation intelligente)
async function selectTermsForSession(count = 10) {
    if (filteredTerms.length === 0) {
        console.log('Aucun terme disponible avec les filtres actuels');
        return [];
    }
    
    // Si pas d'algorithme de répétition espacée, mode aléatoire
    if (!spacedRepetition || !syncManager) {
        const shuffledTerms = [...filteredTerms].sort(() => 0.5 - Math.random());
        return shuffledTerms.slice(0, Math.min(count, filteredTerms.length));
    }
    
    // Mode intelligent: priorisation selon la courbe de l'oubli
    const termsWithProgress = [];
    
    for (const term of filteredTerms) {
        const termKey = generateTermKey(term);
        const progress = userProgress[termKey] || null;
        
        termsWithProgress.push({
            term: term,
            progress: progress,
            priority: spacedRepetition.getPriorityScore(progress)
        });
    }
    
    // Trier par priorité (décroissante)
    termsWithProgress.sort((a, b) => b.priority - a.priority);
    
    // Stratégie de sélection:
    // - 40% des termes les plus prioritaires (jamais vus + difficiles + en retard)
    // - 60% aléatoires parmi les autres
    const highPriorityCount = Math.ceil(count * 0.4);
    const randomCount = count - highPriorityCount;
    
    // Sélectionner les termes prioritaires
    const highPriority = termsWithProgress.slice(0, Math.min(highPriorityCount, termsWithProgress.length));
    
    // Sélectionner aléatoirement parmi le reste
    const remaining = termsWithProgress.slice(highPriorityCount);
    const randomSelection = remaining.sort(() => 0.5 - Math.random()).slice(0, randomCount);
    
    // Combiner et mélanger pour éviter un ordre prévisible
    const selectedTerms = [...highPriority, ...randomSelection]
        .sort(() => 0.5 - Math.random())
        .map(item => item.term);
    
    console.log(`✅ Session intelligente: ${selectedTerms.length} termes (${highPriorityCount} prioritaires)`);
    
    return selectedTerms.slice(0, count);
}

// Simplifier la vérification (plus de traçage individuel)
function isMasteredTerm(term) {
    // Toujours retourner false car on ne trace plus la maîtrise individuelle
    return false;
}

// Marquer un terme comme maîtrisé (simplifiée)
function markTermAsMastered(term) {
    // Ne rien faire - on ne trace plus la maîtrise
    console.log(`Terme évalué comme maîtrisé: ${term.term}`);
}

// Marquer un terme comme non maîtrisé (simplifiée)
function markTermAsNotMastered(term) {
    // Ne rien faire - on ne trace plus la maîtrise  
    console.log(`Terme évalué comme non maîtrisé: ${term.term}`);
}

// Générer une clé unique pour un terme
function generateTermKey(term) {
    return `${term.term}_${term.ue}`.replace(/\s+/g, '_').toLowerCase();
}

// Afficher le terme actuel
function showCurrentTerm() {
    const currentTerm = currentSession[currentTermIndex];
    
    // Mettre à jour l'affichage
    document.getElementById('termUE').textContent = `UE ${currentTerm.ue}`;
    document.getElementById('termNumber').textContent = `${currentTermIndex + 1}/${currentSession.length}`;
    document.getElementById('termName').textContent = currentTerm.term;
    document.getElementById('termDefinition').textContent = currentTerm.definition;
    
    // Reset de l'interface à l'état initial
    setThinkingState();
}

// État initial : réflexion
function setThinkingState() {
    currentState = 'thinking';
    
    // Réinitialiser la zone de réponse
    document.getElementById('userAnswer').value = '';
    document.getElementById('userAnswer').disabled = false;
    
    // Masquer la section de correction
    document.getElementById('correctionSection').style.display = 'none';
    
    // Réinitialiser les boutons de difficulté
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    difficultyButtons.forEach(btn => btn.classList.remove('selected'));
    
    // Afficher le bouton de vérification
    document.getElementById('checkAnswerBtn').style.display = 'inline-block';
    document.getElementById('checkAnswerBtn').disabled = false;
    
    // Focus sur la zone de réponse
    setTimeout(() => {
        document.getElementById('userAnswer').focus();
    }, 100);
}

// Révéler la définition
function revealDefinition() {
    if (currentState !== 'thinking') return;
    
    const userAnswer = document.getElementById('userAnswer').value.trim();
    if (!userAnswer) {
        alert('Veuillez saisir votre réponse avant de vérifier.');
        return;
    }
    
    currentState = 'revealed';
    
    const currentTerm = currentSession[currentTermIndex];
    
    // Afficher les réponses
    document.getElementById('userAnswerDisplay').textContent = userAnswer;
    document.getElementById('correctAnswerDisplay').textContent = currentTerm.definition;
    
    // Désactiver le textarea et masquer le bouton
    document.getElementById('userAnswer').disabled = true;
    document.getElementById('checkAnswerBtn').style.display = 'none';
    
    // Afficher la section de correction
    document.getElementById('correctionSection').style.display = 'block';
    
    // Enregistrer dans les résultats de session
    sessionResults.push({
        term: currentTerm,
        userReflection: userAnswer,
        timestamp: new Date().toISOString(),
        reported: false
    });
    
    // Faire défiler vers la correction
    document.getElementById('correctionSection').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// Passer au terme suivant
/**
 * Noter la difficulté d'un terme et passer au suivant
 * @param {string} difficulty - 'facile', 'moyen', ou 'difficile'
 */
async function rateDifficulty(difficulty) {
    const currentTerm = currentSession[currentTermIndex];
    const termKey = generateTermKey(currentTerm);
    
    // Animation visuelle du bouton cliqué
    const buttons = document.querySelectorAll('.difficulty-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    event.target.closest('.difficulty-btn').classList.add('selected');
    
    // Calculer la nouvelle progression avec l'algorithme SM-2
    if (spacedRepetition && syncManager) {
        const currentProgress = userProgress[termKey] || null;
        const newProgress = spacedRepetition.calculateNextReview(currentProgress, difficulty);
        
        // Sauvegarder dans Firestore
        const saved = await syncManager.saveTermProgress(termKey, newProgress);
        
        if (saved) {
            // Mettre à jour le cache local
            userProgress[termKey] = newProgress;
            
            // Calculer les jours jusqu'à la prochaine révision
            const daysUntilNext = Math.ceil((newProgress.nextReview - new Date()) / (1000 * 60 * 60 * 24));
            const intervalText = spacedRepetition.formatInterval(daysUntilNext);
            
            showNotification(`✅ Progression sauvegardée ! Prochaine révision : ${intervalText}`, 'success');
        } else {
            showNotification('⚠️ Sauvegarde en attente (mode hors ligne)', 'warning');
        }
    } else {
        console.log(`Note enregistrée (mode invité): ${difficulty} pour ${currentTerm.term}`);
    }
    
    // Enregistrer le résultat dans la session
    sessionResults.push({
        term: currentTerm,
        difficulty: difficulty,
        userAnswer: document.getElementById('userAnswer').value
    });
    
    // Passer au terme suivant après un court délai
    setTimeout(() => {
        currentTermIndex++;
        
        if (currentTermIndex < currentSession.length) {
            showCurrentTerm();
        } else {
            showSessionSummary();
        }
    }, 800);
}

function nextTerm() {
    if (currentState !== 'revealed') return;
    
    // Passer au terme suivant
    currentTermIndex++;
    
    if (currentTermIndex < currentSession.length) {
        showCurrentTerm();
    } else {
        showSessionSummary();
    }
}

// Vérifier la réponse de l'utilisateur
function checkAnswer() {
    const userAnswer = document.getElementById('userAnswer').value.trim();
    
    if (!userAnswer) {
        alert('Veuillez saisir votre réponse avant de vérifier.');
        return;
    }
    
    const currentTerm = currentSession[currentTermIndex];
    
    // Afficher la section de correction
    document.getElementById('userAnswerDisplay').textContent = userAnswer;
    document.getElementById('correctAnswerDisplay').textContent = currentTerm.definition;
    document.getElementById('correctionSection').style.display = 'block';
    
    // Désactiver le textarea et le bouton
    document.getElementById('userAnswer').disabled = true;
    
    // Faire défiler vers la correction
    document.getElementById('correctionSection').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// Afficher le résumé de session
function showSessionSummary() {
    // Calculer les statistiques
    const totalTerms = sessionResults.length;
    
    // Créer le contenu du résumé
    let summaryContent = `
        <div class="session-stats">
            <h3>🎉 Félicitations !</h3>
            <p>Vous avez terminé votre session de révision.</p>
        </div>
        
        <div class="terms-review">
            <h4>Récapitulatif des termes</h4>
            <div class="terms-list">
    `;
    
    sessionResults.forEach((result, index) => {
        summaryContent += `
            <div class="term-summary">
                <h5>${result.term.term}</h5>
                <p><strong>Votre réflexion :</strong> ${result.userReflection || 'Aucune réflexion saisie'}</p>
                <p><strong>Définition :</strong> ${result.term.definition}</p>
                ${result.reported ? '<span class="reported-badge">Signalé</span>' : ''}
            </div>
        `;
    });
    
    summaryContent += `
            </div>
        </div>
        
        <div class="summary-actions">
            <button onclick="startNewSession()">Nouvelle session</button>
            <button onclick="returnToMenu()">Retour au menu</button>
        </div>
    `;
    
    // Afficher le résumé
    document.getElementById('revisionScreen').style.display = 'none';
    document.getElementById('resultsScreen').innerHTML = summaryContent;
    document.getElementById('resultsScreen').style.display = 'block';
}

// Afficher la modal de signalement
function showReportModal() {
    if (!validateSessionState()) return;
    
    return safeExecute(() => {
        const currentTerm = currentSession[currentTermIndex];
        
        // Supprimer l'ancienne modal si elle existe
        const existingModal = document.getElementById('reportModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Créer la nouvelle modal
        const modal = document.createElement('div');
        modal.id = 'reportModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3>⚠️ Signaler cette définition</h3>
                    <button class="modal-close" onclick="closeReportModal()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="term-info">
                        <p><strong>Terme :</strong> ${currentTerm.term}</p>
                        <p><strong>Définition actuelle :</strong></p>
                        <div class="current-definition">${currentTerm.definition}</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="reportReason">Raison du signalement :</label>
                        <select id="reportReason" class="form-select">
                            <option value="inexact">Définition inexacte</option>
                            <option value="incomplete">Définition incomplète</option>
                            <option value="unclear">Définition peu claire</option>
                            <option value="error">Erreur dans la définition</option>
                            <option value="typo">Faute de frappe/orthographe</option>
                            <option value="other">Autre</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="reportComment">Votre commentaire :</label>
                        <textarea 
                            id="reportComment" 
                            class="form-textarea"
                            placeholder="Décrivez le problème ou proposez une amélioration..."
                            rows="4"
                        ></textarea>
                    </div>
                    
                    <div class="info-box">
                        <p><strong>📋 Processus :</strong></p>
                        <p>En cliquant sur "Envoyer", votre commentaire sera envoyé.</p>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="submitReport()">
                        📤 Envoyer
                    </button>
                    <button class="btn btn-secondary" onclick="closeReportModal()">
                        ❌ Annuler
                    </button>
                </div>
            </div>
        `;
        
        // Ajouter la modal au body
        document.body.appendChild(modal);
        
        // Afficher la modal avec animation
        setTimeout(() => {
            modal.classList.add('modal-active');
        }, 10);
        
        // Focus sur le textarea
        setTimeout(() => {
            const commentField = document.getElementById('reportComment');
            if (commentField) commentField.focus();
        }, 100);
        
        return true;
    }, 'Impossible d\'ouvrir la modal de signalement');
}

// Fermer la modal de signalement
function closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.classList.remove('modal-active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Soumettre le signalement via Google Forms (iframe cachée)
function submitReport() {
    const currentTerm = currentSession[currentTermIndex];
    const reasonElement = document.getElementById('reportReason');
    const commentElement = document.getElementById('reportComment');
    
    if (!reasonElement || !commentElement) {
        showNotification('❌ Erreur : formulaire non trouvé', 'error');
        return;
    }
    
    const reason = reasonElement.value;
    const comment = commentElement.value.trim();
    
    if (!comment) {
        showNotification('⚠️ Veuillez ajouter un commentaire pour expliquer le problème', 'warning');
        document.getElementById('reportComment').focus();
        return;
    }
    
    // Construire le commentaire enrichi
    const enrichedComment = `PROBLÈME: ${getReasonLabel(reason)}

COMMENTAIRE/SUGGESTION:
${comment}

DÉFINITION ACTUELLE:
${currentTerm.definition}

Date: ${new Date().toLocaleString('fr-FR')}`;

    // Créer une iframe cachée pour la soumission
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = 'hidden-form-target';
    document.body.appendChild(iframe);
    
    // Créer le formulaire qui cible l'iframe
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://docs.google.com/forms/d/e/1FAIpQLSe04vxWBsFmPrrEVdQsFwvsrt0konBbrd4iNncbRb8Z99N0UA/formResponse';
    form.target = 'hidden-form-target';
    form.style.display = 'none';
    
    // Ajouter les champs avec vos vrais entry IDs
    const formFields = {
        'entry.987196451': currentTerm.term,                    // Terme signalé
        'entry.46296924': currentTerm.ue || 'Non spécifiée',   // Unité d'enseignement
        'entry.980958767': enrichedComment                     // Commentaire complet
    };
    
    Object.entries(formFields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
    });
    
    document.body.appendChild(form);
    
    // Soumettre le formulaire
    form.submit();
    
    // Nettoyer après 3 secondes
    setTimeout(() => {
        if (document.body.contains(form)) {
            document.body.removeChild(form);
        }
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
    }, 3000);
    
    // Marquer comme signalé pour éviter les doublons
    markTermAsReported(currentTerm);
    
    // Feedback immédiat à l'utilisateur
    showNotification('✅ Signalement envoyé ! Merci pour votre contribution.', 'success');
    
    // Fermer la modal
    closeReportModal();
    
    // Analytics si disponible
    if (window.gtag) {
        window.gtag('event', 'term_reported', {
            event_category: 'User Interaction',
            event_label: currentTerm.term,
            custom_parameter_1: reason
        });
    }
}

// Marquer un terme comme signalé
function markTermAsReported(term) {
    if (!reportedTerms.includes(term.term)) {
        reportedTerms.push(term.term);
        localStorage.setItem('reportedTerms', JSON.stringify(reportedTerms));
    }
    
    // Marquer dans les résultats de session
    const sessionResult = sessionResults.find(r => r.term.id === term.id);
    if (sessionResult) {
        sessionResult.reported = true;
    }
}

// Obtenir le libellé français de la raison
function getReasonLabel(reason) {
    const labels = {
        'inexact': 'Définition inexacte',
        'incomplete': 'Définition incomplète',
        'unclear': 'Définition peu claire',
        'error': 'Erreur dans la définition',
        'typo': 'Faute de frappe/orthographe',
        'other': 'Autre'
    };
    return labels[reason] || reason;
}

// Démarrer une nouvelle session
function startNewSession() {
    // Réinitialiser les variables de session
    currentTermIndex = 0;
    sessionResults = [];
    currentState = 'thinking';
    
    // Réafficher l'écran de démarrage
    document.getElementById('resultsScreen').style.display = 'none';
    document.getElementById('revisionScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
    
    // Mettre à jour les statistiques
    updateStatsDisplay();
}

// Retourner au menu principal
function returnToMenu() {
    window.location.href = 'index.html';
}

// Mise à jour des raccourcis clavier
document.addEventListener('keydown', function(event) {
    // Gestion des raccourcis dans l'interface de révision
    if (document.getElementById('revisionScreen').style.display === 'block') {
        // Ne pas intercepter si on est dans un textarea, input ou modal
        if (event.target.tagName === 'TEXTAREA' || 
            event.target.tagName === 'INPUT' || 
            event.target.tagName === 'SELECT' ||
            document.querySelector('.modal-overlay.modal-active')) {
            return;
        }
        
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            
            // Actions selon l'état actuel
            if (currentState === 'thinking') {
                revealDefinition();
            } else if (currentState === 'revealed') {
                nextTerm();
            }
        } else if (event.key === 'r' || event.key === 'R') {
            event.preventDefault();
            if (currentState === 'revealed') {
                showReportModal();
            }
        }
    }
    
    // Échap pour fermer les modals
    if (event.key === 'Escape') {
        closeReportModal();
    }
});

// Fonction utilitaire pour valider l'état de la session
function validateSessionState() {
    if (!currentSession || currentSession.length === 0) {
        showNotification('❌ Erreur : Aucune session active', 'error');
        return false;
    }
    
    if (currentTermIndex >= currentSession.length) {
        showNotification('❌ Erreur : Index de terme invalide', 'error');
        return false;
    }
    
    return true;
}

// Gestion d'erreur globale pour les fonctions principales
function safeExecute(func, errorMessage = 'Une erreur est survenue') {
    try {
        return func();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification(`❌ ${errorMessage}`, 'error');
        return false;
    }
}

// 🎯 Fonctions pour le sélecteur de nombre de termes

// Ajuster le nombre de termes avec les boutons + et -
function adjustTermCount(delta) {
    const input = document.getElementById('termCount');
    const currentValue = parseInt(input.value) || 10;
    const newValue = Math.max(1, Math.min(50, currentValue + delta));
    
    input.value = newValue;
    updateActivePreset(newValue);
    
    // Analytics pour le choix du nombre de termes
    if (window.IFSIAnalytics) {
        window.IFSIAnalytics.trackTermCountChanged(newValue);
    }
}

// Définir directement le nombre de termes
function setTermCount(count) {
    const input = document.getElementById('termCount');
    input.value = Math.max(1, Math.min(50, count));
    updateActivePreset(count);
    
    // Analytics pour le choix du nombre de termes
    if (window.IFSIAnalytics) {
        window.IFSIAnalytics.trackTermCountChanged(count);
    }
}

// Mettre à jour le bouton preset actif
function updateActivePreset(count) {
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.textContent) === count) {
            btn.classList.add('active');
        }
    });
}

// Initialisation du sélecteur au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    const termCountInput = document.getElementById('termCount');
    
    if (termCountInput) {
        // Gérer les changements manuels dans l'input
        termCountInput.addEventListener('input', function() {
            const value = parseInt(this.value) || 10;
            const clampedValue = Math.max(1, Math.min(50, value));
            
            if (value !== clampedValue) {
                this.value = clampedValue;
            }
            
            updateActivePreset(clampedValue);
        });
        
        // Empêcher la saisie de caractères non numériques
        termCountInput.addEventListener('keypress', function(e) {
            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                e.preventDefault();
            }
        });
    }
});