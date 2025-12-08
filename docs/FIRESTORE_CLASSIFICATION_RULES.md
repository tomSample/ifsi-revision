# Règles de sécurité Firestore pour la classification collaborative

## Collections concernées

### 1. `termClassifications` (Classifications globales)
Stocke les votes agrégés de tous les utilisateurs pour chaque terme.

**Structure :**
```javascript
{
  termId: "hémostase_ue_2.1.s1",
  votes: {
    essential: 45,
    important: 120,
    supplementary: 30,
    ignored: 5
  },
  totalVotes: 200,
  majorityChoice: "important",
  majorityPercentage: 60,
  lastUpdated: "2025-12-08T18:00:00Z",
  createdAt: "2025-12-08T10:00:00Z"
}
```

### 2. `userProgress` (Progression individuelle - EXISTANTE)
Champs ajoutés :
- `personalImportance`: "essential" | "important" | "supplementary" | "ignored"
- `hasVoted`: boolean
- `votedAt`: ISO 8601 timestamp
- `lastModifiedAt`: ISO 8601 timestamp (si modification)

## Règles de sécurité à ajouter

### Version complète (à copier dans Firestore Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // === RÈGLES EXISTANTES (à conserver) ===
    
    // Règles pour userProgress (MISE À JOUR)
    match /userProgress/{progressId} {
      // Vérifier que le progressId correspond bien au format userId_termId
      function isOwner() {
        return request.auth != null && progressId.matches(request.auth.uid + '_.*');
      }
      
      // Lecture : uniquement par le propriétaire
      allow read: if isOwner();
      
      // Écriture : uniquement par le propriétaire
      allow create, update: if isOwner() 
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.termId is string
        // Validation des champs de classification
        && (!('personalImportance' in request.resource.data) 
            || request.resource.data.personalImportance in ['essential', 'important', 'supplementary', 'ignored'])
        && (!('hasVoted' in request.resource.data) 
            || request.resource.data.hasVoted is bool);
      
      // Suppression : uniquement par le propriétaire
      allow delete: if isOwner();
    }
    
    // === NOUVELLES RÈGLES POUR LA CLASSIFICATION ===
    
    // Règles pour termClassifications (lecture publique, écriture via transactions)
    match /termClassifications/{termId} {
      // Lecture : tout le monde peut lire les statistiques globales
      allow read: if true;
      
      // Écriture : uniquement via transactions contrôlées par le code client
      // On vérifie que l'utilisateur est authentifié et que la structure est valide
      allow create: if request.auth != null
        && request.resource.data.termId is string
        && request.resource.data.votes is map
        && request.resource.data.votes.keys().hasAll(['essential', 'important', 'supplementary', 'ignored'])
        && request.resource.data.totalVotes is int
        && request.resource.data.totalVotes >= 1
        && request.resource.data.majorityChoice in ['essential', 'important', 'supplementary', 'ignored']
        && request.resource.data.majorityPercentage is int
        && request.resource.data.majorityPercentage >= 0
        && request.resource.data.majorityPercentage <= 100;
      
      allow update: if request.auth != null
        && request.resource.data.termId == resource.data.termId
        && request.resource.data.totalVotes >= resource.data.totalVotes
        && request.resource.data.votes is map
        && request.resource.data.votes.keys().hasAll(['essential', 'important', 'supplementary', 'ignored']);
      
      // Pas de suppression (les classifications sont permanentes)
      allow delete: if false;
    }
  }
}
```

## Explications des règles

### `termClassifications`

**Lecture (`allow read: if true`):**
- Accessible à tous (même non authentifiés)
- Permet d'afficher les statistiques communautaires
- Pas de données sensibles dans cette collection

**Création (`allow create`):**
- Réservé aux utilisateurs authentifiés
- Validation stricte de la structure :
  * `termId` obligatoire (string)
  * `votes` obligatoire avec les 4 catégories
  * `totalVotes` ≥ 1
  * `majorityChoice` parmi les valeurs valides
  * `majorityPercentage` entre 0 et 100

**Mise à jour (`allow update`):**
- Réservé aux utilisateurs authentifiés
- `termId` immuable (ne peut pas changer)
- `totalVotes` ne peut qu'augmenter (pas de suppression de votes)
- Structure `votes` validée

**Suppression (`allow delete: if false`):**
- Interdite pour tous
- Les classifications sont permanentes
- Évite la perte de données communautaires

### `userProgress` (mises à jour)

**Champs de classification ajoutés :**
- `personalImportance`: Valide uniquement si parmi les 4 valeurs autorisées
- `hasVoted`: Booléen indiquant si l'utilisateur a voté
- `votedAt`: Timestamp du premier vote
- `lastModifiedAt`: Timestamp de la dernière modification

**Sécurité :**
- Seul le propriétaire peut lire/écrire ses données
- Validation du format du `progressId` : `{userId}_{termId}`
- Le `userId` dans le document doit correspondre à l'authentification

## Déploiement

### 1. Accéder à Firebase Console
1. Aller sur https://console.firebase.google.com/
2. Sélectionner votre projet IFSI Lannion
3. Menu : **Firestore Database** → **Règles**

### 2. Copier les règles
Copier l'intégralité du bloc de règles ci-dessus et remplacer les règles existantes.

⚠️ **IMPORTANT :** Conservez les règles existantes pour les autres collections !

### 3. Publier
Cliquer sur **Publier** après avoir vérifié les règles.

### 4. Tester
Firebase affiche automatiquement les erreurs de syntaxe.
Vous pouvez tester avec le simulateur intégré :
- Tester la lecture d'une classification (devrait fonctionner)
- Tester la lecture d'un userProgress non propriétaire (devrait échouer)

## Indexes Firestore recommandés

Pour optimiser les requêtes, créer ces indexes :

### Index 1 : Statistiques utilisateur
```
Collection: userProgress
Champs indexés:
  - userId (Ascending)
  - hasVoted (Ascending)
  - personalImportance (Ascending)
```

**Créer automatiquement :**
Firebase créera cet index automatiquement lors de la première requête.
Sinon, le créer manuellement via Console → Firestore → Indexes

### Index 2 : Classifications par date
```
Collection: termClassifications
Champs indexés:
  - lastUpdated (Descending)
  - totalVotes (Descending)
```

**Utilité :**
Permet de récupérer les termes les plus récemment classifiés ou les plus votés.

## Monitoring et maintenance

### Quotas à surveiller
- **Lectures de documents** : Chaque consultation de classification compte
- **Écritures de documents** : Chaque vote = 2 écritures (userProgress + termClassifications)
- **Bande passante** : Les statistiques globales sont lues fréquemment

### Cache recommandé
Le `ClassificationManager` implémente déjà un cache local de 1 heure pour limiter les lectures Firestore.

### Nettoyage
- **termClassifications** : Pas de nettoyage (données permanentes)
- **userProgress** : Déjà géré par les règles existantes

## Évolutions futures possibles

### 1. Limiter les modifications
Empêcher les utilisateurs de changer leur vote trop souvent :
```javascript
allow update: if request.auth != null
  && isOwner()
  && (!('lastModifiedAt' in resource.data) 
      || request.time > resource.data.lastModifiedAt + duration.value(24, 'h'));
```

### 2. Tracking des modifications
Ajouter un champ `modificationCount` pour limiter :
```javascript
&& (!('modificationCount' in request.resource.data) 
    || request.resource.data.modificationCount < 5)
```

### 3. Validation par niveau utilisateur
Si vous ajoutez un système de "niveaux" (L1, L2, L3) :
```javascript
allow create: if request.auth != null
  && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.level in ['L1', 'L2', 'L3']
```

## Troubleshooting

### Erreur : "Missing or insufficient permissions"
- Vérifier que l'utilisateur est authentifié
- Vérifier le format du `progressId` dans `userProgress`
- Vérifier que le `userId` dans le document correspond à l'auth

### Erreur : "Document already exists"
- Lors d'un premier vote, utiliser `set()` avec `merge: true`
- Ou vérifier avec `hasUserVoted()` avant de créer

### Les statistiques ne s'affichent pas
- Vérifier que la collection `termClassifications` existe
- Vérifier que le `termId` est correct (format : `terme_ue`)
- Vérifier les règles de lecture (`allow read: if true`)

### Les votes ne se mettent pas à jour
- Vérifier que la transaction est bien utilisée
- Vérifier les logs Firestore dans la console
- Vérifier la connexion réseau (mode hors ligne)
