/**
 * Module Semester Selector
 * Gère la sélection du semestre pour filtrer les cours
 * Utilisation: SemesterSelector.init(callback)
 */
const SemesterSelector = (() => {
    let currentSemester = 'S1';
    let filterCallback = null;

    /**
     * Initialise le sélecteur de semestre
     * @param {Function} callback - Fonction à appeler lors d'un changement de semestre
     */
    function init(callback) {
        filterCallback = callback;
        createSelectorHTML();
        attachEventListeners();
    }

    /**
     * Crée le HTML du sélecteur de semestre
     */
    function createSelectorHTML() {
        // Vérifier si le sélecteur existe déjà
        if (document.getElementById('semesterSelector')) {
            return;
        }

        const selector = document.createElement('div');
        selector.id = 'semesterSelector';
        selector.className = 'semester-selector';
        selector.innerHTML = `
            <div class="semester-selector-content">
                <label for="semesterToggle" class="semester-label">📚 Semestre:</label>
                <div class="semester-buttons">
                    <button class="semester-btn active" data-semester="S1">
                        Semestre 1
                    </button>
                    <button class="semester-btn" data-semester="S2">
                        Semestre 2
                    </button>
                </div>
            </div>
        `;

        // Insérer après le header ou au début du main
        const header = document.querySelector('header');
        const main = document.querySelector('main');
        
        if (header) {
            header.insertAdjacentElement('afterend', selector);
        } else if (main) {
            main.insertAdjacentElement('beforebegin', selector);
        } else {
            document.body.insertAdjacentElement('afterbegin', selector);
        }

        // Ajouter les styles s'ils ne sont pas déjà présents
        addStylesIfNeeded();
    }

    /**
     * Attache les événements aux boutons
     */
    function attachEventListeners() {
        const buttons = document.querySelectorAll('.semester-btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const semester = this.getAttribute('data-semester');
                changeSemester(semester);
            });
        });
    }

    /**
     * Change le semestre sélectionné
     * @param {string} semester - Le semestre choisi (S1, S2, etc.)
     */
    function changeSemester(semester) {
        currentSemester = semester;
        
        // Mettre à jour l'affichage des boutons
        document.querySelectorAll('.semester-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-semester') === semester) {
                btn.classList.add('active');
            }
        });

        // Appeler la fonction de filtrage
        if (filterCallback) {
            filterCallback(semester);
        }
    }

    /**
     * Retourne le semestre actuellement sélectionné
     * @returns {string} Le semestre (S1, S2, etc.)
     */
    function getSemester() {
        return currentSemester;
    }

    /**
     * Filtre les cours en fonction du semestre
     * @param {Array} courses - Liste des cours
     * @param {string} semester - Le semestre à filtrer
     * @returns {Array} Les cours filtrés
     */
    function filterCoursesBySemester(courses, semester) {
        return courses.filter(([key, courseData]) => {
            // La clé ou le champ 'ue' doit contenir le semestre
            return courseData.ue && courseData.ue.includes(semester);
        });
    }

    /**
     * Ajoute les styles du sélecteur de semestre au DOM
     */
    function addStylesIfNeeded() {
        if (document.getElementById('semesterSelectorStyles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'semesterSelectorStyles';
        style.textContent = `
            .semester-selector {
                background: #f8f9fa;
                border-bottom: 2px solid #e9ecef;
                padding: 1rem;
                margin-bottom: 1.5rem;
            }

            .semester-selector-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .semester-label {
                font-weight: 600;
                color: #2c3e50;
                margin: 0;
                white-space: nowrap;
            }

            .semester-buttons {
                display: flex;
                gap: 0.5rem;
            }

            .semester-btn {
                padding: 0.6rem 1.2rem;
                border: 2px solid #dee2e6;
                background: white;
                color: #495057;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 0.95rem;
            }

            .semester-btn:hover {
                border-color: #667eea;
                color: #667eea;
                background: #f0f2ff;
                transform: translateY(-2px);
            }

            .semester-btn.active {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-color: #667eea;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }

            .semester-btn.active:hover {
                transform: translateY(-3px);
                box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
            }

            /* Mode mobile */
            @media (max-width: 768px) {
                .semester-selector-content {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .semester-buttons {
                    width: 100%;
                }

                .semester-btn {
                    flex: 1;
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // API publique
    return {
        init,
        getSemester,
        changeSemester,
        filterCoursesBySemester
    };
})();
