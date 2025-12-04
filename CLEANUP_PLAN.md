# 🗂️ Plan de Nettoyage de la Racine

## ✅ Fichiers à GARDER à la racine

### Configuration Projet
- `.eslintrc.json` ✅
- `.gitignore` ✅
- `.prettierrc` ✅
- `package.json` ✅
- `README.md` ✅

### Scripts de démarrage
- `start-dev.bat` ✅
- `start-dev.sh` ✅

### Documentation (à déplacer dans docs/)
- `CHANGELOG.md` → `docs/`
- `IMAGE_OPTIMIZATION.md` → `docs/`
- `PERFORMANCE_OPTIMIZATIONS.md` → `docs/`
- `PHASE2_SUMMARY.md` → `docs/`
- `REFACTORING_STATUS.md` → `docs/`
- `STRUCTURE.md` → `docs/`
- `TESTS.md` → `docs/`

## ❌ Fichiers à SUPPRIMER (dupliqués dans src/)

### HTML Pages (tous dans src/frontend/pages/)
- `account.html` ❌
- `admin.html` ❌
- `browse-courses.html` ❌
- `gallery.html` ❌
- `home.html` ❌
- `index.html` ❌
- `login.html` ❌
- `logout.html` ❌
- `register.html` ❌
- `reset-password.html` ❌
- `revision.html` ❌
- `statistics.html` ❌

### JavaScript (tous dans src/frontend/assets/scripts/)
- `account.js` ❌
- `admin.js` ❌
- `analytics-config.js` ❌
- `analytics.js` ❌
- `app-config.js` ❌
- `auth-firebase.js` ❌
- `auth-guard.js` ❌
- `auth.js` ❌
- `firebase-config.js` ❌ (ATTENTION: vérifier config avant)
- `gallery.js` ❌
- `google-form-config.js` ❌
- `image-optimizer.js` ❌
- `logger.js` ❌
- `performance-utils.js` ❌
- `revision.js` ❌
- `smart-cache.js` ❌
- `spaced-repetition.js` ❌
- `statistics.js` ❌
- `sync-manager.js` ❌

### CSS (tous dans src/frontend/assets/styles/)
- `style.css` ❌
- `style-revision.css` ❌

### Données (dans src/data/)
- `ifsi_courses_2025-09-23.json` ❌
- `images_metadata.json` ❌

### PWA Assets (dans public/)
- `manifest.json` ❌
- `service-worker.js` ❌

### Dossiers anciens (contenus copiés)
- `css/` ❌ (contenu dans src/frontend/assets/styles/)
- `backend/` ❌ (si vide ou ancien)
- `data/` ❌ (contenu dans src/data/)

## 📁 Résultat Final Attendu

```
révision 6/
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── package.json
├── README.md
├── start-dev.bat
├── start-dev.sh
├── .git/
├── docs/              # Toute la documentation
├── images/            # Images sources (à optimiser)
├── public/            # Assets publics finaux
├── src/               # Code source organisé
├── tests/             # Tests
└── tools/             # Outils de dev
```

**Total: ~10-12 fichiers à la racine (au lieu de 50+)**
