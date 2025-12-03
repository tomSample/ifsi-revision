# 🖼️ Guide d'Optimisation des Images

## Objectifs
- ⚡ Réduire le temps de chargement de 3x
- 📱 Améliorer l'expérience mobile
- 💾 Réduire la consommation de bande passante
- 🎯 Lazy loading natif

## 1. Conversion WebP

### Outils de conversion

#### En ligne de commande (npm)
```bash
# Installer imagemin
npm install -g imagemin-cli imagemin-webp

# Convertir toutes les images
imagemin images/**/*.{jpg,png} --plugin=webp --out-dir=images/
```

#### Avec un script Python
```python
# requirements.txt: Pillow

from PIL import Image
import os

def convert_to_webp(source_dir, quality=85):
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            if file.endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(root, file)
                webp_path = img_path.rsplit('.', 1)[0] + '.webp'
                
                try:
                    img = Image.open(img_path)
                    img.save(webp_path, 'webp', quality=quality, method=6)
                    print(f'✅ Converti: {webp_path}')
                except Exception as e:
                    print(f'❌ Erreur {img_path}: {e}')

# Utilisation
convert_to_webp('images/')
```

#### Outils en ligne (gratuits)
- https://squoosh.app/ (Google)
- https://cloudconvert.com/webp-converter

## 2. Utilisation du Lazy Loading

### Méthode 1: Natif (recommandé)
```html
<img src="image.webp" alt="Description" loading="lazy" decoding="async">
```

### Méthode 2: Avec ImageOptimizer.js
```javascript
// Créer une image optimisée
const img = ImageOptimizer.createOptimizedImage(
    'images/anatomie/coeur.jpg',
    'Anatomie du cœur',
    {
        lazy: true,
        width: 800,
        height: 600,
        className: 'anatomy-image'
    }
);

// L'ajouter au DOM
document.querySelector('.container').appendChild(img);
```

### Méthode 3: Data attributes
```html
<!-- HTML -->
<img 
    data-src="images/anatomie/coeur.webp" 
    alt="Anatomie du cœur"
    class="lazy-image"
    width="800" 
    height="600"
>

<!-- Le script image-optimizer.js s'occupe du chargement -->
```

## 3. Responsive Images

### Srcset pour différentes résolutions
```html
<img 
    src="image-800.webp"
    srcset="
        image-400.webp 400w,
        image-800.webp 800w,
        image-1200.webp 1200w
    "
    sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
    alt="Description"
    loading="lazy"
>
```

### Picture element pour différents formats
```html
<picture>
    <source type="image/webp" srcset="image.webp">
    <source type="image/jpeg" srcset="image.jpg">
    <img src="image.jpg" alt="Description" loading="lazy">
</picture>
```

## 4. Préchargement d'images critiques

```javascript
// Précharger les images importantes (hero, logo)
ImageOptimizer.preloadImages([
    '/images/logo.webp',
    '/images/hero-background.webp'
]);
```

## 5. Dimensions recommandées

| Type d'image | Largeur max | Qualité WebP | Poids cible |
|--------------|-------------|--------------|-------------|
| Hero/Banner  | 1920px      | 85%          | < 200KB     |
| Contenu      | 1200px      | 80%          | < 150KB     |
| Thumbnails   | 400px       | 75%          | < 30KB      |
| Icons        | 128px       | 90%          | < 10KB      |

## 6. CDN Cloudflare (Gratuit)

### Configuration
1. Créer un compte Cloudflare
2. Ajouter votre domaine
3. Activer "Polish" (compression auto)
4. Activer "Mirage" (lazy loading auto)
5. Activer "Auto Minify" pour CSS/JS

### Headers à ajouter
```html
<!-- Dans chaque page -->
<link rel="preconnect" href="https://cdn.cloudflare.com">
```

## 7. Checklist d'optimisation

- [ ] Toutes les images converties en WebP (avec fallback)
- [ ] Lazy loading activé sur toutes les images non-critiques
- [ ] Attributs `width` et `height` définis (évite layout shift)
- [ ] Images hero préchargées
- [ ] Compression WebP à 80-85% de qualité
- [ ] Images redimensionnées aux bonnes dimensions
- [ ] Service Worker met en cache les images
- [ ] CDN Cloudflare configuré (si domaine custom)

## 8. Mesurer l'impact

### Avant/Après avec Lighthouse
```bash
# Tester la performance
npx lighthouse https://votre-site.com --view
```

### Métriques clés
- **LCP** (Largest Contentful Paint): < 2.5s ✅
- **FID** (First Input Delay): < 100ms ✅
- **CLS** (Cumulative Layout Shift): < 0.1 ✅

### Monitoring
```javascript
// Dans la console du navigateur
const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource' && entry.initiatorType === 'img') {
            console.log(`Image: ${entry.name}`);
            console.log(`Taille: ${(entry.transferSize / 1024).toFixed(2)} KB`);
            console.log(`Temps: ${entry.duration.toFixed(0)} ms`);
        }
    }
});
observer.observe({ entryTypes: ['resource'] });
```

## 9. Script de conversion automatique

Créer un fichier `optimize-images.py`:

```python
from PIL import Image
import os
import sys

def optimize_images(directory, quality=85):
    """Convertit et optimise toutes les images d'un répertoire"""
    total_original = 0
    total_optimized = 0
    count = 0
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                original_path = os.path.join(root, file)
                webp_path = original_path.rsplit('.', 1)[0] + '.webp'
                
                try:
                    # Ouvrir et optimiser
                    img = Image.open(original_path)
                    
                    # Redimensionner si trop grand
                    max_width = 1920
                    if img.width > max_width:
                        ratio = max_width / img.width
                        new_height = int(img.height * ratio)
                        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                    
                    # Sauvegarder en WebP
                    img.save(webp_path, 'webp', quality=quality, method=6)
                    
                    # Statistiques
                    original_size = os.path.getsize(original_path)
                    optimized_size = os.path.getsize(webp_path)
                    total_original += original_size
                    total_optimized += optimized_size
                    count += 1
                    
                    reduction = ((original_size - optimized_size) / original_size) * 100
                    print(f'✅ {file} -> {os.path.basename(webp_path)} ({reduction:.1f}% de réduction)')
                    
                except Exception as e:
                    print(f'❌ Erreur {file}: {e}')
    
    if count > 0:
        total_reduction = ((total_original - total_optimized) / total_original) * 100
        print(f'\n📊 Résumé:')
        print(f'   Images traitées: {count}')
        print(f'   Taille originale: {total_original / (1024*1024):.2f} MB')
        print(f'   Taille optimisée: {total_optimized / (1024*1024):.2f} MB')
        print(f'   Réduction totale: {total_reduction:.1f}%')

if __name__ == '__main__':
    directory = sys.argv[1] if len(sys.argv) > 1 else 'images'
    print(f'🖼️ Optimisation des images dans: {directory}\n')
    optimize_images(directory)
```

Utilisation:
```bash
python optimize-images.py images/
```

## Impact attendu

### Avant optimisation
- Images PNG/JPG: ~500KB/image
- Chargement page: ~8s (3G)
- Score Lighthouse: 50-60

### Après optimisation
- Images WebP: ~150KB/image (70% de réduction)
- Chargement page: ~2.5s (3G) ⚡ **3x plus rapide**
- Score Lighthouse: 90-95 ✅

### Économies
- Bande passante: -70%
- Coûts CDN/hébergement: -60%
- Temps de chargement mobile: -66%
