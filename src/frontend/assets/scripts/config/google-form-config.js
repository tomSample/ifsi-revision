// Configuration Google Forms - À compléter avec vos vrais IDs
const GOOGLE_FORM_CONFIG = {
    // URL de base de votre Google Form (à récupérer après création)
    baseUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSc_EXAMPLE_FORM_ID/viewform',
    
    // Entry IDs de vos champs (à récupérer en inspectant le formulaire)
    fields: {
        terme: 'entry.2005620554',           // Champ "Terme signalé"
        definition: 'entry.1045781291',      // Champ "Définition actuelle"
        ue: 'entry.1166974658',             // Champ "UE"
        categorie: 'entry.839337160',       // Champ "Catégorie"
        probleme: 'entry.1377237208',       // Champ "Type de problème"
        commentaire: 'entry.1821309694',    // Champ "Commentaire"
        horodatage: 'entry.1234567890'      // Champ "Date"
    }
};

/* 
ÉTAPES POUR OBTENIR VOS VRAIS IDs :

1. Créez votre Google Form selon les instructions
2. Ouvrez le formulaire en mode "Aperçu"
3. Appuyez sur F12 pour ouvrir les outils de développement
4. Dans l'onglet "Elements", cherchez les balises <input> ou <textarea>
5. Chaque champ aura un attribut name="entry.XXXXXXXX"
6. Copiez ces numbers et remplacez-les dans la configuration ci-dessus
7. Copiez l'URL de votre formulaire et remplacez baseUrl

EXEMPLE de ce que vous devriez voir dans le code HTML :
<input type="text" name="entry.2005620554" ...>  ← ID pour le terme
<textarea name="entry.1821309694" ...>           ← ID pour le commentaire

Une fois configuré, remplacez le contenu de la fonction createGoogleFormUrl 
dans revision.js avec ces vrais IDs.
*/