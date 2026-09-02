/**
 * MODULE PHARMA-QUIZ
 * Quiz pharmacologie avec QCM/QCU générés automatiquement
 * à partir du fichier pharmaco.csv
 */

class PharmaQuiz {
    constructor() {
        this.pharmaData = [];
        this.currentQuiz = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.quizActive = false;
        this.quizMode = 'mixed'; // 'qcm' (choix multiple), 'qcu' (vrai/faux), 'mixed'
        this.questionsPerQuiz = 10;
    }

    /**
     * Parse le CSV pharmacologie
     */
    async loadPharmaData() {
        try {
            // Essayer différents chemins
            const paths = [
                // Chemin relatif à partir de quiz.html
                '../../data/recap_charts/UE 4.4.S1 - Familles de médicaments.csv',
                // Chemin absolu
                '../../data/recap_charts/UE 4.4.S1 - Familles de médicaments.csv',
                // Chemin avec resolvePath
                (window.resolvePath ? window.resolvePath('/src/data/recap_charts/UE 4.4.S1 - Familles de médicaments.csv') : null)
            ].filter(p => p !== null);
            
            let csvText = null;
            let loadedFrom = null;
            
            for (const path of paths) {
                try {
                    console.log(`[PharmaQuiz] Essai de charger: ${path}`);
                    const response = await fetch(path);
                    if (response.ok) {
                        csvText = await response.text();
                        loadedFrom = path;
                        console.log(`✓ Chargé depuis: ${path}`);
                        break;
                    }
                } catch (err) {
                    console.log(`  ✗ Échec: ${err.message}`);
                    continue;
                }
            }
            
            if (!csvText) {
                throw new Error('Impossible de charger le fichier CSV');
            }
            
            this.parseCsvData(csvText);
            console.log(`✓ Pharmacologie chargée: ${this.pharmaData.length} entrées`);
            return true;
        } catch (error) {
            console.error('Erreur chargement pharmaco.csv:', error);
            return false;
        }
    }

    /**
     * Parse le contenu CSV avec la nouvelle structure (14 colonnes)
     */
    parseCsvData(csvText) {
        const rows = this.parseCSV(csvText);
        
        if (rows.length === 0) {
            console.error('CSV vide');
            return;
        }

        // Structure: Famille, Sous_type, Medicament_Principal, Exemples_Commerciaux, 
        // Indication_1, Indication_2, Mecanisme_Court, IDE_1_Grave, IDE_2, 
        // Surveillance_Clinique_1, Surveillance_Clinique_2, 
        // Surveillance_Biologique_1, Surveillance_Biologique_2, Antidote
        
        const headers = rows[0];
        
        for (let i = 1; i < rows.length; i++) {
            const values = rows[i];
            if (values.length >= 14) {
                this.pharmaData.push({
                    famille: (values[0] || '').trim(),
                    sousType: (values[1] || '').trim(),
                    medicamentPrincipal: (values[2] || '').trim(),
                    exemplesCommerciaux: (values[3] || '').trim(),
                    indication1: (values[4] || '').trim(),
                    indication2: (values[5] || '').trim(),
                    mecanismeCourt: (values[6] || '').trim(),
                    ide1Grave: (values[7] || '').trim(),
                    ide2: (values[8] || '').trim(),
                    surveillanceClinique1: (values[9] || '').trim(),
                    surveillanceClinique2: (values[10] || '').trim(),
                    surveillanceBiologique1: (values[11] || '').trim(),
                    surveillanceBiologique2: (values[12] || '').trim(),
                    antidote: (values[13] || '').trim()
                });
            }
        }
    }

    /**
     * Parse le CSV complet en tenant compte des guillemets et sauts de ligne
     */
    parseCSV(csvText) {
        const rows = [];
        let currentRow = [];
        let currentField = '';
        let insideQuotes = false;

        for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            const nextChar = csvText[i + 1];

            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    // Guillemet échappé
                    currentField += '"';
                    i++; // Sauter le prochain guillemet
                } else {
                    // Basculer état guillemets
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                // Fin de champ
                currentRow.push(currentField.trim());
                currentField = '';
            } else if ((char === '\n' || char === '\r') && !insideQuotes) {
                // Fin de ligne (sauf si dans guillemets)
                if (currentField || currentRow.length > 0) {
                    currentRow.push(currentField.trim());
                    if (currentRow.some(v => v.length > 0)) {
                        rows.push(currentRow);
                    }
                    currentRow = [];
                    currentField = '';
                }
                // Sauter \r\n
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }
            } else {
                currentField += char;
            }
        }

        // Ajouter le dernier champ et la dernière ligne
        if (currentField || currentRow.length > 0) {
            currentRow.push(currentField.trim());
        }
        if (currentRow.some(v => v.length > 0)) {
            rows.push(currentRow);
        }

        return rows;
    }

    /**
     * Génère les questions du quiz (QCU uniquement)
     */
    generateQuiz(count = this.questionsPerQuiz, mode = this.quizMode) {
        this.currentQuiz = [];
        const availableData = [...this.pharmaData].sort(() => Math.random() - 0.5);

        for (let i = 0; i < Math.min(count, availableData.length); i++) {
            const data = availableData[i];
            
            // Générer uniquement des QCU (questions vrai/faux)
            this.currentQuiz.push(this.generateQCU(data));
        }

        this.currentQuestionIndex = 0;
        this.score = 0;
        this.quizActive = true;
    }

    /**
     * Génère une question QCU (Vrai/Faux)
     * 40+ variantes de questions différentes
     * Énoncés très variés: structures grammaticales différentes
     * Fréquence augmentée des questions de surveillance (40%)
     */
    generateQCU(data) {
        const random = Math.random();
        let types = [];

        // 40% surveillance (IDE + biologiques + antidote)
        if (random < 0.4) {
            types = this.generateSurveillanceQuestions(data);
        } else {
            // 60% autres catégories
            const category = Math.random();
            if (category < 0.35) {
                types = this.generateIndicationQuestions(data);
            } else if (category < 0.65) {
                types = this.generateMecanismeQuestions(data);
            } else {
                types = this.generateEffetsQuestions(data);
            }
        }

        const chosen = types[Math.floor(Math.random() * types.length)];
        
        return {
            type: 'qcu',
            famille: data.famille,
            question: chosen.question,
            correctAnswer: chosen.answer,
            explanation: this.generateExplanation(data, chosen.field),
            userAnswer: null
        };
    }

    /**
     * Génère 10+ variations de questions sur surveillances
     */
    generateSurveillanceQuestions(data) {
        const surveillance1 = data.surveillanceClinique1 || data.surveillanceClinique2 || 'surveillance';
        const surveillance2 = data.surveillanceClinique2 || data.surveillanceClinique1 || '';
        const biologique1 = data.surveillanceBiologique1 || data.surveillanceBiologique2 || 'dosage';
        const biologique2 = data.surveillanceBiologique2 || data.surveillanceBiologique1 || '';
        const antidote = data.antidote;

        return [
            // Surveillances cliniques - positives
            { question: `${data.famille} nécessite une surveillance: "${surveillance1}"`, answer: true, field: 'surveillances' },
            { question: `On doit surveiller ${surveillance1} chez les patients prenant ${data.medicamentPrincipal}`, answer: true, field: 'surveillances' },
            { question: `La surveillance clinique de ${data.famille} inclut: ${surveillance1}`, answer: true, field: 'surveillances' },
            { question: `Chez un patient sous ${data.medicamentPrincipal}, il faut évaluer ${surveillance1}`, answer: true, field: 'surveillances' },
            
            // Surveillances biologiques - positives
            { question: `Pour ${data.famille}, il est important de vérifier: "${biologique1}"`, answer: true, field: 'biologiques' },
            { question: `On doit doser régulièrement ${biologique1} chez les patients recevant ${data.medicamentPrincipal}`, answer: true, field: 'biologiques' },
            { question: `La surveillance biologique de ${data.famille} comprend ${biologique1}`, answer: true, field: 'biologiques' },
            { question: `Avant de débuter ${data.medicamentPrincipal}, on demande un bilan incluant ${biologique1}`, answer: true, field: 'biologiques' },
            
            // Antidote - positif/négatif selon données
            { question: `L'antidote spécifique de ${data.famille} est le ${antidote}`, answer: !antidote.includes('Pas'), field: 'antidote' },
            { question: `En cas d'overdose de ${data.medicamentPrincipal}, il existe un antidote spécifique`, answer: !antidote.includes('Pas'), field: 'antidote' },
            { question: `${data.famille} a un antidote bien connu en pharmacologie`, answer: !antidote.includes('Pas'), field: 'antidote' },
            
            // Surveillances négatives (pièges)
            { question: `${data.medicamentPrincipal} nécessite une surveillance quotidienne de la température rectale`, answer: false, field: 'surveillances' },
            { question: `${data.famille} demande une autosurveillance du poids toutes les heures`, answer: false, field: 'surveillances' }
        ];
    }

    /**
     * Génère 10+ variations de questions sur indications
     */
    generateIndicationQuestions(data) {
        const med = data.medicamentPrincipal;
        const ind1 = data.indication1;
        const ind2 = data.indication2;

        return [
            // Positives - indication 1
            { question: `${med} est indiqué pour: "${ind1}"`, answer: true, field: 'indications' },
            { question: `L'indication principale de ${data.famille} est ${ind1}`, answer: true, field: 'indications' },
            { question: `On utilise ${med} en cas de ${ind1}`, answer: true, field: 'indications' },
            { question: `${ind1} est une indication reconnue pour ${med}`, answer: true, field: 'indications' },
            { question: `Pour traiter ${ind1}, on peut prescrire ${data.famille}`, answer: true, field: 'indications' },
            
            // Positives - indication 2
            { question: `${data.famille} est efficace contre ${ind2}`, answer: true, field: 'indications' },
            { question: `Chez un patient souffrant de ${ind2}, ${med} peut être prescrit`, answer: true, field: 'indications' },
            { question: `${med} est indiqué pour: "${ind2}"`, answer: true, field: 'indications' },
            
            // Négatives (pièges)
            { question: `${data.famille} est utilisé pour traiter l'asthme aigu grave`, answer: false, field: 'indications' },
            { question: `${med} est la première ligne de traitement du cancer`, answer: false, field: 'indications' },
            { question: `${data.famille} est indiqué dans le traitement de l'hypoglycémie aiguë`, answer: false, field: 'indications' },
            { question: `L'indication principale de ${data.famille} est la prévention de l'ostéoporose`, answer: false, field: 'indications' }
        ];
    }

    /**
     * Génère 10+ variations de questions sur mécanisme
     */
    generateMecanismeQuestions(data) {
        const meca = data.mecanismeCourt;

        return [
            // Positives
            { question: `${data.famille} agit par: "${meca}"`, answer: true, field: 'mecanisme' },
            { question: `Le mécanisme d'action de ${data.medicamentPrincipal} est ${meca}`, answer: true, field: 'mecanisme' },
            { question: `${data.medicamentPrincipal} fonctionne en ${meca}`, answer: true, field: 'mecanisme' },
            { question: `Le mode d'action de ${data.famille} implique ${meca}`, answer: true, field: 'mecanisme' },
            { question: `${data.medicamentPrincipal} agit sur l'organisme par ${meca}`, answer: true, field: 'mecanisme' },
            { question: `Pharmacologiquement, ${data.famille} exerce son effet via ${meca}`, answer: true, field: 'mecanisme' },
            
            // Négatives (pièges)
            { question: `${data.famille} fonctionne par inhibition des protéines de transport`, answer: false, field: 'mecanisme' },
            { question: `Le mécanisme d'action de ${data.medicamentPrincipal} est l'agonisme des récepteurs dopaminergiques`, answer: false, field: 'mecanisme' },
            { question: `${data.famille} agit uniquement sur le système nerveux central`, answer: false, field: 'mecanisme' },
            { question: `Le mécanisme d'action de ${data.medicamentPrincipal} est inconnu à ce jour`, answer: false, field: 'mecanisme' }
        ];
    }

    /**
     * Génère 10+ variations de questions sur effets indésirables
     */
    generateEffetsQuestions(data) {
        const ide1 = data.ide1Grave;
        const ide2 = data.ide2;

        return [
            // Positives - IDE 1 (grave)
            { question: `Un effet indésirable majeur de ${data.famille} est: "${ide1}"`, answer: true, field: 'effets' },
            { question: `${data.medicamentPrincipal} peut provoquer: ${ide1}`, answer: true, field: 'effets' },
            { question: `L'effet indésirable principal de ${data.famille} est ${ide1}`, answer: true, field: 'effets' },
            { question: `Parmi les effets indésirables de ${data.medicamentPrincipal}, on retrouve ${ide1}`, answer: true, field: 'effets' },
            
            // Positives - IDE 2
            { question: `Les patients sous ${data.famille} peuvent présenter ${ide2}`, answer: true, field: 'effets' },
            { question: `${ide2} est un effet indésirable attendu avec ${data.medicamentPrincipal}`, answer: true, field: 'effets' },
            { question: `Lors de la prescription de ${data.famille}, on informe le patient du risque de ${ide2}`, answer: true, field: 'effets' },
            
            // Négatives (pièges)
            { question: `${data.medicamentPrincipal} provoque régulièrement une amnésie totale`, answer: false, field: 'effets' },
            { question: `Un effet indésirable courant de ${data.famille} est l'euphorie prolongée`, answer: false, field: 'effets' },
            { question: `${data.medicamentPrincipal} provoque toujours une augmentation de 50kg chez les patients`, answer: false, field: 'effets' },
            { question: `${data.famille} provoque une dépendance physique chez 100% des patients`, answer: false, field: 'effets' }
        ];
    }

    /**
     * OBSOLÈTE: Génère une question QCM (Choix multiple)
     * Remplacé par QCU uniquement
     * Conservé pour compatibilité (retourne null)
     */
    generateQCM(data) {
        return null;
    }

    /**

     * Génère des réponses incorrectes
     */
    generateIncorrectAnswers(field, data) {
        const incorrectMap = {
            mecanisme: [
                'Inhibition des protéines de transport',
                'Agoniste des récepteurs dopaminergiques',
                'Inhibition de la synthèse d\'ATP'
            ],
            effets: [
                'Amnésie totale',
                'Augmentation de la tension artérielle',
                'Euphorie prolongée'
            ],
            surveillances: [
                'Température rectale toutes les 4 heures',
                'Dosage plasmatique du calcium',
                'Électrocardiogramme quotidien'
            ],
            indications: [
                'Traitement de l\'asthme aigu grave',
                'Prévention de l\'ostéoporose',
                'Traitement de l\'hypoglycémie'
            ]
        };

        return (incorrectMap[field] || []).slice(0, 3);
    }

    /**
     * Génère une explication
     */
    generateExplanation(data, field) {
        const classLabel = `${data.sousType || data.famille} (${data.famille})`;
        const explanations = {
            nomCommercial: `Identification: "${data.exemplesCommerciaux}" est un nom commercial du ${data.medicamentPrincipal}, appartenant à la classe ${classLabel}`,
            indications: `Indications: ${data.indication1}${data.indication2 ? ' et ' + data.indication2 : ''}`,
            mecanisme: `Mécanisme: ${data.mecanismeCourt}`,
            effets: `Effets indésirables: ${data.ide1Grave}${data.ide2 ? ' et ' + data.ide2 : ''}`,
            surveillances: `Surveillance clinique: ${data.surveillanceClinique1}${data.surveillanceClinique2 ? ' et ' + data.surveillanceClinique2 : ''}`,
            biologiques: `Surveillance biologique: ${data.surveillanceBiologique1}${data.surveillanceBiologique2 ? ' et ' + data.surveillanceBiologique2 : ''}`,
            antidote: `Antidote: ${data.antidote}`
        };
        return explanations[field] || '';
    }

    /**
     * Vérifie la réponse de l'utilisateur
     */
    checkAnswer(userAnswer) {
        const question = this.currentQuiz[this.currentQuestionIndex];
        const isCorrect = this.normalizeAnswer(userAnswer) === 
                         this.normalizeAnswer(question.correctAnswer);
        
        question.userAnswer = userAnswer;
        if (isCorrect) this.score++;
        
        return {
            isCorrect,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation
        };
    }

    /**
     * Normalise les réponses pour comparaison
     */
    normalizeAnswer(answer) {
        return String(answer).toLowerCase().trim();
    }

    /**
     * Obtient la question actuelle
     */
    getCurrentQuestion() {
        return this.currentQuiz[this.currentQuestionIndex];
    }

    /**
     * Passe à la question suivante
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuiz.length - 1) {
            this.currentQuestionIndex++;
            return true;
        }
        return false;
    }

    /**
     * Obtient les résultats du quiz
     */
    getResults() {
        const total = this.currentQuiz.length;
        const percentage = Math.round((this.score / total) * 100);
        
        return {
            score: this.score,
            total: total,
            percentage: percentage,
            questions: this.currentQuiz,
            passed: percentage >= 70
        };
    }

    /**
     * Réinitialise le quiz
     */
    reset() {
        this.currentQuiz = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.quizActive = false;
    }

    /**
     * Récupère les familles uniques
     */
    getFamilies() {
        const families = new Set();
        this.pharmaData.forEach(med => {
            if (med.famille) {
                families.add(med.famille);
            }
        });
        return Array.from(families).sort();
    }

    /**
     * Récupère les domaines disponibles
     */
    getAvailableDomains() {
        return [
            { id: 'nomCommercial', label: 'Identification par nom commercial' },
            { id: 'indications', label: 'Indications' },
            { id: 'mecanisme', label: 'Mécanisme' },
            { id: 'effets', label: 'Effets indésirables' },
            { id: 'surveillanceClinique', label: 'Surveillance clinique' },
            { id: 'surveillanceBiologique', label: 'Surveillance biologique' },
            { id: 'antidote', label: 'Antidote' }
        ];
    }

    /**
     * Génère un quiz filtré par familles et domaines
     */
    generateFilteredQuiz(count, selectedFamilies = null, selectedDomains = null) {
        // Si aucun filtre, sélectionner tous
        if (!selectedFamilies || selectedFamilies.length === 0) {
            selectedFamilies = this.getFamilies();
        }
        if (!selectedDomains || selectedDomains.length === 0) {
            selectedDomains = this.getAvailableDomains().map(d => d.id);
        }

        // Filtrer les données selon les familles sélectionnées
        const filteredData = this.pharmaData.filter(med => 
            selectedFamilies.includes(med.famille)
        );

        if (filteredData.length === 0) {
            console.warn('Aucune donnée trouvée pour les familles sélectionnées');
            return this.generateQuiz(count);
        }

        // Générer les questions avec les filtres appliqués
        this.currentQuiz = [];
        count = Math.min(count, filteredData.length * 6); // Limite maximale

        for (let i = 0; i < count; i++) {
            const data = filteredData[Math.floor(Math.random() * filteredData.length)];
            
            // Sélectionner un domaine aléatoire parmi les domaines choisis
            const validDomains = [];
            if (selectedDomains.includes('nomCommercial') && data.exemplesCommerciaux) validDomains.push('nomCommercial');
            if (selectedDomains.includes('indications') && (data.indication1 || data.indication2)) validDomains.push('indications');
            if (selectedDomains.includes('mecanisme') && data.mecanismeCourt) validDomains.push('mecanisme');
            if (selectedDomains.includes('effets') && (data.ide1Grave || data.ide2)) validDomains.push('effets');
            if (selectedDomains.includes('surveillanceClinique') && (data.surveillanceClinique1 || data.surveillanceClinique2)) validDomains.push('surveillanceClinique');
            if (selectedDomains.includes('surveillanceBiologique') && (data.surveillanceBiologique1 || data.surveillanceBiologique2)) validDomains.push('surveillanceBiologique');
            if (selectedDomains.includes('antidote') && data.antidote) validDomains.push('antidote');

            if (validDomains.length > 0) {
                const domain = validDomains[Math.floor(Math.random() * validDomains.length)];
                const question = this.generateQuestionByDomain(data, domain);
                if (question) {
                    this.currentQuiz.push(question);
                }
            }
        }

        this.quizActive = true;
        this.currentQuestionIndex = 0;
        return this.currentQuiz;
    }

    /**
     * Génère une question basée sur un domaine spécifique
     */
    generateQuestionByDomain(data, domain) {
        switch(domain) {
            case 'nomCommercial':
                return this.generateNomCommercialQuestion(data);
            case 'indications':
                return this.generateIndicationQuestion(data);
            case 'mecanisme':
                return this.generateMecanismeQuestion(data);
            case 'effets':
                return this.generateEffetsQuestion(data);
            case 'surveillanceClinique':
                return this.generateSurveillanceClinicalQuestion(data);
            case 'surveillanceBiologique':
                return this.generateSurveillanceBiologicalQuestion(data);
            case 'antidote':
                return this.generateAntidoteQuestion(data);
            default:
                return null;
        }
    }

    /**
     * Génère une question sur l'identification du médicament par son nom commercial
     */
    generateNomCommercialQuestion(data) {
        if (!data.exemplesCommerciaux) return null;
        const questions = this.generateNomCommercialQuestions(data);
        if (questions.length === 0) return null;
        const q = questions[Math.floor(Math.random() * questions.length)];
        return {
            question: q.question,
            correctAnswer: q.answer,
            explanation: this.generateExplanation(data, 'nomCommercial'),
            medicament: data.medicamentPrincipal,
            domaine: 'nomCommercial',
            userAnswer: null
        };
    }

    /**
     * Génère 12+ variations de questions sur identification par nom commercial
     * Enseigne à identifier la classe/famille d'un médicament à partir de son nom commercial
     */
    generateNomCommercialQuestions(data) {
        const nomComm = data.exemplesCommerciaux || 'ce médicament';
        const sousType = data.sousType || data.famille;
        const famille = data.famille;
        const med = data.medicamentPrincipal;
        const classLabel = `${sousType} (${famille})`;

        return [
            // Questions positives - identification famille à partir du nom commercial
            { question: `Le médicament "${nomComm}" appartient à la classe: ${classLabel}`, answer: true, field: 'nomCommercial' },
            { question: `"${nomComm}" est un médicament de la classe ${classLabel}`, answer: true, field: 'nomCommercial' },
            { question: `Si on vous dit le nom commercial "${nomComm}", il s'agit d'un ${classLabel}`, answer: true, field: 'nomCommercial' },
            { question: `${nomComm} est un exemple de ${classLabel}`, answer: true, field: 'nomCommercial' },
            { question: `La classe thérapeutique du médicament "${nomComm}" est ${classLabel}`, answer: true, field: 'nomCommercial' },
            { question: `"${nomComm}" est classé parmi les ${classLabel}`, answer: true, field: 'nomCommercial' },
            { question: `Le nom commercial "${nomComm}" correspond à un médicament ${classLabel}`, answer: true, field: 'nomCommercial' },
            { question: `${nomComm} figure dans la classe des ${classLabel}`, answer: true, field: 'nomCommercial' },
            { question: `Lorsqu'on rencontre le terme "${nomComm}", on identifie un ${classLabel}`, answer: true, field: 'nomCommercial' },
            { question: `${med} vendu sous le nom commercial "${nomComm}" est un ${classLabel}`, answer: true, field: 'nomCommercial' },
            
            // Questions négatives - faux noms ou fausses classes (pièges)
            { question: `"${nomComm}" est un antibiotique de la classe des fluoroquinolones`, answer: sousType.toLowerCase().includes('antibiotique') && sousType.toLowerCase().includes('fluoroquinolone'), field: 'nomCommercial' },
            { question: `${nomComm} appartient à la classe des anticoagulants directs`, answer: sousType.toLowerCase().includes('anticoagulant'), field: 'nomCommercial' },
            { question: `Le nom commercial "${nomComm}" correspond à une hormone thyroïdienne`, answer: sousType.toLowerCase().includes('thyroid'), field: 'nomCommercial' }
        ];
    }

    /**
     * Génère une question sur les indications
     */
    generateIndicationQuestion(data) {
        const questions = this.generateIndicationQuestions(data);
        if (questions.length === 0) return null;
        const q = questions[Math.floor(Math.random() * questions.length)];
        return {
            question: q.question,
            correctAnswer: q.answer,
            explanation: this.generateExplanation(data, 'indications'),
            medicament: data.medicamentPrincipal,
            domaine: 'indications',
            userAnswer: null
        };
    }

    /**
     * Génère une question sur le mécanisme
     */
    generateMecanismeQuestion(data) {
        const questions = this.generateMecanismeQuestions(data);
        if (questions.length === 0) return null;
        const q = questions[Math.floor(Math.random() * questions.length)];
        return {
            question: q.question,
            correctAnswer: q.answer,
            explanation: this.generateExplanation(data, 'mecanisme'),
            medicament: data.medicamentPrincipal,
            domaine: 'mecanisme',
            userAnswer: null
        };
    }

    /**
     * Génère une question sur les effets indésirables
     */
    generateEffetsQuestion(data) {
        const questions = this.generateEffetsQuestions(data);
        if (questions.length === 0) return null;
        const q = questions[Math.floor(Math.random() * questions.length)];
        return {
            question: q.question,
            correctAnswer: q.answer,
            explanation: this.generateExplanation(data, 'effets'),
            medicament: data.medicamentPrincipal,
            domaine: 'effets',
            userAnswer: null
        };
    }

    /**
     * Génère une question sur l'antidote
     */
    generateAntidoteQuestion(data) {
        if (!data.antidote) return null;
        
        const variations = [
            {
                question: `L'antidote du ${data.medicamentPrincipal} est le ${data.antidote}.`,
                correctAnswer: true,
                explanation: `Exact. L'antidote du ${data.medicamentPrincipal} est ${data.antidote}.`
            },
            {
                question: `La naloxone est l'antidote du ${data.medicamentPrincipal}.`,
                correctAnswer: data.antidote.toLowerCase().includes('naloxone'),
                explanation: `${data.antidote ? `L'antidote du ${data.medicamentPrincipal} est ${data.antidote}.` : 'Cet antidote ne correspond pas.'}`
            },
            {
                question: `${data.medicamentPrincipal} a un antidote.`,
                correctAnswer: !!data.antidote,
                explanation: `${data.antidote ? `Oui. L'antidote est ${data.antidote}.` : 'Non, ce médicament n\'a pas d\'antidote spécifique.'}`
            }
        ];

        const variation = variations[Math.floor(Math.random() * variations.length)];
        return {
            ...variation,
            medicament: data.medicamentPrincipal,
            domaine: 'antidote',
            userAnswer: null
        };
    }

    /**
     * Génère une question de surveillance clinique
     */
    generateSurveillanceClinicalQuestion(data) {
        const surveillances = [data.surveillanceClinique1, data.surveillanceClinique2].filter(s => s);
        if (surveillances.length === 0) return null;
        
        const surv = surveillances[Math.floor(Math.random() * surveillances.length)];
        
        const variations = [
            {
                question: `La surveillance clinique du ${data.medicamentPrincipal} comprend: ${surv}.`,
                correctAnswer: true,
                explanation: `Oui, il faut surveiller: ${surv}.`
            },
            {
                question: `Il est recommandé de surveiller ${surv} chez les patients prenant du ${data.medicamentPrincipal}.`,
                correctAnswer: true,
                explanation: `Oui, la surveillance clinique inclut: ${surv}.`
            },
            {
                question: `Pour ${data.medicamentPrincipal}, il n'y a pas besoin de surveillance clinique particulière.`,
                correctAnswer: false,
                explanation: `Faux, il faut surveiller: ${surv}.`
            }
        ];

        const variation = variations[Math.floor(Math.random() * variations.length)];
        return {
            ...variation,
            medicament: data.medicamentPrincipal,
            domaine: 'surveillanceClinique',
            userAnswer: null
        };
    }

    /**
     * Génère une question de surveillance biologique
     */
    generateSurveillanceBiologicalQuestion(data) {
        const surveillances = [data.surveillanceBiologique1, data.surveillanceBiologique2].filter(s => s);
        if (surveillances.length === 0) return null;
        
        const surv = surveillances[Math.floor(Math.random() * surveillances.length)];
        
        const variations = [
            {
                question: `La surveillance biologique du ${data.medicamentPrincipal} comprend: ${surv}.`,
                correctAnswer: true,
                explanation: `Oui, il faut surveiller biologiquement: ${surv}.`
            },
            {
                question: `Il est recommandé de doser: ${surv} chez les patients prenant du ${data.medicamentPrincipal}.`,
                correctAnswer: true,
                explanation: `Oui, la surveillance biologique inclut: ${surv}.`
            },
            {
                question: `Pour ${data.medicamentPrincipal}, aucun dosage sanguin n'est nécessaire.`,
                correctAnswer: false,
                explanation: `Faux, il faut surveiller biologiquement: ${surv}.`
            }
        ];

        const variation = variations[Math.floor(Math.random() * variations.length)];
        return {
            ...variation,
            medicament: data.medicamentPrincipal,
            domaine: 'surveillanceBiologique',
            userAnswer: null
        };
    }
}

// Export pour utilisation
window.PharmaQuiz = PharmaQuiz;
