/**
 * CONFIGURATION DE L'APPLICATION
 * 
 * Paramètres de sécurité et restrictions d'accès
 */

const appConfig = {
    // Domaines email autorisés pour l'inscription
    // Laissez vide [] pour autoriser tous les domaines
    allowedEmailDomains: [
        '@ifps-lannion.bzh'
        // Ajoutez d'autres domaines autorisés ici
    ],
    
    // Mode de restriction
    // 'strict' : Seuls les domaines listés sont autorisés
    // 'open' : Tous les domaines sont autorisés
    restrictionMode: 'strict',
    
    // Message d'erreur personnalisé
    restrictionMessage: "L'inscription est réservée aux étudiants IFSI. Veuillez utiliser votre adresse email institutionnelle.",
    
    // Autoriser les admins à bypasser la restriction
    adminEmails: [
        // Les admins peuvent s'inscrire avec n'importe quel email
        'admin@example.com'
    ]
};

// Export pour utilisation dans d'autres scripts
if (typeof window !== 'undefined') {
    window.appConfig = appConfig;
}
