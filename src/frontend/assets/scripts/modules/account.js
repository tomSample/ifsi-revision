/**
 * Gestion du compte utilisateur
 * Permet de modifier l'email, le mot de passe et supprimer le compte
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { 
    getAuth, 
    updateEmail,
    updatePassword,
    deleteUser,
    reauthenticateWithCredential,
    EmailAuthProvider,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { 
    getFirestore,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    collection,
    getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Initialisation
const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Vérifier que l'utilisateur est connecté
auth.onAuthStateChanged((user) => {
    if (!user) {
        // Pas connecté, rediriger vers login
        window.location.href = 'login.html';
    } else {
        // Charger les informations du compte
        loadAccountInfo(user);
    }
});

/**
 * Charger les informations du compte
 */
async function loadAccountInfo(user) {
    try {
        // Email
        document.getElementById('userEmail').textContent = user.email;

        // Date de création
        if (user.metadata.creationTime) {
            const createdAt = new Date(user.metadata.creationTime);
            document.getElementById('userCreatedAt').textContent = formatDate(createdAt);
        }

        // Dernière connexion
        if (user.metadata.lastSignInTime) {
            const lastLogin = new Date(user.metadata.lastSignInTime);
            document.getElementById('lastLogin').textContent = formatDate(lastLogin);
        }

    } catch (error) {
        console.error('Erreur chargement info:', error);
    }
}

/**
 * Formater une date
 */
function formatDate(date) {
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Changer l'email
 */
document.getElementById('changeEmailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newEmail = document.getElementById('newEmail').value;
    const password = document.getElementById('emailPassword').value;
    const btn = document.getElementById('changeEmailBtn');
    const errorMessage = document.getElementById('emailMessage');
    const successMessage = document.getElementById('emailSuccess');

    // Réinitialiser les messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Désactiver le bouton
    btn.disabled = true;
    btn.innerHTML = 'Modification en cours<span class="loading-spinner"></span>';

    try {
        const user = auth.currentUser;

        // Ré-authentifier
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);

        // Mettre à jour l'email dans Firebase Auth
        await updateEmail(user, newEmail);

        // Mettre à jour dans Firestore
        await setDoc(doc(db, 'users', user.uid), {
            email: newEmail
        }, { merge: true });

        // Succès
        successMessage.textContent = '✅ Email modifié avec succès !';
        successMessage.style.display = 'block';
        
        // Réinitialiser le formulaire
        document.getElementById('changeEmailForm').reset();
        
        // Mettre à jour l'affichage
        document.getElementById('userEmail').textContent = newEmail;

    } catch (error) {
        console.error('Erreur changement email:', error);
        errorMessage.textContent = getErrorMessage(error.code);
        errorMessage.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Modifier l\'email';
    }
});

/**
 * Changer le mot de passe
 */
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    const btn = document.getElementById('changePasswordBtn');
    const errorMessage = document.getElementById('passwordMessage');
    const successMessage = document.getElementById('passwordSuccess');

    // Réinitialiser les messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Vérifier que les mots de passe correspondent
    if (newPassword !== confirmNewPassword) {
        errorMessage.textContent = 'Les mots de passe ne correspondent pas.';
        errorMessage.style.display = 'block';
        return;
    }

    // Désactiver le bouton
    btn.disabled = true;
    btn.innerHTML = 'Modification en cours<span class="loading-spinner"></span>';

    try {
        const user = auth.currentUser;

        // Ré-authentifier
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Changer le mot de passe
        await updatePassword(user, newPassword);

        // Succès
        successMessage.textContent = '✅ Mot de passe modifié avec succès !';
        successMessage.style.display = 'block';
        
        // Réinitialiser le formulaire
        document.getElementById('changePasswordForm').reset();

    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        errorMessage.textContent = getErrorMessage(error.code);
        errorMessage.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Modifier le mot de passe';
    }
});

/**
 * Ouvrir la modal de suppression
 */
document.getElementById('deleteAccountBtn').addEventListener('click', () => {
    document.getElementById('deleteModal').classList.add('active');
    document.getElementById('deletePassword').focus();
});

/**
 * Fermer la modal de suppression
 */
document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
    document.getElementById('deleteModal').classList.remove('active');
    document.getElementById('deleteAccountForm').reset();
    document.getElementById('deleteMessage').style.display = 'none';
});

/**
 * Supprimer le compte
 */
document.getElementById('deleteAccountForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('deletePassword').value;
    const btn = document.getElementById('confirmDeleteBtn');
    const errorMessage = document.getElementById('deleteMessage');

    // Confirmation supplémentaire
    if (!confirm('⚠️ ATTENTION : Cette action est DÉFINITIVE et IRRÉVERSIBLE.\n\nToute votre progression sera PERDUE.\n\nÊtes-vous ABSOLUMENT SÛR de vouloir supprimer votre compte ?')) {
        return;
    }

    // Réinitialiser les messages
    errorMessage.style.display = 'none';

    // Désactiver le bouton
    btn.disabled = true;
    btn.innerHTML = 'Suppression en cours<span class="loading-spinner"></span>';

    try {
        const user = auth.currentUser;
        const userId = user.uid;

        // Ré-authentifier
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);

        // Supprimer toutes les données Firestore
        await deleteUserData(userId);

        // Supprimer le compte Firebase Auth
        await deleteUser(user);

        // Rediriger vers la page d'accueil
        alert('✅ Votre compte a été supprimé avec succès.');
        window.location.href = 'navigation.html';

    } catch (error) {
        console.error('Erreur suppression compte:', error);
        errorMessage.textContent = getErrorMessage(error.code);
        errorMessage.style.display = 'block';
        
        btn.disabled = false;
        btn.textContent = 'Supprimer définitivement';
    }
});

/**
 * Supprimer toutes les données utilisateur
 */
async function deleteUserData(userId) {
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
 * Déconnexion
 */
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'navigation.html';
    } catch (error) {
        console.error('Erreur déconnexion:', error);
        alert('Erreur lors de la déconnexion');
    }
});

/**
 * Messages d'erreur en français
 */
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
        'auth/invalid-email': 'Adresse email invalide.',
        'auth/requires-recent-login': 'Veuillez vous reconnecter pour effectuer cette action.',
        'auth/wrong-password': 'Mot de passe incorrect.',
        'auth/invalid-credential': 'Mot de passe incorrect.',
        'auth/weak-password': 'Le nouveau mot de passe doit contenir au moins 6 caractères.',
        'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.',
        'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre connexion internet.'
    };

    return errorMessages[errorCode] || `Erreur : ${errorCode}`;
}

// Fermer la modal en cliquant à l'extérieur
document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('deleteModal')) {
        document.getElementById('cancelDeleteBtn').click();
    }
});
