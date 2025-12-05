/**
 * Gestionnaire d'authentification Firebase
 * Gère : inscription, connexion, déconnexion, réinitialisation mot de passe
 */

// Import Firebase SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updatePassword,
    updateEmail,
    deleteUser,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { 
    getFirestore,
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    collection,
    getDocs,
    query
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Initialisation Firebase
const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export global
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;

/**
 * Classe de gestion de l'authentification
 */
class FirebaseAuthManager {
    constructor() {
        this.currentUser = null;
        this.setupAuthListener();
    }

    /**
     * Écouter les changements d'état d'authentification
     */
    setupAuthListener() {
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            
            if (user) {
                console.log('✅ Utilisateur connecté');
                this.onUserLogin(user);
            } else {
                console.log('❌ Utilisateur déconnecté');
                this.onUserLogout();
            }
        });
    }

    /**
     * Inscription d'un nouvel utilisateur
     */
    async register(email, password) {
        try {
            // Créer le compte Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Créer le document utilisateur dans Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: email,
                createdAt: new Date(),
                settings: {
                    dailyGoal: 20,
                    notifications: true
                },
                stats: {
                    totalTermsStudied: 0,
                    totalReviews: 0,
                    currentStreak: 0,
                    lastActivity: new Date()
                }
            });

            return { 
                success: true, 
                userId: user.uid,
                email: user.email,
                message: 'Compte créé avec succès !'
            };

        } catch (error) {
            console.error('Erreur inscription:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error.code) 
            };
        }
    }

    /**
     * Connexion utilisateur
     */
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Mettre à jour lastActivity
            await setDoc(doc(db, 'users', user.uid), {
                stats: {
                    lastActivity: new Date()
                }
            }, { merge: true });

            return { 
                success: true, 
                userId: user.uid,
                email: user.email,
                message: 'Connexion réussie !'
            };

        } catch (error) {
            console.error('Erreur connexion:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error.code) 
            };
        }
    }

    /**
     * Déconnexion
     */
    async logout() {
        try {
            // 1. Synchroniser les modifications en attente
            if (window.syncManager && typeof window.syncManager.syncPendingChanges === 'function') {
                await window.syncManager.syncPendingChanges();
            }
            
            // 2. Déconnexion Firebase
            await signOut(auth);
            
            // 3. Nettoyer les caches de session
            sessionStorage.removeItem('coursesData_session');
            sessionStorage.removeItem('userProgress_session');
            
            return { success: true, message: 'Déconnexion réussie' };
        } catch (error) {
            console.error('Erreur déconnexion:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Réinitialisation du mot de passe
     */
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            return { 
                success: true, 
                message: 'Email de réinitialisation envoyé ! Vérifiez votre boîte mail.' 
            };
        } catch (error) {
            console.error('Erreur reset password:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error.code) 
            };
        }
    }

    /**
     * Changer le mot de passe (utilisateur connecté)
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Aucun utilisateur connecté');

            // Ré-authentifier avant de changer le mot de passe
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Changer le mot de passe
            await updatePassword(user, newPassword);

            return { 
                success: true, 
                message: 'Mot de passe modifié avec succès !' 
            };

        } catch (error) {
            console.error('Erreur changement mot de passe:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error.code) 
            };
        }
    }

    /**
     * Changer l'email (utilisateur connecté)
     */
    async changeEmail(newEmail, currentPassword) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Aucun utilisateur connecté');

            // Ré-authentifier
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Changer l'email
            await updateEmail(user, newEmail);

            // Mettre à jour dans Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: newEmail
            }, { merge: true });

            return { 
                success: true, 
                message: 'Email modifié avec succès !' 
            };

        } catch (error) {
            console.error('Erreur changement email:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error.code) 
            };
        }
    }

    /**
     * Supprimer le compte et toutes les données
     */
    async deleteAccount(password) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Aucun utilisateur connecté');

            // Ré-authentifier
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);

            const userId = user.uid;

            // 1. Supprimer toutes les données Firestore
            await this.deleteUserData(userId);

            // 2. Supprimer le compte Firebase Auth
            await deleteUser(user);

            return { 
                success: true, 
                message: 'Compte supprimé avec succès' 
            };

        } catch (error) {
            console.error('Erreur suppression compte:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error.code) 
            };
        }
    }

    /**
     * Supprimer toutes les données utilisateur de Firestore
     */
    async deleteUserData(userId) {
        try {
            // Supprimer la progression
            const progressRef = collection(db, 'users', userId, 'progress');
            const progressSnapshot = await getDocs(progressRef);
            
            const deletePromises = [];
            progressSnapshot.forEach((doc) => {
                deletePromises.push(deleteDoc(doc.ref));
            });
            
            await Promise.all(deletePromises);

            // Supprimer le document utilisateur
            await deleteDoc(doc(db, 'users', userId));

            console.log('✅ Toutes les données utilisateur supprimées');

        } catch (error) {
            console.error('Erreur suppression données:', error);
            throw error;
        }
    }

    /**
     * Récupérer les données utilisateur
     */
    async getUserData(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            
            if (userDoc.exists()) {
                return { success: true, data: userDoc.data() };
            } else {
                return { success: false, error: 'Utilisateur non trouvé' };
            }

        } catch (error) {
            console.error('Erreur récupération données:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Vérifier si un utilisateur est connecté
     */
    isLoggedIn() {
        return auth.currentUser !== null;
    }

    /**
     * Obtenir l'utilisateur actuel
     */
    getCurrentUser() {
        return auth.currentUser;
    }

    /**
     * Messages d'erreur en français
     */
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
            'auth/invalid-email': 'Adresse email invalide.',
            'auth/operation-not-allowed': 'Opération non autorisée.',
            'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
            'auth/user-disabled': 'Ce compte a été désactivé.',
            'auth/user-not-found': 'Aucun compte associé à cet email.',
            'auth/wrong-password': 'Mot de passe incorrect.',
            'auth/invalid-credential': 'Identifiants invalides.',
            'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
            'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre connexion internet.',
            'auth/requires-recent-login': 'Veuillez vous reconnecter pour effectuer cette action.'
        };

        return errorMessages[errorCode] || `Erreur : ${errorCode}`;
    }

    /**
     * Callback lors de la connexion
     */
    onUserLogin(user) {
        // Rediriger vers le dashboard ou la page précédente
        const redirectUrl = localStorage.getItem('redirect_after_login') || 'navigation.html';
        localStorage.removeItem('redirect_after_login');
        
        // Notification visuelle
        this.showNotification('✅ Connexion réussie !', 'success');
        
        // Event pour les autres scripts
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user } }));
    }

    /**
     * Callback lors de la déconnexion
     */
    onUserLogout() {
        // Nettoyer les données locales si nécessaire
        // Ne pas rediriger automatiquement pour laisser l'utilisateur sur la page actuelle
        
        // Event pour les autres scripts
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
    }

    /**
     * Afficher une notification
     */
    showNotification(message, type = 'info') {
        // Créer une notification simple
        const notification = document.createElement('div');
        notification.className = `firebase-notification firebase-notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 14px;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Styles pour les animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Instance globale
window.authManager = new FirebaseAuthManager();

console.log('🔥 Firebase Auth Manager initialisé');
