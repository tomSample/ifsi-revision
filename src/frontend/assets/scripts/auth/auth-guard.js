/**
 * AUTH GUARD - Protection des pages
 * 
 * Redirige automatiquement vers la page de login si l'utilisateur n'est pas connecté
 * À inclure sur toutes les pages nécessitant une authentification
 */

class AuthGuard {
    constructor() {
        this.auth = null;
        this.checkInProgress = false;
        this.publicPages = ['login.html', 'register.html', 'reset-password.html', 'logout.html'];
    }

    /**
     * Initialiser le guard avec Firebase Auth
     */
    async initialize() {
        if (this.checkInProgress) return;
        this.checkInProgress = true;

        try {
            // Import dynamique de Firebase
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
            const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
            
            // Initialiser Firebase
            const app = initializeApp(window.firebaseConfig);
            this.auth = getAuth(app);
            
            // Vérifier l'authentification
            return new Promise((resolve) => {
                onAuthStateChanged(this.auth, (user) => {
                    if (!user) {
                        this.redirectToLogin();
                    } else {
                        console.log('✅ Utilisateur authentifié');
                        resolve(user);
                    }
                });
            });
            
        } catch (error) {
            console.error('❌ Erreur Auth Guard:', error);
            this.redirectToLogin();
        }
    }

    /**
     * Rediriger vers la page de login (landing page)
     */
    redirectToLogin() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // Ne pas rediriger si déjà sur une page publique
        if (this.publicPages.includes(currentPage) || currentPage === 'index.html') {
            return;
        }

        console.log('🔒 Accès refusé - Utilisateur non connecté, redirection vers index.html');
        
        // Sauvegarder l'URL de destination pour redirection après login
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        
        // Rediriger vers la landing page (index.html)
        window.location.href = './index.html';
    }

    /**
     * Rediriger vers la page sauvegardée après login
     */
    static redirectAfterLogin() {
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        sessionStorage.removeItem('redirectAfterLogin');
        
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            window.location.href = './home.html';
        }
    }

    /**
     * Afficher un message de mode invité
     */
    showGuestModeWarning() {
        const warningBanner = document.createElement('div');
        warningBanner.id = 'guestModeWarning';
        warningBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 12px 20px;
            text-align: center;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideDown 0.3s ease;
        `;
        warningBanner.innerHTML = `
            ⚠️ Mode invité - Vos révisions ne seront pas sauvegardées
            <a href="./register.html" style="color: white; text-decoration: underline; margin-left: 10px; font-weight: bold;">
                Créer un compte gratuit
            </a>
        `;
        document.body.prepend(warningBanner);
        
        // Ajuster le padding du body
        document.body.style.paddingTop = '50px';
    }
}

// Auto-initialisation
if (typeof window !== 'undefined') {
    window.AuthGuard = AuthGuard;
    
    // Initialiser automatiquement au chargement
    if (window.firebaseConfig) {
        const guard = new AuthGuard();
        guard.initialize();
    } else {
        // Attendre que firebase-config.js soit chargé
        window.addEventListener('DOMContentLoaded', () => {
            const guard = new AuthGuard();
            guard.initialize();
        });
    }
}
