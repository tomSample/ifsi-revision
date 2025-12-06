/**
 * Gestionnaire de cache centralisé pour les données de cours
 * Cache les données en sessionStorage lors de la connexion
 * Efface le cache lors de la déconnexion
 */

// Helper pour résoudre les chemins sur GitHub Pages (si pas déjà défini)
if (!window.resolvePath) {
    const isGitHubPages = window.location.hostname.includes('github.io');
    const basePath = isGitHubPages ? '/ifsi-revision' : '';
    window.resolvePath = (path) => path.startsWith('/') ? basePath + path : path;
}
const resolvePath = window.resolvePath;

/**
 * Précharger le cache des cours lors de l'authentification
 * À appeler lors de la connexion utilisateur
 */
async function preloadCoursesCache() {
    try {
        console.log('🔄 Préchargement du cache des cours...');
        const response = await fetch(resolvePath('/src/data/courses.json'));
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Stocker dans le cache de session (persiste jusqu'à la déconnexion)
        sessionStorage.setItem('coursesData_session', JSON.stringify(data));
        console.log('✅ Cache des cours préchargé pour la session');
        console.log(`📊 ${data.courses?.length || 0} cours en cache`);
        
        return data;
    } catch (error) {
        console.error('❌ Erreur préchargement cache:', error);
        return null;
    }
}

/**
 * Effacer le cache des cours et de la progression
 * À appeler lors de la déconnexion
 */
function clearCoursesCache() {
    try {
        sessionStorage.removeItem('coursesData_session');
        sessionStorage.removeItem('userProgress_session');
        console.log('🗑️ Cache des cours et progression effacé');
    } catch (error) {
        console.error('Erreur lors de l\'effacement du cache:', error);
    }
}

/**
 * Récupérer les données depuis le cache ou le serveur
 * @returns {Promise<Object>} Les données des cours
 */
async function getCoursesData() {
    // Vérifier le cache de session d'abord
    const sessionCache = sessionStorage.getItem('coursesData_session');
    
    if (sessionCache) {
        console.log('📦 Chargement depuis le cache de session');
        try {
            return JSON.parse(sessionCache);
        } catch (error) {
            console.error('Erreur parsing cache, rechargement...', error);
            sessionStorage.removeItem('coursesData_session');
        }
    }
    
    // Si pas de cache, charger depuis le serveur
    console.log('🌐 Chargement depuis le serveur...');
    const url = resolvePath('/src/data/courses.json');
    console.log('📍 URL complète:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} - URL: ${url}`);
    }
    
    const data = await response.json();
    
    // Mettre en cache pour la session
    try {
        sessionStorage.setItem('coursesData_session', JSON.stringify(data));
        console.log('✅ Données mises en cache pour la session');
    } catch (e) {
        console.warn('⚠️ Impossible de mettre en cache (quota dépassé?)');
    }
    
    return data;
}

/**
 * Vérifier si le cache existe
 * @returns {boolean}
 */
function hasCachedData() {
    return sessionStorage.getItem('coursesData_session') !== null;
}

// Rendre les fonctions disponibles globalement
window.preloadCoursesCache = preloadCoursesCache;
window.clearCoursesCache = clearCoursesCache;
window.getCoursesData = getCoursesData;
window.hasCachedData = hasCachedData;
