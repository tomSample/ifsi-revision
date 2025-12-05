/**
 * Bottom Navigation Bar Component
 * Barre de navigation inférieure pour naviguer entre les pages principales
 */

(function() {
    // Configuration des pages avec navigation
    const navItems = [
        {
            id: 'revision',
            icon: '📚',
            label: 'Révisions',
            url: '/src/frontend/pages/revision.html',
            page: 'revision.html'
        },
        {
            id: 'browse',
            icon: '📖',
            label: 'Cours',
            url: '/src/frontend/pages/browse-courses.html',
            page: 'browse-courses.html'
        },
        {
            id: 'statistics',
            icon: '📊',
            label: 'Stats',
            url: '/src/frontend/pages/statistics.html',
            page: 'statistics.html'
        },
        {
            id: 'gallery',
            icon: '🖼️',
            label: 'Galerie',
            url: '/src/frontend/pages/gallery.html',
            page: 'gallery.html'
        }
    ];

    // Styles CSS pour la bottom nav
    const styles = `
        <style>
            .bottom-nav {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: white;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                display: flex;
                justify-content: space-around;
                padding: 10px 0;
                border-top: 1px solid #e0e0e0;
            }

            .bottom-nav-item {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-decoration: none;
                color: #6c757d;
                transition: all 0.3s ease;
                padding: 8px;
                cursor: pointer;
                border-radius: 8px;
            }

            .bottom-nav-item:hover {
                background: #f8f9fa;
                color: #667eea;
            }

            .bottom-nav-item.active {
                color: #667eea;
                background: #f0f4ff;
            }

            .bottom-nav-icon {
                font-size: 24px;
                margin-bottom: 4px;
            }

            .bottom-nav-label {
                font-size: 12px;
                font-weight: 500;
            }

            /* Ajouter un padding au body pour ne pas cacher le contenu */
            body {
                padding-bottom: 70px;
            }

            /* Responsive: masquer sur grand écran */
            @media (min-width: 768px) {
                .bottom-nav {
                    display: none;
                }
                body {
                    padding-bottom: 0;
                }
            }
        </style>
    `;

    // Créer la barre de navigation
    function createBottomNav() {
        // Vérifier si on est sur une page qui doit avoir la nav
        const currentPath = window.location.pathname;
        const shouldShowNav = navItems.some(item => currentPath.includes(item.page));
        
        if (!shouldShowNav) return;

        // Injecter les styles
        document.head.insertAdjacentHTML('beforeend', styles);

        // Créer la barre
        const nav = document.createElement('nav');
        nav.className = 'bottom-nav';

        navItems.forEach(item => {
            const isActive = currentPath.includes(item.page);
            
            const navItem = document.createElement('a');
            navItem.href = item.url;
            navItem.className = `bottom-nav-item ${isActive ? 'active' : ''}`;
            navItem.innerHTML = `
                <span class="bottom-nav-icon">${item.icon}</span>
                <span class="bottom-nav-label">${item.label}</span>
            `;

            nav.appendChild(navItem);
        });

        // Ajouter au body
        document.body.appendChild(nav);
    }

    // Initialiser quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createBottomNav);
    } else {
        createBottomNav();
    }
})();
