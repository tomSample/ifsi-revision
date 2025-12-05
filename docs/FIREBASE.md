# 🔥 Configuration Firebase pour IFSI Révision

## 📋 Prérequis
- Compte Google
- 10 minutes

---

## 🚀 Étape 1 : Créer un projet Firebase

1. **Aller sur** : https://console.firebase.google.com/
2. **Cliquer** sur "Ajouter un projet"
3. **Nom du projet** : `ifsi-revision` (ou autre)
4. **Google Analytics** : Désactiver (pas nécessaire)
5. **Cliquer** sur "Créer le projet"

---

## 🔐 Étape 2 : Activer l'authentification

1. Dans le menu latéral → **Authentication**
2. Cliquer sur **"Commencer"**
3. Onglet **"Sign-in method"**
4. Activer **"E-mail/Mot de passe"** :
   - Cliquer sur la ligne
   - Activer le premier bouton (Email/Password)
   - ❌ NE PAS activer "Lien par e-mail (connexion sans mot de passe)"
   - Sauvegarder

---

## 💾 Étape 3 : Créer la base de données Firestore

1. Dans le menu latéral → **Firestore Database**
2. Cliquer sur **"Créer une base de données"**
3. **Mode** : Choisir **"Production"** (on configurera les règles après)
4. **Localisation** : `europe-west1` (Belgique) ou `europe-west3` (Francfort)
5. Cliquer sur **"Activer"**

---

## 🛡️ Étape 4 : Configurer les règles de sécurité Firestore

1. Dans **Firestore Database** → Onglet **"Règles"**
2. **Remplacer** tout le contenu par :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Vérifier si utilisateur est admin
    function isAdmin() {
      return exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Utilisateurs peuvent gérer leurs propres données
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Sous-collection progression
      match /progress/{termKey} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Historique des révisions
        match /history/{reviewId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    
    // ⭐ NOUVEAU : Feedbacks utilisateurs
    match /feedbacks/{feedbackId} {
      allow create: if request.auth != null;  // N'importe quel utilisateur connecté peut créer
      allow read: if isAdmin();                // Seuls les admins peuvent lire
      allow update, delete: if isAdmin();      // Seuls les admins peuvent modifier/supprimer
    }
    
    // Cours en lecture seule (optionnel - si tu décides de les mettre sur Firebase)
    match /courses/{courseId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

3. Cliquer sur **"Publier"**

---

## 🌐 Étape 5 : Récupérer la configuration Web

1. Dans la page d'accueil du projet → **Paramètres du projet** (⚙️ en haut à gauche)
2. Scroll vers le bas → Section **"Vos applications"**
3. Cliquer sur l'icône **Web** (`</>`)
4. **Nom de l'app** : `ifsi-revision-web`
5. ❌ NE PAS cocher "Configurer Firebase Hosting"
6. Cliquer sur **"Enregistrer l'application"**
7. **Copier** les informations de configuration qui ressemblent à :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "ifsi-revision.firebaseapp.com",
  projectId: "ifsi-revision",
  storageBucket: "ifsi-revision.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

8. **Coller** ces informations dans le fichier `firebase-config.js`

---

## 📧 Étape 6 : Configurer l'email de réinitialisation

1. Dans **Authentication** → Onglet **"Templates"**
2. Cliquer sur **"Réinitialisation du mot de passe"** (crayon ✏️)
3. **Personnaliser le message** (optionnel) :
   - Nom de l'expéditeur : `IFSI Lannion Révisions`
   - Objet : `Réinitialisation de votre mot de passe`
   - Message : Garder le template par défaut ou personnaliser
4. **Sauvegarder**

---

## ✅ Vérification finale

**Checklist :**
- ✅ Authentication activée (Email/Password)
- ✅ Firestore Database créée
- ✅ Règles de sécurité configurées
- ✅ Configuration Web copiée dans `firebase-config.js`
- ✅ Template email configuré

---

## 🔒 Sécurité des données

### Données collectées (minimum) :
- ✅ Email (obligatoire pour connexion)
- ✅ Mot de passe (hashé automatiquement par Firebase)
- ❌ Pas de nom
- ❌ Pas de téléphone
- ❌ Pas de date de naissance

### Protection :
- 🔐 Mots de passe **jamais stockés en clair** (Firebase utilise bcrypt)
- 🔐 Règles Firestore empêchent l'accès aux données des autres utilisateurs
- 🔐 Chaque utilisateur voit **uniquement** ses propres données
- 🔐 HTTPS obligatoire

---

## 💰 Limites gratuites (Spark Plan)

**Authentication :**
- ✅ 50,000 utilisateurs actifs/mois
- ✅ Illimité en connexions

**Firestore :**
- ✅ 1 GB de stockage
- ✅ 50,000 lectures/jour
- ✅ 20,000 écritures/jour
- ✅ 20,000 suppressions/jour

**Pour 100-500 étudiants IFSI → Largement suffisant !**

---

## 🆘 Dépannage

### Erreur "Firebase: Error (auth/invalid-api-key)"
→ Vérifier que `apiKey` dans `firebase-config.js` est correct

### Erreur "Missing or insufficient permissions"
→ Vérifier les règles Firestore (Étape 4)

### Email de réinitialisation non reçu
→ Vérifier les spams
→ Vérifier dans Authentication > Users si l'email est vérifié

---

## 📝 Notes importantes

1. **Ne pas commit** `firebase-config.js` avec les vraies clés sur GitHub public
   - Ajouter à `.gitignore` : `firebase-config.js`
   - Créer `firebase-config.example.js` avec des valeurs factices

2. **Sauvegarder** la configuration Firebase quelque part (gestionnaire de mots de passe)

3. **Monitoring** : Firebase Console > Analytics pour suivre l'usage

---

## ✨ C'est prêt !

Ton Firebase est configuré. L'application peut maintenant :
- ✅ Créer des comptes utilisateurs (email + mot de passe)
- ✅ Se connecter / Déconnecter
- ✅ Réinitialiser le mot de passe
- ✅ Synchroniser la progression
- ✅ Gérer le compte utilisateur

**Durée totale : ~10 minutes** ⏱️
