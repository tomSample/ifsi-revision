if (!window.resolvePath) {
    const basePath = window.location.hostname.includes('github.io') ? '/ifsi-revision' : '';
    window.resolvePath = (path) => path.startsWith('/') ? basePath + path : path;
}

const listElement = document.getElementById('questionnaireList');
const viewElement = document.getElementById('questionnaireView');

function dataPath(path) {
    return window.resolvePath(`/src/data/${path}`);
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}

function renderQuestionnaireList(questionnaires) {
    const groups = questionnaires.reduce((accumulator, questionnaire) => {
        const ue = questionnaire.ue || 'Autres UE';
        (accumulator[ue] ||= []).push(questionnaire);
        return accumulator;
    }, {});

    listElement.innerHTML = Object.entries(groups)
        .sort(([ueA], [ueB]) => ueA.localeCompare(ueB, 'fr', { numeric: true }))
        .map(([ue, items]) => `
        <section class="ue-section">
            <h3 class="ue-title">${escapeHtml(ue)}</h3>
        ${items.sort((itemA, itemB) => itemA.titre.localeCompare(itemB.titre, 'fr')).map((item) => `
            <article class="questionnaire-card">
                    <div>
                        <h4>${escapeHtml(item.titre)}</h4>
                        <p>${escapeHtml(item.description || 'Questionnaire de révision')}</p>
                    </div>
                    <button class="button" type="button" data-questionnaire-index="${questionnaires.indexOf(item)}">
                        Commencer →
                    </button>
                </article>
            `).join('')}
        </section>
    `).join('');

    listElement.querySelectorAll('[data-questionnaire-index]').forEach((button) => {
        button.addEventListener('click', () => loadQuestionnaire(questionnaires[Number(button.dataset.questionnaireIndex)]));
    });
}

function renderQuestionnaire(questionnaire, data) {
    const questions = Array.isArray(data.questions) ? data.questions : [];
    if (!questions.length) {
        throw new Error('Ce questionnaire ne contient aucune question.');
    }

    viewElement.innerHTML = `
        <button class="button secondary" type="button" id="backToList">← Tous les questionnaires</button>
        <article class="question-card">
            <h2>${escapeHtml(data.titre || questionnaire.titre)}</h2>
            <p>${escapeHtml(data.description || questionnaire.description || '')}</p>
            <div class="question-list">
                ${questions.map((question, index) => `
                    <section class="question-card">
                        <div class="question-number">Question ${index + 1} / ${questions.length}</div>
                        <h3>${escapeHtml(question.question)}</h3>
                        <div class="answer" id="answer-${index}" hidden>
                            <strong>Réponse</strong>
                            <p>${escapeHtml(question.reponse)}</p>
                        </div>
                        <div class="question-actions">
                            <button class="button" type="button" data-answer-index="${index}" aria-controls="answer-${index}">
                                Afficher la réponse
                            </button>
                        </div>
                    </section>
                `).join('')}
            </div>
        </article>
    `;

    document.getElementById('backToList').addEventListener('click', showList);
    viewElement.querySelectorAll('[data-answer-index]').forEach((button) => {
        button.addEventListener('click', () => {
            const answer = document.getElementById(`answer-${button.dataset.answerIndex}`);
            answer.hidden = false;
            button.remove();
        });
    });
    listElement.classList.add('hidden');
    viewElement.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadQuestionnaire(questionnaire) {
    listElement.innerHTML = '<p class="status">Chargement du questionnaire…</p>';
    try {
        const response = await fetch(dataPath(questionnaire.fichier), { cache: 'no-store' });
        if (!response.ok) throw new Error(`Impossible de charger ${questionnaire.fichier}`);
        renderQuestionnaire(questionnaire, await response.json());
    } catch (error) {
        listElement.innerHTML = `<p class="status error">${escapeHtml(error.message)}</p>`;
    }
}

function showList() {
    viewElement.classList.add('hidden');
    listElement.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function init() {
    try {
        const response = await fetch(dataPath('questionnaires.json'), { cache: 'no-store' });
        if (!response.ok) throw new Error('Impossible de charger la liste des questionnaires.');
        const questionnaires = await response.json();
        if (!Array.isArray(questionnaires) || !questionnaires.length) {
            listElement.innerHTML = '<p class="empty-state">Aucun questionnaire disponible pour le moment.</p>';
            return;
        }
        renderQuestionnaireList(questionnaires);
    } catch (error) {
        listElement.innerHTML = `<p class="status error">${escapeHtml(error.message)}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', init);
