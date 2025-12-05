/**
 * Page Load Guard
 * Désactive les interactions jusqu'au chargement complet de la page
 * Évite les comportements anormaux dus aux clics pendant le chargement
 */

(function() {
    'use strict';
    
    // Désactiver toutes les interactions au chargement
    function disableInteractions() {
        // Ajouter un overlay de chargement
        const overlay = document.createElement('div');
        overlay.id = 'page-load-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 1;
            transition: opacity 0.3s ease;
        `;
        
        overlay.innerHTML = `
            <div style="text-align: center;">
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                <p style="color: #667eea; font-weight: 600;">Chargement...</p>
            </div>
        `;
        
        // Ajouter l'animation de rotation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(overlay);
        
        // Désactiver tous les boutons et liens
        document.querySelectorAll('button, a, input[type="submit"]').forEach(el => {
            el.disabled = true;
            el.style.pointerEvents = 'none';
        });
    }
    
    // Réactiver toutes les interactions
    function enableInteractions() {
        // Supprimer l'overlay
        const overlay = document.getElementById('page-load-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
        
        // Réactiver tous les boutons et liens
        document.querySelectorAll('button, a, input[type="submit"]').forEach(el => {
            el.disabled = false;
            el.style.pointerEvents = '';
        });
    }
    
    // Initialisation immédiate
    if (document.readyState === 'loading') {
        disableInteractions();
    }
    
    // Attendre que tout soit chargé (DOM + scripts + images)
    window.addEventListener('load', function() {
        // Délai de sécurité pour s'assurer que tous les scripts sont initialisés
        setTimeout(enableInteractions, 100);
    });
    
    // Fallback si 'load' ne se déclenche pas (après 5 secondes)
    setTimeout(function() {
        const overlay = document.getElementById('page-load-overlay');
        if (overlay) {
            console.warn('Page load timeout - forçage de l\'activation');
            enableInteractions();
        }
    }, 5000);
})();
