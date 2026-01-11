# 🚀 Guide de démarrage rapide - Quiz Pharmacologie

## ✅ Installation complète

Le quiz pharmacologie est **entièrement installé et prêt à l'emploi** !

## 📱 Comment accéder au quiz

### Option 1 : Via la page d'accueil (Recommandé)
1. Allez sur `/home.html`
2. Cliquez sur le bouton **"💊 Quiz Pharmacologie"**
3. Démarrez le quiz

### Option 2 : Accès direct
- Allez directement sur `/quiz.html`

### Option 3 : Test de diagnostic
- Allez sur `/test-quiz.html` pour vérifier que tout fonctionne

## 🎮 Utilisation

### Écran 1: Configuration
```
┌─────────────────────────────────────┐
│  💊 Quiz Pharmacologie              │
│                                     │
│  Prêt à réviser?                   │
│                                     │
│  Mode:                             │
│  ○ Mode Mixte (QCM + QCU)          │
│  ○ Seuls QCM                       │
│  ○ Seuls Vrai/Faux                 │
│                                     │
│  Questions: [10] (5-50)             │
│                                     │
│  [Démarrer le Quiz]                │
└─────────────────────────────────────┘
```

### Écran 2: Questions
```
Barre de progression: ████░░░░░░ 40%
Question 4/10

┌─────────────────────────────────────┐
│ [Vrai/Faux]                         │
│                                     │
│ Le Tramadol est un opioïde faible  │
│                                     │
│  [✓ Vrai]  [✗ Faux]                │
│                                     │
│ [← Précédent] [Suivant →]          │
└─────────────────────────────────────┘
```

### Écran 3: Résultats
```
┌─────────────────────────────────────┐
│  Résultats du Quiz                  │
│                                     │
│           8/10                      │
│         Votre score                │
│           80%                       │
│                                     │
│  👍 Très bon! Continuez!            │
│                                     │
│  Revue des réponses:               │
│  ✓ Question 1 (Correcte)           │
│  ✗ Question 2 (Incorrecte)         │
│  ...                                │
│                                     │
│  [Retour] [Recommencer]            │
└─────────────────────────────────────┘
```

## 🎯 Types de questions

### QCM (Choix Multiple)
```
Quel est le mécanisme d'action de l'ibuprofène?

○ Agoniste des récepteurs dopaminergiques
● Inhibition COX-1/2 → ↓ prostaglandines
○ Inhibition des protéines de transport
○ Inhibition de la synthèse d'ATP
```

### QCU (Vrai/Faux)
```
Le paracétamol peut causer une hépatotoxicité en cas de surdosage.

[✓ Vrai]  [✗ Faux]
```

## 📊 Interprétation des résultats

| Score | Feedback | Recommandation |
|-------|----------|-----------------|
| 90-100% | 🌟 Excellent! | Bravo! Continuez à cette cadence |
| 75-89% | 👍 Très bon! | De bonnes connaissances |
| 60-74% | 📚 Correct | Continuez à réviser! |
| <60% | 💪 À améliorer | Intensifiez votre révision |

## 🔧 Configuration du quiz

### Nombre de questions
- **Minimum**: 5 questions
- **Maximum**: 50 questions
- **Défaut**: 10 questions
- **Recommandé**: 10-15 pour une session courte

### Mode de réponse
- **Mode Mixte**: Alterne QCM et QCU (plus varié)
- **Seuls QCM**: Questions à choix multiple
- **Seuls Vrai/Faux**: Plus rapide et facile

## 💡 Conseils d'utilisation

### Pour les débutants
- Commencer avec 5-10 questions
- Mode Mixte pour variété
- Lire les explications après chaque réponse

### Pour la révision intensive
- 20-30 questions
- Refaire après quelques jours
- Suivre ses scores pour voir progression

### Pour la préparation d'examen
- 40-50 questions
- Mode Mixte ou seuls QCM
- Utiliser les révisions précédentes

## 📚 Contenu du quiz

### Couvert:
✅ Antalgiques (palier 1, 2, 3)
✅ Antipyrétiques
✅ AINS
✅ Corticoïdes
✅ Anticoagulants (HNF, HBPM, AVK, AOD)
✅ Antiagrégants
✅ Anticoagulants spécifiques

### Pour chaque médicament:
- Indications cliniques
- Mécanisme d'action
- Effets indésirables
- Surveillances cliniques
- Surveillances biologiques
- Antidotes

## 🐛 Problèmes et solutions

### "Le quiz ne charge pas"
1. Rafraîchir la page (Ctrl+F5)
2. Vérifier la console (F12)
3. S'assurer que `pharmaco.csv` existe dans `src/data/`

### "Les questions n'apparaissent pas"
1. Vérifier que `pharma-quiz.js` est chargé
2. Vérifier la console pour les erreurs
3. Essayer `test-quiz.html` pour diagnostiquer

### "Je veux recommencer"
- Cliquer "Recommencer" après les résultats
- Ou revenir à l'accueil et relancer

## 📖 Documentation complète

Pour plus de détails:
- [PHARMA_QUIZ_README.md](PHARMA_QUIZ_README.md) - Guide technique
- [PHARMA_QUIZ_IMPLEMENTATION.md](PHARMA_QUIZ_IMPLEMENTATION.md) - Détails implémentation
- Code source: `src/frontend/assets/scripts/modules/pharma-quiz.js`

## 🎓 Objectifs pédagogiques

Ce quiz aide à:
- ✓ Réviser la pharmacologie de manière interactive
- ✓ Tester la compréhension immédiatement
- ✓ Identifier les points faibles
- ✓ Obtenir du feedback explicatif
- ✓ Pratiquer régulièrement

## 🔄 Flux utilisateur recommandé

```
1. Session 1: 10 questions, Mode Mixte
   → Voir score et réviser erreurs

2. Attendre quelques jours

3. Session 2: 15 questions, Mode Mixte
   → Vérifier progression

4. Avant examen: 30-50 questions
   → Mode Seul QCM si besoin de préparer type exam

5. Jour de l'examen: 20 questions rapides
   → Réchauffer le cerveau!
```

## ✨ Caractéristiques principales

🎯 **Questions aléatoires** - Chaque session est différente
🔀 **Mix QCM/QCU** - Variété des types de réponse
💡 **Explications** - Feedback immédiat après réponse
📊 **Revue détaillée** - Revoir erreurs et explications
📱 **Responsive** - Fonctionne sur tous les appareils
⚡ **Rapide** - Aucun délai de chargement

## 📞 Support

Si vous avez des questions:
1. Consultez la documentation complète
2. Vérifiez la page test-quiz.html
3. Vérifiez la console (F12) pour erreurs

---

**Prêt à tester?** 🚀
👉 Cliquez sur "Quiz Pharmacologie" depuis l'accueil!

**Bon courage pour vos révisions!** 💊📚
