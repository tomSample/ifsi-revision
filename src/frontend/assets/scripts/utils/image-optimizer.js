/**
 * IMAGE OPTIMIZER - Lazy Loading & WebP Support
 * Améliore les performances de chargement des images
 */

class ImageOptimizer {
    constructor() {
        this.observer = null;
        this.init();
    }

    /**
     * Initialiser l'Intersection Observer pour le lazy loading
     */
    init() {
        // Vérifier le support d'IntersectionObserver
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.loadImage(entry.target);
                            this.observer.unobserve(entry.target);
                        }
                    });
                },
                {
                    root: null,
                    rootMargin: '50px', // Charger 50px avant d'être visible
                    threshold: 0.01
                }
            );

            // Observer toutes les images avec data-src
            this.observeImages();
        } else {
            // Fallback: charger toutes les images immédiatement
            this.loadAllImages();
        }
    }

    /**
     * Observer toutes les images lazy
     */
    observeImages() {
        const lazyImages = document.querySelectorAll('img[data-src], img[data-srcset]');
        lazyImages.forEach(img => {
            this.observer.observe(img);
        });
    }

    /**
     * Charger une image
     */
    loadImage(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;

        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
        }

        if (srcset) {
            img.srcset = srcset;
            img.removeAttribute('data-srcset');
        }

        // Ajouter une classe pour les animations
        img.classList.add('loaded');
    }

    /**
     * Fallback: charger toutes les images
     */
    loadAllImages() {
        const lazyImages = document.querySelectorAll('img[data-src], img[data-srcset]');
        lazyImages.forEach(img => this.loadImage(img));
    }

    /**
     * Créer une image optimisée avec support WebP
     * @param {string} src - Chemin de l'image
     * @param {string} alt - Texte alternatif
     * @param {object} options - Options (lazy, sizes, etc.)
     * @returns {HTMLImageElement}
     */
    static createOptimizedImage(src, alt = '', options = {}) {
        const img = document.createElement('img');
        const {
            lazy = true,
            sizes = '100vw',
            className = '',
            width = null,
            height = null
        } = options;

        // Attributs de base
        img.alt = alt;
        if (className) img.className = className;
        if (width) img.width = width;
        if (height) img.height = height;

        // Support WebP avec fallback
        const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        const originalSrc = src;

        if (lazy) {
            // Lazy loading natif
            img.loading = 'lazy';
            img.decoding = 'async';
            
            // Utiliser data-src pour l'observer
            img.dataset.src = this.supportsWebP() ? webpSrc : originalSrc;
            
            // Placeholder: image 1x1 transparent
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        } else {
            img.src = this.supportsWebP() ? webpSrc : originalSrc;
        }

        // Attributs de responsive
        if (sizes) {
            img.sizes = sizes;
        }

        return img;
    }

    /**
     * Vérifier le support WebP
     * @returns {boolean}
     */
    static supportsWebP() {
        if (this._supportsWebP !== undefined) {
            return this._supportsWebP;
        }

        const canvas = document.createElement('canvas');
        if (canvas.getContext && canvas.getContext('2d')) {
            this._supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        } else {
            this._supportsWebP = false;
        }

        return this._supportsWebP;
    }

    /**
     * Précharger des images critiques
     * @param {string[]} urls - URLs des images à précharger
     */
    static preloadImages(urls) {
        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
        });
    }

    /**
     * Observer de nouvelles images ajoutées dynamiquement
     */
    observeNewImages() {
        if (this.observer) {
            this.observeImages();
        }
    }
}

// Initialiser automatiquement au chargement de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.imageOptimizer = new ImageOptimizer();
    });
} else {
    window.imageOptimizer = new ImageOptimizer();
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageOptimizer;
}
