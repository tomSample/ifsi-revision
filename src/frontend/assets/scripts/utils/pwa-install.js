/**
 * PWA INSTALLATION MANAGER
 * Gère l'installation de l'application en tant que PWA
 * Détection multi-plateforme (iOS, Android, Desktop)
 */

class PWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.platform = this.detectPlatform();
        this.installCount = parseInt(localStorage.getItem('pwa_install_prompt_count') || '0');
        this.lastPromptDate = localStorage.getItem('pwa_last_prompt_date');
        this.isStandalone = this.isRunningStandalone();
        
        this.init();
    }

    /**
     * Détecte la plateforme de l'utilisateur
     */
    detectPlatform() {
        const ua = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(ua);
        const isAndroid = /android/.test(ua);
        const isMac = /macintosh|mac os x/.test(ua);
        const isWindows = /windows/.test(ua);
        
        if (isIOS) return 'ios';
        if (isAndroid) return 'android';
        if (isMac) return 'mac';
        if (isWindows) return 'windows';
        return 'other';
    }

    /**
     * Vérifie si l'app est déjà installée (mode standalone)
     */
    isRunningStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true ||
               document.referrer.includes('android-app://');
    }

    /**
     * Initialisation
     */
    init() {
        // Ne rien faire si déjà installé
        if (this.isStandalone) {
            console.log('✅ [PWA] Application déjà installée');
            return;
        }

        // Écouter l'événement beforeinstallprompt (Android/Desktop)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            console.log('📲 [PWA] Prompt d\'installation disponible');
            
            // Afficher la bannière après un délai intelligent
            this.schedulePrompt();
        });

        // Écouter l'installation réussie
        window.addEventListener('appinstalled', () => {
            console.log('✅ [PWA] Application installée avec succès');
            this.deferredPrompt = null;
            this.hideInstallBanner();
            this.showSuccessMessage();
        });

        // Pour iOS: détecter et proposer installation manuelle
        if (this.platform === 'ios' && !this.isStandalone) {
            this.schedulePrompt();
        }
    }

    /**
     * Planifie l'affichage de la bannière
     */
    schedulePrompt() {
        // Ne pas afficher si déjà montré récemment
        if (this.lastPromptDate) {
            const daysSinceLastPrompt = Math.floor(
                (Date.now() - new Date(this.lastPromptDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (daysSinceLastPrompt < 7) {
                console.log(`⏰ [PWA] Bannière déjà montrée il y a ${daysSinceLastPrompt} jours`);
                return;
            }
        }

        // Ne pas afficher au premier chargement
        const pageViews = parseInt(sessionStorage.getItem('page_views') || '0');
        sessionStorage.setItem('page_views', (pageViews + 1).toString());
        
        if (pageViews === 0) {
            console.log('🚫 [PWA] Première visite, pas de bannière');
            return;
        }

        // Afficher après 3 secondes d'interaction
        setTimeout(() => {
            this.showInstallBanner();
        }, 3000);
    }

    /**
     * Affiche la bannière d'installation
     */
    showInstallBanner() {
        // Vérifier qu'elle n'existe pas déjà
        if (document.getElementById('pwa-install-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.className = 'pwa-install-banner';
        
        const icon = this.platform === 'ios' ? '📱' : '📲';
        const title = this.platform === 'ios' 
            ? 'Installer IFSI Révisions' 
            : 'Installer l\'application';
        
        const description = this.platform === 'ios'
            ? 'Ajoutez cette app à votre écran d\'accueil pour un accès rapide'
            : 'Installez l\'application pour un accès hors ligne et des performances optimales';

        banner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-icon">${icon}</div>
                <div class="pwa-banner-text">
                    <div class="pwa-banner-title">${title}</div>
                    <div class="pwa-banner-description">${description}</div>
                </div>
                <div class="pwa-banner-actions">
                    <button class="pwa-btn-install" id="pwa-install-btn">Installer</button>
                    <button class="pwa-btn-close" id="pwa-close-btn">✕</button>
                </div>
            </div>
        `;

        // Styles inline pour éviter dépendance CSS
        const style = document.createElement('style');
        style.textContent = `
            .pwa-install-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
                z-index: 10000;
                animation: slideUp 0.4s ease;
            }
            
            @keyframes slideUp {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .pwa-banner-content {
                display: flex;
                align-items: center;
                gap: 15px;
                max-width: 900px;
                margin: 0 auto;
            }
            
            .pwa-banner-icon {
                font-size: 40px;
                flex-shrink: 0;
            }
            
            .pwa-banner-text {
                flex: 1;
            }
            
            .pwa-banner-title {
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 5px;
            }
            
            .pwa-banner-description {
                font-size: 14px;
                opacity: 0.9;
            }
            
            .pwa-banner-actions {
                display: flex;
                gap: 10px;
                flex-shrink: 0;
            }
            
            .pwa-btn-install {
                background: white;
                color: #667eea;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 15px;
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .pwa-btn-install:hover {
                transform: scale(1.05);
            }
            
            .pwa-btn-close {
                background: rgba(255,255,255,0.2);
                color: white;
                border: none;
                padding: 12px;
                border-radius: 8px;
                font-size: 18px;
                cursor: pointer;
                line-height: 1;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .pwa-btn-close:hover {
                background: rgba(255,255,255,0.3);
            }
            
            @media (max-width: 600px) {
                .pwa-banner-content {
                    flex-direction: column;
                    text-align: center;
                }
                
                .pwa-banner-actions {
                    width: 100%;
                    flex-direction: column;
                }
                
                .pwa-btn-install, .pwa-btn-close {
                    width: 100%;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(banner);

        // Events
        document.getElementById('pwa-install-btn').addEventListener('click', () => {
            this.handleInstall();
        });

        document.getElementById('pwa-close-btn').addEventListener('click', () => {
            this.hideInstallBanner();
            this.trackPromptDismissal();
        });

        // Tracking
        this.installCount++;
        localStorage.setItem('pwa_install_prompt_count', this.installCount.toString());
        localStorage.setItem('pwa_last_prompt_date', new Date().toISOString());
    }

    /**
     * Gère l'installation selon la plateforme
     */
    async handleInstall() {
        if (this.platform === 'ios') {
            this.showIOSInstructions();
        } else if (this.deferredPrompt) {
            // Android/Desktop
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('✅ [PWA] Installation acceptée');
            } else {
                console.log('❌ [PWA] Installation refusée');
            }
            
            this.deferredPrompt = null;
        }
        
        this.hideInstallBanner();
    }

    /**
     * Instructions pour iOS
     */
    showIOSInstructions() {
        const modal = document.createElement('div');
        modal.id = 'pwa-ios-modal';
        modal.innerHTML = `
            <div style="
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
                padding: 20px;
            ">
                <div style="
                    background: white;
                    border-radius: 20px;
                    padding: 30px;
                    max-width: 400px;
                    text-align: center;
                ">
                    <h2 style="color: #667eea; margin-bottom: 20px;">📱 Installation sur iOS</h2>
                    <p style="margin-bottom: 20px; line-height: 1.6;">
                        Pour installer l'application :
                    </p>
                    <ol style="text-align: left; line-height: 2; margin-bottom: 20px;">
                        <li>Touchez le bouton Partager <span style="font-size: 24px;">⬆️</span> en bas de Safari</li>
                        <li>Faites défiler et touchez "Sur l'écran d'accueil"</li>
                        <li>Touchez "Ajouter"</li>
                    </ol>
                    <button onclick="document.getElementById('pwa-ios-modal').remove()" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 10px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 16px;
                    ">Compris !</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Masque la bannière
     */
    hideInstallBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.style.animation = 'slideDown 0.4s ease';
            setTimeout(() => banner.remove(), 400);
        }
    }

    /**
     * Message de succès
     */
    showSuccessMessage() {
        const message = document.createElement('div');
        message.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 10001;
                animation: slideIn 0.3s ease;
            ">
                ✅ Application installée avec succès !
            </div>
        `;
        
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
    }

    /**
     * Tracking du refus
     */
    trackPromptDismissal() {
        localStorage.setItem('pwa_prompt_dismissed', new Date().toISOString());
    }
}

// Animation CSS supplémentaire
const slideDownAnimation = document.createElement('style');
slideDownAnimation.textContent = `
    @keyframes slideDown {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(100%); opacity: 0; }
    }
`;
document.head.appendChild(slideDownAnimation);

// Initialisation automatique
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pwaInstallManager = new PWAInstallManager();
    });
} else {
    window.pwaInstallManager = new PWAInstallManager();
}

console.log('✅ [PWA] Install Manager chargé');
