# Sélecteur de Semestres - Documentation

## Vue d'ensemble

Le système de sélection de semestres permet aux utilisateurs de filtrer les cours et les révisions par semestre (S1, S2, etc.).

## Fonctionnalités

### 1. **Boutons toggles de sélection**
- Boutons situés en haut de chaque page (revision.html et browse-courses.html)
- Design moderne avec gradient au survol
- Indicateur visuel du semestre actif

### 2. **Filtrage automatique**
- Les cours sont automatiquement filtrés selon le semestre sélectionné
- Le filtre s'applique à :
  - **revision.html** : Listes des UE et termes disponibles
  - **browse-courses.html** : Affichage des cours et statistiques

### 3. **Pas de stockage persistent**
- Le choix du semestre n'est pas mémorisé dans localStorage
- Par défaut, le Semestre 1 (S1) est sélectionné au chargement
- Chaque visite de la page recommence à S1

## Architecture

### Module: `semester-selector.js`

Un module IIFE (Immediately Invoked Function Expression) qui gère :

```javascript
SemesterSelector.init(callback)        // Initialiser le sélecteur
SemesterSelector.getSemester()         // Récupérer le semestre actif
SemesterSelector.changeSemester(sem)   // Changer le semestre
SemesterSelector.filterCoursesBySemester(courses, semester) // Filtrer les cours
```

### Intégration dans les pages

#### revision.html
```javascript
// Initialisation (après le chargement des données)
SemesterSelector.init(onSemesterChanged);

// Callback personnalisé
function onSemesterChanged(semester) {
    currentSemester = semester;
    // Réextraire et filtrer les termes
    // Rafraîchir les listes d'UE
}
```

#### browse-courses.html
```javascript
// Initialisation
SemesterSelector.init(onSemesterChanged);

// Callback personnalisé
function onSemesterChanged(semester) {
    currentSemester = semester;
    filterByCurrentSemester(); // Raffraîchir l'affichage
    filterCourses(); // Réappliquer les autres filtres
}
```

## Structure des données

Les cours dans `courses.json` doivent avoir un champ `ue` au format :
```
"ue": "2.2.S1"   // Pour le Semestre 1
"ue": "2.2.S2"   // Pour le Semestre 2
```

Le module extrait le semestre automatiquement de ce champ.

## Filtrage

La fonction `filterCoursesBySemester(courses, semester)` filtre les cours en vérifiant que :
- Le champ `ue` du cours contient le semestre demandé
- Exemple : `"2.2.S1".includes("S1")` → `true`

## Styles

Le sélecteur inclut ses propres styles CSS injected au DOM :
- Boutons avec état actif/inactif
- Animations au survol
- Design responsive (mobile-first)
- Gradient de couleur pour l'état actif

## Améliorations futures

1. **Sauvegarde du semestre en localStorage** (optionnel)
2. **Support de semestres dynamiques** (génération automatique basée sur les données)
3. **Sélecteur d'année académique** (si plusieurs années sont ajoutées)
4. **Badges de disponibilité** (montre combien de cours par semestre)

## Exemple d'utilisation

### Pour ajouter un nouveau semestre

1. Ajouter des cours avec `"ue": "X.X.S3"` dans courses.json
2. Créer un bouton dans le sélecteur (le module se met à jour automatiquement)
3. Aucun code JavaScript supplémentaire n'est nécessaire

### Pour modifier le style

Éditer les styles dans `SemesterSelector.addStylesIfNeeded()` dans le fichier `semester-selector.js`.

## Débogage

Pour vérifier que le sélecteur fonctionne :

```javascript
// Dans la console du navigateur
SemesterSelector.getSemester()  // Affiche le semestre actif
```

Voir les logs pour le filtrage :
```
📚 Changement vers S1
✅ 15 termes disponibles pour S1
```
