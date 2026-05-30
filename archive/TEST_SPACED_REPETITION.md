# Test de la Répétition Espacée

## Modifications Apportées

### 1. Algorithme de Sélection (`revision.js`)
**Fonction:** `selectTermsForSession()`

**Nouveau comportement:**
- ✅ **Utilisateur connecté + progression:** Mode intelligent
  - Priorité 1: Termes jamais vus (shufflés)
  - Priorité 2: Termes dus aujourd'hui (triés par retard et difficulté)
  - Priorité 3: Termes pas encore dus (seulement si pas assez)

- ℹ️ **Utilisateur non connecté OU pas de progression:** Mode aléatoire
  - Shuffle classique des termes filtrés

**Logs console disponibles:**
```javascript
🔍 Vérification modules: { spacedRepetition, syncManager, auth, user, userProgressSize }
📊 Catégorisation: { neverSeen, dueToday, notDue }
✅ Session intelligente: { total, composition }
```

### 2. Indicateur Visuel
**Fichiers modifiés:**
- `revision.html` : Ajout div `#selectionModeIndicator`
- `style-revision.css` : Style `.stat-icon`
- `revision.js` : Update dans `updateStatsDisplay()`

**Affichage:**
- 🧠 **Répétition espacée active** (bleu) - Utilisateur connecté avec progression
- ℹ️ **Mode aléatoire (pas de progression)** (gris) - Utilisateur connecté sans données
- 🔀 **Mode aléatoire (non connecté)** (gris) - Mode invité

## Comment Tester

### Test 1: Mode Invité (Aléatoire)
1. Ouvrir http://localhost:5000/src/frontend/pages/revision.html
2. Ne PAS se connecter
3. Observer l'indicateur: 🔀 Mode aléatoire (non connecté)
4. Console: `⚠️ Mode aléatoire: { raison: 'Non connecté' }`

### Test 2: Mode Connecté Sans Progression (Aléatoire)
1. Se connecter avec un compte Firebase
2. Ne jamais avoir fait de révision (ou vider Firestore)
3. Observer: ℹ️ Mode aléatoire (pas de progression)
4. Console: `⚠️ Mode aléatoire: { raison: 'Aucune progression enregistrée' }`

### Test 3: Mode Intelligent (Répétition Espacée)
1. Se connecter avec un compte Firebase
2. Faire au moins une session de révision (enregistrer difficulté)
3. Revenir plus tard (ou modifier Firestore pour mettre des dates passées)
4. Observer: 🧠 Répétition espacée active (bleu)
5. Console détaillée:
```
🔍 Vérification modules: { user: 'abc123', userProgressSize: 15 }
🧠 Mode intelligent activé - Répétition espacée
📊 Catégorisation: { neverSeen: 50, dueToday: 8, notDue: 12 }
✅ Session intelligente: { total: 10, composition: { neverSeen: 6, dueToday: 4, notDue: 0 } }
  1. Anatomie cardiaque... - Jamais vu
  2. Valves cardiaques... - Dû (retard: 3j) - difficile
  3. ...
```

### Test 4: Vérifier le Filtrage par Date
1. En mode connecté avec progression
2. Ouvrir la console navigateur
3. Regarder la composition de la session
4. Vérifier que:
   - Les termes "Jamais vu" apparaissent en premier
   - Les termes "Dû aujourd'hui" ou "en retard" apparaissent
   - Les termes "Prochain: dans Xj" n'apparaissent PAS (sauf si session > termes dus)

## Intervalles de Révision

Selon `spaced-repetition.js` (SM-2 algorithm):

| Difficulté | Premier intervalle | Suivants |
|------------|-------------------|----------|
| **Difficile** | 1 jour | Répété court |
| **Moyen** | 3 jours | Augmente progressivement |
| **Facile** | 6 jours | Augmente rapidement |

**Formule SM-2:**
- `interval = previousInterval × easinessFactor`
- `easinessFactor` ajusté selon qualité réponse (entre 1.3 et 2.5)

## Données Firestore

**Structure:** `users/{uid}/progress/{termKey}`

```json
{
  "easinessFactor": 2.5,
  "repetitions": 3,
  "intervalDays": 12,
  "lastReviewed": "2025-12-06T10:30:00.000Z",
  "nextReview": "2025-12-18T10:30:00.000Z",
  "lastDifficulty": "moyen",
  "reviewCount": 5,
  "difficultyHistory": {
    "difficile": 1,
    "moyen": 2,
    "facile": 2
  }
}
```

**Champs importants pour le filtrage:**
- `nextReview` : Date ISO de la prochaine révision
- `lastDifficulty` : 'difficile', 'moyen', 'facile'
- `repetitions` : Nombre de révisions réussies

## Commandes de Test Firestore

Pour tester rapidement, créer manuellement des documents:

```javascript
// Console Firebase (Firestore)
db.collection('users').doc('YOUR_UID').collection('progress').doc('termKey123').set({
  easinessFactor: 2.5,
  repetitions: 1,
  intervalDays: 1,
  lastReviewed: new Date('2025-12-05'),
  nextReview: new Date('2025-12-06'), // Dû aujourd'hui
  lastDifficulty: 'difficile',
  reviewCount: 1,
  difficultyHistory: { difficile: 1, moyen: 0, facile: 0 }
});
```

## Prochaines Étapes

Après validation:
1. ✅ Tester les 4 scénarios ci-dessus
2. 📝 Commit: `feat: répétition espacée intelligente`
3. 🔀 Merge vers `stable-v1`
4. 📦 Bump version → `3.3.0`
5. 🚀 Push vers GitHub

## Résultat Attendu

**Pour un utilisateur avec 100 termes:**
- 30 jamais vus
- 10 dus aujourd'hui (dont 3 en retard)
- 60 pas encore dus

**Session de 10 termes:**
- Priorité aux jamais vus d'abord
- Puis dus aujourd'hui (triés difficile → facile)
- Résultat probable: 7-8 jamais vus + 2-3 dus

**Avantages:**
- ✅ Apprentissage progressif (jamais vus en premier)
- ✅ Révisions ciblées (termes difficiles reviennent plus vite)
- ✅ Pas de surcharge (termes maîtrisés espacés automatiquement)
- ✅ Backward compatible (mode aléatoire pour invités)
