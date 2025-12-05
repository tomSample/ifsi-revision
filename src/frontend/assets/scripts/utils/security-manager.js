/**
 * SECURITY MANAGER
 * Gestion de la sécurité et validation des entrées
 */

class SecurityManager {
    constructor() {
        this.initialized = false;
        this.cspViolations = [];
        this.suspiciousActivities = [];
    }

    /**
     * Initialise le système de sécurité
     */
    init() {
        if (this.initialized) return;

        // Content Security Policy violation reporting
        document.addEventListener('securitypolicyviolation', (e) => {
            this.handleCSPViolation(e);
        });

        // Surveillance des tentatives d'injection
        this.setupXSSProtection();

        this.initialized = true;
        console.log('✅ [SecurityManager] Système de sécurité initialisé');
    }

    /**
     * Gère les violations CSP
     */
    handleCSPViolation(event) {
        const violation = {
            timestamp: new Date().toISOString(),
            blockedURI: event.blockedURI,
            violatedDirective: event.violatedDirective,
            originalPolicy: event.originalPolicy,
            documentURI: event.documentURI,
            sourceFile: event.sourceFile,
            lineNumber: event.lineNumber
        };

        this.cspViolations.push(violation);
        console.warn('⚠️ [CSP] Violation détectée:', violation);

        // Limiter le stockage
        if (this.cspViolations.length > 50) {
            this.cspViolations = this.cspViolations.slice(0, 50);
        }
    }

    /**
     * Protection XSS - nettoie les entrées HTML
     */
    sanitizeHTML(input) {
        if (typeof input !== 'string') return input;

        // Créer un élément temporaire pour parser le HTML
        const temp = document.createElement('div');
        temp.textContent = input;
        return temp.innerHTML;
    }

    /**
     * Échappe les caractères spéciaux pour éviter les injections
     */
    escapeHTML(text) {
        if (typeof text !== 'string') return text;

        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };

        return text.replace(/[&<>"'/]/g, (char) => map[char]);
    }

    /**
     * Valide un email
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valide un mot de passe (au moins 8 caractères, 1 majuscule, 1 chiffre)
     */
    validatePassword(password) {
        if (password.length < 8) {
            return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule' };
        }
        if (!/[0-9]/.test(password)) {
            return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
        }
        return { valid: true };
    }

    /**
     * Détecte les tentatives d'injection SQL (pour validation de formulaires)
     */
    detectSQLInjection(input) {
        if (typeof input !== 'string') return false;

        const sqlPatterns = [
            /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b)/i,
            /(\bUNION\b.*\bSELECT\b)/i,
            /(--|\#|\/\*|\*\/)/,
            /(\bOR\b\s+\d+\s*=\s*\d+)/i,
            /(\'\s*OR\s*\'\d+\'\s*=\s*\'\d+)/i
        ];

        return sqlPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Détecte les tentatives XSS dans les entrées utilisateur
     */
    detectXSS(input) {
        if (typeof input !== 'string') return false;

        const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /<iframe\b/gi,
            /javascript:/gi,
            /on\w+\s*=/gi, // onclick, onload, etc.
            /<embed\b/gi,
            /<object\b/gi
        ];

        return xssPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Valide une entrée utilisateur
     */
    validateInput(input, type = 'text', options = {}) {
        const { maxLength = 1000, allowHTML = false, required = false } = options;

        // Vérification required
        if (required && (!input || input.trim() === '')) {
            return { valid: false, message: 'Ce champ est requis' };
        }

        // Vérification longueur
        if (input && input.length > maxLength) {
            return { valid: false, message: `Le texte ne peut pas dépasser ${maxLength} caractères` };
        }

        // Vérification type
        switch (type) {
            case 'email':
                if (input && !this.validateEmail(input)) {
                    return { valid: false, message: 'Email invalide' };
                }
                break;

            case 'password':
                if (input) {
                    return this.validatePassword(input);
                }
                break;

            case 'text':
            case 'textarea':
                if (input) {
                    // Détection SQL injection
                    if (this.detectSQLInjection(input)) {
                        this.logSuspiciousActivity('sql_injection_attempt', input);
                        return { valid: false, message: 'Entrée invalide détectée' };
                    }

                    // Détection XSS
                    if (!allowHTML && this.detectXSS(input)) {
                        this.logSuspiciousActivity('xss_attempt', input);
                        return { valid: false, message: 'Contenu HTML non autorisé' };
                    }
                }
                break;

            case 'number':
                if (input && isNaN(Number(input))) {
                    return { valid: false, message: 'Doit être un nombre' };
                }
                break;

            case 'url':
                try {
                    if (input) new URL(input);
                } catch {
                    return { valid: false, message: 'URL invalide' };
                }
                break;
        }

        return { valid: true };
    }

    /**
     * Valide un formulaire complet
     */
    validateForm(formData, schema) {
        const errors = {};
        let isValid = true;

        for (const [field, rules] of Object.entries(schema)) {
            const value = formData[field];
            const validation = this.validateInput(value, rules.type, rules);

            if (!validation.valid) {
                errors[field] = validation.message;
                isValid = false;
            }
        }

        return { isValid, errors };
    }

    /**
     * Log les activités suspectes
     */
    logSuspiciousActivity(type, details) {
        const activity = {
            timestamp: new Date().toISOString(),
            type,
            details: typeof details === 'string' ? details.substring(0, 100) : details,
            userAgent: navigator.userAgent,
            url: window.location.href,
            user: this.getUserContext()
        };

        this.suspiciousActivities.push(activity);
        console.warn('🚨 [Security] Activité suspecte détectée:', activity);

        // Limiter le stockage
        if (this.suspiciousActivities.length > 20) {
            this.suspiciousActivities = this.suspiciousActivities.slice(0, 20);
        }

        // Envoyer à l'error handler si disponible
        if (window.errorHandler) {
            window.errorHandler.addError({
                ...activity,
                id: `sec_${Date.now()}`,
                type: 'security',
                message: `Activité suspecte: ${type}`
            });
        }
    }

    /**
     * Récupère le contexte utilisateur (anonymisé)
     */
    getUserContext() {
        try {
            const user = window.auth?.currentUser;
            return user ? {
                uid: user.uid,
                emailDomain: user.email?.split('@')[1] // Seulement le domaine
            } : null;
        } catch {
            return null;
        }
    }

    /**
     * Setup protection XSS globale
     */
    setupXSSProtection() {
        // Override des méthodes dangereuses (document.write, eval)
        const originalDocumentWrite = document.write;
        document.write = function(...args) {
            console.warn('[Security] document.write() appelé - potentiellement dangereux');
            window.securityManager?.logSuspiciousActivity('document_write', args[0]);
            // Ne pas exécuter document.write en production
            if (window.location.hostname === 'localhost') {
                originalDocumentWrite.apply(document, args);
            }
        };

        // Surveillance de eval (déjà déconseillé)
        const originalEval = window.eval;
        window.eval = function(code) {
            console.warn('[Security] eval() appelé - potentiellement dangereux');
            window.securityManager?.logSuspiciousActivity('eval_usage', code);
            return originalEval(code);
        };
    }

    /**
     * Génère des headers CSP recommandés (pour information)
     */
    getRecommendedCSP() {
        return {
            'Content-Security-Policy': [
                "default-src 'self'",
                "script-src 'self' https://www.gstatic.com https://www.googletagmanager.com 'unsafe-inline' 'unsafe-eval'", // Firebase nécessite unsafe-eval
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https: blob:",
                "font-src 'self' data:",
                "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://firestore.googleapis.com",
                "frame-src 'self' https://www.google.com",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'",
                "upgrade-insecure-requests"
            ].join('; ')
        };
    }

    /**
     * Vérifie si l'application tourne en HTTPS (requis pour PWA)
     */
    checkHTTPS() {
        const isSecure = window.location.protocol === 'https:' || 
                        window.location.hostname === 'localhost';
        
        if (!isSecure) {
            console.warn('⚠️ [Security] Application non sécurisée (HTTP). HTTPS requis pour PWA.');
        }
        
        return isSecure;
    }

    /**
     * Rate limiting simple (prévention spam/brute force)
     */
    createRateLimiter(maxAttempts, windowMs) {
        const attempts = new Map();

        return function(identifier) {
            const now = Date.now();
            const userAttempts = attempts.get(identifier) || [];
            
            // Nettoyer les anciennes tentatives
            const recentAttempts = userAttempts.filter(time => now - time < windowMs);
            
            if (recentAttempts.length >= maxAttempts) {
                return {
                    allowed: false,
                    retryAfter: windowMs - (now - recentAttempts[0])
                };
            }
            
            recentAttempts.push(now);
            attempts.set(identifier, recentAttempts);
            
            return { allowed: true };
        };
    }

    /**
     * Génère un token CSRF (pour futurs formulaires sensibles)
     */
    generateCSRFToken() {
        const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        sessionStorage.setItem('csrf_token', token);
        return token;
    }

    /**
     * Vérifie un token CSRF
     */
    validateCSRFToken(token) {
        const storedToken = sessionStorage.getItem('csrf_token');
        return storedToken && storedToken === token;
    }

    /**
     * Export des logs de sécurité
     */
    exportSecurityLogs() {
        const logs = {
            exportDate: new Date().toISOString(),
            appVersion: window.versionManager?.getVersion(),
            cspViolations: this.cspViolations,
            suspiciousActivities: this.suspiciousActivities,
            httpsEnabled: this.checkHTTPS()
        };

        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ifsi-security-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Obtient un rapport de sécurité
     */
    getSecurityReport() {
        return {
            httpsEnabled: this.checkHTTPS(),
            cspViolations: this.cspViolations.length,
            suspiciousActivities: this.suspiciousActivities.length,
            recommendedCSP: this.getRecommendedCSP(),
            lastViolation: this.cspViolations[0] || null,
            lastSuspiciousActivity: this.suspiciousActivities[0] || null
        };
    }
}

// Instance globale
window.securityManager = new SecurityManager();
window.securityManager.init();

console.log('🔒 [Security] Recommandations CSP:', window.securityManager.getRecommendedCSP());
