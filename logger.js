/**
 * LOGGER.JS - Système de logging configurable
 * Désactive les logs en production
 */

const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const logger = {
    info(...args) {
        if (isDev) {
            console.log('ℹ️', ...args);
        }
    },
    
    warn(...args) {
        if (isDev) {
            console.warn('⚠️', ...args);
        }
    },
    
    error(...args) {
        // Toujours afficher les erreurs
        console.error('❌', ...args);
    },
    
    debug(...args) {
        if (isDev) {
            console.debug('🐛', ...args);
        }
    }
};
