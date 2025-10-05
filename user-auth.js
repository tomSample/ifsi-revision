// ====================================
// SYSTÈME D'AUTHENTIFICATION UTILISATEUR
// Stockage local avec localStorage
// ====================================

class UserManager {
    constructor() {
        this.storageKey = 'ifsi_users_data';
        this.currentUserKey = 'ifsi_current_user';
        this.usersData = this.loadUsersData();
    }

    // Charger les données utilisateurs depuis localStorage
    loadUsersData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : { users: {} };
        } catch (error) {
            console.error('Erreur lors du chargement des données utilisateurs:', error);
            return { users: {} };
        }
    }

    // Sauvegarder les données utilisateurs
    saveUsersData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.usersData));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            return false;
        }
    }

    // Valider un nom d'utilisateur
    validateUsername(username) {
        if (!username) {
            return { valid: false, message: 'Le nom d\'utilisateur est requis' };
        }

        if (username.length < 2) {
            return { valid: false, message: 'Le nom d\'utilisateur doit contenir au moins 2 caractères' };
        }

        if (username.length > 20) {
            return { valid: false, message: 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères' };
        }

        if (!/^[a-zA-Z0-9\-]+$/.test(username)) {
            return { valid: false, message: 'Seules les lettres, chiffres et tirets sont autorisés' };
        }

        return { valid: true, message: 'Nom d\'utilisateur valide' };
    }

    // Vérifier si un utilisateur existe
    userExists(username) {
        return username && this.usersData.users.hasOwnProperty(username.toLowerCase());
    }

    // Créer un nouvel utilisateur
    createUser(username) {
        const validation = this.validateUsername(username);
        if (!validation.valid) {
            return { success: false, message: validation.message };
        }

        const normalizedUsername = username.toLowerCase();

        if (this.userExists(normalizedUsername)) {
            return { success: false, message: 'Ce nom d\'utilisateur existe déjà' };
        }

        // Créer l'utilisateur avec les données minimales
        const userData = {
            username: normalizedUsername,
            created_at: new Date().toISOString(),
            last_session_date: null,
            rotation_state: {
                current_course_index: 0,
                current_word_index: 0,
                words_today: 0
            }
        };

        this.usersData.users[normalizedUsername] = userData;

        if (this.saveUsersData()) {
            return { success: true, message: 'Utilisateur créé avec succès', user: userData };
        } else {
            return { success: false, message: 'Erreur lors de la sauvegarde' };
        }
    }

    // Connecter un utilisateur
    loginUser(username) {
        const validation = this.validateUsername(username);
        if (!validation.valid) {
            return { success: false, message: validation.message };
        }

        const normalizedUsername = username.toLowerCase();

        if (!this.userExists(normalizedUsername)) {
            return { success: false, message: 'Cet utilisateur n\'existe pas' };
        }

        const userData = this.usersData.users[normalizedUsername];

        // Sauvegarder l'utilisateur actuel
        localStorage.setItem(this.currentUserKey, normalizedUsername);

        return { success: true, message: 'Connexion réussie', user: userData };
    }

    // Nouvelle méthode combinée pour connexion/création automatique
    loginOrCreateUser(username) {
        const validation = this.validateUsername(username);
        if (!validation.valid) {
            console.log('❌ Nom d\'utilisateur invalide:', validation.message);
            return false;
        }

        const normalizedUsername = username.toLowerCase();

        // Si l'utilisateur existe, on le connecte
        if (this.userExists(normalizedUsername)) {
            const loginResult = this.loginUser(normalizedUsername);
            console.log('🔑 Connexion utilisateur existant:', loginResult.success);
            return loginResult.success;
        } else {
            // Sinon on le crée et on le connecte
            const createResult = this.createUser(normalizedUsername);
            if (createResult.success) {
                const loginResult = this.loginUser(normalizedUsername);
                console.log('✨ Création et connexion nouvel utilisateur:', loginResult.success);
                return loginResult.success;
            } else {
                console.log('❌ Échec création utilisateur:', createResult.message);
                return false;
            }
        }
    }

    // Obtenir l'utilisateur actuellement connecté
    getCurrentUser() {
        const currentUsername = localStorage.getItem(this.currentUserKey);
        if (currentUsername) {
            // Recharger les données au cas où elles auraient été mises à jour
            this.usersData = this.loadUsersData();
            if (this.userExists(currentUsername)) {
                return this.usersData.users[currentUsername];
            }
        }
        return null;
    }

    // Déconnecter l'utilisateur actuel
    logoutUser() {
        localStorage.removeItem(this.currentUserKey);
        console.log('🚪 Utilisateur déconnecté');
        return { success: true, message: 'Déconnexion réussie' };
    }

    // Vérifier si un utilisateur est connecté
    isLoggedIn() {
        const result = this.getCurrentUser() !== null;
        console.log('🔍 Vérification connexion:', {
            isLoggedIn: result,
            currentUserKey: localStorage.getItem(this.currentUserKey),
            hasUsersData: Object.keys(this.usersData.users).length > 0
        });
        return result;
    }

    // Mettre à jour les données de rotation d'un utilisateur
    updateUserRotation(username, rotationState) {
        const normalizedUsername = username.toLowerCase();
        if (this.userExists(normalizedUsername)) {
            this.usersData.users[normalizedUsername].rotation_state = rotationState;
            this.usersData.users[normalizedUsername].last_session_date = new Date().toISOString().split('T')[0];
            return this.saveUsersData();
        }
        return false;
    }

    // Obtenir les statistiques basiques
    getUserStats() {
        const totalUsers = Object.keys(this.usersData.users).length;
        const currentUser = this.getCurrentUser();
        
        return {
            totalUsers,
            currentUser: currentUser ? currentUser.username : null,
            isLoggedIn: this.isLoggedIn()
        };
    }
}

// Instance globale
const userManager = new UserManager();

console.log('🔐 Système d\'authentification utilisateur simplifié initialisé');