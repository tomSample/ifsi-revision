# 📊 Chargement Automatique des Fichiers CSV - Récapitulatifs

## 🎯 Fonctionnalité

À partir de maintenant, **tous les fichiers CSV ajoutés au dossier `src/data/recap_charts/` sont automatiquement détectés et affichés sur le site** sans avoir besoin de modifier le code.

## 📁 Comment ça marche

### Architecture

1. **Backend (Flask)**
   - Nouvelle route API : `GET /api/recap-charts/list`
   - Cette route scanne le dossier `src/data/recap_charts/` et retourne la liste de tous les fichiers `.csv`
   - Localisation : `src/backend/app.py` (lignes 901-944)

2. **Frontend (JavaScript)**
   - Nouvelle fonction : `loadRecapChartsFromAPI()` dans `src/frontend/pages/ide-management.html`
   - Appelle l'API pour récupérer la liste des fichiers
   - Charge chaque fichier CSV trouvé automatiquement
   - Affiche les tableaux organisés par UE et semestre

### Flux d'exécution

```
1. Page ide-management.html se charge
   ↓
2. Fonction loadAllCharts() s'exécute
   ↓
3. Appel API : GET /api/recap-charts/list
   ↓
4. Backend scanne le dossier et retourne la liste des CSV
   ↓
5. Pour chaque CSV, appel de loadChartFromSource()
   ↓
6. Tableaux affichés à l'écran automatiquement
```

## 🚀 Utilisation

### Ajouter un nouveau tableau

**C'est simple !** Il suffit de placer un fichier CSV dans le dossier :
```
src/data/recap_charts/
```

**Format du nom de fichier :**
```
UE X.X.SX - Nom du tableau.csv
```

**Exemples :**
- `UE 2.5.S2 - Infections cutanées.csv` ✅
- `UE 4.4.S1 - Familles de médicaments.csv` ✅
- `UE 2.5.S2 - Maladies éruptives pédiatriques.csv` ✅

### Ce qui se passe ensuite

1. ✅ Le fichier est automatiquement détecté par l'API
2. ✅ Le tableau s'affiche dans la page "Fiches récapitulatives"
3. ✅ Il est filtré par le semestre sélectionné
4. ✅ Les données sont formatées et présentées correctement

**Aucune modification de code nécessaire !**

## 🔧 Configuration technique

### Route API

**Endpoint:** `GET /api/recap-charts/list`

**Réponse réussie:**
```json
{
  "success": true,
  "charts": [
    "UE 2.5.S2 - Infections cutanées.csv",
    "UE 2.5.S2 - Maladies éruptives pédiatriques.csv",
    "UE 4.4.S1 - Familles de médicaments.csv"
  ],
  "count": 3
}
```

**Réponse en cas d'erreur:**
```json
{
  "success": false,
  "error": "Message d'erreur",
  "charts": []
}
```

### Code JavaScript

**Localisation:** `src/frontend/pages/ide-management.html` (lignes 653-681)

```javascript
async function loadRecapChartsFromAPI() {
    // 1. Appel l'API
    const response = await fetch('/api/recap-charts/list');
    const data = await response.json();
    
    // 2. Pour chaque CSV, appelle loadChartFromSource()
    for (const filename of data.charts) {
        const path = `../../../src/data/recap_charts/${encodeURIComponent(filename)}`;
        await loadChartFromSource(path, filename);
    }
}
```

## 📋 Exigences pour les fichiers CSV

### Format du nom
- Doit commencer par l'UE : `UE X.X.SX`
- Suivi d'un tiret et d'un nom : `- Nom du tableau`
- Extension : `.csv`

### Contenu CSV
- Format standard CSV (virgule ou point-virgule comme séparateur)
- Première ligne = en-têtes
- Pas de lignes vides entre les données
- Encodage UTF-8 (support des accents)

**Exemple de structure :**
```csv
Famille,Sous_type,Medicament_Principal,Exemples_Commerciaux,Indication_1,Indication_2
Antalgique,Non opioïdes,Paracétamol,Doliprane,Douleur légère-modérée,Fièvre
```

## ✨ Avantages

- ✅ **Aucune maintenance de code** - Pas besoin de modifier le code à chaque ajout
- ✅ **Détection automatique** - L'API trouve les fichiers au moment où la page se charge
- ✅ **Extensibilité** - Ajoutez autant de tableaux que vous voulez
- ✅ **Performance** - L'API ne scanne qu'une seule fois au chargement
- ✅ **Fiabilité** - Gestion d'erreurs correcte si l'API n'est pas disponible

## 🔄 Mise à jour en direct

Quand vous ajoutez un nouveau fichier CSV :
1. **Dès votre prochaine visite** sur la page, le fichier sera automatiquement chargé
2. **Aucun redémarrage du serveur** n'est nécessaire
3. **Aucune modification de code** n'est requise

## 📝 Notes de développement

### Fallback mode
Si pour une raison quelconque l'API n'est pas disponible, le code JavaScript a un mode de repli (supprimé pour plus de clarté, mais peut être réactivé si nécessaire).

### Filtrage par semestre
Les tableaux sont automatiquement filtrés selon :
- Le semestre sélectionné dans le sélecteur (S1, S2, S3, etc.)
- L'UE dans le nom du fichier

### Tri alphabétique
Les fichiers CSV sont retournés triés alphabétiquement par le backend, garantissant un ordre cohérent.

## 🐛 Dépannage

**Problème:** Les tableaux ne s'affichent pas

**Solutions :**
1. Vérifiez que les fichiers CSV sont dans le bon dossier : `src/data/recap_charts/`
2. Vérifiez le nom du fichier (format : `UE X.X.SX - Nom.csv`)
3. Vérifiez le format du CSV (séparateur virgule/point-virgule, encodage UTF-8)
4. Ouvrez la console développeur (F12) pour voir les erreurs

**Conseil:** Dans la console, vous verrez des logs comme :
- `"📡 Chargement automatique des fichiers recap_charts..."`
- `"📊 3 fichier(s) CSV trouvé(s) via l'API"`
- `"✓ Tableau chargé: UE 2.5.S2 - Infections cutanées.csv"`

## 📚 Ressources

- [Documentation IDE Management](./docs/IDE_MANAGEMENT.md)
- [Structure des données](./docs/STRUCTURE_DONNEES.md)
- [API Backend](./docs/API_DOCUMENTATION.md)

---

**Mise à jour:** Février 2026  
**Statut:** ✅ Fonctionnel  
**Version:** 1.0
