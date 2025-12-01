/**
 * ALGORITHME SM-2 (SuperMemo 2) - RÉPÉTITION ESPACÉE
 * 
 * Implémentation de l'algorithme de répétition espacée basé sur la courbe de l'oubli
 * Calcule le prochain intervalle de révision selon la difficulté perçue
 * 
 * Principe :
 * - Jamais vu : Priorité maximale
 * - Difficile : Revoir dans 1 jour
 * - Moyen : Revoir dans 3-6 jours (selon historique)
 * - Facile : Revoir dans 7+ jours (selon historique)
 */

class SpacedRepetition {
    constructor() {
        // Qualité de la réponse (mapping difficulté → qualité SM-2)
        this.QUALITY = {
            DIFFICILE: 1,  // Échec total - revoir très vite
            MOYEN: 3,      // Difficile mais réussi - revoir bientôt
            FACILE: 5      // Parfait - revoir plus tard
        };

        // Intervalle minimum en jours
        this.MIN_INTERVAL = 1;
        
        // Facteur de facilité par défaut
        this.DEFAULT_EASINESS = 2.5;
    }

    /**
     * Calculer le prochain intervalle de révision (algorithme SM-2)
     * 
     * @param {Object} progress - Données de progression existantes
     * @param {string} difficulty - Difficulté perçue: 'facile', 'moyen', 'difficile'
     * @returns {Object} Nouvelles données de progression
     */
    calculateNextReview(progress, difficulty) {
        const now = new Date();
        
        // Mapping difficulté → qualité
        const qualityMap = {
            'difficile': this.QUALITY.DIFFICILE,
            'moyen': this.QUALITY.MOYEN,
            'facile': this.QUALITY.FACILE
        };
        
        const quality = qualityMap[difficulty.toLowerCase()] || this.QUALITY.MOYEN;

        // Si premier passage (jamais vu)
        if (!progress || !progress.repetitions) {
            return this.initializeProgress(quality);
        }

        // Récupérer les valeurs actuelles
        let easinessFactor = progress.easinessFactor || this.DEFAULT_EASINESS;
        let repetitions = progress.repetitions || 0;
        let intervalDays = progress.intervalDays || 0;

        // Calculer le nouveau facteur de facilité (EF)
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        const newEasiness = Math.max(
            1.3,
            easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        );

        // Calculer le nouveau nombre de répétitions et l'intervalle
        let newRepetitions;
        let newInterval;

        if (quality < 3) {
            // Échec : recommencer à zéro
            newRepetitions = 0;
            newInterval = 1; // Revoir demain
        } else {
            // Succès : augmenter l'intervalle
            newRepetitions = repetitions + 1;

            if (newRepetitions === 1) {
                newInterval = 1; // 1er succès : revoir dans 1 jour
            } else if (newRepetitions === 2) {
                newInterval = 6; // 2ème succès : revoir dans 6 jours
            } else {
                // 3ème succès et plus : intervalPrécédent * EF
                newInterval = Math.round(intervalDays * newEasiness);
            }
        }

        // Calculer la prochaine date de révision
        const nextReviewDate = new Date(now);
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

        // Retourner les nouvelles données de progression
        return {
            easinessFactor: newEasiness,
            repetitions: newRepetitions,
            intervalDays: newInterval,
            lastReviewed: now,
            nextReview: nextReviewDate,
            lastDifficulty: difficulty,
            reviewCount: (progress.reviewCount || 0) + 1,
            // Statistiques de difficulté
            difficultyHistory: {
                difficile: (progress.difficultyHistory?.difficile || 0) + (difficulty === 'difficile' ? 1 : 0),
                moyen: (progress.difficultyHistory?.moyen || 0) + (difficulty === 'moyen' ? 1 : 0),
                facile: (progress.difficultyHistory?.facile || 0) + (difficulty === 'facile' ? 1 : 0)
            }
        };
    }

    /**
     * Initialiser la progression pour un nouveau terme
     * 
     * @param {number} quality - Qualité de la première révision
     * @returns {Object} Données de progression initiales
     */
    initializeProgress(quality) {
        const now = new Date();
        const nextReview = new Date(now);

        // Premier intervalle selon la difficulté
        let intervalDays;
        let difficulty;

        if (quality >= 5) {
            intervalDays = 6;
            difficulty = 'facile';
        } else if (quality >= 3) {
            intervalDays = 3;
            difficulty = 'moyen';
        } else {
            intervalDays = 1;
            difficulty = 'difficile';
        }

        nextReview.setDate(nextReview.getDate() + intervalDays);

        return {
            easinessFactor: this.DEFAULT_EASINESS,
            repetitions: 1,
            intervalDays: intervalDays,
            lastReviewed: now,
            nextReview: nextReview,
            lastDifficulty: difficulty,
            reviewCount: 1,
            difficultyHistory: {
                difficile: difficulty === 'difficile' ? 1 : 0,
                moyen: difficulty === 'moyen' ? 1 : 0,
                facile: difficulty === 'facile' ? 1 : 0
            }
        };
    }

    /**
     * Vérifier si un terme doit être révisé
     * 
     * @param {Object} progress - Données de progression
     * @returns {boolean} True si le terme doit être révisé
     */
    isDue(progress) {
        if (!progress || !progress.nextReview) {
            return true; // Jamais vu = à réviser
        }

        const now = new Date();
        return progress.nextReview <= now;
    }

    /**
     * Obtenir le score de priorité pour un terme
     * Plus le score est élevé, plus le terme est prioritaire
     * 
     * @param {Object} progress - Données de progression
     * @returns {number} Score de priorité (0-1000)
     */
    getPriorityScore(progress) {
        // Jamais vu : priorité maximale
        if (!progress || !progress.repetitions) {
            return 1000;
        }

        const now = new Date();
        const nextReview = progress.nextReview || now;

        // Nombre de jours en retard (peut être négatif si en avance)
        const daysOverdue = Math.floor((now - nextReview) / (1000 * 60 * 60 * 24));

        // Score de base selon la difficulté moyenne
        const diffHistory = progress.difficultyHistory || { difficile: 0, moyen: 0, facile: 0 };
        const total = diffHistory.difficile + diffHistory.moyen + diffHistory.facile;
        
        let difficultyScore = 500; // Score par défaut
        if (total > 0) {
            // Plus il y a de "difficile", plus le score est élevé
            difficultyScore = (diffHistory.difficile * 800 + diffHistory.moyen * 500 + diffHistory.facile * 200) / total;
        }

        // Bonus pour les termes en retard
        const overdueBonus = Math.max(0, daysOverdue * 50);

        // Score final
        return Math.min(1000, difficultyScore + overdueBonus);
    }

    /**
     * Trier les termes par priorité
     * 
     * @param {Array} termsWithProgress - Tableau d'objets {term: {...}, progress: {...}}
     * @returns {Array} Termes triés par priorité décroissante
     */
    sortByPriority(termsWithProgress) {
        return termsWithProgress.sort((a, b) => {
            const priorityA = this.getPriorityScore(a.progress);
            const priorityB = this.getPriorityScore(b.progress);
            return priorityB - priorityA; // Ordre décroissant
        });
    }

    /**
     * Formater l'intervalle en texte lisible
     * 
     * @param {number} days - Nombre de jours
     * @returns {string} Texte formaté
     */
    formatInterval(days) {
        if (days === 0) return "Aujourd'hui";
        if (days === 1) return "Demain";
        if (days < 7) return `Dans ${days} jours`;
        if (days < 30) {
            const weeks = Math.floor(days / 7);
            return `Dans ${weeks} semaine${weeks > 1 ? 's' : ''}`;
        }
        const months = Math.floor(days / 30);
        return `Dans ${months} mois`;
    }

    /**
     * Obtenir des statistiques sur la progression
     * 
     * @param {Object} allProgress - Dictionnaire termKey → progress
     * @returns {Object} Statistiques globales
     */
    getStatistics(allProgress) {
        const stats = {
            total: Object.keys(allProgress).length,
            neverReviewed: 0,
            dueToday: 0,
            mastered: 0, // intervalDays >= 30
            learning: 0, // intervalDays < 30
            avgEasinessFactor: 0,
            difficultyDistribution: {
                difficile: 0,
                moyen: 0,
                facile: 0
            }
        };

        const now = new Date();
        let totalEF = 0;
        let countEF = 0;

        for (const progress of Object.values(allProgress)) {
            if (!progress.repetitions) {
                stats.neverReviewed++;
            } else {
                if (progress.nextReview && progress.nextReview <= now) {
                    stats.dueToday++;
                }

                if (progress.intervalDays >= 30) {
                    stats.mastered++;
                } else {
                    stats.learning++;
                }

                if (progress.easinessFactor) {
                    totalEF += progress.easinessFactor;
                    countEF++;
                }

                // Distribution de difficulté
                if (progress.lastDifficulty) {
                    stats.difficultyDistribution[progress.lastDifficulty]++;
                }
            }
        }

        if (countEF > 0) {
            stats.avgEasinessFactor = (totalEF / countEF).toFixed(2);
        }

        return stats;
    }
}

// Export pour utilisation dans d'autres scripts
if (typeof window !== 'undefined') {
    window.SpacedRepetition = SpacedRepetition;
}
