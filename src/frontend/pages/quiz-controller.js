/**
 * QUIZ CONTROLLER UNIVERSEL
 * Gère l'affichage et l'interaction pour tous les types de quiz
 */

let currentQuizType = null;  // 'pharma' ou 'mcq'
let quizInstance = null;     // Instance du quiz (PharmaQuiz ou McqQuiz)
let currentAnswerSelected = null;

/**
 * Initialise l'app au chargement
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📚 Initialisation de l\'application quiz...');
    showScreen('quizSelectionScreen');
});


/**
 * Sélectionne un type de quiz
 */
window.selectQuiz = async function(quizType) {
    console.log(`📖 Sélection du quiz: ${quizType}`);
    
    currentQuizType = quizType;
    showScreen('loadingScreen');
    
    try {
        if (quizType === 'UE_2.3') {
            // Quiz Pharmacologie existant
            quizInstance = new PharmaQuiz();
            const loaded = await quizInstance.loadPharmaData();
            
            if (loaded && quizInstance.pharmaData.length > 0) {
                console.log('✓ Quiz Pharmacologie chargé');
                setupPharmaCourseUI();
                populatePharmaCourseFilters();
                showScreen('startScreen');
            } else {
                throw new Error('Données pharmacologiques non chargées');
            }
        } else if (quizType === 'UE_4.4.S2_antibiotiques') {
            // Quiz Antibiotiques (MCQ)
            quizInstance = new McqQuiz();
            const filePath = '/src/data/questionnaire/UE_4.4.S2_antibiotiques.json';
            const loaded = await quizInstance.loadQuizData(filePath);
            
            if (loaded && quizInstance.quizData.length > 0) {
                console.log('✓ Quiz Antibiotiques chargé');
                setupMcqUI();
                populateMcqFilters();
                showScreen('startScreen');
            } else {
                throw new Error('Questions antibiotiques non chargées');
            }
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError(`❌ Erreur: ${error.message}`);
    }
};

/**
 * Configure l'UI pour le quiz Pharmacologie
 */
function setupPharmaCourseUI() {
    const startScreen = document.getElementById('startScreen');
    startScreen.innerHTML = `
        <div class="start-screen">
            <div class="start-icon">💊</div>
            <h2>Configurez votre quiz de pharmacologie</h2>
            <p>Prêt à réviser?</p>

            <div class="quiz-options">
                <div class="option-group">
                    <label>
                        <input type="number" id="questionsCount" value="10" min="5" max="50" style="width: 60px; padding: 0.5rem;">
                        <strong>Nombre de questions</strong>
                    </label>
                </div>
            </div>

            <div class="filters-section">
                <div class="filters-title">🎯 Filtrer par familles et domaines (tous sélectionnés par défaut)</div>
                <div class="filters-grid">
                    <div class="filter-group">
                        <h3>Familles de médicaments</h3>
                        <div class="filter-options" id="familiesContainer"></div>
                    </div>
                    <div class="filter-group">
                        <h3>Domaines d'étude</h3>
                        <div class="filter-options" id="domainsContainer"></div>
                    </div>
                </div>
            </div>

            <div class="quiz-actions">
                <button class="btn btn-secondary" onclick="window.backToSelection()">← Changer de quiz</button>
                <button class="btn btn-primary" onclick="window.startPharmaCourseQuiz()">Démarrer le Quiz</button>
            </div>
        </div>
    `;
}

/**
 * Configure l'UI pour le quiz MCQ
 */
function setupMcqUI() {
    const startScreen = document.getElementById('startScreen');
    startScreen.innerHTML = `
        <div class="start-screen">
            <div class="start-icon">🔬</div>
            <h2>Configurez votre quiz d'antibiotiques</h2>
            <p>Testez vos connaissances en mémorisation et sécurité</p>

            <div class="quiz-options">
                <div class="option-group">
                    <label>
                        <input type="number" id="questionsCount" value="20" min="5" max="25" style="width: 60px; padding: 0.5rem;">
                        <strong>Nombre de questions</strong>
                    </label>
                </div>
            </div>

            <div class="filters-section">
                <div class="filters-title">🎯 Filtrer par type (tous sélectionnés par défaut)</div>
                <div class="filters-grid">
                    <div class="filter-group">
                        <h3>Type de question</h3>
                        <div class="filter-options" id="typesContainer"></div>
                    </div>
                    <div class="filter-group">
                        <h3>Thème</h3>
                        <div class="filter-options" id="themesContainer"></div>
                    </div>
                </div>
            </div>

            <div class="quiz-actions">
                <button class="btn btn-secondary" onclick="window.backToSelection()">← Changer de quiz</button>
                <button class="btn btn-primary" onclick="window.startMcqQuiz()">Démarrer le Quiz</button>
            </div>
        </div>
    `;
}

/**
 * Remplit les filtres pour le quiz Pharmacologie
 */
function populatePharmaCourseFilters() {
    const families = quizInstance.getFamilies();
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
    
    const domains = quizInstance.getAvailableDomains();
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
 * Remplit les filtres pour le quiz MCQ
 */
function populateMcqFilters() {
    const types = quizInstance.getTypes();
    const typesContainer = document.getElementById('typesContainer');
    typesContainer.innerHTML = '';
    
    types.forEach(type => {
        const label = document.createElement('label');
        label.className = 'filter-label';
        label.innerHTML = `
            <input type="checkbox" class="type-checkbox" value="${type}" checked>
            ${type === 'memorization' ? '📚 Mémorisation' : '⚠️ Sécurité'}
        `;
        typesContainer.appendChild(label);
    });
    
    const themes = quizInstance.getThemes();
    const themesContainer = document.getElementById('themesContainer');
    themesContainer.innerHTML = '';
    
    themes.forEach(theme => {
        const label = document.createElement('label');
        label.className = 'filter-label';
        label.innerHTML = `
            <input type="checkbox" class="theme-checkbox" value="${theme}" checked>
            ${theme}
        `;
        themesContainer.appendChild(label);
    });
}

/**
 * Démarre le quiz Pharmacologie
 */
window.startPharmaCourseQuiz = function() {
    const selectedFamilies = Array.from(document.querySelectorAll('.family-checkbox:checked'))
        .map(cb => cb.value);
    const selectedDomains = Array.from(document.querySelectorAll('.domain-checkbox:checked'))
        .map(cb => cb.value);
    const count = parseInt(document.getElementById('questionsCount').value);
    
    quizInstance.generateFilteredQuiz(count, selectedFamilies, selectedDomains);
    
    console.log(`▶ Quiz Pharmacologie démarré: ${count} questions`);
    displayPharmaCourseQuestion();
    showScreen('quizScreen');
};

/**
 * Démarre le quiz MCQ
 */
window.startMcqQuiz = function() {
    const selectedTypes = Array.from(document.querySelectorAll('.type-checkbox:checked'))
        .map(cb => cb.value);
    const selectedThemes = Array.from(document.querySelectorAll('.theme-checkbox:checked'))
        .map(cb => cb.value);
    const count = parseInt(document.getElementById('questionsCount').value);
    
    quizInstance.generateQuiz(count, {
        type: selectedTypes,
        theme: selectedThemes
    });
    
    console.log(`▶ Quiz Antibiotiques démarré: ${count} questions`);
    displayMcqQuestion();
    showScreen('quizScreen');
};

/**
 * Remplit les checkboxes des familles et domaines
 */
function populateFilters() {
    // Familles
    const families = quizInstance.getFamilies();
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
    const domains = quizInstance.getAvailableDomains();
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
 * Affiche la question actuelle (Pharmacologie)
 */
function displayPharmaCourseQuestion() {
    const question = quizInstance.getCurrentQuestion();
    const total = quizInstance.currentQuiz.length;
    const current = quizInstance.currentQuestionIndex + 1;
    
    document.getElementById('questionCounter').textContent = `${current}/${total}`;
    const progress = (current / total) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    
    let html = `
        <div class="question">
            <span class="question-type">Vrai/Faux</span>
            <div class="question-text">${question.question}</div>
    `;
    
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
    
    updateNavigationButtons(current, total, 'pharmacy');
}

/**
 * Affiche la question actuelle (MCQ)
 */
function displayMcqQuestion() {
    const question = quizInstance.getCurrentQuestion();
    const total = quizInstance.currentQuiz.length;
    const current = quizInstance.currentQuestionIndex + 1;
    
    document.getElementById('questionCounter').textContent = `${current}/${total}`;
    const progress = (current / total) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    
    let html = `
        <div class="question">
            <span class="question-type">${question.type === 'memorization' ? '📚 Mémorisation' : '⚠️ Sécurité'}</span>
            <div class="question-text">${question.variante}</div>
            <div class="answers">
    `;
    
    const selectedAnswer = quizInstance.userAnswers[quizInstance.currentQuestionIndex];
    
    question.reponsesMelangees.forEach((answer, index) => {
        const isSelected = selectedAnswer === answer;
        const ansId = `answer-${quizInstance.currentQuestionIndex}-${index}`;
        html += `
            <div class="answer-option ${isSelected ? 'selected' : ''}" 
                 style="background: ${isSelected ? '#fff5f8' : 'white'}; border-color: ${isSelected ? '#fa709a' : '#e0e0e0'};"
                 onclick="window.selectMcqAnswer('${answer.replace(/'/g, "\\'")}')">
                <input type="radio" id="${ansId}" name="answer" value="${answer}" ${isSelected ? 'checked' : ''}>
                <label for="${ansId}" style="cursor: pointer; margin: 0; padding: 0; flex: 1;">${answer}</label>
            </div>
        `;
    });
    
    html += `</div></div>`;
    document.getElementById('questionContent').innerHTML = html;
    
    updateNavigationButtons(current, total, 'mcq');
}

/**
 * Met à jour les boutons de navigation
 */
function updateNavigationButtons(current, total, quizType) {
    const prevBtn = document.querySelector('button[onclick="window.previousQuestion()"]');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = current === 1;
    
    if (current === total) {
        nextBtn.textContent = 'Terminer le quiz →';
        nextBtn.onclick = function() { window.finishQuiz(); };
    } else {
        nextBtn.textContent = 'Suivant →';
        nextBtn.onclick = function() { window.nextQuestion(); };
    }
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
    quizInstance.generateFilteredQuiz(count, selectedFamilies, selectedDomains);
    
    console.log(`▶ Quiz démarré:`);
    console.log(`  - ${count} questions`);
    console.log(`  - Familles: ${selectedFamilies.join(', ')}`);
    console.log(`  - Domaines: ${selectedDomains.join(', ')}`);
    
    displayPharmaCourseQuestion();
    showScreen('quizScreen');
}

/**
 * Sélectionne une réponse Vrai/Faux
 */
window.selectVFAnswer = function(value) {
    const question = quizInstance.getCurrentQuestion();
    question.userAnswer = value;
    
    document.querySelectorAll('.btn-vf').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
};

/**
 * Sélectionne une réponse MCQ
 */
window.selectMcqAnswer = function(answer) {
    quizInstance.setAnswer(answer);
    
    document.querySelectorAll('.answer-option').forEach(opt => {
        opt.classList.remove('selected');
        opt.style.background = 'white';
        opt.style.borderColor = '#e0e0e0';
    });
    
    event.target.closest('.answer-option').classList.add('selected');
    event.target.closest('.answer-option').style.background = '#fff5f8';
    event.target.closest('.answer-option').style.borderColor = '#fa709a';
};

/**
 * Passe à la question suivante
 */
window.nextQuestion = function() {
    if (currentQuizType === 'UE_2.3') {
        const question = quizInstance.getCurrentQuestion();
        if (question.userAnswer === null) {
            alert('⚠️ Veuillez sélectionner une réponse');
            return;
        }
    } else if (currentQuizType === 'UE_4.4.S2_antibiotiques') {
        if (quizInstance.userAnswers[quizInstance.currentQuestionIndex] === null) {
            alert('⚠️ Veuillez sélectionner une réponse');
            return;
        }
    }
    
    if (quizInstance.nextQuestion()) {
        if (currentQuizType === 'UE_2.3') {
            displayPharmaCourseQuestion();
        } else {
            displayMcqQuestion();
        }
    }
};

/**
 * Revient à la question précédente
 */
window.previousQuestion = function() {
    if (quizInstance.previousQuestion()) {
        if (currentQuizType === 'UE_2.3') {
            displayPharmaCourseQuestion();
        } else {
            displayMcqQuestion();
        }
    }
};

/**
 * Termine le quiz
 */
window.finishQuiz = function() {
    if (currentQuizType === 'UE_2.3') {
        const question = quizInstance.getCurrentQuestion();
        if (question.userAnswer === null) {
            alert('⚠️ Veuillez sélectionner une réponse');
            return;
        }
        
        quizInstance.score = 0;
        quizInstance.currentQuiz.forEach(q => {
            const isCorrect = quizInstance.normalizeAnswer(q.userAnswer) === 
                             quizInstance.normalizeAnswer(q.correctAnswer);
            if (isCorrect) quizInstance.score++;
        });
    } else if (currentQuizType === 'UE_4.4.S2_antibiotiques') {
        if (quizInstance.userAnswers[quizInstance.currentQuestionIndex] === null) {
            alert('⚠️ Veuillez sélectionner une réponse');
            return;
        }
        quizInstance.calculateScore();
    }
    
    displayResults();
};

/**
 * Affiche les résultats
 */
function displayResults() {
    let results, percentage;
    
    if (currentQuizType === 'UE_2.3') {
        results = quizInstance.getResults();
        percentage = Math.round((quizInstance.score / quizInstance.currentQuiz.length) * 100);
        
        document.getElementById('scoreDisplay').textContent = `${quizInstance.score}/${quizInstance.currentQuiz.length}`;
    } else if (currentQuizType === 'UE_4.4.S2_antibiotiques') {
        results = quizInstance.getResults();
        percentage = Math.round((quizInstance.score / quizInstance.currentQuiz.length) * 100);
        
        document.getElementById('scoreDisplay').textContent = `${quizInstance.score}/${quizInstance.currentQuiz.length}`;
    }
    
    document.getElementById('scorePercentage').textContent = `${percentage}%`;
    
    let feedback, className;
    if (percentage >= 90) {
        feedback = '🌟 Excellent! Vous avez une excellente compréhension!';
        className = 'excellent';
    } else if (percentage >= 75) {
        feedback = '👍 Très bon! Continuez comme ça!';
        className = 'good';
    } else if (percentage >= 60) {
        feedback = '📚 Correct, continuez à réviser!';
        className = 'average';
    } else {
        feedback = '💪 Ne vous découragez pas, pratiquez encore!';
        className = 'poor';
    }
    
    document.getElementById('feedback').textContent = feedback;
    document.getElementById('feedback').className = `results-feedback ${className}`;
    
    let reviewHtml = '';
    results.forEach((result, index) => {
        reviewHtml += `
            <div class="review-question ${result.isCorrect ? 'correct' : 'incorrect'}">
                <div class="review-q-number">Question ${index + 1} ${result.isCorrect ? '✓' : '✗'}</div>
                <div class="review-q-text"><strong>${result.question}</strong></div>
                <div class="review-answers-info">
                    <div class="review-answer-user">
                        Votre réponse: <strong>${result.userAnswer}</strong>
                    </div>
                    ${!result.isCorrect ? `<div class="review-answer-correct">Bonne réponse: <strong>${result.correctAnswer}</strong></div>` : ''}
                </div>
            </div>
        `;
    });
    
    document.getElementById('reviewAnswers').innerHTML = reviewHtml;
    showScreen('resultsScreen');
}

/**
 * Revient à la sélection du quiz
 */
window.backToSelection = function() {
    currentQuizType = null;
    quizInstance = null;
    showScreen('quizSelectionScreen');
};

/**
 * Réinitialise le quiz
 */
window.resetQuiz = function() {
    window.location.href = './home.html';
};

/**
 * Recommence le quiz
 */
window.retakeQuiz = function() {
    if (currentQuizType === 'UE_2.3') {
        setupPharmaCourseUI();
        populatePharmaCourseFilters();
    } else if (currentQuizType === 'UE_4.4.S2_antibiotiques') {
        setupMcqUI();
        populateMcqFilters();
    }
    quizInstance.reset();
    showScreen('startScreen');
};

/**
 * Affiche une erreur
 */
function showError(message) {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.innerHTML = `
        <div class="loading">
            <p style="color: #dc3545; font-weight: 600;">${message}</p>
            <button class="btn btn-secondary" onclick="window.backToSelection()" style="margin-top: 1rem;">
                Retour
            </button>
        </div>
    `;
}

/**
 * Ouvre le quiz depuis la page d'accueil
 */
window.openQuiz = function() {
    window.location.href = './quiz.html';
};
