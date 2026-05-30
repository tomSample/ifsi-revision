#!/usr/bin/env node

/**
 * Script de minification pour les fichiers JavaScript et CSS
 * Utilise une minification basique (conservation de la structure mais suppression des commentaires et espaces)
 */

const fs = require('fs');
const path = require('path');

function minifyJS(code) {
    // Supprimer les commentaires multilignes
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Supprimer les commentaires simple ligne
    code = code.replace(/^[\t ]*\/\/.*$/gm, '');
    
    // Supprimer les espaces inutiles avant/après certains caractères
    code = code.replace(/\s*([{};:,])\s*/g, '$1');
    code = code.replace(/\s*([=+\-*/<>!&|])\s*/g, ' $1 ');
    
    // Condenser les espaces multiples
    code = code.replace(/\s+/g, ' ');
    
    // Nettoyer les espaces avant les accolades après les fonctions
    code = code.replace(/\)\s+{/g, '){');
    code = code.replace(/}\s+else/g, '}else');
    code = code.replace(/}\s+catch/g, '}catch');
    code = code.replace(/}\s+finally/g, '}finally');
    
    // Supprimer les espaces inutiles aux extrémités
    code = code.trim();
    
    return code;
}

function minifyCSS(code) {
    // Supprimer les commentaires
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Supprimer les espaces inutiles
    code = code.replace(/\s+/g, ' ');
    code = code.replace(/\s*([{}:;,>+~])\s*/g, '$1');
    
    // Nettoyer les espaces inutiles
    code = code.trim();
    
    return code;
}

// Configuration complète des fichiers à minifier
const jsFiles = [
    { src: 'src/frontend/assets/scripts/config/app-config.js', dst: 'public/js/config/app-config.min.js' },
    { src: 'src/frontend/assets/scripts/config/firebase-config.js', dst: 'public/js/config/firebase-config.min.js' },
    { src: 'src/frontend/assets/scripts/config/logger-config.js', dst: 'public/js/config/logger-config.min.js' },
    { src: 'src/frontend/assets/scripts/auth/auth.js', dst: 'public/js/auth/auth.min.js' },
    { src: 'src/frontend/assets/scripts/auth/auth-firebase.js', dst: 'public/js/auth/auth-firebase.min.js' },
    { src: 'src/frontend/assets/scripts/auth/auth-guard.js', dst: 'public/js/auth/auth-guard.min.js' },
    { src: 'src/frontend/assets/scripts/modules/account.js', dst: 'public/js/modules/account.min.js' },
    { src: 'src/frontend/assets/scripts/modules/admin.js', dst: 'public/js/modules/admin.min.js' },
    { src: 'src/frontend/assets/scripts/modules/admin-feedbacks.js', dst: 'public/js/modules/admin-feedbacks.min.js' },
    { src: 'src/frontend/assets/scripts/modules/admin-reports.js', dst: 'public/js/modules/admin-reports.min.js' },
    { src: 'src/frontend/assets/scripts/modules/classification-manager.js', dst: 'public/js/modules/classification-manager.min.js' },
    { src: 'src/frontend/assets/scripts/modules/gallery.js', dst: 'public/js/modules/gallery.min.js' },
    { src: 'src/frontend/assets/scripts/modules/mcq-quiz.js', dst: 'public/js/modules/mcq-quiz.min.js' },
    { src: 'src/frontend/assets/scripts/modules/pharma-quiz.js', dst: 'public/js/modules/pharma-quiz.min.js' },
    { src: 'src/frontend/assets/scripts/modules/revision.js', dst: 'public/js/modules/revision.min.js' },
    { src: 'src/frontend/assets/scripts/modules/spaced-repetition.js', dst: 'public/js/modules/spaced-repetition.min.js' },
    { src: 'src/frontend/assets/scripts/modules/statistics.js', dst: 'public/js/modules/statistics.min.js' },
    { src: 'src/frontend/assets/scripts/modules/sync-manager.js', dst: 'public/js/modules/sync-manager.min.js' },
    { src: 'src/frontend/assets/scripts/utils/cache-manager.js', dst: 'public/js/utils/cache-manager.min.js' },
    { src: 'src/frontend/assets/scripts/utils/error-handler.js', dst: 'public/js/utils/error-handler.min.js' },
    { src: 'src/frontend/assets/scripts/utils/feedback-manager.js', dst: 'public/js/utils/feedback-manager.min.js' },
    { src: 'src/frontend/assets/scripts/utils/image-optimizer.js', dst: 'public/js/utils/image-optimizer.min.js' },
    { src: 'src/frontend/assets/scripts/utils/logger.js', dst: 'public/js/utils/logger.min.js' },
    { src: 'src/frontend/assets/scripts/utils/page-load-guard.js', dst: 'public/js/utils/page-load-guard.min.js' },
    { src: 'src/frontend/assets/scripts/utils/performance-utils.js', dst: 'public/js/utils/performance-utils.min.js' },
    { src: 'src/frontend/assets/scripts/utils/pwa-install.js', dst: 'public/js/utils/pwa-install.min.js' },
    { src: 'src/frontend/assets/scripts/utils/security-manager.js', dst: 'public/js/utils/security-manager.min.js' },
    { src: 'src/frontend/assets/scripts/utils/smart-cache.js', dst: 'public/js/utils/smart-cache.min.js' },
    { src: 'src/frontend/assets/scripts/utils/sw-register.js', dst: 'public/js/utils/sw-register.min.js' },
    { src: 'src/frontend/assets/scripts/utils/version-manager.js', dst: 'public/js/utils/version-manager.min.js' },
    { src: 'src/frontend/assets/scripts/semester-selector.js', dst: 'public/js/semester-selector.min.js' },
    { src: 'src/frontend/pages/quiz-controller.js', dst: 'public/js/quiz-controller.min.js' }
];

const cssFiles = [
    { src: 'src/frontend/assets/styles/admin.css', dst: 'public/css/admin.min.css' },
    { src: 'src/frontend/assets/styles/animations.css', dst: 'public/css/animations.min.css' },
    { src: 'src/frontend/assets/styles/base.css', dst: 'public/css/base.min.css' },
    { src: 'src/frontend/assets/styles/components.css', dst: 'public/css/components.min.css' },
    { src: 'src/frontend/assets/styles/design-system.css', dst: 'public/css/design-system.min.css' },
    { src: 'src/frontend/assets/styles/layout.css', dst: 'public/css/layout.min.css' },
    { src: 'src/frontend/assets/styles/main.css', dst: 'public/css/main.min.css' },
    { src: 'src/frontend/assets/styles/revision.css', dst: 'public/css/revision.min.css' },
    { src: 'src/frontend/assets/styles/style-revision.css', dst: 'public/css/style-revision.min.css' },
    { src: 'src/frontend/assets/styles/style.css', dst: 'public/css/style.min.css' },
    { src: 'src/frontend/assets/styles/theme.css', dst: 'public/css/theme.min.css' },
    { src: 'src/frontend/assets/styles/utilities.css', dst: 'public/css/utilities.min.css' },
    { src: 'src/frontend/assets/styles/variables.css', dst: 'public/css/variables.min.css' }
];

console.log('🔨 Minification des fichiers JavaScript et CSS...\n');

let jsCount = 0, cssCount = 0, jsReduction = 0, cssReduction = 0;

jsFiles.forEach(file => {
    try {
        const srcPath = path.join(__dirname, file.src);
        const dstPath = path.join(__dirname, file.dst);
        
        if (!fs.existsSync(srcPath)) return;
        
        const dstDir = path.dirname(dstPath);
        if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
        
        const sourceCode = fs.readFileSync(srcPath, 'utf8');
        const minifiedCode = minifyJS(sourceCode);
        fs.writeFileSync(dstPath, minifiedCode, 'utf8');
        
        const srcSize = sourceCode.length;
        const dstSize = minifiedCode.length;
        const ratio = ((1 - dstSize / srcSize) * 100).toFixed(1);
        
        jsCount++;
        jsReduction += (srcSize - dstSize);
        console.log(`✓ ${file.src.split('/').pop()} (${ratio}%)`);
    } catch (error) {
        console.error(`❌ ${file.src}: ${error.message}`);
    }
});

console.log('');

cssFiles.forEach(file => {
    try {
        const srcPath = path.join(__dirname, file.src);
        const dstPath = path.join(__dirname, file.dst);
        
        if (!fs.existsSync(srcPath)) return;
        
        const dstDir = path.dirname(dstPath);
        if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
        
        const sourceCode = fs.readFileSync(srcPath, 'utf8');
        const minifiedCode = minifyCSS(sourceCode);
        fs.writeFileSync(dstPath, minifiedCode, 'utf8');
        
        const srcSize = sourceCode.length;
        const dstSize = minifiedCode.length;
        const ratio = ((1 - dstSize / srcSize) * 100).toFixed(1);
        
        cssCount++;
        cssReduction += (srcSize - dstSize);
        console.log(`✓ ${file.src.split('/').pop()} (${ratio}%)`);
    } catch (error) {
        console.error(`❌ ${file.src}: ${error.message}`);
    }
});

console.log('\n✅ Minification complétée!');
console.log(`📊 JS: ${jsCount} fichiers (${(jsReduction/1024).toFixed(1)} KB) | CSS: ${cssCount} fichiers (${(cssReduction/1024).toFixed(1)} KB)`);
