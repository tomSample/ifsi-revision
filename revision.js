// Variables globales pour la gestion des révisions
let allTerms = [];
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

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    loadCoursesData();
    loadUserProgress();
    loadReportedTerms();
    setupEventListeners();
});

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
        const response = await fetch('ifsi_courses_2025-09-23.json');
        coursesData = await response.json();
        
        // Extraire tous les termes de tous les cours
        allTerms = [];
        coursesData.courses.forEach(course => {
            const [courseKey, courseData] = course;
            if (courseData.definitions) {
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
        
        globalStats.totalTerms = allTerms.length;
        updateStatsDisplay();
        
        console.log(`${allTerms.length} termes chargés depuis ${coursesData.courses.length} cours`);
        
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
    const priorityTermsElement = document.getElementById('priorityTerms');
    const globalProgressElement = document.getElementById('globalProgress');
    
    if (totalTermsElement) {
        totalTermsElement.textContent = globalStats.totalTerms;
    }
    
    // Affichage du nombre de sessions complétées
    if (priorityTermsElement) {
        const totalSessions = parseInt(localStorage.getItem('totalSessions') || '0');
        priorityTermsElement.textContent = totalSessions;
    }
    
    if (globalProgressElement) {
        const totalSessions = parseInt(localStorage.getItem('totalSessions') || '0');
        globalProgressElement.textContent = `${globalStats.totalTerms} termes disponibles - ${totalSessions} sessions complétées`;
    }
}

// Démarrer une session de révision
function startRevision() {
    if (allTerms.length === 0) {
        alert('Aucun terme disponible. Vérifiez le chargement des données.');
        return;
    }
    
    // Sélectionner 10 termes pour cette session
    currentSession = selectTermsForSession();
    currentTermIndex = 0;
    sessionResults = [];
    sessionStartTime = new Date();
    
    // Masquer l'écran de démarrage et afficher l'écran de révision
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('revisionScreen').style.display = 'block';
    
    // Démarrer le premier terme
    showCurrentTerm();
}

// Sélectionner 10 termes pour la session (complètement aléatoire)
function selectTermsForSession() {
    if (allTerms.length === 0) {
        console.log('Aucun terme disponible');
        return [];
    }
    
    // Mélanger tous les termes de façon aléatoire
    const shuffledTerms = [...allTerms].sort(() => 0.5 - Math.random());
    
    // Prendre les 10 premiers (ou moins s'il y a moins de 10 termes)
    const sessionTerms = shuffledTerms.slice(0, Math.min(10, allTerms.length));
    
    console.log(`Session générée avec ${sessionTerms.length} termes aléatoires`);
    return sessionTerms;
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
    document.getElementById('sessionProgress').textContent = `Session : ${currentTermIndex + 1}/${currentSession.length}`;
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
            <h3>Résumé de votre session</h3>
            <p><strong>Termes étudiés :</strong> ${totalTerms}</p>
            <p><strong>Termes signalés :</strong> ${reportedTerms.length}</p>
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
                        <p>En cliquant sur "Ouvrir le formulaire", le Google Form s'ouvrira avec le terme et l'UE pré-remplis. Votre commentaire sera également intégré. Vous n'aurez qu'à valider l'envoi.</p>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="submitReport()">
                        📤 Ouvrir le formulaire
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

// Soumettre le signalement via Google Forms
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
    
    // Créer l'URL Google Forms avec pré-remplissage
    const googleFormUrl = createGoogleFormUrl({
        term: currentTerm.term,
        definition: currentTerm.definition,
        ue: currentTerm.ue || 'Non spécifiée',
        category: currentTerm.category || 'Général',
        reason: reason,
        comment: comment,
        timestamp: new Date().toLocaleString('fr-FR')
    });
    
    // Ouvrir Google Forms dans un nouvel onglet
    window.open(googleFormUrl, '_blank');
    
    // Marquer comme signalé pour éviter les doublons
    markTermAsReported(currentTerm);
    
    // Afficher confirmation
    showNotification('📝 Google Form ouvert ! Vérifiez l\'onglet et validez l\'envoi.', 'success');
    
    // Fermer la modal
    closeReportModal();
}

// Créer l'URL Google Forms avec pré-remplissage
function createGoogleFormUrl(data) {
    // URL de base du Google Form
    const baseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSe04vxWBsFmPrrEVdQsFwvsrt0konBbrd4iNncbRb8Z99N0UA/viewform';
    
    // Configuration des champs (vos vrais entry IDs)
    const fieldMappings = {
        terme: 'entry.987196451',           // Champ "Terme signalé"
        ue: 'entry.46296924',              // Champ "Unité d'enseignement"
        commentaire: 'entry.980958767'     // Champ "Suggestion/commentaire"
    };
    
    // Construire le commentaire complet avec toutes les infos
    const fullComment = `
PROBLÈME: ${getReasonLabel(data.reason)}

COMMENTAIRE/SUGGESTION:
${data.comment}

DÉFINITION ACTUELLE:
${data.definition}

Date: ${data.timestamp}
`.trim();
    
    // Construire les paramètres d'URL
    const params = new URLSearchParams({
        'usp': 'pp_url',
        [fieldMappings.terme]: data.term,
        [fieldMappings.ue]: data.ue,
        [fieldMappings.commentaire]: fullComment
    });
    
    return `${baseUrl}?${params.toString()}`;
}

// Supprimer la fonction fallback email (plus nécessaire)
// function createEmailFallback(data) { ... } - SUPPRIMÉE

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