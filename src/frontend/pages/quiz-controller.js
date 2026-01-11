/**
 * QUIZ CONTROLLER
 * Gère la logique d'affichage et d'interaction du quiz
 */

let pharmaQuiz = null;
let currentAnswerSelected = null;

/**
 * Initialise le quiz au chargement
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📚 Initialisation du quiz pharmacologie...');
    
    // Créer l'instance du quiz
    pharmaQuiz = new PharmaQuiz();
    
    // Charger les données pharmacologiques
    showScreen('loadingScreen');
    const loaded = await pharmaQuiz.loadPharmaData();
    
    if (loaded && pharmaQuiz.pharmaData.length > 0) {
        console.log('✓ Données chargées, quiz prêt');
        populateFilters();
        showScreen('startScreen');
    } else {
        showError('❌ Erreur: Impossible de charger les données pharmacologiques');
    }
});

/**
 * Remplit les checkboxes des familles et domaines
 */
function populateFilters() {
    // Familles
    const families = pharmaQuiz.getFamilies();
    const familiesContainer = document.getElementById('familiesContainer');
    familiesContainer.innerHTML = '';
    
    families.forEach(family => {
        const label = document.createElement('label');
        label.className = 'filter-label';
        label.innerHTML = `
            <input type="checkbox" class="family-checkbox" value="${family}" checked>
            ${family}
        `;
        familiesContainer.appendChild(label);
    });
    
    // Domaines
    const domains = pharmaQuiz.getAvailableDomains();
    const domainsContainer = document.getElementById('domainsContainer');
    domainsContainer.innerHTML = '';
    
    domains.forEach(domain => {
        const label = document.createElement('label');
        label.className = 'filter-label';
        label.innerHTML = `
            <input type="checkbox" class="domain-checkbox" value="${domain.id}" checked>
            ${domain.label}
        `;
        domainsContainer.appendChild(label);
    });
}

/**
 * Affiche un écran spécifique
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

/**
 * Démarre le quiz
 */
window.startQuiz = function() {
    // Récupérer les filtres sélectionnés
    const selectedFamilies = Array.from(document.querySelectorAll('.family-checkbox:checked'))
        .map(cb => cb.value);
    const selectedDomains = Array.from(document.querySelectorAll('.domain-checkbox:checked'))
        .map(cb => cb.value);
    
    const count = parseInt(document.getElementById('questionsCount').value);
    
    // Générer le quiz avec les filtres
    pharmaQuiz.generateFilteredQuiz(count, selectedFamilies, selectedDomains);
    
    console.log(`▶ Quiz démarré:`);
    console.log(`  - ${count} questions`);
    console.log(`  - Familles: ${selectedFamilies.join(', ')}`);
    console.log(`  - Domaines: ${selectedDomains.join(', ')}`);
    
    displayQuestion();
    showScreen('quizScreen');
};

/**
 * Affiche la question actuelle
 */
function displayQuestion() {
    const question = pharmaQuiz.getCurrentQuestion();
    const total = pharmaQuiz.currentQuiz.length;
    const current = pharmaQuiz.currentQuestionIndex + 1;
    
    // Mettre à jour le compteur et la barre de progression
    document.getElementById('questionCounter').textContent = `${current}/${total}`;
    const progress = (current / total) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    
    // Afficher la question
    let html = `
        <div class="question">
            <span class="question-type">Vrai/Faux</span>
            <div class="question-text">${question.question}</div>
    `;
    
    // Question Vrai/Faux uniquement
    const isAnswered = question.userAnswer !== null;
    html += `
        <div class="vrai-faux-group">
            <button class="btn-vf ${isAnswered && question.userAnswer === true ? 'selected' : ''}" 
                    onclick="window.selectVFAnswer(true)">
                ✓ Vrai
            </button>
            <button class="btn-vf ${isAnswered && question.userAnswer === false ? 'selected' : ''}" 
                    onclick="window.selectVFAnswer(false)">
                ✗ Faux
            </button>
        </div>
    `;
    
    html += `</div>`;
    
    document.getElementById('questionContent').innerHTML = html;
    
    // Mettre à jour les boutons
    document.querySelector('button[onclick="window.previousQuestion()"]').disabled = current === 1;
    
    const nextBtn = document.getElementById('nextBtn');
    if (current === total) {
        nextBtn.textContent = 'Terminer le quiz →';
        nextBtn.onclick = function() { window.finishQuiz(); };
    } else {
        nextBtn.textContent = 'Suivant →';
        nextBtn.onclick = function() { window.nextQuestion(); };
    }
    
    // Auto-focus sur la première réponse
    const firstAnswer = document.querySelector('.btn-vf');
    if (firstAnswer) firstAnswer.focus();
};

/**
 * Sélectionne une réponse QCM
 * OBSOLÈTE: remplacé par selectVFAnswer
 * Conservé pour compatibilité (ne fait rien)
 */
window.selectAnswer = function(element) {
    // Non utilisé - QCU uniquement
};

/**
 * Sélectionne une réponse Vrai/Faux
 */
window.selectVFAnswer = function(value) {
    const question = pharmaQuiz.getCurrentQuestion();
    question.userAnswer = value;
    
    // Mettre à jour l'affichage
    document.querySelectorAll('.btn-vf').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    console.log('✓ Vrai/Faux sélectionné:', value);
};

/**
 * Passe à la question suivante
 */
window.nextQuestion = function() {
    const question = pharmaQuiz.getCurrentQuestion();
    
    if (question.userAnswer === null) {
        alert('⚠️ Veuillez sélectionner une réponse avant de continuer');
        return;
    }
    
    if (pharmaQuiz.nextQuestion()) {
        displayQuestion();
    }
};

/**
 * Revient à la question précédente
 */
window.previousQuestion = function() {
    if (pharmaQuiz.currentQuestionIndex > 0) {
        pharmaQuiz.currentQuestionIndex--;
        displayQuestion();
    }
};

/**
 * Termine le quiz
 */
window.finishQuiz = function() {
    const question = pharmaQuiz.getCurrentQuestion();
    
    if (question.userAnswer === null) {
        alert('⚠️ Veuillez sélectionner une réponse avant de terminer');
        return;
    }
    
    // Calculer le score final en vérifiant toutes les réponses
    pharmaQuiz.score = 0;
    pharmaQuiz.currentQuiz.forEach(q => {
        const isCorrect = pharmaQuiz.normalizeAnswer(q.userAnswer) === 
                         pharmaQuiz.normalizeAnswer(q.correctAnswer);
        if (isCorrect) pharmaQuiz.score++;
    });
    
    displayResults();
};

/**
 * Affiche les résultats
 */
function displayResults() {
    const results = pharmaQuiz.getResults();
    
    // Mettre à jour l'affichage du score
    document.getElementById('scoreDisplay').textContent = `${results.score}/${results.total}`;
    document.getElementById('scorePercentage').textContent = `${results.percentage}%`;
    
    // Feedback selon le score
    let feedback, className;
    if (results.percentage >= 90) {
        feedback = '🌟 Excellent! Vous maîtrisez très bien la pharmacologie!';
        className = 'excellent';
    } else if (results.percentage >= 75) {
        feedback = '👍 Très bon! Vous avez de bonnes connaissances.';
        className = 'good';
    } else if (results.percentage >= 60) {
        feedback = '📚 Correct, mais continuez à réviser!';
        className = 'average';
    } else {
        feedback = '💪 Continuez vos efforts, la pratique améliorera votre score!';
        className = 'poor';
    }
    
    document.getElementById('feedback').textContent = feedback;
    document.getElementById('feedback').className = `results-feedback ${className}`;
    
    // Afficher la revue des réponses
    let reviewHtml = '';
    results.questions.forEach((question, index) => {
        const isCorrect = pharmaQuiz.normalizeAnswer(question.userAnswer) === 
                         pharmaQuiz.normalizeAnswer(question.correctAnswer);
        
        reviewHtml += `
            <div class="review-question ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="review-q-number">Question ${index + 1} ${isCorrect ? '✓' : '✗'}</div>
                <div class="review-q-text"><strong>${question.question}</strong></div>
                <div class="review-answers-info">
                    <div class="review-answer-user">
                        Votre réponse: <strong>${question.userAnswer}</strong>
                    </div>
                    ${!isCorrect ? `<div class="review-answer-correct">Bonne réponse: <strong>${question.correctAnswer}</strong></div>` : ''}
                    <div class="explanation">${question.explanation}</div>
                </div>
            </div>
        `;
    });
    
    document.getElementById('reviewAnswers').innerHTML = reviewHtml;
    
    showScreen('resultsScreen');
}

/**
 * Réinitialise le quiz
 */
window.resetQuiz = function() {
    pharmaQuiz.reset();
    currentAnswerSelected = null;
    window.location.href = './home.html';
};

/**
 * Recommence le quiz
 */
window.retakeQuiz = function() {
    showScreen('startScreen');
};

/**
 * Affiche une erreur
 */
function showError(message) {
    document.getElementById('loadingScreen').innerHTML = `
        <div class="loading">
            <p style="color: #dc3545; font-weight: 600;">${message}</p>
            <p style="margin-top: 1rem; color: #999;">Assurez-vous que le fichier pharmaco.csv est présent dans src/data/</p>
            <button class="btn btn-secondary" onclick="window.location.href='./home.html'">
                Retour
            </button>
        </div>
    `;
}

/**
 * Ouvre le quiz depuis la page d'accueil
 */
window.openPharmaQuiz = function() {
    window.location.href = './quiz.html';
};
