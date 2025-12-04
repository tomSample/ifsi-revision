# 📁 Structure du Projet - IFSI Révision App

## Organisation professionnelle

```
projet/
├── public/                      # Assets statiques accessibles publiquement
│   ├── images/                  # Images optimisées (WebP)
│   ├── icons/                   # Icônes PWA
│   ├── manifest.json            # Manifest PWA
│   └── service-worker.js        # Service Worker pour cache offline
│
├── src/
│   ├── backend/                 # Backend Python Flask
│   │   ├── app.py              # Point d'entrée Flask
│   │   ├── routes/             # Routes API
│   │   └── utils/              # Utilitaires backend
│   │
│   ├── frontend/
│   │   ├── assets/
│   │   │   ├── styles/         # Tous les CSS
│   │   │   │   ├── variables.css
│   │   │   │   ├── base.css
│   │   │   │   ├── components.css
│   │   │   │   └── ...
│   │   │   └── scripts/
│   │   │       ├── config/     # Configurations (Firebase, app, analytics)
│   │   │       ├── modules/    # Modules métier (revision, sync, stats)
│   │   │       ├── auth/       # Authentification
│   │   │       └── utils/      # Utilitaires (logger, cache, perf)
│   │   │
│   │   └── pages/              # Pages HTML
│   │       ├── index.html
│   │       ├── revision.html
│   │       └── ...
│   │
│   └── data/                   # Données statiques
│       ├── courses.json        # Base de données des cours
│       └── images_metadata.json
│
├── docs/                       # Documentation
│   ├── FIREBASE.md
│   ├── AJOUT_COURS.md
│   └── ...
│
├── tests/                      # Tests et fichiers de test
│   ├── test-api.html
│   └── test-google-form.html
│
├── tools/                      # Outils de développement
│   └── generate-icons.html
│
├── .eslintrc.json             # Configuration ESLint
├── .prettierrc                # Configuration Prettier
├── .gitignore                 # Fichiers à ignorer
├── package.json               # Dépendances Node.js
└── README.md                  # Documentation principale
```

## Changements par rapport à l'ancienne structure

### ✅ Améliorations
- **Séparation claire**: Backend / Frontend / Public
- **Modularité**: Scripts organisés par fonction
- **Standards**: Configuration linting et formatting
- **Clarté**: Chaque dossier a un rôle précis

### 🔄 Migrations à venir (Phase 2)
- Mise à jour des chemins dans les fichiers HTML
- Mise à jour du Service Worker
- Mise à jour de app.py pour les nouveaux chemins
- Tests de fonctionnement

## Utilisation

### Développement
```bash
npm run dev       # Lancer le serveur Flask
```

### Linting
```bash
npm run lint      # Vérifier le code JavaScript
npm run format    # Formater automatiquement le code
```
