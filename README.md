# 📚 IFSI Lannion 2025 - Plateforme de Révision Intelligente

> Application web de révision avec répétition espacée (SM-2), authentification Firebase, et synchronisation cloud.

## ✨ Fonctionnalités Principales

### 🎯 **Système de Révision Intelligent**
- Algorithme SM-2 (Spaced Repetition) pour mémorisation optimale
- Sélection adaptative : priorité aux termes non-maîtrisés
- Sessions de 10 termes avec auto-évaluation
- Synchronisation progression Firestore (multi-device)
- Mode invité avec localStorage

### 🔐 **Authentification Firebase**
- Inscription/connexion par email
- Reset mot de passe
- Persistance de session configurable ("Se souvenir de moi")
- Protection automatique des routes (AuthGuard)
- Redirection intelligente après login

### 📊 **Statistiques & Analytics**
- Heatmap 30 jours d'activité
- Graphiques de progression par UE
- Taux de réussite en temps réel
- Export des données utilisateur
- Google Analytics 4 intégré

### 🖼️ **Galerie d'Images Médicales**
- Organisation par catégories (Anatomie, Systèmes, Normes)
- Lightbox avec zoom
- Lazy loading optimisé
- Recherche et filtres

### ⚙️ **Administration**
- Upload fichiers ODT (extraction automatique)
- Détection de doublons intelligente
- Gestion des métadonnées (UE, auteur, date)
- Aperçu avant validation

### 🎨 **Design System Moderne**
- 100+ variables CSS réutilisables
- Design accessible (WCAG 2.1 AA)
- Responsive mobile-first
- Dark mode ready (à activer)

---

## 🚀 Installation & Démarrage

### Prérequis
- Python 3.11+
- Compte Firebase (Firestore + Authentication)

### 1. Cloner le projet
```bash
git clone https://github.com/tomSample/ifsi-revision.git
cd "ifsi-revision/révision 6"
```

### 2. Installer les dépendances Python
```bash
pip install -r requirements.txt
```

### 3. Configurer Firebase
Créer `firebase-config.js` avec vos credentials :
```javascript
window.firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "votre-projet.firebaseapp.com",
    projectId: "votre-projet-id",
    storageBucket: "votre-projet.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

**⚠️ IMPORTANT** : `firebase-config.js` est dans `.gitignore` (ne jamais commiter)

### 4. Lancer l'application
```bash
python app.py
```
ou
```bash
start.bat  # Windows
```

Ouvrir http://localhost:5000

---

## 📁 Architecture du Projet

```
révision 6/
├── 🔥 NOUVEAUX FICHIERS (Refactoring Phases 1-4)
│   ├── logger.js              # Logger configurable dev/prod
│   ├── firebase-init.js       # Singleton Firebase (évite duplication)
│   ├── storage-manager.js     # Gestion centralisée localStorage
│   ├── utils.js               # Fonctions utilitaires (debounce, format, etc.)
│   └── shared-layouts.css     # Styles réutilisables (glassmorphism, auth-status)
│
├── 🎯 CORE MODULES
│   ├── spaced-repetition.js   # Algorithme SM-2
│   ├── sync-manager.js        # Synchronisation Firestore (✅ cache LRU ajouté)
│   ├── auth-guard.js          # Protection routes (✅ race condition corrigée)
│   ├── auth.js                # Logique authentification
│   ├── revision.js            # Session de révision
│   ├── statistics.js          # Calculs & visualisations
│   ├── gallery.js             # Galerie images
│   └── admin.js               # Upload & extraction ODT
│
├── 🎨 DESIGN SYSTEM
│   ├── design-system.css      # Variables CSS (462 lignes)
│   ├── accessibility.css      # WCAG 2.1 AA (~500 lignes)
│   ├── components.css         # Composants réutilisables (753 lignes)
│   ├── style.css              # Layouts principaux
│   └── style-revision.css     # Page révision
│
├── 📄 HTML PAGES (12 fichiers)
│   ├── index.html             # Landing page
│   ├── home.html              # Navigation authentifiée
│   ├── login.html / register.html / reset-password.html
│   ├── revision.html          # Interface révision
│   ├── statistics.html        # Dashboard stats
│   ├── gallery.html           # Images médicales
│   ├── admin.html             # Upload cours
│   ├── account.html           # Profil utilisateur
│   └── logout.html            # Déconnexion
│
├── 📊 DATA
│   ├── ifsi_courses_2025-09-23.json  # Base 500+ termes
│   └── images_metadata.json          # Catalogue images
│
├── 🖼️ ASSETS
│   ├── images/anatomie-physiologie/
│   ├── images/systemes/
│   └── images/normes/
│
├── 🐍 BACKEND
│   ├── app.py                 # Flask API (extraction ODT, stats)
│   └── requirements.txt       # Flask 2.3.3, python-odf 1.4.0
│
└── 📚 DOCUMENTATION
    ├── README.md              # Ce fichier
    ├── NEXT_STEPS.md          # Plan développement futur
    ├── FIREBASE_SETUP.md      # Config Firebase (sécurité)
    └── IMPLEMENTATION_FIREBASE.md  # Guide intégration
```

---

## 🔧 Technologies & Stack

### Frontend
- **HTML5, CSS3, JavaScript ES6+** (modules)
- **Firebase SDK 10.7.0** (Auth + Firestore)
- **Design System** : Variables CSS, Flexbox, Grid
- **Accessibilité** : WCAG 2.1 AA, prefers-reduced-motion
- **Analytics** : Google Analytics 4 (configuré)

### Backend
- **Python 3.11**
- **Flask 2.3.3** (API REST)
- **python-odf 1.4.0** (extraction .odt)
- **Flask-CORS 4.0.0** (CORS handling)

### Base de Données
- **Firestore** (progression utilisateur, sync cloud)
- **JSON local** (cours, cache)
- **localStorage** (mode invité, cache local)

### Algorithmes
- **SM-2 Spaced Repetition** (SuperMemo 2)
- **LRU Cache** (Least Recently Used - 1000 items max)

---

## 🎯 Améliorations Récentes (Phases 1-4)

### ✅ Phase 1 : Sécurité
- Firebase Security Rules vérifiées (users/{uid} owner only)
- Git history audité (aucun credential exposé)
- Logger.js créé (logs désactivés en production)

### ✅ Phase 2 : Corrections Bugs Critiques
- **Race condition** auth-guard.js corrigée (Promise singleton)
- **Fuite mémoire** sync-manager.js corrigée (cache LRU 1000 items)

### ✅ Phase 3 : Consolidation Code
- firebase-init.js : Singleton pattern (évite 12 duplications)
- storage-manager.js : Gestion robuste localStorage avec error handling
- utils.js : 15+ fonctions helper (debounce, throttle, format, escapeHtml)
- shared-layouts.css : Styles extraits (glassmorphism, auth-status)

### ✅ Phase 4 : Optimisation CSS
- 100+ rgba() remplacées par variables design-system
- Préparation minification (Phase 5+)

---

## 📊 Métriques Actuelles

| Métrique | Valeur |
|----------|--------|
| **Termes dans base** | 500+ |
| **UE disponibles** | 6 (2.2, 2.4, 3.1, 3.10, 4.1, 4.4) |
| **Cours** | 15 |
| **Images médicales** | 9 |
| **Score Architecture** | 8/10 ⭐ |
| **Score Sécurité** | 8/10 ⭐ (après Phase 1) |
| **Score UX/UI** | 9/10 ⭐ |

---

## 🔒 Sécurité

### ✅ Mesures Implémentées
- Firebase Security Rules strictes (lecture/écriture owner only)
- firebase-config.js dans .gitignore
- Validation côté serveur (Flask)
- CORS configuré
- Logger désactivé en production

### ⚠️ À Améliorer (Voir NEXT_STEPS.md)
- App Check Firebase (protection DDoS)
- Rate limiting Flask
- Input sanitization (XSS)
- HTTPS forcé (nginx reverse proxy en prod)

---

## 🧪 Tests

**État actuel** : Aucun test automatisé (0% coverage)

**Recommandé** (voir NEXT_STEPS.md) :
- Jest pour tests unitaires (spaced-repetition, sync-manager, utils)
- Cypress pour E2E (login, révision, statistics)
- Testing Library pour composants

---

## 📞 Support & Contact

- **Projet** : IFSI Lannion 2025
- **Stack** : HTML5, CSS3, JS ES6+, Python Flask, Firebase
- **License** : À définir
- **Auteur** : Thomas (tomSample)

---

## 📚 Documentation Complémentaire

- 📋 **NEXT_STEPS.md** : Phases 5-10 (Vite bundler, PWA, tests, CI/CD)
- 🔥 **FIREBASE_SETUP.md** : Configuration détaillée Firebase
- 🔧 **IMPLEMENTATION_FIREBASE.md** : Guide technique intégration

---

**Dernière mise à jour** : 2 décembre 2025  
**Version** : 2.0 (Après refactoring Phases 1-4)

    "ue": "2.2.S1",
    "title": "Titre du cours",
    "author": "Auteur",
    "date": "JJ/MM/AAAA"
  },
  "definitions": [
    {
      "term": "Terme",
      "definition": "Définition complète"
    }
  ]
}
```

## 📋 Format des Fichiers ODT

Les fichiers .odt doivent respecter cette structure :

```
UE 2.2.S1
titre : Titre du cours
auteur : nom_auteur
DD/MM/YYYY
========
1. Terme 1 : Définition du premier terme
2. Terme 2 : Définition du second terme
...
```

### Règles importantes :
- **Métadonnées** avant les séparateurs `========`
- **UE** : format "UE X.X.SX" 
- **Titre** : après "titre :" ou directement sur une ligne
- **Auteur** : après "auteur :" 
- **Date** : format JJ/MM/AAAA
- **Séparateur** : Au moins 4 signes `=`
- **Définitions** : Format "N. Terme : Définition"

---
*Projet développé pour IFSI Lannion 2025*