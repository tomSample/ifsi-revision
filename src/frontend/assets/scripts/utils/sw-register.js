/**
 * SERVICE WORKER REGISTRATION
 * Enregistrement et mise à jour du Service Worker
 */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // Résoudre le chemin pour GitHub Pages
            const swPath = window.resolvePath ? window.resolvePath('/service-worker.js') : '/service-worker.js';
            const swScope = window.resolvePath ? window.resolvePath('/') : '/';
            
            const registration = await navigator.serviceWorker.register(swPath, {
                scope: swScope
            });
            
            console.log('✅ [SW] Service Worker enregistré:', registration.scope);
            
            // Vérifier les mises à jour toutes les heures
            setInterval(() => {
                registration.update();
            }, 3600000);
            
            // Écouter les mises à jour
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Nouvelle version disponible
                        showUpdateNotification(registration);
                    }
                });
            });
            
        } catch (error) {
            console.error('❌ [SW] Erreur enregistrement:', error);
        }
    });
}

/**
 * Affiche une notification de mise à jour
 */
function showUpdateNotification(registration) {
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #667eea;
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 15px;
            max-width: 90%;
            animation: slideDown 0.4s ease;
        ">
            <div style="font-size: 24px;">🔄</div>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 5px;">Mise à jour disponible</div>
                <div style="font-size: 14px; opacity: 0.9;">Une nouvelle version de l'application est prête</div>
            </div>
            <button id="update-app-btn" style="
                background: white;
                color: #667eea;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
            ">Mettre à jour</button>
            <button id="dismiss-update-btn" style="
                background: transparent;
                color: white;
                border: none;
                padding: 10px;
                cursor: pointer;
                font-size: 18px;
            ">✕</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Mettre à jour
    document.getElementById('update-app-btn').addEventListener('click', () => {
        if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    });
    
    // Ignorer
    document.getElementById('dismiss-update-btn').addEventListener('click', () => {
        notification.remove();
    });
}

// Animation
const slideDownAnim = document.createElement('style');
slideDownAnim.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
`;
document.head.appendChild(slideDownAnim);

console.log('✅ [SW] Registration script chargé');
