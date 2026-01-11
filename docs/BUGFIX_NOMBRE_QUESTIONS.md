# 🐛 BUG FIX - Nombre de questions non respecté

## Problème identifié

Quand l'utilisateur choisissait 30 questions, le quiz n'en affichait que 3 environ.

### Cause racine

Le parser CSV ne chargeait que 3 médicaments au lieu de 52 disponibles.

**Raison:** Le parser original ne gérait pas correctement:
- Les sauts de ligne DANS les cellules (texte multi-ligne entre guillemets)
- Les guillemets échappés
- Les délimiteurs complexes

---

## Solution appliquée

### Avant (Broken)
```javascript
parseCSVLine(line) {
    // Parsait ligne par ligne
    // N'était pas capable de gérer les sauts de ligne
}

parseCsvData(csvText) {
    const lines = csvText.split('\n');  // ← Problème: cassait les cellules multi-lignes
    for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length === headers.length) {  // ← Rejetait les lignes malformées
            // ...
        }
    }
}
```

### Après (Fixed)
```javascript
parseCSV(csvText) {
    // Parsage complet respectant les guillemets et sauts de ligne
    // Utilise un state machine pour gérer les guillemets
    // Traite correctement les sauts de ligne DANS les cellules
}

parseCsvData(csvText) {
    const rows = this.parseCSV(csvText);  // ← Récupère TOUTES les lignes correctement
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        if (values.length >= 8) {  // ← Accepte les lignes valides
            // ...
        }
    }
}
```

---

## Changements détaillés

### 1. Nouvelle fonction `parseCSV()`
- Utilise un **state machine** pour gérer les guillemets
- Respecte les **sauts de ligne dans les cellules** (multi-lignes)
- Gère les **guillemets échappés** (`""`)
- Traite correctement **`\r\n` et `\n`**

### 2. Modification `parseCsvData()`
- Appelle `parseCSV()` au lieu d'une split simple
- Condition moins stricte: `values.length >= 8` au lieu de `===`
- Trim automatique de chaque valeur

### 3. Suppression `parseCSVLine()`
- Ancienne fonction remplacée par `parseCSV()`
- Pas plus utilisée

---

## Résultats

### Avant le fix
```
Chargement CSV... ❌
Entrées trouvées: 3
Questions générées (demandé: 30): 3
```

### Après le fix
```
Chargement CSV... ✓
Entrées trouvées: 52 ✓
Questions générées (demandé: 30): 30 ✓
```

---

## Test du fix

Pour vérifier que ça fonctionne:

### Option 1: Page de test
1. Aller à: `src/frontend/pages/test-parser.html`
2. Doit afficher "52 entrées chargées"
3. Doit générer "30 questions"

### Option 2: Console
```javascript
let quiz = new PharmaQuiz();
await quiz.loadPharmaData();
console.log(quiz.pharmaData.length);  // Doit afficher 52
quiz.generateQuiz(30, 'mixed');
console.log(quiz.currentQuiz.length); // Doit afficher 30
```

---

## Fichiers modifiés

1. **`src/frontend/assets/scripts/modules/pharma-quiz.js`**
   - Remplacé ancien parser par nouveau
   - Totalement rétrocompatible

2. **`public/js/modules/pharma-quiz.min.js`**
   - Mise à jour version minifiée

3. **`src/frontend/pages/test-parser.html`** (NEW)
   - Page de test pour diagnostiquer le parsing

---

## Impact

✅ **Nombre de questions maintenant respecté**
✅ **Toutes 52 entrées sont chargées**
✅ **Quiz peut avoir jusqu'à 50 questions**
✅ **Pas de breaking changes**
✅ **Performance maintenue**

---

## Vérification

Après le fix:
- Quiz de 5 questions: ✓ 5 questions
- Quiz de 10 questions: ✓ 10 questions
- Quiz de 30 questions: ✓ 30 questions ← **FIXED!**
- Quiz de 50 questions: ✓ 50 questions

---

**Bug corrigé et validé!** ✅
