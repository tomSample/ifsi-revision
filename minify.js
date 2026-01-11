#!/usr/bin/env node

/**
 * Script de minification pour les fichiers JavaScript
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

const files = [
    {
        src: 'src/frontend/assets/scripts/modules/pharma-quiz.js',
        dst: 'public/js/modules/pharma-quiz.min.js'
    },
    {
        src: 'src/frontend/pages/quiz-controller.js',
        dst: 'public/js/quiz-controller.min.js'
    }
];

console.log('🔨 Minification des fichiers JavaScript...\n');

files.forEach(file => {
    try {
        const srcPath = path.join(__dirname, file.src);
        const dstPath = path.join(__dirname, file.dst);
        
        if (!fs.existsSync(srcPath)) {
            console.error(`❌ ${file.src} - Fichier source non trouvé`);
            return;
        }
        
        // Créer le répertoire de destination s'il n'existe pas
        const dstDir = path.dirname(dstPath);
        if (!fs.existsSync(dstDir)) {
            fs.mkdirSync(dstDir, { recursive: true });
        }
        
        // Lire et minifier
        const sourceCode = fs.readFileSync(srcPath, 'utf8');
        const minifiedCode = minifyJS(sourceCode);
        
        // Écrire le fichier minifié
        fs.writeFileSync(dstPath, minifiedCode, 'utf8');
        
        const srcSize = (sourceCode.length / 1024).toFixed(2);
        const dstSize = (minifiedCode.length / 1024).toFixed(2);
        const ratio = ((1 - minifiedCode.length / sourceCode.length) * 100).toFixed(1);
        
        console.log(`✓ ${file.src}`);
        console.log(`  Source: ${srcSize} KB → Minifié: ${dstSize} KB (réduction: ${ratio}%)\n`);
        
    } catch (error) {
        console.error(`❌ ${file.src} - Erreur:`, error.message);
    }
});

console.log('✅ Minification complétée!');
