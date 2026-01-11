# 📚 Quiz Pharmacologie - Documentation

## 🎯 Vue d'ensemble

Un système de quiz interactif pour réviser la pharmacologie basé sur le fichier `pharmaco.csv`. Propose des questions QCM (Choix Multiple) et QCU (Vrai/Faux) générées automatiquement.

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers :
1. **`src/frontend/assets/scripts/modules/pharma-quiz.js`**
   - Module principal qui charge et parse le CSV
   - Génère les questions QCM et QCU
   - Gère la logique du quiz

2. **`src/frontend/pages/quiz.html`**
   - Interface visuelle du quiz
   - Écrans: démarrage, questions, résultats
   - Design responsive avec gradient rose/jaune

3. **`src/frontend/pages/quiz-controller.js`**
   - Contrôleur qui gère l'interaction utilisateur
   - Affichage des questions
   - Calcul des résultats et feedback

4. **`public/js/modules/pharma-quiz.min.js`**
   - Version minifiée pour les performances

### Fichiers modifiés :
- **`src/frontend/pages/home.html`**
  - Ajout bouton "Quiz Pharmacologie" (💊)
  - Ajout style CSS pour le bouton
  - Ajout fonction `openPharmaQuiz()`

## 🚀 Comment utiliser

### 1. Accès au quiz
- Depuis la page d'accueil (home.html), cliquer sur le bouton **"Quiz Pharmacologie"**
- Ou accéder directement via `/quiz.html`

### 2. Configuration
- **Mode** : Mixte (QCM + QCU), Seuls QCM, Ou Seuls Vrai/Faux
- **Nombre de questions** : Entre 5 et 50 (défaut: 10)

### 3. Déroulement
- Chaque question s'affiche une par une
- QCM : Sélectionner la bonne réponse parmi 4 propositions
- QCU : Répondre Vrai ou Faux
- Barre de progression pour suivre l'avancement
- Navigation : Précédent/Suivant entre les questions

### 4. Résultats
- Score total et pourcentage
- Feedback adapté au score
- Revue détaillée de chaque réponse
- Explications pharmacologiques pour chaque question

## 📊 Génération des questions

### Types de questions

#### QCU (Vrai/Faux)
- "Le médicament X est utilisé pour Y"
- "X agit par mécanisme Y"
- "Un effet indésirable de X est Y"
- "L'antidote de X est Y" (basé sur données réelles)
- "X nécessite une surveillance de la créatininémie" (basé sur données)

#### QCM (Choix Multiple)
- "Quel est le mécanisme d'action de X?"
- "Quels sont les effets indésirables majeurs?"
- "Quelles sont les surveillances cliniques?"
- "Quelle est l'indication principale?"

Chaque question a 4 réponses (1 correcte + 3 distracteurs génériques).

## 🔄 Données pharmacologiques

Source : `src/data/pharmaco.csv`

Colonnes utilisées :
- Famille / sous-type (ex: "Antalgique palier 1")
- Principaux médicaments
- Indications clés
- Mécanisme d'action
- Effets indésirables majeurs
- Surveillances cliniques IDE
- Surveillances biologiques
- Antidote

Le module parse automatiquement ce fichier au démarrage du quiz.

## 💡 Fonctionnalités

✅ **Questions variées** : Mix automatique de QCM et QCU
✅ **Questions aléatoires** : Ordre et sélection randomisés
✅ **Feedback immédiat** : Correctif/Incorrect pour chaque réponse
✅ **Révision complète** : Revue détaillée avec explications
✅ **Scoring** : Calcul automatique avec pourcentage
✅ **Navigation** : Aller/retour entre questions
✅ **Responsive** : Fonctionne sur tous les écrans
✅ **Accessibilité** : Support des raccourcis clavier

## 🎨 Design

- **Gradient** : Rose (#fa709a) vers Jaune (#fee140)
- **Animations** : Transitions fluides entre écrans
- **Responsive** : Mobile-first design
- **Icônes** : Emojis pour faciliter la compréhension

## 🔧 Architecture

```
PharmaQuiz (classe)
├── loadPharmaData()      ← Charge le CSV
├── parseCsvData()        ← Parse les données
├── generateQuiz()        ← Génère les questions
├── generateQCM()         ← Crée questions QCM
├── generateQCU()         ← Crée questions Vrai/Faux
├── checkAnswer()         ← Vérifie les réponses
└── getResults()          ← Calcule le score

Quiz Controller
├── displayQuestion()     ← Affiche question actuelle
├── selectAnswer()        ← Enregistre réponse QCM
├── selectVFAnswer()      ← Enregistre réponse V/F
├── nextQuestion()        ← Navigate
├── finishQuiz()          ← Termine et calcule score
└── displayResults()      ← Affiche résultats
```

## 📝 Exemple de flux utilisateur

```
1. Clic sur "Quiz Pharmacologie" → quiz.html
2. Sélectionner mode (QCM/QCU/Mixte) et nombre de questions
3. Clic "Démarrer" → Première question
4. Sélectionner réponse → Clic "Suivant"
5. Répéter pour toutes les questions
6. Clic "Terminer" → Résultats
7. Revue des réponses avec explications
8. Clic "Recommencer" ou "Retour"
```

## 🐛 Dépannage

### Le quiz ne charge pas
- Vérifier que `pharmaco.csv` existe dans `src/data/`
- Vérifier la console (F12) pour les erreurs
- S'assurer que les scripts sont chargés : `pharma-quiz.js` et `quiz-controller.js`

### Les questions ne s'affichent pas
- Vérifier que le CSV est bien parsé (voir console)
- Vérifier le format du CSV (colonnes correct ordre)

### Les réponses ne sont pas enregistrées
- Vérifier que `selectAnswer()` est appelée
- Vérifier que `quiz-controller.js` est chargé

## 🔐 Sécurité

- Pas de données sensibles stockées
- Quiz local (pas d'appels API externes)
- Données CSV chargées en client-side

## 📈 Améliorations futures

- [ ] Sauvegarde des résultats en Firestore
- [ ] Statistiques par catégorie pharmacologique
- [ ] Système de spaced repetition pour les erreurs
- [ ] Explications scientifiques approfondies
- [ ] Mode exam (chronomètre, bloquage retour)
- [ ] Filtrage par famille de médicaments
- [ ] Questions par difficultés

## 📞 Support

Pour toute question ou amélioration, consultez :
- Le code source du module
- Les commentaires inline
- La structure du CSV

---

**Version** : 1.0
**Date** : 11/01/2026
**Auteur** : Assistant IA
