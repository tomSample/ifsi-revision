# 🧪 Tests Manuels - Option B

**Date:** 4 Décembre 2025  
**Branche:** refactor/project-structure-optimization  
**Testeur:** Product Manager / Dev Senior

---

## ✅ Test 1: Page d'Accueil et Navigation

### URL: http://localhost:5000/

**Éléments à tester:**
- [ ] La page se charge correctement
- [ ] La redirection vers `/src/frontend/pages/index.html` fonctionne
- [ ] Le CSS est appliqué (gradient violet)
- [ ] Le logo et titre sont visibles
- [ ] Les boutons "Se connecter" et "S'inscrire" sont présents
- [ ] Les boutons sont cliquables

**Résultat:**
- Status: ⏳ En attente de test
- Notes: 

---

## ✅ Test 2: Authentification Firebase

### 2.1 Page de Connexion
**URL:** http://localhost:5000/src/frontend/pages/login.html

**Éléments à tester:**
- [ ] La page se charge
- [ ] Formulaire de connexion visible
- [ ] Firebase config se charge (vérifier console développeur)
- [ ] Lien "Mot de passe oublié" fonctionne
- [ ] Lien "S'inscrire" redirige vers register.html

**Test de connexion:**
- [ ] Essayer connexion avec compte existant
- [ ] Vérifier redirection vers home.html après succès
- [ ] Tester message d'erreur si mauvais credentials

**Résultat:**
- Status: ⏳ En attente de test
- Notes: 

### 2.2 Page d'Inscription
**URL:** http://localhost:5000/src/frontend/pages/register.html

**Éléments à tester:**
- [ ] Formulaire d'inscription visible
- [ ] Création de compte fonctionne
- [ ] Validation email
- [ ] Redirection après inscription

**Résultat:**
- Status: ⏳ En attente de test
- Notes: 

---

## ✅ Test 3: Hub Principal (Home)

**URL:** http://localhost:5000/src/frontend/pages/home.html

**Éléments à tester:**
- [ ] Page se charge après authentification
- [ ] Navigation présente (Révision, Statistiques, Galerie, Admin)
- [ ] Carte de progression visible
- [ ] Boutons "Démarrer révision" fonctionnent
- [ ] Déconnexion fonctionne

**Résultat:**
- Status: ⏳ En attente de test
- Notes: 

---

## ✅ Test 4: Système de Révision

**URL:** http://localhost:5000/src/frontend/pages/revision.html

### 4.1 Chargement des Cours
**Éléments à tester:**
- [ ] Fichier courses.json se charge depuis `/src/data/courses.json`
- [ ] Liste des UE disponibles s'affiche
- [ ] Sélection nombre de termes fonctionne (5, 10, 15, 20, 30)

**Console développeur:**
```javascript
// Vérifier qu'il n'y a pas d'erreur:
// ❌ Failed to load resource: /ifsi_courses_2025-09-23.json
// ✅ Loaded: /src/data/courses.json
```

### 4.2 Flashcards
**Éléments à tester:**
- [ ] Terme s'affiche
- [ ] Bouton "Révéler" fonctionne
- [ ] Définition s'affiche après révélation
- [ ] Boutons d'évaluation (Facile, Moyen, Difficile) fonctionnent
- [ ] Progression s'incrémente (1/10, 2/10, etc.)

### 4.3 Algorithme SM-2
**Éléments à tester:**
- [ ] Les intervalles de révision sont calculés
- [ ] Synchronisation Firebase fonctionne
- [ ] Progression sauvegardée

**Résultat:**
- Status: ⏳ En attente de test
- Notes: 

---

## ✅ Test 5: Statistiques

**URL:** http://localhost:5000/src/frontend/pages/statistics.html

**Éléments à tester:**
- [ ] Page se charge
- [ ] Heatmap des 30 derniers jours s'affiche
- [ ] Graphiques Chart.js se chargent:
  - [ ] Graphique par UE
  - [ ] Taux de réussite
  - [ ] Progression temporelle
- [ ] Données Firebase se synchronisent
- [ ] Stats globales affichées (nombre de termes, taux réussite)

**Console développeur:**
```javascript
// Vérifier:
// ✅ Chart.js loaded
// ✅ Firebase data loaded
// ❌ Erreurs 404 ou CORS
```

**Résultat:**
- Status: ⏳ En attente de test
- Notes: 

---

## ✅ Test 6: Galerie d'Images

**URL:** http://localhost:5000/src/frontend/pages/gallery.html

**Éléments à tester:**
- [ ] Page se charge
- [ ] Images médicales s'affichent
- [ ] Métadonnées chargées depuis `/src/data/images_metadata.json`
- [ ] Filtres par catégorie fonctionnent
- [ ] Clic sur image ouvre modal/zoom
- [ ] Images WebP se chargent depuis `/public/images/`

**Vérifier dans Network Tab:**
```
✅ /public/images/anatomie-physiologie/*.webp
❌ /images/*.jpg (anciens chemins)
```

**Résultat:**
- Status: ⏳ En attente de test
- Notes: 

---

## ✅ Test 7: Admin - Upload de Cours

**URL:** http://localhost:5000/src/frontend/pages/admin.html

**Éléments à tester:**
- [ ] Page réservée aux admins se charge
- [ ] Formulaire d'upload .odt visible
- [ ] Test upload fichier .odt
- [ ] Extraction automatique des termes
- [ ] Preview du cours fonctionne
- [ ] Validation et ajout au JSON fonctionne

**API Backend:**
```
POST /api/upload-course
- Vérifie que app.py traite correctement
- Vérifie que courses.json est mis à jour
```

**Résultat:**
- Status: ⏳ En attente de test
- Notes: 

---

## ✅ Test 8: Performance & Optimisations

### 8.1 Chargement Initial
**Métriques à observer (DevTools > Network):**
- [ ] Taille totale chargée < 3 MB
- [ ] Temps de chargement < 3s
- [ ] Nombre de requêtes raisonnable

### 8.2 Assets Optimisés
**Vérifier que les assets sont bien servis:**
- [ ] Images WebP chargées (non JPG)
- [ ] CSS depuis `/src/frontend/assets/styles/`
- [ ] JS depuis `/src/frontend/assets/scripts/`

### 8.3 Service Worker (Optionnel)
**URL:** http://localhost:5000/public/service-worker.js
- [ ] Service Worker s'enregistre
- [ ] Cache v2 fonctionne
- [ ] Mode offline fonctionne (après cache)

**Résultat:**
- Status: ⏳ En attente de test
- Notes: 

---

## 📊 Résumé des Tests

### Tests Réussis: 0/8
### Tests Échoués: 0/8
### Tests en Attente: 8/8

---

## 🐛 Bugs Détectés

_Aucun pour l'instant_

### Bug #1
- **Page:** 
- **Description:** 
- **Sévérité:** 🔴 Critique / 🟠 Majeur / 🟡 Mineur
- **Résolution:** 

---

## ✅ Fonctionnalités Validées

_À remplir au fur et à mesure des tests_

---

## 📝 Notes Générales

- Serveur Flask: ✅ Démarré sur http://localhost:5000
- Environnement: Développement
- Navigateur de test: 

---

## 🚀 Prochaines Actions

Après tests:
- [ ] Corriger les bugs détectés
- [ ] Commit des corrections
- [ ] Re-tester les fonctionnalités corrigées
- [ ] Validation finale avant merge/déploiement
