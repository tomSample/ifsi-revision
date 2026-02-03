## 📖 Exemple: Ajouter un nouveau tableau récapitulatif

### Étape 1: Préparez votre fichier CSV

Créez un fichier avec le bon nom et format.

**Exemple:** `UE 2.5.S2 - Antibiotiques.csv`

**Contenu:**
```csv
Classe,Sous_classe,Medicament,Exemples,Indication_1,Indication_2,Mecanisme,IDE_Grave,IDE_2,Surveillance,Biologie,Antidote
Beta-lactamines,Penicillines,Amoxicilline,Augmentin,Infection ORL,Infection urinaire,Inhibition synthèse paroi,Allergie,Renal failure,Signes d'allergie,Fonction rénale,N/A
Beta-lactamines,Cephalosporines,Céfixime,Oroken,Infection ORL,Infection urinaire,Inhibition synthèse paroi,Allergie,Diarrhée,Signes d'allergie,Fonction rénale,N/A
```

### Étape 2: Placez le fichier dans le bon dossier

```
src/data/recap_charts/
    ├── UE 2.4.S1 - Traumatismes.csv
    ├── UE 2.5.S2 - Infections cutanées.csv
    ├── UE 2.5.S2 - Maladies éruptives pédiatriques.csv
    ├── UE 2.5.S2 - Antibiotiques.csv  ← NOUVEAU FICHIER
    └── UE 4.4.S1 - Familles de médicaments.csv
```

### Étape 3: Redémarrez le serveur (optionnel)

Le serveur recharge automatiquement, mais pour être sûr:
```bash
# Arrêtez le serveur (Ctrl+C)
# Redémarrez-le
python src/backend/app.py
```

### Étape 4: Vérifiez sur le site

1. Ouvrez le navigateur: `http://localhost:5000/src/frontend/pages/ide-management.html`
2. Sélectionnez le semestre: **S2**
3. Votre nouveau tableau **"UE 2.5.S2 - Antibiotiques"** s'affiche automatiquement! ✅

---

## 📐 Format du nom de fichier

**Format obligatoire:**
```
UE X.X.SX - Nom du tableau.csv
```

**Explication:**
- `UE` = littéralement "UE"
- `X.X.SX` = Numéro d'UE (ex: 2.5, 4.4, etc.) et semestre (S1, S2, S3, etc.)
- `-` = tiret pour séparation
- `Nom du tableau` = Texte libre (nom du tableau)
- `.csv` = extension fichier

**Exemples valides:**
- ✅ `UE 2.5.S2 - Antibiotiques.csv`
- ✅ `UE 4.4.S1 - Familles de médicaments.csv`
- ✅ `UE 2.4.S1 - Prise en charge des traumatismes.csv`
- ✅ `UE 3.1.S1 - Législation et déontologie.csv`

**Exemples invalides:**
- ❌ `Antibiotiques.csv` (pas d'UE)
- ❌ `2.5 - Antibiotiques.csv` (manque "UE" et "SX")
- ❌ `UE_2.5_Antibiotiques.csv` (tiret manquant après UE)

---

## 💡 Conseils

### 1. **Copier depuis un fichier existant**
```bash
# Copier un fichier existant
cp "src/data/recap_charts/UE 2.5.S2 - Infections cutanées.csv" \
   "src/data/recap_charts/UE 2.5.S2 - Antibiotiques.csv"

# Éditer le nouveau fichier
# Remplacer le contenu avec vos données
```

### 2. **Utiliser Excel ou LibreOffice**
1. Ouvrez une feuille de calcul
2. Remplissez vos données
3. Exportez en CSV (délimiteurs: virgule)
4. Enregistrez avec le bon nom

### 3. **Tester localement avant d'ajouter**
```bash
# Vérifier que le fichier est valide
curl http://localhost:5000/api/recap-charts/list

# Vous devriez voir votre fichier dans la réponse JSON
```

---

## 🔍 Vérification de l'API

Pour vérifier que votre fichier est bien détecté:

```bash
# PowerShell
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest -Uri "http://localhost:5000/api/recap-charts/list" | Select-Object -ExpandProperty Content | ConvertFrom-Json

# Vous devriez voir:
# {
#   "success": true,
#   "charts": [
#     "UE 2.5.S2 - Infections cutanées.csv",
#     "UE 2.5.S2 - Antibiotiques.csv",  ← NOUVEAU!
#     ...
#   ],
#   "count": 4
# }
```

---

## 🚨 Dépannage

**Problème:** Le fichier n'apparaît pas

**Vérifications:**
1. Le fichier est dans le bon dossier: `src/data/recap_charts/` ? 
2. Le nom suit le format: `UE X.X.SX - Nom.csv` ?
3. C'est un fichier CSV valide (pas XLSX, TXT, etc.) ?
4. Pas d'espaces inutiles au début/fin du nom ?

**Solution:** Ouvrez la console (F12) et regardez les logs:

```javascript
// Vous devriez voir dans la console:
// "📡 Chargement automatique des fichiers recap_charts..."
// "📊 X fichier(s) CSV trouvé(s) via l'API"
// "✓ Tableau chargé: UE X.X.SX - Nom.csv"
```

---

## 📋 Format CSV recommandé

Utilisez au minimum ces colonnes:

| Colonne 1 | Colonne 2 | Colonne 3 | Colonne 4 | Colonne 5 | ... |
|-----------|-----------|-----------|-----------|-----------|-----|
| Catégorie | Type | Nom principal | Exemples | Indication | ... |

**Exemple complet (Antibiotiques):**

```csv
Classe,Sous_classe,Medicament,Exemples_Commerciaux,Indication_1,Indication_2,Mecanisme_Action,IDE_Grave_1,IDE_2,Surveillance_Clinique,Surveillance_Biologique,Antidote
Beta-lactamines,Penicillines,Amoxicilline,"Augmentin, Clamoxyl",Infection ORL,Infection urinaire,Inhibition synthèse paroi,Réaction allergique,Diarrhée,Signes d'allergie,Fonction rénale,N/A
Beta-lactamines,Cephalosporines,Céfixime,Oroken,Infection ORL,Infection urinaire,Inhibition synthèse paroi,Réaction allergique,Diarrhée,Signes d'allergie,Fonction rénale,N/A
Macrolides,Azithromycine,Azithromycine,Zithromax,Infection ORL,Infection respiratoire,Inhibition protéine,Nausées,Arythmie,Symptômes GI,ECG si risque,N/A
```

---

## ✨ Résumé rapide

| Action | Commande/Étape |
|--------|-----------------|
| **Créer un fichier CSV** | Prénom.xlsx → export CSV |
| **Nommer le fichier** | `UE X.X.SX - Nom.csv` |
| **Placer le fichier** | `src/data/recap_charts/` |
| **Vérifier via API** | `curl http://localhost:5000/api/recap-charts/list` |
| **Voir sur le site** | http://localhost:5000/ide-management.html |
| **Aucune étape supplémentaire!** | ✅ C'est tout! |

---

**FAQ:**
- Q: Faut-il redémarrer le serveur? 
  A: Non, l'API détecte automatiquement
  
- Q: Combien de fichiers puis-je ajouter?
  A: Autant que vous voulez!
  
- Q: Est-ce que ça ralentit le site?
  A: Non, juste une requête API au chargement
  
- Q: Je peux éditer les fichiers après?
  A: Oui, les changements apparaissent au prochain rechargement

---

**Dernière mise à jour:** 3 Février 2026
