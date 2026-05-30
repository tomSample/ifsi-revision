#!/usr/bin/env node

/**
 * Script de synchronisation des données
 * Copie les données de src/data/ vers public/data/ pour la distribution
 * Source de vérité: src/data/
 * Build output: public/data/
 */

const fs = require('fs');
const path = require('path');

function copyRecursive(srcDir, dstDir) {
    // Créer le répertoire destination s'il n'existe pas
    if (!fs.existsSync(dstDir)) {
        fs.mkdirSync(dstDir, { recursive: true });
    }

    // Lire le contenu du répertoire source
    const files = fs.readdirSync(srcDir);

    files.forEach(file => {
        const srcPath = path.join(srcDir, file);
        const dstPath = path.join(dstDir, file);
        const stats = fs.statSync(srcPath);

        if (stats.isDirectory()) {
            // Appel récursif pour les répertoires
            copyRecursive(srcPath, dstPath);
        } else {
            // Copier le fichier
            fs.copyFileSync(srcPath, dstPath);
        }
    });
}

console.log('📊 Synchronisation des données...\n');

const srcDataDir = path.join(__dirname, '../src/data');
const publicDataDir = path.join(__dirname, '../public/data');

try {
    // Créer le répertoire public/data s'il n'existe pas
    if (!fs.existsSync(publicDataDir)) {
        fs.mkdirSync(publicDataDir, { recursive: true });
    }

    // Copier tous les fichiers de src/data vers public/data
    copyRecursive(srcDataDir, publicDataDir);

    console.log('✅ Synchronisation complétée!');
    console.log(`   Source: ${srcDataDir}`);
    console.log(`   Destination: ${publicDataDir}`);

    // Compter les fichiers
    const countFiles = (dir) => {
        let count = 0;
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                count += countFiles(filePath);
            } else {
                count++;
            }
        });
        return count;
    };

    const fileCount = countFiles(publicDataDir);
    console.log(`   Fichiers copiés: ${fileCount}`);

} catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message);
    process.exit(1);
}
