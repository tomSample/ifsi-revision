/**
 * GESTIONNAIRE DE PERFORMANCE FIRESTORE
 * 
 * Optimisations:
 * - Batch loading (grouper les reads)
 * - Pagination intelligente
 * - Monitoring des performances
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            firestoreReads: 0,
            firestoreWrites: 0,
            cacheHits: 0,
            cacheMisses: 0,
            operations: []
        };
        
        this.sessionStart = Date.now();
    }

    /**
     * Logger une lecture Firestore
     */
    logFirestoreRead(collection, count, duration) {
        this.metrics.firestoreReads += count;
        this.metrics.operations.push({
            type: 'read',
            collection,
            count,
            duration,
            timestamp: Date.now()
        });
        
        console.log(`📖 Firestore read: ${collection} (${count} docs, ${duration}ms)`);
    }

    /**
     * Logger une écriture Firestore
     */
    logFirestoreWrite(collection, count, duration) {
        this.metrics.firestoreWrites += count;
        this.metrics.operations.push({
            type: 'write',
            collection,
            count,
            duration,
            timestamp: Date.now()
        });
        
        console.log(`📝 Firestore write: ${collection} (${count} docs, ${duration}ms)`);
    }

    /**
     * Logger un cache hit
     */
    logCacheHit(key, source = 'memory') {
        this.metrics.cacheHits++;
        console.log(`✅ Cache hit: ${key} (${source})`);
    }

    /**
     * Logger un cache miss
     */
    logCacheMiss(key) {
        this.metrics.cacheMisses++;
        console.log(`❌ Cache miss: ${key}`);
    }

    /**
     * Obtenir le rapport de performance
     */
    getReport() {
        const sessionDuration = Date.now() - this.sessionStart;
        const totalOperations = this.metrics.firestoreReads + this.metrics.firestoreWrites;
        const cacheTotal = this.metrics.cacheHits + this.metrics.cacheMisses;
        const cacheHitRate = cacheTotal > 0 ? 
            (this.metrics.cacheHits / cacheTotal * 100).toFixed(1) : 0;
        
        return {
            sessionDuration: `${(sessionDuration / 1000).toFixed(1)}s`,
            firestoreReads: this.metrics.firestoreReads,
            firestoreWrites: this.metrics.firestoreWrites,
            totalOperations,
            cacheHits: this.metrics.cacheHits,
            cacheMisses: this.metrics.cacheMisses,
            cacheHitRate: `${cacheHitRate}%`,
            recentOperations: this.metrics.operations.slice(-10)
        };
    }

    /**
     * Afficher le rapport dans la console
     */
    logReport() {
        console.log('📊 === RAPPORT DE PERFORMANCE ===');
        console.table(this.getReport());
    }

    /**
     * Réinitialiser les métriques
     */
    reset() {
        this.metrics = {
            firestoreReads: 0,
            firestoreWrites: 0,
            cacheHits: 0,
            cacheMisses: 0,
            operations: []
        };
        this.sessionStart = Date.now();
    }
}

/**
 * BATCH LOADER - Chargement optimisé par lots
 */
class BatchLoader {
    constructor(db, perfMonitor) {
        this.db = db;
        this.perfMonitor = perfMonitor;
        this.batchSize = 30; // Limite Firestore pour les requêtes 'in'
    }

    /**
     * Charger plusieurs documents en batch
     * @param {string} collectionPath - Chemin de la collection
     * @param {Array<string>} docIds - IDs des documents
     * @returns {Object} Map id -> data
     */
    async loadDocuments(collectionPath, docIds) {
        if (!docIds || docIds.length === 0) {
            return {};
        }

        const startTime = Date.now();
        const results = {};

        try {
            const { getDocs, query, collection, where, documentId } = 
                await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');

            // Découper en batches de 30 maximum
            const batches = [];
            for (let i = 0; i < docIds.length; i += this.batchSize) {
                batches.push(docIds.slice(i, i + this.batchSize));
            }

            // Exécuter tous les batches en parallèle
            const batchPromises = batches.map(async (batch) => {
                const q = query(
                    collection(this.db, collectionPath),
                    where(documentId(), 'in', batch)
                );
                
                const snapshot = await getDocs(q);
                const batchResults = {};
                
                snapshot.forEach(doc => {
                    batchResults[doc.id] = doc.data();
                });
                
                return batchResults;
            });

            // Attendre tous les batches
            const batchResultsArray = await Promise.all(batchPromises);

            // Fusionner les résultats
            batchResultsArray.forEach(batchResult => {
                Object.assign(results, batchResult);
            });

            const duration = Date.now() - startTime;
            this.perfMonitor?.logFirestoreRead(collectionPath, docIds.length, duration);

            console.log(`✅ Batch load: ${docIds.length} docs en ${batches.length} batch(es) (${duration}ms)`);

            return results;
        } catch (error) {
            console.error('Erreur batch load:', error);
            return {};
        }
    }

    /**
     * Charger une collection entière avec pagination
     * @param {string} collectionPath - Chemin de la collection
     * @param {number} limit - Limite par page
     * @param {Object} lastDoc - Dernier document de la page précédente
     * @returns {Object} { docs, lastDoc, hasMore }
     */
    async loadCollectionPaginated(collectionPath, limit = 20, lastDoc = null) {
        const startTime = Date.now();

        try {
            const { getDocs, query, collection, orderBy, startAfter, limit: firestoreLimit } = 
                await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');

            let q = query(
                collection(this.db, collectionPath),
                orderBy('__name__'), // Ordre par ID de document
                firestoreLimit(limit + 1) // +1 pour savoir s'il y a une page suivante
            );

            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);
            const docs = [];
            let newLastDoc = null;
            let hasMore = false;

            snapshot.forEach((doc, index) => {
                if (index < limit) {
                    docs.push({
                        id: doc.id,
                        ...doc.data()
                    });
                    newLastDoc = doc;
                } else {
                    hasMore = true;
                }
            });

            const duration = Date.now() - startTime;
            this.perfMonitor?.logFirestoreRead(collectionPath, docs.length, duration);

            return { docs, lastDoc: newLastDoc, hasMore };
        } catch (error) {
            console.error('Erreur pagination:', error);
            return { docs: [], lastDoc: null, hasMore: false };
        }
    }
}

/**
 * TERM PAGINATOR - Pagination intelligente des termes
 */
class TermPaginator {
    constructor(allTerms, pageSize = 20) {
        this.allTerms = allTerms;
        this.pageSize = pageSize;
        this.currentPage = 0;
        this.loadedTerms = [];
    }

    /**
     * Charger la page suivante
     */
    loadNext() {
        const start = this.currentPage * this.pageSize;
        const end = start + this.pageSize;
        const nextBatch = this.allTerms.slice(start, end);
        
        if (nextBatch.length > 0) {
            this.loadedTerms.push(...nextBatch);
            this.currentPage++;
            
            console.log(`📄 Page ${this.currentPage} chargée (${nextBatch.length} termes)`);
            return nextBatch;
        }
        
        return [];
    }

    /**
     * Précharger la page suivante en arrière-plan
     */
    async preloadNext() {
        const start = (this.currentPage + 1) * this.pageSize;
        const end = start + this.pageSize;
        
        if (start < this.allTerms.length) {
            // Simuler un préchargement asynchrone
            return new Promise(resolve => {
                setTimeout(() => {
                    console.log(`🔄 Préchargement page ${this.currentPage + 2}`);
                    resolve(true);
                }, 100);
            });
        }
        
        return false;
    }

    /**
     * Vérifier s'il reste des pages
     */
    hasMore() {
        return this.currentPage * this.pageSize < this.allTerms.length;
    }

    /**
     * Obtenir le nombre de termes restants
     */
    getRemainingCount() {
        return Math.max(0, this.allTerms.length - this.loadedTerms.length);
    }

    /**
     * Réinitialiser la pagination
     */
    reset() {
        this.currentPage = 0;
        this.loadedTerms = [];
    }
}

// Export pour utilisation globale
window.PerformanceMonitor = PerformanceMonitor;
window.BatchLoader = BatchLoader;
window.TermPaginator = TermPaginator;
