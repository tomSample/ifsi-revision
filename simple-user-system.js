// ===== SYSTÈME MULTI-UTILISATEUR ULTRA-SIMPLE =====

class SimpleUserSystem {
    constructor() {
        this.storageKey = 'ifsi_users_simple';
        this.currentUser = null;
        this.initialized = false;
    }
    
    // Obtenir toutes les données
    getAllData() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        } catch {
            return {};
        }
    }
    
    // Sauvegarder toutes les données
    saveAllData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
    
    // Se connecter
    login(username) {
        this.currentUser = username.toLowerCase();
        const allData = this.getAllData();
        
        // Créer l'utilisateur s'il n'existe pas
        if (!allData[this.currentUser]) {
            allData[this.currentUser] = {
                created: new Date().toISOString().split('T')[0],
                mastered: {}, // terme_id: true/false
                dailyProgress: 0
            };
            this.saveAllData(allData);
            console.log(`✨ Nouvel utilisateur créé: ${this.currentUser}`);
        }
        
        return allData[this.currentUser];
    }
    
    // Marquer un terme comme maîtrisé
    markAsMastered(termName) {
        if (!this.currentUser) return;
        
        const allData = this.getAllData();
        const userData = allData[this.currentUser];
        
        if (userData) {
            const before = Object.values(userData.mastered).filter(Boolean).length;
            userData.mastered[termName] = true;
            userData.dailyProgress++;
            this.saveAllData(allData);
            const after = Object.values(userData.mastered).filter(Boolean).length;
            
            console.log(`✅ ${termName} maîtrisé par ${this.currentUser} (${before} → ${after})`);
            this.updateDisplay();
        }
    }
    
    // Vérifier si un terme est maîtrisé
    isMastered(termName) {
        if (!this.currentUser) return false;
        const allData = this.getAllData();
        const userData = allData[this.currentUser];
        return userData && userData.mastered[termName] === true;
    }
    
    // Obtenir les statistiques
    getStats() {
        if (!this.currentUser || !window.allTerms) return { mastered: 0, total: 0, percent: 0 };
        
        const allData = this.getAllData();
        const userData = allData[this.currentUser];
        const mastered = userData ? Object.values(userData.mastered).filter(Boolean).length : 0;
        const total = window.allTerms.length;
        const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;
        
        return { mastered, total, percent };
    }
    
    // Mettre à jour l'affichage
    updateDisplay() {
        const stats = this.getStats();
        
        console.log(`📊 STATS ${this.currentUser}: ${stats.mastered}/${stats.total} (${stats.percent}%)`);
        
        // Header principal
        const globalProgress = document.getElementById('globalProgress');
        if (globalProgress) {
            globalProgress.textContent = `Maîtrise : ${stats.percent}% (${stats.mastered}/${stats.total})`;
        }
        
        // Écran d'accueil
        const masteredElement = document.getElementById('masteredTerms');
        if (masteredElement) masteredElement.textContent = stats.mastered;
        
        const totalElement = document.getElementById('totalTermsPreview');
        if (totalElement) totalElement.textContent = stats.total;
        
        const priorityElement = document.getElementById('priorityTerms');
        if (priorityElement) priorityElement.textContent = stats.total - stats.mastered;
        
        // Progression quotidienne
        const allData = this.getAllData();
        const userData = allData[this.currentUser];
        const dailyProgress = userData ? userData.dailyProgress : 0;
        const dailyElement = document.getElementById('dailyProgress');
        if (dailyElement) {
            dailyElement.textContent = `📚 Mots du jour : ${Math.min(dailyProgress, 10)}/10`;
        }
    }
    
    // Initialiser le système
    init() {
        if (this.initialized) return;
        
        console.log('🎯 Initialisation système simple');
        
        // Nettoyer l'ancien système une seule fois
        if (localStorage.getItem('masteredTerms')) {
            localStorage.removeItem('masteredTerms');
            console.log('🧹 Migration: ancien système supprimé');
        }
        
        // Attendre que les termes soient chargés
        if (window.allTerms && window.allTerms.length > 0) {
            this.setupHooks();
            this.initialized = true;
            console.log('✅ Système simple initialisé');
        } else {
            setTimeout(() => this.init(), 100);
        }
    }
    
    // Installer les hooks sur le système existant
    setupHooks() {
        // Sauvegarder les fonctions originales
        const originalProcessAnswer = window.processAnswer;
        
        // Remplacer isMasteredTerm
        window.isMasteredTerm = (term) => {
            return this.isMastered(term.term);
        };
        
        // Remplacer markTermAsMastered  
        window.markTermAsMastered = (term) => {
            this.markAsMastered(term.term);
        };
        
        // Remplacer updateStatsDisplay
        window.updateStatsDisplay = () => {
            this.updateDisplay();
        };
        
        // Intercepter processAnswer
        window.processAnswer = (evaluation) => {
            console.log(`🎯 RÉPONSE: ${evaluation}`);
            
            // Appeler l'original
            if (originalProcessAnswer) {
                originalProcessAnswer(evaluation);
            }
            
            // Traiter la progression
            if (evaluation === 'correct' && window.currentSession && window.currentTermIndex > 0) {
                const currentTerm = window.currentSession[window.currentTermIndex - 1];
                if (currentTerm) {
                    this.markAsMastered(currentTerm.term);
                }
            }
        };
        
        console.log('🔧 Hooks installés sur le système existant');
    }
}

// Instance globale
const userSystem = new SimpleUserSystem();

// ===== INTERFACE D'AUTHENTIFICATION =====

function handleAuth() {
    const username = document.getElementById('usernameInput').value.trim();
    
    if (!username) {
        alert('Veuillez entrer votre prénom');
        return;
    }
    
    if (username.length < 2) {
        alert('Le prénom doit contenir au moins 2 caractères');
        return;
    }
    
    console.log(`🔑 CONNEXION: ${username}`);
    
    // Se connecter
    const userData = userSystem.login(username);
    
    // Mettre à jour l'interface
    document.getElementById('currentUser').textContent = username;
    document.getElementById('authOverlay').style.display = 'none';
    document.getElementById('mainInterface').style.display = 'block';
    
    // Initialiser le système
    userSystem.init();
    
    // Mettre à jour l'affichage
    setTimeout(() => {
        userSystem.updateDisplay();
    }, 200);
    
    console.log('✅ Connexion terminée');
}

function logout() {
    userSystem.currentUser = null;
    document.getElementById('usernameInput').value = '';
    document.getElementById('authOverlay').style.display = 'flex';
    document.getElementById('mainInterface').style.display = 'none';
}

// Auto-remplir le dernier utilisateur
document.addEventListener('DOMContentLoaded', function() {
    const lastUser = localStorage.getItem('lastUser');
    if (lastUser) {
        document.getElementById('usernameInput').value = lastUser;
    }
    
    // Sauvegarder le dernier utilisateur utilisé
    const originalHandleAuth = handleAuth;
    window.handleAuth = function() {
        const username = document.getElementById('usernameInput').value.trim();
        localStorage.setItem('lastUser', username);
        originalHandleAuth();
    };
    
    // Connexion avec Entrée
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput) {
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleAuth();
            }
        });
    }
});