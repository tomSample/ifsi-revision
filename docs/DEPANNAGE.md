# 🔧 GUIDE DE DÉPANNAGE - QUIZ PHARMACOLOGIE

Si vous rencontrez des problèmes, consultez ce guide.

---

## ❓ QUESTIONS FRÉQUENTES

### "Le quiz ne charge pas"

**Vérifications:**
1. Rafraîchissez la page (Ctrl+F5)
2. Vérifiez que vous êtes sur `/quiz.html`
3. Ouvrez la console (F12) et cherchez les erreurs rouges
4. Vérifiez que `pharmaco.csv` existe dans `src/data/`

**Solution rapide:**
```
1. Aller à: test-quiz.html
2. Si ça fonctionne → le problème vient de la configuration
3. Si ça ne fonctionne pas → le problème vient de l'installation
```

---

### "Erreur: Fichier CSV non trouvé"

**Causes possibles:**
- Le fichier `pharmaco.csv` n'est pas dans `src/data/`
- Mauvais chemin d'accès
- Permissions de fichier

**Solutions:**
```
1. Vérifier que src/data/pharmaco.csv existe
2. Vérifier que le fichier n'est pas vide
3. Vérifier que le fichier n'est pas corrompu (ouvrir avec un éditeur texte)
4. Vérifier l'encodage du fichier (UTF-8)
```

---

### "Je vois "Aucune donnée" ou "0 questions""

**Vérifications:**
1. Le CSV charge mais est vide?
   - Vérifier que `pharmaco.csv` a du contenu
   - Vérifier le format du CSV (colonnes correctes)

2. Le CSV ne parse pas?
   - Ouvrir la console (F12)
   - Vérifier les erreurs JavaScript
   - Vérifier la structure du CSV

**Solution:**
```javascript
// Dans la console:
console.log(window.pharmaQuiz.pharmaData);
// Devrait afficher un array avec des objets
```

---

### "Les questions n'apparaissent pas"

**Vérifications:**
1. Quiz a-t-il démarré? Vérifier la console
2. Fichiers JavaScript chargés? Vérifier dans Network (F12)
3. Erreur JavaScript? Vérifier la console

**Solution:**
```
1. Ouvrir test-quiz.html
2. Vérifier que les questions s'affichent
3. Si oui → problème dans le contrôleur
4. Si non → problème dans le générateur
```

---

### "Le bouton Quiz n'apparaît pas dans home.html"

**Vérifications:**
1. Vous êtes bien sur la version modifiée?
2. La page s'a pas mis en cache?

**Solutions:**
```
1. Faire Ctrl+Shift+Delete (vider cache)
2. Aller à: home.html
3. Faire Ctrl+F5 (forcer rechargement)
4. Le bouton devrait apparaître
```

---

### "Mon score est toujours 0"

**Causes:**
- Les réponses ne sont pas enregistrées
- Les réponses ne sont pas validées

**Vérifications:**
1. Vous sélectionnez bien une réponse avant de continuer?
2. Message d'alerte "Veuillez sélectionner une réponse"?

**Solution:**
```
1. S'assurer de cliquer sur une réponse
2. Voir si elle devient "selected" (surbrillance)
3. Puis cliquer "Suivant" ou "Terminer"
```

---

### "Les explications ne s'affichent pas"

**Cause:**
- L'explication dans le CSV est vide

**Solution:**
```
1. Vérifier que les colonnes du CSV ne sont pas vides
2. Vérifier que la colonne "Explication" a du contenu
3. Vérifier l'encodage du fichier
```

---

## 🔍 TESTS DE DIAGNOSTIC

### Test 1: Vérifier le chargement du CSV

**Ouvrir la console (F12) et exécuter:**
```javascript
fetch('/src/data/pharmaco.csv')
    .then(r => r.text())
    .then(t => console.log('CSV chargé:', t.length, 'caractères'))
    .catch(e => console.error('Erreur:', e))
```

**Résultat attendu:**
```
CSV chargé: 14000+ caractères
```

---

### Test 2: Vérifier le parsing

**Dans la console:**
```javascript
let quiz = new PharmaQuiz();
quiz.loadPharmaData().then(loaded => {
    console.log('Chargé:', loaded);
    console.log('Entrées:', quiz.pharmaData.length);
    console.log('Première entrée:', quiz.pharmaData[0]);
});
```

**Résultat attendu:**
```
Chargé: true
Entrées: 53
Première entrée: {famille: "...", medicaments: "...", ...}
```

---

### Test 3: Vérifier la génération de questions

**Dans la console:**
```javascript
quiz.generateQuiz(5, 'mixed');
console.log('Questions générées:', quiz.currentQuiz.length);
console.log('Première question:', quiz.currentQuiz[0]);
```

**Résultat attendu:**
```
Questions générées: 5
Première question: {type: "qcm", question: "...", answers: [...]}
```

---

### Test 4: Vérifier le contrôleur

**Aller sur quiz.html et ouvrir la console:**
```javascript
console.log('pharmaQuiz disponible?', typeof window.pharmaQuiz !== 'undefined');
console.log('Fonctions disponibles?', typeof window.startQuiz !== 'undefined');
```

**Résultat attendu:**
```
pharmaQuiz disponible? true
Fonctions disponibles? true
```

---

## 🛠️ DÉPANNAGE AVANCÉ

### Le quiz charge mais pas les données

**Vérifier le chemin d'accès:**
```javascript
// Vérifier le chemin résolu
console.log('Chemin base:', window.resolvePath('/src/data/pharmaco.csv'));

// Devrait afficher quelque chose comme:
// /src/data/pharmaco.csv (ou /ifsi-revision/src/data/pharmaco.csv sur GitHub)
```

---

### Les questions générées sont bizarres

**Vérifier le CSV:**
```javascript
// Afficher toutes les colonnes
console.table(window.pharmaQuiz.pharmaData.slice(0, 3));
```

**Chercher:**
- Des colonnes vides
- Des caractères bizarres
- Du texte mal formé

---

### Les réponses ne sont pas bien catégorisées

**Vérifier le parsing:**
```javascript
// Vérifier comment une ligne est parsée
let quiz = new PharmaQuiz();
let testLine = "Test,Valeur1,Valeur2,\"Valeur avec, virgule\"";
console.log('Parsée:', quiz.parseCSVLine(testLine));
```

---

## 🔄 SOLUTIONS RAPIDES

### Problème général: "Rien ne fonctionne"

**Essayez ceci:**
1. Videz le cache du navigateur (Ctrl+Shift+Delete)
2. Fermer et rouvrir le navigateur
3. Essayer sur un autre navigateur
4. Essayer en mode incognito

---

### Après un update du code

**Si rien ne fonctionne après modifications:**
1. Vider le cache (Ctrl+Shift+Delete)
2. Forcer rechargement (Ctrl+Shift+R ou Cmd+Shift+R)
3. Fermer les onglets du site
4. Rouvrir l'onglet

---

### En production (GitHub Pages)

**Si ça fonctionne localement mais pas en prod:**
1. Vérifier les chemins (peut être `/ifsi-revision/...`)
2. Vérifier les CORS si appel API
3. Vérifier que `resolvePath()` fonctionne

---

## 📱 PROBLÈMES SPÉCIFIQUES

### Mobile: Écran trop petit

**Solution:**
- L'interface est responsive
- Si problème: essayer rotation écran
- Essayer réduire le zoom navigateur

### Mobile: Les boutons ne répondent pas

**Solution:**
- Essayer double-tap
- Essayer long-press
- Vérifier que le navigateur autorise les actions

### Mobile: Les réponses disparaissent

**Solution:**
- Actualiser la page
- C'est peut-être un bug de cache
- Essayer en mode incognito

---

## 💾 SAUVEGARDER VOS RÉPONSES

**Actuellement:** Les réponses ne sont pas sauvegardées.

**Pour les sauvegarder:**
- [ ] À faire: Implémenter localStorage
- [ ] À faire: Intégrer Firebase

---

## 📊 VÉRIFIER LES PERFORMANCES

**Ouvrir DevTools (F12) → Performance:**

1. Cliquer sur "Record"
2. Lancer le quiz
3. Répondre à quelques questions
4. Cliquer "Stop"

**Chercher:**
- FPS > 50
- Pas d'erreurs rouges
- Pas de freeze

---

## 🚨 SIGNALER UN BUG

Si vous trouvez un bug:

1. **Décrire le problème** clairement
2. **Inclure les steps pour reproduire**
3. **Copier-coller l'erreur** de la console
4. **Indiquer le navigateur** et version
5. **Laisser la console ouverte** (F12)

---

## 📞 AIDE SUPPLÉMENTAIRE

Si rien ne fonctionne:

1. **Consulter les docs:**
   - PHARMA_QUIZ_README.md
   - TYPES_QUESTIONS_EXPLICATIONS.md

2. **Essayer test-quiz.html** pour diagnostiquer

3. **Vérifier la console** pour les erreurs (F12)

4. **Vérifier que tous les fichiers existent:**
   - quiz.html
   - quiz-controller.js
   - pharma-quiz.js
   - pharmaco.csv

---

## ✅ CHECKLIST DE DÉPANNAGE

- [ ] Cache vidé (Ctrl+Shift+Delete)
- [ ] Rafraîchi (Ctrl+F5)
- [ ] Console ouverte (F12)
- [ ] Pas d'erreurs rouges?
- [ ] test-quiz.html fonctionne?
- [ ] pharmaco.csv existe?
- [ ] Tous les fichiers présents?
- [ ] Essayé autre navigateur?

---

**Bonne chance!** Si vous êtes toujours bloqué, consultez la documentation complète. 📚
