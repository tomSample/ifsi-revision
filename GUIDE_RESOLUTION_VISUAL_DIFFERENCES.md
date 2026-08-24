# 🔧 GUIDE DE RÉSOLUTION - Différences Visuelles Local vs GitHub Pages

## Problème en Un Mot
**La branche gh-pages manque 4 fichiers CSS + 1 fichier JS** qui sont chargés dans les HTML.

---

## ✅ Solution Rapide (15 minutes)

### Étape 1: Vérifier la branche gh-pages

```bash
cd "c:\Users\thoma\Desktop\IFSI Lannion 2025\app\révision 6"

# Voir le status
git status

# Voir la branche actuelle
git branch -a
```

### Étape 2: Aller sur la branche gh-pages

```bash
git fetch origin gh-pages
git checkout gh-pages
```

### Étape 3: Ajouter les fichiers manquants de main

```bash
# Récupérer les 4 fichiers CSS manquants
git checkout origin/main -- src/frontend/assets/styles/animations.css
git checkout origin/main -- src/frontend/assets/styles/design-system.css
git checkout origin/main -- src/frontend/assets/styles/layout.css
git checkout origin/main -- src/frontend/assets/styles/theme.css

# Récupérer le fichier JS manquant
git checkout origin/main -- src/frontend/assets/scripts/modules/mcq-quiz.js
```

### Étape 4: Committer et pusher

```bash
git add src/frontend/assets/styles/animations.css
git add src/frontend/assets/styles/design-system.css
git add src/frontend/assets/styles/layout.css
git add src/frontend/assets/styles/theme.css
git add src/frontend/assets/scripts/modules/mcq-quiz.js

git commit -m "fix: Add missing CSS and JS files to gh-pages branch

- animations.css: Animations and transitions
- design-system.css: Design tokens and components
- layout.css: Grid, flexbox, and responsive design
- theme.css: Theme colors and branding
- mcq-quiz.js: Multiple choice quiz module

These files were missing from gh-pages but are loaded in HTML files."

git push origin gh-pages
```

### Étape 5: Vérifier GitHub Pages

Allez sur: https://tomsample.github.io/ifsi-revision/

- La page devrait maintenant avoir les couleurs
- Les animations devraient fonctionner
- Le layout devrait être correct

---

## 🚀 Solution Robuste (1-2 heures)

### Mettre en place l'Automatisation avec GitHub Actions

#### 1. Créer le dossier `.github/workflows/`

```bash
mkdir -p .github/workflows
```

#### 2. Créer le fichier `.github/workflows/deploy.yml`

Voir le fichier [deploy.yml](#fichier-deploy) ci-dessous.

#### 3. Pusher la configuration

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: Add GitHub Actions workflow for automated deployment"
git push origin cleanup-optimization
```

#### 4. Créer un `public/index.html` principal

```html
<!DOCTYPE html>
<html>
<head>
    <title>IFSI Révisions 2025</title>
    <meta http-equiv="refresh" content="0; url=./src/frontend/pages/index.html">
</head>
<body>
    <p>Redirection vers <a href="./src/frontend/pages/index.html">l'application</a>...</p>
</body>
</html>
```

---

## 📝 Fichier: deploy.yml

Créer `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run build
      run: npm run build
    
    - name: Deploy to gh-pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./src
        publish_branch: gh-pages
        cname: # Laisser vide si pas de domaine custom
```

---

## 🔍 Vérification de la Correction

### Tester Localement

```bash
# Retour sur main
git checkout cleanup-optimization

# Lancer le serveur local
npm run dev

# Ouvrir http://localhost:5000
```

Vérifier:
- ✅ Les couleurs sont présentes (violet, bleu)
- ✅ Les animations fonctionnent
- ✅ Le layout est correct
- ✅ Les boutons sont stylisés
- ✅ Les quizz MCQ fonctionnent

### Tester sur GitHub Pages

```bash
# Attendre ~1 minute que GitHub Actions finisse
# Puis visiter https://tomsample.github.io/ifsi-revision/
```

Vérifier:
- ✅ Les couleurs sont présentes
- ✅ Les animations fonctionnent
- ✅ Le layout est correct

---

## 🐛 Dépannage

### Problème: Les fichiers CSS ne se chargent pas

**Cause Probable**: Le chemin relatif `../assets/` ne fonctionne pas sur GitHub Pages

**Solution**:
```javascript
// Dans le <head> des fichiers HTML:
<script>
  // Détecter GitHub Pages vs Local
  const isGitHubPages = window.location.hostname.includes('github.io');
  const basePath = isGitHubPages ? '/ifsi-revision' : '';
  window.BASE_PATH = basePath;
</script>

// Puis utiliser:
<link rel="stylesheet" href="${window.BASE_PATH}/src/frontend/assets/styles/theme.css">
```

### Problème: GitHub Pages affiche une page blanche

**Cause Probable**: Pas d'index.html dans la racine de gh-pages

**Solution**: Créer `public/index.html` avec redirection

### Problème: 404 Not Found sur GitHub Pages

**Cause Probable**: Les chemins des fichiers sont absolus au lieu de relatifs

**Solution**: Utiliser des chemins relatifs ou le système `BASE_PATH`

---

## 📊 Checklist de Validation

- [ ] Les 4 fichiers CSS manquants sont poussés vers gh-pages
- [ ] Le fichier mcq-quiz.js est poussé vers gh-pages
- [ ] GitHub Pages se recharge et affiche les couleurs
- [ ] Les animations fonctionnent
- [ ] Le layout est correct
- [ ] Le GitHub Actions workflow est créé
- [ ] Le workflow se déclenche à chaque push vers main
- [ ] Les déploiements futurs sont automatiques

---

## ⏱️ Timeline

**Aujourd'hui (1 heure)**:
1. Ajouter les 4 CSS + 1 JS à gh-pages (15 min)
2. Vérifier GitHub Pages (10 min)
3. Créer le GitHub Actions workflow (35 min)

**Demain**:
1. Tester l'automatisation
2. Documenter le processus

**Semaine prochaine**:
1. Refactoriser le build process (optionnel mais recommandé)
2. Migrer vers Webpack/Vite (pour plus tard)

---

## 📚 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Pages Deployment](https://docs.github.com/en/pages/getting-started-with-github-pages)
- [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages)

---

## 📞 Support

Si vous avez des questions:
1. Vérifiez le `diagnostic_summary.json`
2. Lire le rapport détaillé: `RAPPORT_DIAGNOSTIC_VISUAL_DIFFERENCES.md`
3. Vérifier les logs GitHub Actions: https://github.com/tomSample/ifsi-revision/actions

---

**Dernière mise à jour**: 24 août 2026
