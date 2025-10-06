# Configuration Firebase pour IFSI Lannion

## 🔥 Étapes pour activer Firebase

### 1. Créer un projet Firebase

1. Aller sur [console.firebase.google.com](https://console.firebase.google.com)
2. Cliquer "Ajouter un projet"
3. Nom du projet : `ifsi-lannion-revision`
4. Activer Google Analytics (optionnel)

### 2. Configurer Firestore Database

1. Dans le menu de gauche : `Firestore Database`
2. Cliquer "Créer une base de données"
3. Choisir "Démarrer en mode test" (règles permissives)
4. Sélectionner une région (Europe par défaut)

### 3. Obtenir la configuration

1. Dans les paramètres du projet (roue dentée)
2. Onglet "Général"
3. Section "Vos applications" → "Configuration SDK"
4. Copier l'objet `firebaseConfig`

### 4. Remplacer dans revision.html

Remplacer les valeurs temporaires dans `revision.html` :

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "ifsi-lannion-revision.firebaseapp.com",
    projectId: "ifsi-lannion-revision",
    storageBucket: "ifsi-lannion-revision.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

### 5. Décommenter l'initialisation

Dans `revision.html`, ligne ~175 :

```javascript
// Remplacer ces lignes :
// app = initializeApp(firebaseConfig);
// db = getFirestore(app);

// Par :
app = initializeApp(firebaseConfig);
db = getFirestore(app);
```

### 6. Configurer les règles Firestore

Dans la console Firebase → Firestore → Règles :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permettre la lecture/écriture pour tous les utilisateurs
    // (pour simplifier - améliorer pour la production)
    match /users/{userId} {
      allow read, write: if true;
    }
  }
}
```

## 🧪 Test de fonctionnement

1. Ouvrir l'application
2. Se connecter avec un prénom
3. Faire quelques révisions
4. Vérifier dans la console Firebase que les données apparaissent
5. Se connecter sur un autre appareil avec le même prénom
6. Vérifier que les données sont synchronisées

## 📱 Mode hors ligne

- L'application fonctionne même sans Firebase configuré
- Les données sont sauvegardées localement
- Cliquer "Mode hors ligne" pour désactiver temporairement la synchronisation

## 🔧 Dépannage

### Erreur de connexion Firebase
- Vérifier la configuration dans `revision.html`
- Vérifier les règles Firestore
- Ouvrir la console développeur pour voir les erreurs

### Données non synchronisées
- Vérifier la connexion internet
- Vérifier le statut dans l'interface (☁️ Synchronisé / 📱 Mode hors ligne)
- Réessayer en rafraîchissant la page

### Reset des données
- Pour réinitialiser les données d'un utilisateur :
  1. Console développeur → Application → Local Storage
  2. Supprimer la clé `user_[nom]`
  3. Dans Firebase, supprimer le document correspondant