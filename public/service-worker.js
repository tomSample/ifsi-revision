/**
 * SERVICE WORKER - IFSI Lannion Révisions PWA
 * Cache stratégique intelligent pour mode hors ligne
 * Version 3.3.1 - Répétition espacée + stats simplifiées + ordre aléatoire
 */

const CACHE_VERSION = 'v3.3.1';
const CACHE_NAME = `ifsi-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `ifsi-runtime-${CACHE_VERSION}`;
const DATA_CACHE = `ifsi-data-${CACHE_VERSION}`;

// Ressources critiques à précacher (shell de l'app)
// Note: Seuls les fichiers essentiels pour éviter les erreurs d'installation
const PRECACHE_ASSETS = [
    '/public/images/icon-192.png',
    '/public/images/icon-512.png',
    '/public/manifest.json'
];

// Données à cacher avec stratégie stale-while-revalidate
const DATA_URLS = [
    '/src/data/courses.json'
];

// URLs Firebase (network-first)
const FIREBASE_PATTERNS = [
    /firebasejs/,
    /firestore\.googleapis\.com/,
    /securetoken\.googleapis\.com/,
    /identitytoolkit\.googleapis\.com/
];

// Installation: Précache des ressources critiques
self.addEventListener('install', (event) => {
    console.log(`🔧 [SW ${CACHE_VERSION}] Installation...`);
    
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);
                console.log('📦 [SW] Précache des assets critiques...');
                
                // Cacher les ressources une par une pour identifier laquelle échoue
                for (const asset of PRECACHE_ASSETS) {
                    try {
                        await cache.add(asset);
                        console.log(`✅ [SW] Cached: ${asset}`);
                    } catch (err) {
                        console.warn(`⚠️ [SW] Failed to cache ${asset}:`, err.message);
                        // Continue avec les autres ressources
                    }
                }
                
                console.log(`✅ [SW] Précache terminé`);
                await self.skipWaiting();
            } catch (error) {
                console.error('❌ [SW] Erreur installation:', error);
                throw error;
            }
        })()
    );
});

// Activation: Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    console.log(`🔄 [SW ${CACHE_VERSION}] Activation...`);
    
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            const validCaches = [CACHE_NAME, RUNTIME_CACHE, DATA_CACHE];
            
            await Promise.all(
                cacheNames.map(cacheName => {
                    if (!validCaches.includes(cacheName)) {
                        console.log('🗑️ [SW] Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
            
            console.log('✅ [SW] Activation terminée');
            await self.clients.claim();
        })()
    );
});

// Fetch: Stratégies de cache intelligentes
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorer non-GET et extensions
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Ignorer les requêtes Firestore Listen (WebSocket/streaming)
    if (request.url.includes('firestore.googleapis.com') && 
        (request.url.includes('/Listen/') || request.url.includes('/channel?'))) {
        return; // Laisser passer sans interception
    }
    
    // 1. Firebase: Network First avec timeout
    if (FIREBASE_PATTERNS.some(pattern => pattern.test(request.url))) {
        event.respondWith(networkFirstWithTimeout(request, 3000));
        return;
    }
    
    // 2. Données JSON: Stale While Revalidate
    if (DATA_URLS.some(dataUrl => request.url.includes(dataUrl))) {
        event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
        return;
    }
    
    // 3. Pages HTML: Network First avec fallback offline
    if (request.destination === 'document') {
        event.respondWith(networkFirstWithFallback(request));
        return;
    }
    
    // 4. Assets statiques (JS, CSS, images): Cache First
    if (url.origin === location.origin) {
        event.respondWith(cacheFirst(request, CACHE_NAME));
        return;
    }
    
    // 5. CDN externes: Cache First avec expiration
    event.respondWith(cacheFirst(request, RUNTIME_CACHE, 86400000)); // 24h
});

/**
 * Cache First: Retourne le cache, met à jour en arrière-plan
 */
async function cacheFirst(request, cacheName, maxAge = null) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        // Vérifier l'âge si maxAge spécifié
        if (maxAge) {
            const dateHeader = cachedResponse.headers.get('date');
            const cacheTime = dateHeader ? new Date(dateHeader).getTime() : 0;
            const age = Date.now() - cacheTime;
            
            if (age > maxAge) {
                // Cache expiré, fetch et mettre à jour
                fetchAndCache(request, cache);
                return cachedResponse; // Retourner quand même le cache pendant MAJ
            }
        }
        
        return cachedResponse;
    }
    
    // Pas en cache: fetch et mettre en cache
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        throw error;
    }
}

/**
 * Network First avec timeout: Essaie réseau avec délai maximum
 */
async function networkFirstWithTimeout(request, timeout = 3000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(request, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response && response.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.warn('⚠️ [SW] Network timeout, fallback cache');
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        throw error;
    }
}

/**
 * Stale While Revalidate: Retourne cache ET met à jour en parallèle
 */
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then(response => {
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => cachedResponse);
    
    return cachedResponse || fetchPromise;
}

/**
 * Network First avec page offline: Pour les pages HTML
 */
async function networkFirstWithFallback(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        
        // Page offline de secours
        return new Response(getOfflinePage(), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }
}

/**
 * Fetch et cache en arrière-plan (sans bloquer)
 */
async function fetchAndCache(request, cache) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
    } catch (error) {
        // Silencieux
    }
}

/**
 * Page offline HTML
 */
function getOfflinePage() {
    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mode hors ligne - IFSI Révisions</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    text-align: center;
                    padding: 20px;
                }
                .offline-content {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    padding: 40px;
                    border-radius: 20px;
                    max-width: 500px;
                }
                h1 { font-size: 3rem; margin-bottom: 20px; }
                p { font-size: 1.1rem; line-height: 1.6; margin-bottom: 30px; }
                button {
                    background: white;
                    color: #667eea;
                    border: none;
                    padding: 15px 40px;
                    border-radius: 10px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                button:hover { transform: scale(1.05); }
                .icon { font-size: 5rem; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="offline-content">
                <div class="icon">📡</div>
                <h1>Mode hors ligne</h1>
                <p>Vous êtes actuellement hors ligne. Cette page n'est pas disponible dans le cache.</p>
                <p>Vérifiez votre connexion internet et réessayez.</p>
                <button onclick="location.reload()">🔄 Réessayer</button>
                <button onclick="location.href='/src/frontend/pages/home.html'" style="margin-left: 10px;">🏠 Accueil</button>
            </div>
        </body>
        </html>
    `;
}

// Messages de l'application
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data?.type === 'CLEAR_CACHE') {
        event.waitUntil(
            Promise.all([
                caches.delete(CACHE_NAME),
                caches.delete(RUNTIME_CACHE),
                caches.delete(DATA_CACHE)
            ]).then(() => console.log('🗑️ [SW] Tous les caches vidés'))
        );
    }
    
    if (event.data?.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(RUNTIME_CACHE).then(cache => {
                return cache.addAll(event.data.urls);
            })
        );
    }
});

// Sync en arrière-plan (pour synchro offline)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-progression') {
        event.waitUntil(syncProgression());
    }
});

async function syncProgression() {
    console.log('🔄 [SW] Synchronisation progression...');
    // La logique de sync est gérée par sync-manager.js
}

console.log(`✅ [SW ${CACHE_VERSION}] Service Worker chargé`);

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
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0]?.postMessage({
            type: 'VERSION_INFO',
            version: CACHE_VERSION
        });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.delete(CACHE_NAME).then(() => {
                console.log('🗑️ Cache vidé');
            })
        );
    }
});
