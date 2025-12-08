/**
 * Classification Manager
 * Gère la classification collaborative des termes par les utilisateurs
 */

class ClassificationManager {
    constructor(auth, db) {
        this.auth = auth;
        this.db = db;
        this.cache = new Map(); // Cache local pour les classifications
        this.cacheTimeout = 3600000; // 1 heure
    }

    /**
     * Vérifier si l'utilisateur a déjà voté pour un terme
     */
    async hasUserVoted(termId) {
        const user = this.auth.currentUser;
        if (!user) return false;

        try {
            const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            
            const progressRef = doc(this.db, 'userProgress', `${user.uid}_${termId}`);
            const progressDoc = await getDoc(progressRef);
            
            return progressDoc.exists() && progressDoc.data().hasVoted === true;
        } catch (error) {
            console.error('Erreur vérification vote:', error);
            return false;
        }
    }

    /**
     * Enregistrer le premier vote d'un utilisateur pour un terme
     */
    async voteForTerm(termId, importance) {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Utilisateur non connecté');
        }

        // Vérifier qu'il n'a pas déjà voté
        const hasVoted = await this.hasUserVoted(termId);
        if (hasVoted) {
            console.warn('L\'utilisateur a déjà voté pour ce terme');
            return;
        }

        try {
            const { runTransaction, doc, getDoc, setDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            
            await runTransaction(this.db, async (transaction) => {
                // 1. Mettre à jour les votes globaux
                const classificationRef = doc(this.db, 'termClassifications', termId);
                const classificationDoc = await transaction.get(classificationRef);
                
                if (!classificationDoc.exists()) {
                    // Premier vote sur ce terme
                    transaction.set(classificationRef, {
                        termId,
                        votes: {
                            essential: importance === 'essential' ? 1 : 0,
                            important: importance === 'important' ? 1 : 0,
                            supplementary: importance === 'supplementary' ? 1 : 0,
                            ignored: importance === 'ignored' ? 1 : 0
                        },
                        totalVotes: 1,
                        majorityChoice: importance,
                        majorityPercentage: 100,
                        lastUpdated: new Date().toISOString(),
                        createdAt: new Date().toISOString()
                    });
                } else {
                    // Ajouter le vote
                    const data = classificationDoc.data();
                    data.votes[importance]++;
                    data.totalVotes++;
                    
                    // Recalculer la majorité
                    const maxVotes = Math.max(...Object.values(data.votes));
                    const majorityChoice = Object.keys(data.votes).find(
                        key => data.votes[key] === maxVotes
                    );
                    const majorityPercentage = Math.round((maxVotes / data.totalVotes) * 100);
                    
                    transaction.update(classificationRef, {
                        votes: data.votes,
                        totalVotes: data.totalVotes,
                        majorityChoice,
                        majorityPercentage,
                        lastUpdated: new Date().toISOString()
                    });
                }
                
                // 2. Enregistrer le choix personnel de l'utilisateur
                const progressRef = doc(this.db, 'userProgress', `${user.uid}_${termId}`);
                transaction.set(progressRef, {
                    termId,
                    userId: user.uid,
                    personalImportance: importance,
                    hasVoted: true,
                    votedAt: new Date().toISOString()
                }, { merge: true });
            });

            // Invalider le cache pour ce terme
            this.cache.delete(termId);
            
            console.log(`✅ Vote enregistré: ${importance} pour ${termId}`);
        } catch (error) {
            console.error('Erreur lors du vote:', error);
            throw error;
        }
    }

    /**
     * Modifier le vote existant d'un utilisateur
     */
    async modifyVote(termId, newImportance) {
        const user = this.auth.currentUser;
        if (!user) {
            throw new Error('Utilisateur non connecté');
        }

        try {
            const { runTransaction, doc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            
            await runTransaction(this.db, async (transaction) => {
                // 1. Récupérer l'ancien vote
                const progressRef = doc(this.db, 'userProgress', `${user.uid}_${termId}`);
                const progressDoc = await transaction.get(progressRef);
                
                if (!progressDoc.exists() || !progressDoc.data().hasVoted) {
                    throw new Error('L\'utilisateur n\'a pas encore voté pour ce terme');
                }
                
                const oldImportance = progressDoc.data().personalImportance;
                
                // Si c'est le même choix, ne rien faire
                if (oldImportance === newImportance) {
                    return;
                }
                
                // 2. Mettre à jour les votes globaux
                const classificationRef = doc(this.db, 'termClassifications', termId);
                const classificationDoc = await transaction.get(classificationRef);
                
                if (classificationDoc.exists()) {
                    const data = classificationDoc.data();
                    
                    // Retirer l'ancien vote
                    data.votes[oldImportance]--;
                    
                    // Ajouter le nouveau vote
                    data.votes[newImportance]++;
                    
                    // Recalculer la majorité
                    const maxVotes = Math.max(...Object.values(data.votes));
                    const majorityChoice = Object.keys(data.votes).find(
                        key => data.votes[key] === maxVotes
                    );
                    const majorityPercentage = Math.round((maxVotes / data.totalVotes) * 100);
                    
                    transaction.update(classificationRef, {
                        votes: data.votes,
                        majorityChoice,
                        majorityPercentage,
                        lastUpdated: new Date().toISOString()
                    });
                }
                
                // 3. Mettre à jour le choix personnel
                transaction.update(progressRef, {
                    personalImportance: newImportance,
                    lastModifiedAt: new Date().toISOString()
                });
            });

            // Invalider le cache pour ce terme
            this.cache.delete(termId);
            
            console.log(`✅ Vote modifié: ${newImportance} pour ${termId}`);
        } catch (error) {
            console.error('Erreur lors de la modification du vote:', error);
            throw error;
        }
    }

    /**
     * Récupérer les informations de classification d'un terme
     */
    async getClassificationInfo(termId) {
        // Vérifier le cache
        const cached = this.cache.get(termId);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        const user = this.auth.currentUser;
        
        try {
            const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            
            // 1. Classification globale
            const classificationRef = doc(this.db, 'termClassifications', termId);
            const classificationDoc = await getDoc(classificationRef);
            
            let globalInfo = null;
            if (classificationDoc.exists()) {
                const data = classificationDoc.data();
                globalInfo = {
                    majorityChoice: data.majorityChoice,
                    majorityPercentage: data.majorityPercentage,
                    totalVotes: data.totalVotes,
                    votes: data.votes
                };
            }
            
            // 2. Choix personnel
            let personalInfo = null;
            if (user) {
                const progressRef = doc(this.db, 'userProgress', `${user.uid}_${termId}`);
                const progressDoc = await getDoc(progressRef);
                
                if (progressDoc.exists()) {
                    personalInfo = {
                        importance: progressDoc.data().personalImportance,
                        hasVoted: progressDoc.data().hasVoted || false,
                        votedAt: progressDoc.data().votedAt
                    };
                }
            }
            
            const result = {
                global: globalInfo,
                personal: personalInfo
            };

            // Mettre en cache
            this.cache.set(termId, {
                data: result,
                timestamp: Date.now()
            });
            
            return result;
        } catch (error) {
            console.error('Erreur récupération classification:', error);
            return {
                global: null,
                personal: null
            };
        }
    }

    /**
     * Récupérer les statistiques de classification de l'utilisateur
     */
    async getUserClassificationStats() {
        const user = this.auth.currentUser;
        if (!user) return null;

        try {
            const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            
            const progressRef = collection(this.db, 'userProgress');
            const q = query(progressRef, where('userId', '==', user.uid), where('hasVoted', '==', true));
            const snapshot = await getDocs(q);
            
            const stats = {
                totalVoted: 0,
                essential: 0,
                important: 0,
                supplementary: 0,
                ignored: 0
            };
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.personalImportance) {
                    stats.totalVoted++;
                    stats[data.personalImportance]++;
                }
            });
            
            return stats;
        } catch (error) {
            console.error('Erreur récupération stats:', error);
            return null;
        }
    }

    /**
     * Helpers pour l'affichage
     */
    static getImportanceBadge(importance) {
        const badges = {
            essential: '🔴',
            important: '🟡',
            supplementary: '🟢',
            ignored: '⚫'
        };
        return badges[importance] || '';
    }

    static getImportanceLabel(importance) {
        const labels = {
            essential: 'Essentiel',
            important: 'Important',
            supplementary: 'Complémentaire',
            ignored: 'Ignoré'
        };
        return labels[importance] || '';
    }

    static getImportanceDescription(importance) {
        const descriptions = {
            essential: 'Incontournable pour l\'examen',
            important: 'Utile à connaître',
            supplementary: 'Culture générale',
            ignored: 'Ne plus voir ce terme'
        };
        return descriptions[importance] || '';
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClassificationManager;
}
