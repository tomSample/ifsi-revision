# 🎯 Guide de Test Rapide - IFSI Révision App

## ⚡ Test Express (5 minutes)

### 🔗 URLs Directes à Tester

Ouvrir ces URLs dans votre navigateur (le serveur doit être actif sur http://localhost:5000):

1. **Page d'accueil**  
   http://localhost:5000
   - ✅ Vérifie: Redirection automatique vers index.html

2. **Login**  
   http://localhost:5000/src/frontend/pages/login.html
   - ✅ Vérifie: Formulaire visible, Firebase charge

3. **Home (après login)**  
   http://localhost:5000/src/frontend/pages/home.html
   - ✅ Vérifie: Dashboard, navigation

4. **Révision**  
   http://localhost:5000/src/frontend/pages/revision.html
   - ✅ Vérifie: Chargement courses.json, flashcards

5. **Statistiques**  
   http://localhost:5000/src/frontend/pages/statistics.html
   - ✅ Vérifie: Graphiques Chart.js

6. **Admin**  
   http://localhost:5000/src/frontend/pages/admin.html
   - ✅ Vérifie: Upload ODT

---

## 🔍 Console Développeur

**Ouvrez la console (F12) et vérifiez:**

### ✅ Pas d'erreurs critiques:
```
❌ Failed to load resource: 404
❌ CORS error
❌ Uncaught TypeError
```

### ✅ Ressources chargées:
```
✅ /src/data/courses.json - 200 OK
✅ /src/frontend/assets/styles/style.css - 200 OK
✅ /src/frontend/assets/scripts/... - 200 OK
```

### ✅ Firebase initialisé:
```
✅ Firebase initialized
✅ Auth initialized
```

---

## 📊 Network Tab

### Vérifier les chemins:
```
✅ CSS depuis /src/frontend/assets/styles/
✅ JS depuis /src/frontend/assets/scripts/
✅ JSON depuis /src/data/
✅ Images depuis /public/images/ (si galerie testée)
```

### Vérifier la taille:
```
Total size loaded: < 3 MB pour page initiale
```

---

## ✅ Checklist Rapide

### Navigation
- [ ] Tous les liens entre pages fonctionnent
- [ ] Boutons de navigation visibles
- [ ] Pas de pages 404

### Authentification
- [ ] Login fonctionne
- [ ] Logout fonctionne
- [ ] Protection des pages (redirection si non authentifié)

### Fonctionnalités Core
- [ ] Révision: flashcards s'affichent
- [ ] Révision: évaluation (facile/moyen/difficile) fonctionne
- [ ] Statistiques: graphiques visibles
- [ ] Admin: formulaire upload visible

### Performance
- [ ] Chargement < 3 secondes
- [ ] Pas de freeze/lag
- [ ] Transitions fluides

---

## 🐛 Si Problèmes Détectés

### Problème: Page 404
**Solution:** Vérifier les chemins dans le HTML (doivent pointer vers `/src/frontend/...`)

### Problème: CSS ne charge pas
**Solution:** Vérifier `<link href="/src/frontend/assets/styles/..."`

### Problème: Firebase erreur
**Solution:** Vérifier firebase-config.js existe et contient les bonnes clés

### Problème: courses.json 404
**Solution:** Vérifier `fetch('/src/data/courses.json')` dans revision.js et statistics.js

---

## 📝 Rapport à Remplir

**Test effectué le:** _____________________

### Résultats:
- ✅ Tout fonctionne parfaitement
- ⚠️  Fonctionne avec quelques bugs mineurs (préciser ci-dessous)
- ❌ Problèmes majeurs (préciser ci-dessous)

### Bugs trouvés:
1. 
2. 
3. 

### Fonctionnalités validées:
- [ ] Navigation générale
- [ ] Authentification
- [ ] Système de révision
- [ ] Statistiques
- [ ] Galerie
- [ ] Admin

---

## 🚀 Après les Tests

Si tout fonctionne:
```bash
git add docs/TESTS_MANUELS.md
git commit -m "test: Validation manuelle réussie - Toutes fonctionnalités OK"
```

Si bugs trouvés:
1. Noter tous les bugs dans TESTS_MANUELS.md
2. Créer des issues/tasks pour les corrections
3. Corriger un par un
4. Re-tester

---

## ⏱️ Temps Estimé

- **Test rapide:** 5-10 minutes
- **Test complet:** 20-30 minutes
- **Test approfondi avec scenarios:** 45-60 minutes

**Recommandation:** Commencer par le test rapide (5 min) pour valider que tout charge correctement.
