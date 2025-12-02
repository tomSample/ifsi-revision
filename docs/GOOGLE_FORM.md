# 📝 Instructions pour Créer le Google Form

## Étape 1 : Créer le Formulaire

1. Allez sur https://forms.google.com
2. Cliquez sur "Créer un formulaire vide"
3. Titre : "IFSI Lannion 2025 - Signalement de Définitions"
4. Description : "Aidez-nous à améliorer les définitions de l'application de révision"

## Étape 2 : Ajouter les Champs

### Champ 1 : Terme
- Type : **Réponse courte**
- Question : "Terme signalé"
- Obligatoire : ✅ Oui

### Champ 2 : UE
- Type : **Réponse courte** 
- Question : "Unité d'Enseignement (UE)"
- Obligatoire : ❌ Non

### Champ 3 : Catégorie
- Type : **Réponse courte**
- Question : "Catégorie"
- Obligatoire : ❌ Non

### Champ 4 : Définition Actuelle
- Type : **Paragraphe**
- Question : "Définition actuelle"
- Obligatoire : ❌ Non

### Champ 5 : Type de Problème
- Type : **Choix multiple**
- Question : "Quel est le problème avec cette définition ?"
- Options :
  - Définition inexacte
  - Définition incomplète
  - Définition peu claire
  - Erreur dans la définition
  - Faute de frappe/orthographe
  - Autre
- Obligatoire : ✅ Oui

### Champ 6 : Commentaire/Suggestion
- Type : **Paragraphe**
- Question : "Votre commentaire ou suggestion d'amélioration"
- Description : "Expliquez le problème ou proposez une meilleure définition"
- Obligatoire : ✅ Oui

### Champ 7 : Date de Signalement
- Type : **Réponse courte**
- Question : "Date et heure du signalement"
- Obligatoire : ❌ Non

## Étape 3 : Configurer le Formulaire

1. **Paramètres** → **Général** :
   - ✅ Collecter les adresses e-mail (optionnel)
   - ✅ Réponse unique par personne (optionnel)

2. **Paramètres** → **Présentation** :
   - Message de confirmation : "Merci ! Votre signalement a été enregistré. Nous examinerons cette définition."

## Étape 4 : Obtenir les Entry IDs

1. **Ouvrir le formulaire en mode "Aperçu"**
2. **Inspecter la page** (F12)
3. **Trouver les entry IDs** dans le code HTML :
   - Chercher `name="entry.` suivi de chiffres
   - Noter chaque ID pour chaque champ

Exemple :
```html
<input name="entry.2005620554" ... > <!-- Terme -->
<input name="entry.1045781291" ... > <!-- Définition -->
<input name="entry.1166974658" ... > <!-- UE -->
<!-- etc. -->
```

## Étape 5 : Mettre à Jour le Code

Dans `revision.js`, remplacer les entry IDs dans la fonction `createGoogleFormUrl` :

```javascript
const fieldMappings = {
    terme: 'entry.VOTRE_ID_TERME',           // Remplacer par votre ID
    definition: 'entry.VOTRE_ID_DEFINITION', // Remplacer par votre ID
    ue: 'entry.VOTRE_ID_UE',                // Remplacer par votre ID
    categorie: 'entry.VOTRE_ID_CATEGORIE',  // Remplacer par votre ID
    probleme: 'entry.VOTRE_ID_PROBLEME',    // Remplacer par votre ID
    commentaire: 'entry.VOTRE_ID_COMMENT',  // Remplacer par votre ID
    horodatage: 'entry.VOTRE_ID_DATE'       // Remplacer par votre ID
};
```

Et remplacer l'URL de base :
```javascript
const baseUrl = 'https://docs.google.com/forms/d/e/VOTRE_FORM_ID/viewform';
```

## Étape 6 : Configurer les Notifications

1. **Réponses** → **Créer une feuille de calcul**
2. **Outils** → **Éditeur de script** → **Déclencheurs**
3. Créer un déclencheur "À l'envoi du formulaire"
4. Fonction pour envoyer un email de notification

## Étape 7 : Tester

1. Tester le formulaire manuellement
2. Tester depuis l'application avec un terme de test
3. Vérifier que les données arrivent bien dans le Google Sheets

## Résultat Final

- ✅ Interface modal conservée
- ✅ Expérience utilisateur fluide
- ✅ Données centralisées dans Google Sheets
- ✅ Notifications automatiques
- ✅ Pas de refonte majeure