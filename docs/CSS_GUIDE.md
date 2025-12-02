# 🎨 Guide d'Utilisation CSS Refactorisé

## 📦 Structure Modulaire

Le CSS a été refactorisé en modules réutilisables dans `/css/` :

```
css/
├── main.css        ← Point d'entrée (importer celui-ci)
├── variables.css   ← Design tokens (couleurs, espacements, etc.)
├── base.css        ← Reset + styles de base
├── components.css  ← Composants réutilisables
├── utilities.css   ← Classes utilitaires
├── admin.css       ← Spécifique à admin.html
└── revision.css    ← Spécifique à revision.html
```

---

## 🚀 Migration depuis style.css

### Avant (ancien)
```html
<link rel="stylesheet" href="style.css">
```

### Après (nouveau)
```html
<!-- 1. CSS principal (variables + base + components + utilities) -->
<link rel="stylesheet" href="css/main.css">

<!-- 2. CSS spécifique selon la page (optionnel) -->
<link rel="stylesheet" href="css/admin.css">     <!-- Pour admin.html -->
<link rel="stylesheet" href="css/revision.css">  <!-- Pour revision.html -->
```

---

## 💡 Avantages

### 1. Variables CSS Réutilisables
```css
/* Au lieu de */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Utiliser */
background: var(--color-bg-gradient);
```

### 2. Classes Utilitaires
```html
<!-- Au lieu de styles inline ou CSS custom -->
<div class="flex flex-center gap-md p-lg rounded-lg shadow-md">
  ...
</div>
```

### 3. Composants Standardisés
```html
<!-- Boutons -->
<button class="btn btn-primary">Valider</button>
<button class="btn btn-secondary">Annuler</button>

<!-- Cards -->
<div class="card">
  <h3 class="card-header">Titre</h3>
  <p>Contenu...</p>
</div>

<!-- Notifications -->
<div class="notification notification-success">
  ✅ Succès !
</div>
```

---

## 🎨 Design Tokens Disponibles

### Couleurs
```css
var(--color-primary)           /* #667eea */
var(--color-secondary)         /* #4facfe */
var(--color-success)           /* #28a745 */
var(--color-error)             /* #dc3545 */
var(--color-warning)           /* #ffc107 */
```

### Espacements
```css
var(--spacing-xs)  /* 0.5rem */
var(--spacing-sm)  /* 1rem */
var(--spacing-md)  /* 1.5rem */
var(--spacing-lg)  /* 2rem */
var(--spacing-xl)  /* 3rem */
```

### Typographie
```css
var(--font-size-xs)   /* 0.875rem */
var(--font-size-sm)   /* 1rem */
var(--font-size-md)   /* 1.125rem */
var(--font-size-lg)   /* 1.5rem */
var(--font-size-xl)   /* 2rem */
```

### Border Radius
```css
var(--radius-sm)    /* 8px */
var(--radius-md)    /* 12px */
var(--radius-lg)    /* 15px */
var(--radius-full)  /* 50px (boutons arrondis) */
```

---

## 📝 Exemples Pratiques

### Créer un Formulaire
```html
<div class="form-group">
  <label class="form-label">Email</label>
  <input type="email" class="form-input" placeholder="email@example.com">
</div>

<div class="form-group">
  <label class="form-label">Message</label>
  <textarea class="form-textarea" rows="4"></textarea>
</div>

<button class="btn btn-primary">Envoyer</button>
```

### Créer une Modal
```html
<div class="modal-overlay" id="myModal">
  <div class="modal-container">
    <div class="modal-header">
      <h3>Titre de la Modal</h3>
      <button onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <p>Contenu...</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Annuler</button>
      <button class="btn btn-primary">Confirmer</button>
    </div>
  </div>
</div>
```

### Layout Flex
```html
<!-- Centrer horizontalement et verticalement -->
<div class="flex flex-center gap-lg">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Espacer les items -->
<div class="flex flex-between p-md">
  <div>Gauche</div>
  <div>Droite</div>
</div>
```

---

## 🔧 Personnalisation

Pour personnaliser, modifier `css/variables.css` :

```css
:root {
  /* Changer la couleur primaire */
  --color-primary: #your-color;
  
  /* Ajuster les espacements */
  --spacing-md: 2rem;
  
  /* Modifier la typographie */
  --font-family: 'Your Font', sans-serif;
}
```

---

## 🌙 Dark Mode (préparé)

Le dark mode est préparé dans `variables.css` :

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-white: #1a1a1a;
    --color-text-primary: #f0f0f0;
    /* ... */
  }
}
```

Pour activer : Décommenter et ajuster les valeurs.

---

## 📦 Prochaine Étape : Migration Vite

Quand prêt pour un build tool :

```bash
npm create vite@latest
npm install

# Dans vite.config.js
import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
        revision: 'revision.html',
      }
    }
  }
});
```

---

## ✅ TODO : Migration HTML

- [ ] Mettre à jour tous les `<link rel="stylesheet">` dans les HTML
- [ ] Tester chaque page
- [ ] Valider responsive mobile
- [ ] Supprimer `style.css` et `style-revision.css` après validation

---

**Questions ?** Consulter `css/variables.css` pour la liste complète des tokens.
