/**
 * SERVICE WORKER - IFSI Lannion Révisions
 * Cache stratégique pour mode hors ligne
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `ifsi-cache-${CACHE_VERSION}`;

// Ressources critiques à mettre en cache immédiatement
const CRITICAL_ASSETS = [
    '/',
    '/admin.html',
    '/home.html',
    '/revision.html',
    '/statistics.html',
    '/account.html',
    '/login.html',
    '/style.css',
    '/style-revision.css',
    '/auth.js',
    '/auth-guard.js',
    '/sync-manager.js',
    '/spaced-repetition.js',
    '/revision.js',
    '/statistics.js',
    '/account.js',
    '/admin.js',
    '/ifsi_courses_2025-09-23.json'
];

// Ressources Firebase (cache avec stratégie network-first)
const FIREBASE_URLS = [
    'https://www.gstatic.com/firebasejs/',
    'https://firestore.googleapis.com/'
];

// Installation: mise en cache des ressources critiques
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installation en cours...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: Mise en cache des ressources critiques');
                return cache.addAll(CRITICAL_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker: Installation terminée');
                return self.skipWaiting(); // Activer immédiatement
            })
            .catch(err => {
                console.error('❌ Service Worker: Erreur installation', err);
            })
    );
});

// Activation: nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker: Activation en cours...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Service Worker: Suppression ancien cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Activation terminée');
                return self.clients.claim(); // Prendre le contrôle immédiatement
            })
    );
});

// Fetch: stratégie de cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorer les requêtes non-GET
    if (request.method !== 'GET') {
        return;
    }
    
    // Ignorer les requêtes Chrome extensions
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Stratégie pour Firebase: Network First (temps réel important)
    if (FIREBASE_URLS.some(firebase => request.url.includes(firebase))) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }
    
    // Stratégie pour les ressources de l'app: Cache First (performance)
    if (url.origin === location.origin) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }
    
    // Stratégie par défaut pour CDN externes: Cache First
    event.respondWith(cacheFirstStrategy(request));
});

/**
 * Cache First: Priorité au cache, fallback réseau
 * Idéal pour: Assets statiques, CSS, JS
 */
async function cacheFirstStrategy(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Si en cache, retourner immédiatement
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Sinon, essayer le réseau
    try {
        const networkResponse = await fetch(request);
        
        // Mettre en cache si succès
        if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        // Hors ligne et pas en cache
        console.error('❌ Ressource non disponible:', request.url);
        
        if (request.destination === 'document') {
            return new Response(`
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <title>Hors ligne</title>
                    <style>
                        body { font-family: Arial; text-align: center; padding: 50px; }
                        h1 { color: #667eea; }
                    </style>
                </head>
                <body>
                    <h1>Mode hors ligne</h1>
                    <p>Cette page n'est pas disponible hors ligne.</p>
                    <button onclick="location.reload()">Réessayer</button>
                </body>
                </html>
            `, {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }
        
        throw error;
    }
}

/**
 * Network First: Priorité au réseau, fallback cache
 * Idéal pour: API Firebase, données temps réel
 */
async function networkFirstStrategy(request) {
    try {
        // Essayer le réseau d'abord
        const networkResponse = await fetch(request);
        
        // Mettre en cache si succès
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.warn('⚠️ Network First: Fallback cache', request.url);
        
        // Fallback: chercher en cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Messages depuis l'app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.delete(CACHE_NAME).then(() => {
                console.log('🗑️ Cache vidé');
            })
        );
    }
});
