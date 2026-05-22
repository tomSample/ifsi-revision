/**
 * MODULE MCQ-QUIZ
 * Quiz avec questions à choix multiples avec variantes
 * Format JSON avec réponses mélangées
 */

class McqQuiz {
    constructor() {
        this.quizData = [];
        this.currentQuiz = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.quizActive = false;
        this.questionsPerQuiz = 20;
        this.userAnswers = [];
    }

    /**
     * Charge les données du quiz depuis un fichier JSON
     */
    async loadQuizData(filePath) {
        try {
            // Essayer différents chemins
            const paths = [
                // Chemin relatif à partir de quiz.html
                '../../data/questionnaire/UE_4.4.S2_antibiotiques.json',
                // Chemin absolu
                '/src/data/questionnaire/UE_4.4.S2_antibiotiques.json',
                // Chemin avec resolvePath
                (window.resolvePath ? window.resolvePath('/src/data/questionnaire/UE_4.4.S2_antibiotiques.json') : null)
            ].filter(p => p !== null);
            
            let jsonData = null;
            let loadedFrom = null;
            
            for (const path of paths) {
                try {
                    console.log(`[McqQuiz] Essai de charger: ${path}`);
                    const response = await fetch(path);
                    if (response.ok) {
                        jsonData = await response.json();
                        loadedFrom = path;
                        console.log(`✓ Chargé depuis: ${path}`);
                        break;
                    }
                } catch (err) {
                    console.log(`  ✗ Échec: ${err.message}`);
                    continue;
                }
            }
            
            if (!jsonData) {
                throw new Error('Impossible de charger le fichier JSON');
            }
            
            this.quizData = jsonData;
            console.log(`✓ Quiz chargé: ${this.quizData.length} questions`);
            return true;
        } catch (error) {
            console.error('Erreur chargement quiz:', error);
            return false;
        }
    }

    /**
     * Génère le quiz avec filtrage optionnel
     */
    generateQuiz(count, filters = {}) {
        let questions = [...this.quizData];

        // Filtrer par type
        if (filters.type && filters.type.length > 0) {
            questions = questions.filter(q => filters.type.includes(q.type));
        }

        // Filtrer par thème
        if (filters.theme && filters.theme.length > 0) {
            questions = questions.filter(q => filters.theme.includes(q.theme));
        }

        // Mélanger et prendre le nombre souhaité
        questions = this.shuffleArray(questions).slice(0, Math.min(count, questions.length));

        this.currentQuiz = questions.map(q => {
            // Créer une copie avec les réponses mélangées
            return {
                ...q,
                variante: q.variantes[Math.floor(Math.random() * q.variantes.length)],
                reponsesMelangees: this.shuffleArray([...q.reponses])
            };
        });

        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = new Array(this.currentQuiz.length).fill(null);
        this.quizActive = true;

        console.log(`▶ Quiz généré: ${this.currentQuiz.length} questions`);
        return this.currentQuiz;
    }

    /**
     * Obtient la question actuelle
     */
    getCurrentQuestion() {
        if (this.currentQuestionIndex >= this.currentQuiz.length) {
            return null;
        }
        return this.currentQuiz[this.currentQuestionIndex];
    }

    /**
     * Définit la réponse de l'utilisateur
     */
    setAnswer(answer) {
        if (this.currentQuestionIndex < this.userAnswers.length) {
            this.userAnswers[this.currentQuestionIndex] = answer;
        }
    }

    /**
     * Va à la question suivante
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuiz.length - 1) {
            this.currentQuestionIndex++;
            return true;
        }
        return false;
    }

    /**
     * Va à la question précédente
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            return true;
        }
        return false;
    }

    /**
     * Calcule le score final
     */
    calculateScore() {
        this.score = 0;
        for (let i = 0; i < this.currentQuiz.length; i++) {
            if (this.userAnswers[i] === this.currentQuiz[i].correcte) {
                this.score++;
            }
        }
        this.quizActive = false;
        return this.score;
    }

    /**
     * Obtient les résultats détaillés
     */
    getResults() {
        const results = [];
        for (let i = 0; i < this.currentQuiz.length; i++) {
            results.push({
                question: this.currentQuiz[i].variante,
                userAnswer: this.userAnswers[i],
                correctAnswer: this.currentQuiz[i].correcte,
                isCorrect: this.userAnswers[i] === this.currentQuiz[i].correcte,
                theme: this.currentQuiz[i].theme,
                type: this.currentQuiz[i].type
            });
        }
        return results;
    }

    /**
     * Obtient les thèmes disponibles
     */
    getThemes() {
        const themes = [...new Set(this.quizData.map(q => q.theme))];
        return themes.sort();
    }

    /**
     * Obtient les types disponibles
     */
    getTypes() {
        const types = [...new Set(this.quizData.map(q => q.type))];
        return types.sort();
    }

    /**
     * Mélange un array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Réinitialise le quiz
     */
    reset() {
        this.currentQuiz = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.quizActive = false;
        this.userAnswers = [];
    }
}
