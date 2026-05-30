# 🧪 Dossier Tests

Ce dossier contient les fichiers de test et de validation pour le projet IFSI Révision.

## 📋 Contenu

### Test Pages

| Fichier | Purpose | Usage |
|---------|---------|-------|
| **QUIZ_IMPLEMENTATION_STATUS.html** | Tableau de bord d'implémentation | Dashboard interactif montrant l'état des fonctionnalités |
| **TEST_NOM_COMMERCIAL.html** | Test de la fonctionnalité "Nom Commercial" | Validation de l'ajout du champ nom commercial aux médicaments |

---

## 🚀 Comment Utiliser

### 1. QUIZ_IMPLEMENTATION_STATUS.html
```bash
# Ouvrir directement dans le navigateur
open tests/QUIZ_IMPLEMENTATION_STATUS.html

# Ou via le serveur Python (recommandé)
python src/backend/app.py
# Puis accéder à http://localhost:5000/tests/QUIZ_IMPLEMENTATION_STATUS.html
```

**Fonctionnalités:**
- Vue d'ensemble des fonctionnalités implémentées
- Liens rapides vers les pages de test
- Dashboard de statut

### 2. TEST_NOM_COMMERCIAL.html
```bash
# Ouvrir directement dans le navigateur
open tests/TEST_NOM_COMMERCIAL.html

# Vérifier que:
# ✓ Le champ "Nom Commercial" s'affiche
# ✓ Les données sont sauvegardées correctement
# ✓ L'affichage est correct dans les listes
```

---

## 📝 Notes

- Ces fichiers sont **des utilitaires de développement/test**, pas des pages de production
- À ne pas inclure dans les builds de production
- Pour des tests réels, utiliser un framework de test (Jest, Cypress, etc.)

---

## 🔄 Ajout de Nouveaux Tests

Quand vous créez un nouveau test:

1. Créez le fichier dans ce dossier (`tests/`)
2. Documentez son purpose ici
3. Ajoutez un lien dans QUIZ_IMPLEMENTATION_STATUS.html
4. Nommez-le de manière claire: `test-[feature].html` ou `TEST_[FEATURE].html`

---

*Dossier créé le 30 mai 2026 lors du nettoyage du projet*
