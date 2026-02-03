# Auto-chargement des fichiers CSV - recap_charts

## � Deux modes: Local vs GitHub Pages

### Mode Local (Localhost) ✅
- **Automatique**: L'API Flask détecte les fichiers CSV
- Ajouter un fichier = Immédiatement visible
- Aucune modification de code

### Mode GitHub Pages ⚠️
- **Semi-automatique**: Fichiers doivent être listés manuellement
- Raison: GitHub Pages = contenu statique, pas d'API Python/Flask

---

## 📝 Comment ajouter un tableau

### Local (localhost:5000)
```
1. Créer: UE X.X.SX - Nom.csv
2. Placer: src/data/recap_charts/
3. Ouvrir le site
4. ✅ Visible automatiquement!
```

### GitHub Pages
```
1. Créer: UE X.X.SX - Nom.csv
2. Placer: src/data/recap_charts/
3. Éditer: src/frontend/pages/ide-management.html
4. Ajouter le nom à la liste csvFiles (ligne ~698)
5. Push vers GitHub
6. ✅ Visible après quelques secondes
```

**Exemple code à modifier:**
```javascript
const csvFiles = [
    'UE 2.5.S2 - Infections cutanées.csv',
    'UE 2.5.S2 - Maladies éruptives pédiatriques.csv',
    'UE 4.4.S1 - Familles de médicaments.csv',
    'UE X.X.SX - NOUVEAU TABLEAU.csv'  // ← AJOUTER ICI
];
```

---

## 🔍 Vérifier le mode

Ouvrir la console (F12) et regarder:
- **Local:** `[Local] 3 fichier(s) CSV`
- **GitHub Pages:** `[GitHub Pages] 3 fichier(s) CSV`

---

**Mise à jour:** 3 Février 2026 | **Statut:** ✅ Local + GitHub Pages supportés
