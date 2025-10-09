/**
 * 📊 Configuration Analytics IFSI
 * Fichier de configuration centralisé pour Google Analytics 4
 */

// ========================================
// CONFIGURATION PRINCIPALE
// ========================================

// ⚠️ À CONFIGURER : Remplacez par votre vrai ID Google Analytics
const ANALYTICS_CONFIG = {
    // ID de mesure Google Analytics 4 (format : G-XXXXXXXXXX)
    GA_MEASUREMENT_ID: 'G-TGLNPW9JFH',
    
    // Activer/désactiver les analytics
    ENABLED: true,
    
    // Mode debug (affiche les événements dans la console)
    DEBUG_MODE: true,
    
    // Informations sur l'établissement
    SCHOOL_INFO: {
        name: 'IFSI Lannion',
        level: 'L1',
        year: '2025'
    }
};

// ========================================
// CONFIGURATION DES ÉVÉNEMENTS
// ========================================

const ANALYTICS_EVENTS = {
    // Révisions
    REVISION_START: 'revision_session_start',
    TERM_VIEWED: 'term_viewed',
    DEFINITION_REVEALED: 'definition_revealed',
    TERM_REPORTED: 'term_reported',
    REVISION_COMPLETED: 'revision_session_completed',
    REFLECTION_TIME: 'reflection_time',
    
    // Galerie
    GALLERY_LOADED: 'gallery_loaded',
    GALLERY_SEARCH: 'search_performed',
    
    // Administration
    ADMIN_ACCESS: 'admin_access',
    ADMIN_TAB_SWITCH: 'tab_switched',
    
    // Engagement
    PAGE_ENGAGEMENT: 'page_engagement'
};

// ========================================
// PARAMÈTRES PERSONNALISÉS
// ========================================

const CUSTOM_PARAMETERS = {
    STUDENT_LEVEL: 'student_level',
    TEACHING_UNIT: 'teaching_unit',
    TERM_ID: 'term_id',
    REFLECTION_TIME: 'reflection_time',
    REPORT_TYPE: 'report_type',
    SEARCH_TERM: 'search_term',
    ADMIN_SECTION: 'admin_section',
    SESSION_DURATION: 'session_duration',
    TERMS_COMPLETED: 'terms_completed',
    TERMS_REPORTED: 'terms_reported'
};

// ========================================
// SEUILS ET LIMITES
// ========================================

const ANALYTICS_THRESHOLDS = {
    // Temps minimum sur page pour déclencher l'engagement (secondes)
    MIN_ENGAGEMENT_TIME: 10,
    
    // Intervalle de suivi de l'engagement (millisecondes)
    ENGAGEMENT_INTERVAL: 30000,
    
    // Classification des temps de réflexion (secondes)
    REFLECTION_CATEGORIES: {
        VERY_FAST: 10,    // < 10s
        FAST: 30,         // 10-30s  
        NORMAL: 60,       // 30-60s
        DEEP: Infinity    // > 60s
    }
};

// ========================================
// EXPORT DE LA CONFIGURATION
// ========================================

// Export pour utilisation dans analytics.js
window.IFSI_ANALYTICS_CONFIG = {
    ...ANALYTICS_CONFIG,
    EVENTS: ANALYTICS_EVENTS,
    PARAMETERS: CUSTOM_PARAMETERS,
    THRESHOLDS: ANALYTICS_THRESHOLDS
};

// Log de la configuration (si debug activé)
if (ANALYTICS_CONFIG.DEBUG_MODE) {
    console.log('📊 Configuration Analytics IFSI chargée:', window.IFSI_ANALYTICS_CONFIG);
}