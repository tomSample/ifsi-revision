# 🔄 Guide de mise à jour des PWA

## Pourquoi les PWA installées ne se mettent pas à jour automatiquement ?

### Le problème

Les Progressive Web Apps (PWA) utilisent un **Service Worker** pour fonctionner hors ligne. Ce mécanisme crée un problème de mise à jour :

1. **Cache persistant** : Le Service Worker (SW) met en cache tous les fichiers de l'application
2. **Stratégie "Cache First"** : Le SW sert d'abord les fichiers en cache avant de vérifier le réseau
3. **Pas de rechargement automatique** : Le nouveau SW attend que toutes les instances de l'app soient fermées
4. **Users mobiles** : Sur mobile, les apps restent souvent en arrière-plan sans jamais vraiment se fermer

### Solution actuelle dans le projet

#### 1. Versioning du Service Worker

Dans `public/service-worker.js`, changez la version à chaque mise à jour :

```javascript
const CACHE_VERSION = 'v3.4.0';  // ← Incrémentez à chaque déploiement
const CACHE_NAME = `ifsi-cache-${CACHE_VERSION}`;
```

#### 2. Stratégie de mise à jour

Le SW actuel utilise une stratégie **"Network First"** pour les fichiers HTML/JS/CSS :

```javascript
// Dans service-worker.js
self.addEventListener('fetch', (event) => {
    // HTML/JS/CSS : Network First (mise à jour prioritaire)
    if (url.pathname.match(/\.(html|js|css)$/)) {
        event.respondWith(networkFirst(event.request));
    }
});
```

#### 3. Force Update au lancement

Dans `src/frontend/assets/scripts/utils/sw-register.js` :

```javascript
// Vérifier les mises à jour toutes les heures
setInterval(() => {
    registration.update();
}, 60 * 60 * 1000);
```

## 🛠️ Solutions recommandées

### Option 1 : Force Update avec notification (RECOMMANDÉ)

Ajoutez dans `sw-register.js` :

```javascript
registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    
    newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nouvelle version disponible !
            if (confirm('🎉 Nouvelle version disponible ! Recharger maintenant ?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
            }
        }
    });
});
```

Dans `service-worker.js` :

```javascript
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
```

### Option 2 : Bannière de mise à jour persistante

```javascript
function showUpdateBanner() {
    const banner = document.createElement('div');
    banner.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; 
                    background: #667eea; color: white; padding: 15px; 
                    text-align: center; z-index: 9999;">
            🎉 Nouvelle version disponible ! 
            <button onclick="window.location.reload()" 
                    style="margin-left: 10px; padding: 8px 16px; 
                           background: white; color: #667eea; border: none; 
                           border-radius: 4px; cursor: pointer;">
                Mettre à jour
            </button>
        </div>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
}
```

### Option 3 : Mise à jour automatique silencieuse

```javascript
// Dans sw-register.js
registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    
    newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Attendre 5 secondes puis recharger automatiquement
            setTimeout(() => {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
            }, 5000);
        }
    });
});
```

## 📋 Checklist de déploiement

Avant chaque déploiement :

- [ ] Incrémenter `CACHE_VERSION` dans `service-worker.js`
- [ ] Incrémenter la version dans `manifest.json`
- [ ] Incrémenter les paramètres `?v=X.X.X` des scripts critiques
- [ ] Tester en local avec cache désactivé
- [ ] Tester l'installation complète de la PWA
- [ ] Vérifier que la mise à jour fonctionne

## 🔧 Débogage

### Forcer la mise à jour en développement

1. **Chrome DevTools** :
   - F12 → Application → Service Workers
   - Cocher "Update on reload"
   - Cliquer "Unregister" puis recharger

2. **Firefox DevTools** :
   - F12 → Application → Service Workers
   - Cliquer "Unregister"

3. **Vider le cache manuellement** :
```javascript
// Dans la console du navigateur
caches.keys().then(keys => {
    keys.forEach(key => caches.delete(key));
}).then(() => location.reload());
```

### Vérifier la version active

```javascript
// Dans la console
navigator.serviceWorker.getRegistration().then(reg => {
    console.log('Version active:', reg.active);
});
```

## 💡 Bonnes pratiques

1. **Versioning sémantique** : Utilisez `v3.4.0`, `v3.4.1`, etc.
2. **Changelog** : Maintenez un `CHANGELOG.md` pour tracer les versions
3. **Notification utilisateur** : Informez toujours avant de recharger
4. **Délai de grâce** : Donnez 10-30 secondes avant un rechargement auto
5. **Stratégie adaptative** :
   - Network First pour HTML/JS/CSS (mises à jour rapides)
   - Cache First pour images/fonts (performances)
   - Stale While Revalidate pour données JSON

## 🚀 Mise à jour recommandée pour ce projet

Actuellement, le projet n'a pas de système de notification de mise à jour. Je recommande d'implémenter **Option 1** (Force Update avec notification) pour :

- ✅ Contrôle utilisateur
- ✅ Mise à jour rapide
- ✅ Pas de surprise (rechargement inattendu)
- ✅ Compatible tous navigateurs

### Implementation rapide

1. Ajouter dans `sw-register.js` le code de l'Option 1
2. Ajouter dans `service-worker.js` le listener de message
3. Tester avec deux versions différentes
4. Documenter dans le README

## 📚 Ressources

- [Service Worker Lifecycle](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle)
- [PWA Update Best Practices](https://web.dev/service-worker-lifecycle/)
- [Workbox Update Strategies](https://developers.google.com/web/tools/workbox/guides/advanced-recipes)
