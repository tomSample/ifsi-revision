(() => {
    'use strict';

    const state = { questionnaires: [], selectedUE: null };
    const elements = {
        uePanel: document.getElementById('uePanel'),
        ueCards: document.getElementById('ueCards'),
        pathologyPanel: document.getElementById('pathologyPanel'),
        pathologyCards: document.getElementById('pathologyCards'),
        pathologyTitle: document.getElementById('pathologyTitle'),
        quizPanel: document.getElementById('quizPanel'),
        quizTitle: document.getElementById('quizTitle'),
        quizDescription: document.getElementById('quizDescription'),
        questions: document.getElementById('questions')
    };

    const basePath = window.location.hostname.includes('github.io') ? '/ifsi-revision' : '';
    const escapeHtml = (value) => {
        const element = document.createElement('div');
        element.textContent = value || '';
        return element.innerHTML;
    };

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        try {
            const isGitHubPages = window.location.hostname.includes('github.io');
            const dataUrl = isGitHubPages
                ? '../../data/UE-2.8/td-questions.json'
                : `${basePath}/api/data/td-questions`;
            const response = await fetch(dataUrl, { cache: 'no-store' });
            if (!response.ok) throw new Error('Impossible de charger le tableau des questions TD.');
            const data = await response.json();
            state.questionnaires = Array.isArray(data.questionnaires) ? data.questionnaires : [];
            renderUEs(data.ue || 'UE');
        } catch (error) {
            elements.ueCards.innerHTML = `<p class="status error">${escapeHtml(error.message)}</p>`;
        }
        document.getElementById('backToUes').addEventListener('click', showUEs);
        document.getElementById('backToPathologies').addEventListener('click', showPathologies);
    }

    function renderUEs(ue) {
        elements.ueCards.innerHTML = `
            <button type="button" class="action-card choice-card" data-ue="${escapeHtml(ue)}">
                <span class="action-card-icon">🎓</span>
                <h4>${escapeHtml(ue)}</h4>
                <p>${state.questionnaires.length} pathologies disponibles</p>
            </button>`;
        elements.ueCards.querySelector('[data-ue]').addEventListener('click', () => {
            state.selectedUE = ue;
            renderPathologies();
        });
    }

    function renderPathologies() {
        elements.pathologyTitle.textContent = `Pathologies de ${state.selectedUE}`;
        elements.pathologyCards.innerHTML = state.questionnaires.map((item, index) => `
            <button type="button" class="action-card choice-card" data-pathology-index="${index}">
                <span class="action-card-icon">🩺</span>
                <h4>${escapeHtml(item.titre)}</h4>
                <p>${escapeHtml(item.description)}</p>
            </button>`).join('');
        elements.pathologyCards.querySelectorAll('[data-pathology-index]').forEach((card) => {
            card.addEventListener('click', () => renderQuiz(state.questionnaires[Number(card.dataset.pathologyIndex)]));
        });
        elements.uePanel.classList.add('hidden');
        elements.quizPanel.classList.add('hidden');
        elements.pathologyPanel.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderQuiz(questionnaire) {
        elements.quizTitle.textContent = questionnaire.titre;
        elements.quizDescription.textContent = questionnaire.description;
        elements.questions.innerHTML = questionnaire.questions.map((question, index) => `
            <article class="question-card">
                <div class="question-number">Question ${index + 1} / ${questionnaire.questions.length}</div>
                <h4>${escapeHtml(question.question)}</h4>
                <button class="btn btn-primary" type="button" data-answer-index="${index}">Afficher la réponse</button>
                <div class="answer hidden" id="answer-${index}">
                    <strong>${escapeHtml(question.categorie || 'Réponse')}</strong>
                    <p>${escapeHtml(question.reponse)}</p>
                </div>
            </article>`).join('');
        elements.questions.querySelectorAll('[data-answer-index]').forEach((button) => {
            button.addEventListener('click', () => {
                document.getElementById(`answer-${button.dataset.answerIndex}`).classList.remove('hidden');
                button.remove();
            });
        });
        elements.pathologyPanel.classList.add('hidden');
        elements.quizPanel.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showUEs() {
        elements.pathologyPanel.classList.add('hidden');
        elements.quizPanel.classList.add('hidden');
        elements.uePanel.classList.remove('hidden');
    }

    function showPathologies() {
        elements.quizPanel.classList.add('hidden');
        elements.pathologyPanel.classList.remove('hidden');
    }
})();
