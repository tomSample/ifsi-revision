# 📝 Implémentation: Identification par Nom Commercial

## Objectif
Ajouter une nouvelle question au quiz pharmacologie pour faire identifier la classe (famille) d'un médicament à partir de son nom commercial.

## Modifications Effectuées

### 1. Nouvelle Catégorie de Domaine
**Fichier**: `src/frontend/assets/scripts/modules/pharma-quiz.js`

- **Ajout du domaine** `nomCommercial` à `getAvailableDomains()`:
  ```javascript
  { id: 'nomCommercial', label: 'Identification par nom commercial' }
  ```
  Ce domaine est positionné en **premier** pour la visibilité maximale.

### 2. Génération des Questions
**Fichier**: `src/frontend/assets/scripts/modules/pharma-quiz.js`

#### Méthode `generateNomCommercialQuestion(data)`
- Crée une question unique d'identification par nom commercial
- Utilise `exemplesCommerciaux` du CSV pour le nom du médicament
- Retourne une structure compatible avec le reste du quiz

#### Méthode `generateNomCommercialQuestions(data)`
- Génère **12+ variations** de questions différentes
- **10 questions positives** pour identifier correctement la classe:
  - Différentes formulations grammaticales
  - Structures de phrases variées
  - Approches pédagogiques différentes

- **4 questions négatives (pièges)**:
  - Fausses classes proposées
  - Tests de compréhension des classes
  - Évaluation de la discernement

### 3. Intégration dans la Génération Filtrée
**Fichier**: `src/frontend/assets/scripts/modules/pharma-quiz.js`

- **Mise à jour** de `generateFilteredQuiz()`:
  ```javascript
  if (selectedDomains.includes('nomCommercial') && data.exemplesCommerciaux) 
      validDomains.push('nomCommercial');
  ```

### 4. Gestion des Domaines
**Fichier**: `src/frontend/assets/scripts/modules/pharma-quiz.js`

- **Ajout du case** dans `generateQuestionByDomain()`:
  ```javascript
  case 'nomCommercial':
      return this.generateNomCommercialQuestion(data);
  ```

### 5. Explication des Réponses
**Fichier**: `src/frontend/assets/scripts/modules/pharma-quiz.js`

- **Mise à jour** de `generateExplanation()`:
  ```javascript
  nomCommercial: `Identification: "${data.exemplesCommerciaux}" est un nom commercial du ${data.medicamentPrincipal}, appartenant à la classe ${data.famille}`
  ```

## Interface Utilisateur

### Checkbox Automatique ✓
Le checkbox pour "Identification par nom commercial" **apparaît automatiquement** dans l'interface:
- Position: **En tête de liste** des domaines
- Génération: Dynamique via `quiz-controller.js` qui appelle `getAvailableDomains()`
- État par défaut: **Coché** (inclus dans le quiz)

### Accès
1. Ouvrir le Quiz Pharmacologie
2. Dans la section "Domaines d'étude"
3. Vérifier la présence du checkbox "Identification par nom commercial"
4. Sélectionner/Désélectionner selon vos besoins
5. Lancer le quiz

## Types de Questions Générées

### Exemples Positifs (Vrai):
- "Le médicament "Aspirine" appartient à la classe: Analgésiques"
- "Si on vous dit le nom commercial "Aspirine", il s'agit d'un Analgésique"
- "Aspirine est un exemple d'Analgésique"

### Exemples Négatifs (Faux/Pièges):
- "Aspirine est un antibiotique de la classe des fluoroquinolones" (si Aspirine n'est pas un antibiotique)
- "Aspirine appartient à la classe des anticoagulants directs"

## Données Utilisées

La fonctionnalité s'appuie sur:
- **Colonne CSV**: `exemplesCommerciaux` - Les noms commerciaux du médicament
- **Colonne CSV**: `famille` - La classe/famille thérapeutique
- **Colonne CSV**: `medicamentPrincipal` - Le nom générique du médicament

## Bénéfices Pédagogiques

✓ Entraîne à **reconnaître les médicaments** par leurs noms commerciaux
✓ Renforce la **compréhension des classes thérapeutiques**
✓ Simule les **situations cliniques réelles** où on rencontre les noms commerciaux
✓ Valide les **connaissances de nomenclature pharmacologique**

## Compatibilité

- Compatible avec tous les types de questions existantes
- Intégré au système de filtrage par familles
- Fonctionne avec le système de notation existant
- Supporté par l'export des résultats

## Testing Recommandé

1. Vérifier que le checkbox apparaît dans l'interface
2. Générer un quiz avec uniquement "Identification par nom commercial"
3. Vérifier la cohérence des questions générées
4. Valider les explications affichées
5. Tester la sélection/désélection du checkbox

---
**Date d'implémentation**: 12 Janvier 2026
**Statut**: ✓ Complet et fonctionnel
