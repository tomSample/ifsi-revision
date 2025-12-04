/**
 * IFSI Analytics - Google Analytics 4 avec métriques pédagogiques
 * Mesure l'engagement étudiant et l'efficacité pédagogique
 */

// Configuration Google Analytics 4
const GA_MEASUREMENT_ID = window.IFSI_ANALYTICS_CONFIG?.GA_MEASUREMENT_ID || 'G-TGLNPW9JFH';
const ANALYTICS_ENABLED = window.IFSI_ANALYTICS_CONFIG?.ENABLED !== false;
const DEBUG_MODE = window.IFSI_ANALYTICS_CONFIG?.DEBUG_MODE || false;

// Initialisation de Google Analytics
function initializeAnalytics() {
    // Vérifier si les analytics sont activés
    if (!ANALYTICS_ENABLED) {
        console.log('📊 Analytics IFSI désactivé par configuration');
        return;
    }
    
    // Chargement de Google Analytics 4
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    // Configuration gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
        // Configuration pour l'éducation
        custom_map: {
            'custom_parameter_1': 'student_level',
            'custom_parameter_2': 'teaching_unit'
        }
    });

    // Assignation globale
    window.gtag = gtag;
    
    console.log('📊 Analytics IFSI initialisé');
}

// ========================================
// ÉVÉNEMENTS PÉDAGOGIQUES PERSONNALISÉS
// ========================================

/**
 * Suivi de démarrage de session de révision
 */
function trackRevisionStart(totalTerms) {
    if (window.gtag) {
        window.gtag('event', 'revision_session_start', {
            event_category: 'Learning',
            event_label: 'Révision démarrée',
            value: totalTerms,
            custom_parameter_1: 'IFSI_L2',
            custom_parameter_2: 'Multi-UE'
        });
    }
    console.log('📈 Événement: Session de révision démarrée');
}

/**
 * Suivi de progression d'un terme
 */
function trackTermProgress(termId, ue, termNumber, totalTerms, timeSpent = null) {
    if (window.gtag) {
        window.gtag('event', 'term_viewed', {
            event_category: 'Learning',
            event_label: `Terme ${termNumber}/${totalTerms}`,
            value: termNumber,
            custom_parameter_1: 'IFSI_L2',
            custom_parameter_2: ue,
            term_id: termId,
            time_spent: timeSpent
        });
    }
    console.log(`📖 Événement: Terme ${termNumber}/${totalTerms} consulté (UE: ${ue})`);
}

/**
 * Suivi de révélation de définition
 */
function trackDefinitionRevealed(termId, ue, timeBeforeReveal) {
    if (window.gtag) {
        window.gtag('event', 'definition_revealed', {
            event_category: 'Learning',
            event_label: 'Définition révélée',
            value: timeBeforeReveal,
            custom_parameter_1: 'IFSI_L2',
            custom_parameter_2: ue,
            term_id: termId,
            reflection_time: timeBeforeReveal
        });
    }
    console.log(`💡 Événement: Définition révélée après ${timeBeforeReveal}s de réflexion`);
}

/**
 * Suivi de signalement de terme
 */
function trackTermReported(termId, ue, reportType = 'unclear') {
    if (window.gtag) {
        window.gtag('event', 'term_reported', {
            event_category: 'Quality',
            event_label: 'Terme signalé',
            value: 1,
            custom_parameter_1: 'IFSI_L2',
            custom_parameter_2: ue,
            term_id: termId,
            report_type: reportType
        });
    }
    console.log(`⚠️ Événement: Terme signalé (${reportType})`);
}

/**
 * Suivi de fin de session
 */
function trackRevisionCompleted(termsCompleted, totalTime, reportedTerms = 0) {
    if (window.gtag) {
        window.gtag('event', 'revision_session_completed', {
            event_category: 'Learning',
            event_label: 'Session terminée',
            value: termsCompleted,
            custom_parameter_1: 'IFSI_L2',
            custom_parameter_2: 'Multi-UE',
            terms_completed: termsCompleted,
            session_duration: totalTime,
            terms_reported: reportedTerms
        });
    }
    console.log(`✅ Événement: Session terminée - ${termsCompleted} termes en ${totalTime}s`);
}

/**
 * Suivi d'utilisation de la galerie
 */
function trackGalleryUsage(action, searchTerm = null) {
    if (window.gtag) {
        window.gtag('event', 'gallery_usage', {
            event_category: 'Navigation',
            event_label: action,
            value: 1,
            custom_parameter_1: 'IFSI_L2',
            search_term: searchTerm
        });
    }
    console.log(`🖼️ Événement: Galerie - ${action}`);
}

/**
 * Suivi d'accès administration
 */
function trackAdminAccess(action, section = null) {
    if (window.gtag) {
        window.gtag('event', 'admin_access', {
            event_category: 'Administration',
            event_label: action,
            value: 1,
            admin_section: section
        });
    }
    console.log(`🔧 Événement: Admin - ${action}`);
}

/**
 * Suivi des temps de réflexion (métriques pédagogiques avancées)
 */
function trackReflectionTime(termId, ue, reflectionTime) {
    if (window.gtag) {
        window.gtag('event', 'reflection_time', {
            event_category: 'Learning_Analytics',
            event_label: 'Temps de réflexion',
            value: reflectionTime,
            custom_parameter_1: 'IFSI_L2',
            custom_parameter_2: ue,
            term_id: termId
        });
    }
    
    // Classification du temps de réflexion
    let category;
    if (reflectionTime < 10) category = 'très rapide';
    else if (reflectionTime < 30) category = 'rapide';
    else if (reflectionTime < 60) category = 'normal';
    else category = 'approfondi';
    
    console.log(`⏱️ Temps de réflexion: ${reflectionTime}s (${category})`);
}

// ========================================
// MÉTRIQUES D'ENGAGEMENT AUTOMATIQUES
// ========================================

let pageStartTime = Date.now();
let lastInteractionTime = Date.now();

/**
 * Suivi automatique du temps passé sur la page
 */
function trackPageEngagement() {
    const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);
    const timeSinceLastInteraction = Math.round((Date.now() - lastInteractionTime) / 1000);
    
    if (window.gtag && timeOnPage > 10) { // Minimum 10 secondes
        window.gtag('event', 'page_engagement', {
            event_category: 'Engagement',
            event_label: 'Temps sur page',
            value: timeOnPage,
            time_since_last_interaction: timeSinceLastInteraction
        });
    }
}

/**
 * Mise à jour automatique du temps d'interaction
 */
function updateLastInteraction() {
    lastInteractionTime = Date.now();
}

// ========================================
// INITIALISATION ET ÉVÉNEMENTS
// ========================================

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeAnalytics();
    
    // Suivi des interactions utilisateur
    document.addEventListener('click', updateLastInteraction);
    document.addEventListener('keypress', updateLastInteraction);
    document.addEventListener('scroll', updateLastInteraction);
    
    // Suivi du temps d'engagement toutes les 30 secondes
    setInterval(trackPageEngagement, 30000);
    
    // Suivi à la fermeture de la page
    window.addEventListener('beforeunload', trackPageEngagement);
});

// ========================================
// UTILITAIRES D'EXPORT
// ========================================

/**
 * Génère un rapport d'utilisation local (pour admin)
 */
function generateUsageReport() {
    const report = {
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        session_duration: Math.round((Date.now() - pageStartTime) / 1000),
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`
    };
    
    console.log('📋 Rapport d\'utilisation:', report);
    return report;
}

// Export des fonctions pour utilisation globale
window.IFSIAnalytics = {
    trackRevisionStart,
    trackTermProgress,
    trackDefinitionRevealed,
    trackTermReported,
    trackRevisionCompleted,
    trackGalleryUsage,
    trackAdminAccess,
    trackReflectionTime,
    generateUsageReport
};