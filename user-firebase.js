// ====================================
// SYSTÈME MULTI-UTILISATEUR AVEC FIREBASE
// Synchronisation cloud + localStorage hybride
// ====================================

class UserFirebaseManager {
    constructor() {
        this.currentUser = null;
        this.isOnline = false;
        this.syncEnabled = false;
        this.lastSyncTime = null;
        
        // Vérifier si Firebase est disponible
        this.checkFirebaseAvailability();
        
        // Écouter les changements de connexion
        window.addEventListener('online', () => this.handleConnectionChange(true));
        window.addEventListener('offline', () => this.handleConnectionChange(false));
    }

    // Vérifier la disponibilité de Firebase
    checkFirebaseAvailability() {
        this.syncEnabled = window.firebaseDb ? true : false;
        this.isOnline = navigator.onLine && this.syncEnabled;
        
        console.log(`🔥 Firebase: ${this.syncEnabled ? 'Activé' : 'Désactivé'}`);
        console.log(`🌐 Connexion: ${this.isOnline ? 'En ligne' : 'Hors ligne'}`);
    }

    // Gérer les changements de connexion
    handleConnectionChange(online) {
        this.isOnline = online && this.syncEnabled;
        this.updateSyncStatus();
        
        if (this.isOnline && this.currentUser) {
            this.syncUserData();
        }
    }

    // Mettre à jour le statut de synchronisation dans l'interface
    updateSyncStatus() {
        const statusElement = document.getElementById('syncStatus');
        if (!statusElement) return;

        if (!this.syncEnabled) {
            statusElement.textContent = '📱 Mode hors ligne';
            statusElement.style.color = 'rgba(255,255,255,0.7)';
        } else if (this.isOnline) {
            statusElement.textContent = '☁️ Synchronisé';
            statusElement.style.color = 'rgba(255,255,255,0.9)';
        } else {
            statusElement.textContent = '📡 Synchronisation en attente';
            statusElement.style.color = 'rgba(255,255,255,0.6)';
        }
    }

    // Connexion utilisateur
    async loginUser(username) {
        if (!username || username.length < 2) {
            throw new Error('Le prénom doit contenir au moins 2 caractères');
        }

        this.currentUser = username.toLowerCase().trim();
        console.log(`👤 Connexion: ${this.currentUser}`);

        // Sauvegarder le dernier utilisateur
        localStorage.setItem('lastUser', this.currentUser);

        // Charger les données utilisateur
        await this.loadUserData();

        // Démarrer la synchronisation si possible
        if (this.isOnline) {
            await this.syncUserData();
        }

        // Mettre à jour l'interface
        this.updateUI();
        
        return this.currentUser;
    }

    // Déconnexion utilisateur
    logoutUser() {
        if (this.currentUser) {
            console.log(`🚪 Déconnexion: ${this.currentUser}`);
        }
        
        this.currentUser = null;
        this.showAuthInterface();
    }

    // Charger les données utilisateur (localStorage + Firebase)
    async loadUserData() {
        if (!this.currentUser) return null;

        // 1. Charger les données locales
        const localData = this.getLocalUserData();
        
        // 2. Si en ligne, vérifier les données cloud
        if (this.isOnline) {
            try {
                const cloudData = await this.getCloudUserData();
                
                // Comparer les timestamps et garder les plus récentes
                if (cloudData && cloudData.lastModified > (localData.lastModified || 0)) {
                    console.log('☁️ Données cloud plus récentes, synchronisation...');
                    this.saveLocalUserData(cloudData);
                    return cloudData;
                }
            } catch (error) {
                console.log('📱 Erreur cloud, utilisation des données locales:', error.message);
            }
        }

        return localData;
    }

    // Obtenir les données utilisateur locales
    getLocalUserData() {
        const storageKey = `user_${this.currentUser}`;
        const userData = localStorage.getItem(storageKey);
        
        if (userData) {
            return JSON.parse(userData);
        }

        // Créer un nouvel utilisateur
        const newUserData = {
            username: this.currentUser,
            created: Date.now(),
            lastModified: Date.now(),
            masteredTerms: [],
            sessionStats: {
                totalSessions: 0,
                totalAnswers: 0,
                correctAnswers: 0
            }
        };

        this.saveLocalUserData(newUserData);
        console.log(`✨ Nouvel utilisateur créé: ${this.currentUser}`);
        
        return newUserData;
    }

    // Sauvegarder les données utilisateur localement
    saveLocalUserData(userData) {
        const storageKey = `user_${this.currentUser}`;
        userData.lastModified = Date.now();
        localStorage.setItem(storageKey, JSON.stringify(userData));
    }

    // Obtenir les données utilisateur depuis Firebase
    async getCloudUserData() {
        if (!this.syncEnabled || !this.currentUser || !window.firebaseDb) return null;

        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            const docRef = doc(window.firebaseDb, 'users', this.currentUser);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data();
            }
            
            return null;
        } catch (error) {
            console.log('❌ Erreur lecture Firebase:', error.message);
            return null;
        }
    }

    // Sauvegarder les données utilisateur sur Firebase
    async saveCloudUserData(userData) {
        if (!this.syncEnabled || !this.currentUser || !window.firebaseDb) return;

        try {
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            const docRef = doc(window.firebaseDb, 'users', this.currentUser);
            await setDoc(docRef, userData);
            
            console.log(`☁️ Données synchronisées pour ${this.currentUser}`);
            this.lastSyncTime = Date.now();
        } catch (error) {
            console.log('❌ Erreur écriture Firebase:', error.message);
        }
    }

    // Synchroniser les données utilisateur
    async syncUserData() {
        if (!this.isOnline || !this.currentUser) return;

        try {
            const localData = this.getLocalUserData();
            await this.saveCloudUserData(localData);
            this.updateSyncStatus();
        } catch (error) {
            console.error('❌ Erreur de synchronisation:', error);
        }
    }

    // Obtenir la liste des termes maîtrisés pour l'utilisateur actuel
    getMasteredTerms() {
        if (!this.currentUser) return [];
        
        const userData = this.getLocalUserData();
        return userData.masteredTerms || [];
    }

    // Marquer un terme comme maîtrisé
    async markTermAsMastered(termKey) {
        if (!this.currentUser) return;

        const userData = this.getLocalUserData();
        
        if (!userData.masteredTerms.includes(termKey)) {
            userData.masteredTerms.push(termKey);
            this.saveLocalUserData(userData);
            
            console.log(`✅ ${termKey} maîtrisé par ${this.currentUser}`);
            
            // Synchroniser si en ligne
            if (this.isOnline) {
                await this.syncUserData();
            }
        }
    }

    // Retirer un terme de la liste des maîtrisés
    async markTermAsNotMastered(termKey) {
        if (!this.currentUser) return;

        const userData = this.getLocalUserData();
        userData.masteredTerms = userData.masteredTerms.filter(term => term !== termKey);
        this.saveLocalUserData(userData);
        
        console.log(`🔄 ${termKey} marqué comme non maîtrisé par ${this.currentUser}`);
        
        // Synchroniser si en ligne
        if (this.isOnline) {
            await this.syncUserData();
        }
    }

    // Vérifier si un terme est maîtrisé
    isMasteredTerm(termKey) {
        const masteredTerms = this.getMasteredTerms();
        return masteredTerms.includes(termKey);
    }

    // Mettre à jour les statistiques de session
    async updateSessionStats(correct, total) {
        if (!this.currentUser) return;

        const userData = this.getLocalUserData();
        userData.sessionStats.totalSessions++;
        userData.sessionStats.totalAnswers += total;
        userData.sessionStats.correctAnswers += correct;
        
        this.saveLocalUserData(userData);
        
        // Synchroniser si en ligne
        if (this.isOnline) {
            await this.syncUserData();
        }
    }

    // Afficher l'interface d'authentification
    showAuthInterface() {
        document.getElementById('userAuth').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        
        // Pré-remplir avec le dernier utilisateur
        const lastUser = localStorage.getItem('lastUser');
        if (lastUser) {
            document.getElementById('usernameInput').value = lastUser;
        }
    }

    // Afficher l'interface principale
    showMainInterface() {
        document.getElementById('userAuth').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
    }

    // Mettre à jour l'interface utilisateur
    updateUI() {
        if (!this.currentUser) {
            this.showAuthInterface();
            return;
        }

        // Afficher l'interface principale
        this.showMainInterface();
        
        // Mettre à jour le nom d'utilisateur
        const nameElement = document.getElementById('currentUserName');
        if (nameElement) {
            nameElement.textContent = this.currentUser.charAt(0).toUpperCase() + this.currentUser.slice(1);
        }
        
        // Mettre à jour le statut de synchronisation
        this.updateSyncStatus();
    }

    // Vérifier et restaurer la session au démarrage
    async restoreSession() {
        const lastUser = localStorage.getItem('lastUser');
        if (lastUser) {
            console.log(`🔄 Restauration de la session pour: ${lastUser}`);
            await this.loginUser(lastUser);
        } else {
            this.showAuthInterface();
        }
    }
}

// Instance globale
const userManager = new UserFirebaseManager();

// ====================================
// FONCTIONS D'INTERFACE
// ====================================

// Connexion utilisateur
async function loginUser() {
    const username = document.getElementById('usernameInput').value.trim();
    
    try {
        await userManager.loginUser(username);
        
        // Recharger les données de révision avec le nouvel utilisateur
        if (typeof loadCoursesData === 'function') {
            loadCoursesData();
        }
        
    } catch (error) {
        alert(error.message);
    }
}

// Déconnexion utilisateur
function logoutUser() {
    userManager.logoutUser();
}

// Mode hors ligne
function showOfflineMode() {
    alert('Mode hors ligne activé.\nVos données seront sauvegardées localement et synchronisées lors de votre prochaine connexion.');
    userManager.syncEnabled = false;
    userManager.isOnline = false;
    userManager.updateSyncStatus();
}

// Permettre la connexion avec Entrée
document.getElementById('usernameInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        loginUser();
    }
});

// ====================================
// HOOKS POUR REVISION.JS
// ====================================

// Remplacer les fonctions de stockage globales
window.userManager = userManager;

// Au démarrage de la page
document.addEventListener('DOMContentLoaded', function() {
    // Attendre un peu que les éléments soient chargés
    setTimeout(() => {
        userManager.restoreSession();
    }, 100);
});

console.log('🚀 Système multi-utilisateur Firebase initialisé');