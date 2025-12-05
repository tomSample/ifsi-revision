/**
 * GESTIONNAIRE DE SYNCHRONISATION FIRESTORE - OPTIMISÉ
 * 
 * Gère la synchronisation de la progression utilisateur avec Firestore
 * Stocke pour chaque terme : difficulté, dates de révision, intervalle SM-2
 * 
 * Optimisations v2:
 * - Cache multi-niveaux (RAM + localStorage)
 * - Batch loading pour réduire les reads
 * - Monitoring des performances
 * 
 * v3.1.0:
 * - Rate limiting sur les appels Firestore (10 req/min par utilisateur)
 */

class SyncManager {
    constructor(auth, db) {
        this.auth = auth;
        this.db = db;
        this.userProgressCache = {}; // Cache local pour performances
        this.isOnline = navigator.onLine;
        this.pendingSync = []; // File d'attente pour sync hors ligne
        
        // 🚀 Initialiser le cache intelligent
        this.smartCache = new SmartCache({
            maxMemorySize: 200,
            ttl: 7 * 24 * 60 * 60 * 1000, // 7 jours
            storagePrefix: 'ifsi_progress_'
        });
        
        // 📊 Initialiser le monitoring
        this.perfMonitor = new PerformanceMonitor();
        
        // 📦 Initialiser le batch loader
        this.batchLoader = new BatchLoader(db, this.perfMonitor);
        
        // 🛡️ Rate limiter pour les appels Firestore (10 req/min)
        this.firestoreLimiter = window.securityManager ? 
            window.securityManager.createRateLimiter(10, 60000) : null;
        
        // Écouter les changements de connexion
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncPendingChanges();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    /**
     * Récupérer la progression d'un terme - OPTIMISÉ avec cache
     * @param {string} termKey - Clé unique du terme (UE + terme)
     * @returns {Object|null} Données de progression ou null
     */
    async getTermProgress(termKey) {
        // 1. Vérifier le cache intelligent d'abord
        const cached = this.smartCache.get(termKey);
        if (cached) {
            this.perfMonitor.logCacheHit(termKey);
            return cached;
        }

        const user = this.auth.currentUser;
        if (!user) {
            console.warn('Utilisateur non connecté');
            return null;
        }

        const startTime = Date.now();

        try {
            const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            const progressRef = doc(this.db, 'users', user.uid, 'progress', termKey);
            const progressSnap = await getDoc(progressRef);

            const duration = Date.now() - startTime;
            this.perfMonitor.logFirestoreRead('progress', 1, duration);

            if (progressSnap.exists()) {
                const data = progressSnap.data();
                // Convertir les Timestamps en Date
                if (data.lastReviewed?.toDate) {
                    data.lastReviewed = data.lastReviewed.toDate();
                }
                if (data.nextReview?.toDate) {
                    data.nextReview = data.nextReview.toDate();
                }
                
                // Mettre en cache
                this.smartCache.set(termKey, data);
                return data;
            }

            return null;
        } catch (error) {
            console.error('Erreur récupération progression:', error);
            return null;
        }
    }

    /**
     * Sauvegarder la progression d'un terme
     * @param {string} termKey - Clé unique du terme
     * @param {Object} progressData - Données de progression
     * @returns {boolean|Object} True si succès, objet avec rateLimited si limité
     */
    async saveTermProgress(termKey, progressData) {
        const user = this.auth.currentUser;
        if (!user) {
            console.warn('Utilisateur non connecté - sauvegarde impossible');
            return false;
        }

        // Mettre à jour le cache local
        this.userProgressCache[termKey] = progressData;

        // Si hors ligne, ajouter à la file d'attente
        if (!this.isOnline) {
            this.pendingSync.push({ termKey, progressData });
            this.savePendingToLocalStorage();
            return true;
        }

        // 🛡️ Vérifier le rate limiting
        if (this.firestoreLimiter) {
            const check = this.firestoreLimiter(user.uid);
            if (!check.allowed) {
                console.warn(`⚠️ Rate limiting: Trop de requêtes. Réessayez dans ${Math.ceil(check.retryAfter/1000)}s`);
                // Ajouter à la file d'attente pour retry plus tard
                this.pendingSync.push({ termKey, progressData });
                this.savePendingToLocalStorage();
                return { rateLimited: true, retryAfter: check.retryAfter };
            }
        }

        try {
            const { setDoc, doc, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            
            // Convertir les dates en Timestamps Firestore
            const dataToSave = { ...progressData };
            if (dataToSave.lastReviewed instanceof Date) {
                dataToSave.lastReviewed = Timestamp.fromDate(dataToSave.lastReviewed);
            }
            if (dataToSave.nextReview instanceof Date) {
                dataToSave.nextReview = Timestamp.fromDate(dataToSave.nextReview);
            }

            const progressRef = doc(this.db, 'users', user.uid, 'progress', termKey);
            await setDoc(progressRef, dataToSave, { merge: true });

            return true;
        } catch (error) {
            console.error('Erreur sauvegarde progression:', error);
            // En cas d'erreur, ajouter à la file d'attente
            this.pendingSync.push({ termKey, progressData });
            this.savePendingToLocalStorage();
            return false;
        }
    }

    /**
     * Récupérer toute la progression utilisateur - OPTIMISÉ avec batch et cache
     * @param {boolean} forceRefresh - Forcer le rechargement depuis Firestore
     * @returns {Object} Dictionnaire termKey -> progressData ou {rateLimited: true}
     */
    async getAllProgress(forceRefresh = false) {
        const user = this.auth.currentUser;
        if (!user) {
            console.warn('Utilisateur non connecté');
            return {};
        }

        // Vérifier le cache si pas de refresh forcé
        if (!forceRefresh && Object.keys(this.userProgressCache).length > 0) {
            console.log('✅ Utilisation du cache pour getAllProgress');
            return this.userProgressCache;
        }

        // 🛡️ Vérifier le rate limiting
        if (this.firestoreLimiter) {
            const check = this.firestoreLimiter(user.uid);
            if (!check.allowed) {
                console.warn(`⚠️ Rate limiting: Trop de requêtes. Réessayez dans ${Math.ceil(check.retryAfter/1000)}s`);
                // Retourner le cache si disponible
                if (Object.keys(this.userProgressCache).length > 0) {
                    return this.userProgressCache;
                }
                return { rateLimited: true, retryAfter: check.retryAfter };
            }
        }

        const startTime = Date.now();

        try {
            const { getDocs, collection } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            const progressRef = collection(this.db, 'users', user.uid, 'progress');
            const progressSnap = await getDocs(progressRef);

            const allProgress = {};
            progressSnap.forEach((doc) => {
                const data = doc.data();
                // Convertir les Timestamps en Date
                if (data.lastReviewed?.toDate) {
                    data.lastReviewed = data.lastReviewed.toDate();
                }
                if (data.nextReview?.toDate) {
                    data.nextReview = data.nextReview.toDate();
                }
                allProgress[doc.id] = data;
                
                // Mettre chaque terme dans le SmartCache
                this.smartCache.set(doc.id, data);
            });

            // Mettre à jour le cache mémoire
            this.userProgressCache = allProgress;
            
            const duration = Date.now() - startTime;
            const count = Object.keys(allProgress).length;
            this.perfMonitor.logFirestoreRead('progress', count, duration);
            
            console.log(`✅ Progression chargée: ${count} termes en ${duration}ms`);

            return allProgress;
        } catch (error) {
            console.error('Erreur récupération toute la progression:', error);
            return {};
        }
    }

    /**
     * Mettre à jour les statistiques globales de l'utilisateur
     * @param {Object} stats - Statistiques à mettre à jour
     */
    async updateUserStats(stats) {
        const user = this.auth.currentUser;
        if (!user) return false;

        try {
            const { setDoc, doc, Timestamp, increment } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            
            const userRef = doc(this.db, 'users', user.uid);
            const updateData = {
                'stats.lastActivity': Timestamp.fromDate(new Date())
            };

            // Incrémenter les compteurs
            if (stats.totalTermsStudied) {
                updateData['stats.totalTermsStudied'] = increment(stats.totalTermsStudied);
            }
            if (stats.totalReviews) {
                updateData['stats.totalReviews'] = increment(stats.totalReviews);
            }
            if (stats.currentStreak !== undefined) {
                updateData['stats.currentStreak'] = stats.currentStreak;
            }

            await setDoc(userRef, updateData, { merge: true });
            return true;
        } catch (error) {
            console.error('Erreur mise à jour statistiques:', error);
            return false;
        }
    }

    /**
     * Synchroniser les modifications en attente (mode hors ligne)
     */
    async syncPendingChanges() {
        if (this.pendingSync.length === 0) return;

        console.log(`Synchronisation de ${this.pendingSync.length} modifications en attente...`);
        
        const toSync = [...this.pendingSync];
        this.pendingSync = [];

        for (const { termKey, progressData } of toSync) {
            await this.saveTermProgress(termKey, progressData);
        }

        this.savePendingToLocalStorage();
        console.log('✅ Synchronisation terminée');
    }

    /**
     * Sauvegarder la file d'attente dans localStorage
     */
    savePendingToLocalStorage() {
        try {
            localStorage.setItem('pendingSync', JSON.stringify(this.pendingSync));
        } catch (error) {
            console.error('Erreur sauvegarde pendingSync:', error);
        }
    }

    /**
     * Charger la file d'attente depuis localStorage
     */
    loadPendingFromLocalStorage() {
        try {
            const pending = localStorage.getItem('pendingSync');
            if (pending) {
                this.pendingSync = JSON.parse(pending);
                // Reconvertir les dates
                this.pendingSync.forEach(item => {
                    if (item.progressData.lastReviewed) {
                        item.progressData.lastReviewed = new Date(item.progressData.lastReviewed);
                    }
                    if (item.progressData.nextReview) {
                        item.progressData.nextReview = new Date(item.progressData.nextReview);
                    }
                });
            }
        } catch (error) {
            console.error('Erreur chargement pendingSync:', error);
        }
    }

    /**
     * Vider le cache local
     */
    clearCache() {
        this.userProgressCache = {};
        this.smartCache.clear();
        console.log('🧹 Cache vidé');
    }

    /**
     * 🚀 NOUVEAU: Charger plusieurs progressions en batch
     * @param {Array<string>} termKeys - Liste des clés de termes
     * @returns {Object} Map termKey -> progressData
     */
    async getProgressBatch(termKeys) {
        if (!termKeys || termKeys.length === 0) {
            return {};
        }

        const user = this.auth.currentUser;
        if (!user) {
            console.warn('Utilisateur non connecté');
            return {};
        }

        // Vérifier le cache pour chaque terme
        const results = {};
        const missingKeys = [];

        for (const key of termKeys) {
            const cached = this.smartCache.get(key);
            if (cached) {
                results[key] = cached;
                this.perfMonitor.logCacheHit(key);
            } else {
                missingKeys.push(key);
            }
        }

        // Si tout est en cache, retourner immédiatement
        if (missingKeys.length === 0) {
            console.log(`✅ Tous les ${termKeys.length} termes en cache`);
            return results;
        }

        console.log(`📦 Chargement batch: ${missingKeys.length}/${termKeys.length} termes`);

        // Charger les termes manquants en batch
        const collectionPath = `users/${user.uid}/progress`;
        const batchResults = await this.batchLoader.loadDocuments(collectionPath, missingKeys);

        // Convertir les timestamps et mettre en cache
        for (const [key, data] of Object.entries(batchResults)) {
            if (data.lastReviewed?.toDate) {
                data.lastReviewed = data.lastReviewed.toDate();
            }
            if (data.nextReview?.toDate) {
                data.nextReview = data.nextReview.toDate();
            }
            
            this.smartCache.set(key, data);
            results[key] = data;
        }

        return results;
    }

    /**
     * 📊 Obtenir les statistiques de performance
     */
    getPerformanceStats() {
        return {
            cache: this.smartCache.getStats(),
            firestore: this.perfMonitor.getReport()
        };
    }

    /**
     * 📊 Afficher les statistiques dans la console
     */
    logPerformanceStats() {
        console.log('=== STATISTIQUES SYNC MANAGER ===');
        this.smartCache.logStats();
        this.perfMonitor.logReport();
    }

    /**
     * Récupérer les termes à réviser aujourd'hui
     * @returns {Array} Liste des termKeys à réviser
     */
    async getTermsDueToday() {
        const allProgress = await this.getAllProgress();
        const now = new Date();
        const dueTodayKeys = [];

        for (const [termKey, progress] of Object.entries(allProgress)) {
            if (progress.nextReview && progress.nextReview <= now) {
                dueTodayKeys.push(termKey);
            }
        }

        return dueTodayKeys;
    }

    /**
     * Récupérer les termes jamais révisés
     * @param {Array} allTermKeys - Liste de tous les termes disponibles
     * @returns {Array} Liste des termKeys jamais révisés
     */
    async getNeverReviewedTerms(allTermKeys) {
        const allProgress = await this.getAllProgress();
        const neverReviewed = [];

        for (const termKey of allTermKeys) {
            if (!allProgress[termKey]) {
                neverReviewed.push(termKey);
            }
        }

        return neverReviewed;
    }
}

// Export pour utilisation dans d'autres scripts
if (typeof window !== 'undefined') {
    window.SyncManager = SyncManager;
}
