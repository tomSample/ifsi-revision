# Configuration Firebase OAuth pour GitHub Pages

## Problème actuel

L'erreur suivante apparaît dans la console :

```
Info: The current domain is not authorized for OAuth operations. 
This will prevent signInWithPopup, signInWithRedirect, linkWithPopup and linkWithRedirect from working. 
Add your domain (tomsample.github.io) to the OAuth redirect domains list in the Firebase console 
-> Authentication -> Settings -> Authorized domains tab.
```

## Solution : Autoriser le domaine GitHub Pages

### Étapes à suivre dans la Firebase Console

1. **Aller sur Firebase Console**
   - URL : https://console.firebase.google.com/
   - Sélectionner le projet : `ifsi-revision`

2. **Accéder aux paramètres d'authentification**
   - Dans le menu latéral gauche, cliquer sur **"Authentication"** (🔐)
   - Cliquer sur l'onglet **"Settings"** en haut
   - Faire défiler jusqu'à la section **"Authorized domains"**

3. **Ajouter le domaine GitHub Pages**
   - Cliquer sur **"Add domain"**
   - Entrer : `tomsample.github.io`
   - Cliquer sur **"Add"**

4. **Domaines qui doivent être autorisés :**
   - ✅ `localhost` (déjà présent par défaut)
   - ✅ `ifsi-revision.firebaseapp.com` (déjà présent par défaut)
   - ✅ `tomsample.github.io` (À AJOUTER)

### Résultat attendu

Après cette configuration :
- ✅ Les utilisateurs pourront se connecter depuis GitHub Pages
- ✅ Les opérations Firebase Auth fonctionneront normalement
- ✅ Plus d'avertissement dans la console

### Délai de propagation

- Les changements sont généralement **immédiats**
- Rafraîchir la page GitHub Pages après l'ajout
- Vider le cache si nécessaire (Ctrl+Shift+R ou Cmd+Shift+R)

---

## Notes supplémentaires

### Pourquoi cette configuration est nécessaire ?

Firebase Auth vérifie que les requêtes d'authentification proviennent de domaines autorisés pour des raisons de sécurité. Cela empêche les attaques par domaine malveillant.

### Impact si non configuré

Sans cette autorisation :
- ❌ `signInWithEmailAndPassword()` fonctionne (utilisé actuellement)
- ❌ `signInWithPopup()` NE fonctionnera PAS (Google, Facebook, etc.)
- ❌ `signInWithRedirect()` NE fonctionnera PAS
- ✅ Toutes les autres opérations Firebase (Firestore, Storage) fonctionnent

### Sécurité

Cette configuration est **SAFE** :
- Vous autorisez uniquement votre propre domaine GitHub Pages
- Les clés API dans `firebase-config.js` sont publiques par design
- La sécurité réelle est assurée par les Firestore Security Rules

---

**Date de création :** 6 décembre 2025  
**Statut :** Configuration requise pour production
