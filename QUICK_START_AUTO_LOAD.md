# ⚡ Quick Start - Ajouter un Tableau en 30 secondes

## TL;DR (Trop long; Pas lu)

```
1. Créez un fichier: UE X.X.SX - Nom.csv
2. Placez-le: src/data/recap_charts/
3. Ouvrez le site
4. ✅ Voilà!
```

---

## Étapes Détaillées

### 1️⃣ Créer le fichier CSV

**Option A: Avec Excel**
- Ouvrez Excel
- Remplissez vos données
- Fichier → Enregistrer sous → Format CSV (séparé par virgule)
- Nom: `UE 2.5.S2 - Antibiotiques.csv`

**Option B: Copier un fichier existant**
```bash
cp "src/data/recap_charts/UE 2.5.S2 - Infections cutanées.csv" \
   "src/data/recap_charts/UE 2.5.S2 - Antibiotiques.csv"
# Puis éditez le contenu
```

### 2️⃣ Placer le fichier

```
C:\Users\thoma\Desktop\IFSI Lannion 2025\révision 6\
src\data\recap_charts\
    ↓
    UE 2.5.S2 - Antibiotiques.csv  ← PLACER VOTRE FICHIER ICI
```

### 3️⃣ Ouvrir le site

```
http://localhost:5000/src/frontend/pages/ide-management.html
```

### 4️⃣ Voilà! ✅

Votre tableau s'affiche automatiquement!

---

## Format du nom (Important!)

**Doit être:**
```
UE X.X.SX - Nom du tableau.csv
```

**Exemples:**
- ✅ `UE 2.5.S2 - Antibiotiques.csv`
- ✅ `UE 4.4.S1 - Familles de médicaments.csv`
- ✅ `UE 2.4.S1 - Traumatismes.csv`

**Ne pas:**
- ❌ `Antibiotiques.csv`
- ❌ `2.5 - Antibiotiques.csv`
- ❌ `Antibiotiques.xlsx`

---

## Format CSV (Recommandé)

**Première ligne = En-têtes**
```csv
Classe,Medicament,Indication,IDE,Surveillance
Beta-lactamines,Amoxicilline,Infection ORL,Allergie,Signes d'allergie
Macrolides,Azithromycine,Infection ORL,Nausées,Symptômes GI
```

**Séparateur:** Virgule `,`  
**Encodage:** UTF-8  
**Pas de lignes vides**

---

## Vérifier que ça marche

### Dans le navigateur
1. Ouvrez: http://localhost:5000/ide-management.html
2. Sélectionnez le semestre (ex: S2)
3. Votre UE s'affiche avec le tableau ✅

### Via l'API (Avancé)
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/recap-charts/list" | Select-Object -ExpandProperty Content
```

Vous devriez voir votre fichier dans la liste.

---

## FAQ 60 secondes

**Q: Faut-il éditer du code?**  
A: Non!

**Q: Faut-il redémarrer le serveur?**  
A: Non! L'API scanne automatiquement.

**Q: Combien de fichiers puis-je ajouter?**  
A: Autant que vous voulez!

**Q: Ça ralentit le site?**  
A: Non, juste une requête API au chargement.

**Q: Mon fichier n'apparaît pas?**  
A: Vérifiez le nom (`UE X.X.SX - Nom.csv`) et le dossier (`src/data/recap_charts/`).

---

## Dépannage rapide

| Problème | Solution |
|----------|----------|
| Fichier ne s'affiche pas | Vérifier le nom et le dossier |
| Erreur 404 | Le fichier CSV n'existe pas |
| Tableau vide | Vérifier le format CSV (séparateur virgule) |
| Tableau au mauvais semestre | Vérifier le S1/S2/etc. dans le nom |
| API ne répond pas | Redémarrer: `python src/backend/app.py` |

---

## Exemples concrets

### Ajouter un tableau Antibiotiques
```
1. Fichier: UE 2.5.S2 - Antibiotiques.csv
2. Placement: src/data/recap_charts/
3. Ouvrez le site → S2 → Vous voyez le tableau!
```

### Ajouter un tableau Pharmacologie
```
1. Fichier: UE 4.4.S1 - Cardiovasculaires.csv
2. Placement: src/data/recap_charts/
3. Ouvrez le site → S1 → Vous voyez le tableau!
```

### Ajouter 3 tableaux à la fois
```
1. Fichiers:
   - UE 2.5.S2 - Antibiotiques.csv
   - UE 2.5.S2 - Antiviraux.csv
   - UE 2.5.S2 - Antifongiques.csv
2. Placement: src/data/recap_charts/
3. Ouvrez le site → Les 3 tableaux s'affichent!
```

---

## Points clés à retenir

✨ **C'est tout ce que vous devez savoir:**

1. **Créer un CSV** avec le bon nom
2. **Placer dans** `src/data/recap_charts/`
3. **Ouvrir le site** → Automatique! ✅

---

## Pour aller plus loin

- 📖 [Guide complet](./docs/GUIDE_AJOUTER_TABLEAU.md)
- 📚 [Documentation technique](./RECAP_CHARTS_AUTO_LOAD.md)
- 📝 [Changelog](./CHANGELOG_AUTO_LOAD.md)

---

**Vous avez 30 secondes? Vous pouvez ajouter un tableau!** ⚡

**C'est fini!** 🎉
