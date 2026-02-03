# 🛣️ Feuille de Route - Améliorations Futures

## ✅ Phase 1 COMPLÉTÉE - Auto-chargement des CSV

**État:** 🟢 Fonctionnel  
**Fichiers modifiés:** 2  
**Nouvelles routes API:** 1  
**Documentation:** 7 fichiers  

---

## 📋 Phase 2 (Optionnel) - Amélioration UX

### 2.1 Upload direct via l'interface
- Ajouter un bouton "Uploader un CSV"
- Nouvelle route: `POST /api/recap-charts/upload`
- Validation du format
- Message de succès

### 2.2 Dashboard d'administration
- Voir tous les fichiers CSV
- Bouton pour supprimer un fichier
- Aperçu du contenu
- Historique des uploads

### 2.3 Édition en direct
- Éditer le contenu des CSV depuis le web
- Sauvegarder les modifications
- Version history (optionnel)

---

## 💾 Phase 3 (Optionnel) - Performance

### 3.1 Cache côté serveur
- Mettre en cache la liste des CSV
- Expiration après 5 minutes
- Invalidation manuelle possible

### 3.2 Compression
- Gzipper les réponses JSON
- Réduire la bande passante

### 3.3 Lazy loading
- Charger les CSV au scroll
- Pas tous d'un coup

---

## 🔄 Phase 4 (Optionnel) - Intégration

### 4.1 Recherche globale
- Rechercher dans les CSV
- Chercher par UE, mot-clé, etc.

### 4.2 Export
- Exporter un CSV compilé (tous les fichiers)
- Exporter en XLSX
- Exporter en PDF

### 4.3 Synchronisation
- Sync avec Google Drive (optionnel)
- Backup automatique

---

## 🤖 Phase 5 (Optionnel) - Intelligence

### 5.1 Validation intelligente
- Vérifier la structure du CSV
- Détecter les colonnes manquantes
- Avertissements avant le upload

### 5.2 Import/Export CSV
- Importer depuis différentes sources
- Normaliser les formats différents

### 5.3 Statistiques
- Nombre de lignes par tableau
- Dernière modification
- Taille du fichier

---

## 🚀 Ce qui pourrait être fait en priorité

### Faible effort, très utile:
1. ✨ **Bouton pour supprimer un CSV**
   - Effort: 1 heure
   - Utilité: Haute
   
2. ✨ **Upload direct via interface**
   - Effort: 2 heures
   - Utilité: Très haute
   
3. ✨ **Validation de format CSV**
   - Effort: 1-2 heures
   - Utilité: Moyenne

### Effort moyen:
4. 🎯 **Dashboard d'administration**
   - Effort: 4-6 heures
   - Utilité: Moyenne

5. 🎯 **Cache côté serveur**
   - Effort: 2-3 heures
   - Utilité: Performance

### Effort élevé:
6. 💪 **Édition en direct des CSV**
   - Effort: 8-10 heures
   - Utilité: Basse (peut être fait avec Excel)

7. 💪 **Sync avec Google Drive**
   - Effort: 6-8 heures
   - Utilité: Très basse

---

## 📊 Priorités recommandées

### TOP 3 pour l'année

1. **✅ Auto-chargement** (FAIT)
   - Permet d'ajouter des fichiers facilement

2. **Upload direct** (RECOMMANDÉ)
   - Évite de devoir naviguer le système de fichiers
   - Gain de temps énorme
   - ~2 heures de travail

3. **Dashboard/Admin** (RECOMMANDÉ)
   - Voir tous les fichiers en un coup d'oeil
   - Supprimer/modifier facilement
   - ~5 heures de travail

---

## 🎯 MVP Suggéré pour Phase 2

Si vous ne voulez que les fonctionnalités essentielles:

```
Phase 2 MVP:
├─ Bouton upload CSV
├─ Suppression de fichier
├─ Validation format
└─ Page de gestion des fichiers

Effort total: ~5 heures
Impact: Très haut
```

---

## 📈 Possible avenir

### Court terme (1-3 mois)
- Optimiser l'interface actuelle
- Ajouter l'upload direct
- Dashboard basique

### Moyen terme (3-6 mois)
- Édition en direct (optionnel)
- Recherche global
- Export avancé

### Long terme (6+ mois)
- Intégration Google Drive
- Statistiques avancées
- Version history

---

## 🛑 Limitations actuelles

Qu'est-ce qui pourrait être amélioré:

1. ⚠️ Pas d'upload direct (faut accéder aux fichiers)
2. ⚠️ Pas de suppression via UI (faut accéder aux fichiers)
3. ⚠️ Pas de validation de format CSV
4. ⚠️ Pas de cache (requête API à chaque fois)
5. ⚠️ Pas d'historique des uploads

---

## ✨ Ce qui fonctionne parfaitement

✅ Détection automatique des CSV  
✅ Affichage sur l'interface  
✅ Filtrage par UE et semestre  
✅ Performance bonne  
✅ Aucune maintenance requise  

---

## 💡 Idées futures

### Nice-to-have

- [ ] Thème dark mode
- [ ] Export en PDF
- [ ] Recherche par mot-clé
- [ ] Stats par UE
- [ ] Mobile-responsive
- [ ] Offline mode

### Pour une future version

- [ ] API REST complète (CRUD)
- [ ] Base de données (au lieu de fichiers)
- [ ] Multi-utilisateurs
- [ ] Permissions granulaires
- [ ] Audit trail

---

## 🚀 Prochaines étapes recommandées

### Immédiate
1. ✅ Tester le système actuel
2. ✅ Ajouter quelques fichiers CSV
3. ✅ Valider que ça fonctionne

### Court terme (1-2 semaines)
1. 🔴 Ajouter un upload direct
2. 🔴 Ajouter une suppression via UI
3. 🔴 Validation de format

### Moyen terme (1-3 mois)
1. 🟠 Dashboard d'administration
2. 🟠 Recherche dans les CSV
3. 🟠 Statistiques

---

## 📝 Notes de développement

### Pour implémenter la Phase 2:

**Backend (Python Flask):**
```python
@app.route('/api/recap-charts/upload', methods=['POST'])
def upload_chart():
    # Valider le fichier
    # Sauvegarder
    # Retourner le succès

@app.route('/api/recap-charts/delete/<filename>', methods=['DELETE'])
def delete_chart(filename):
    # Valider le filename
    # Supprimer
    # Retourner le succès

@app.route('/api/recap-charts/validate', methods=['POST'])
def validate_csv():
    # Valider la structure CSV
    # Retourner les erreurs
```

**Frontend (JavaScript):**
```javascript
// Ajouter des formulaires pour upload/delete
// Ajouter les handlers
// Afficher les messages de succès/erreur
```

---

## 🎯 Conclusion

L'implémentation actuelle est **solide et prête pour la production**.

Les améliorations futures sont **optionnelles** mais pourraient vraiment améliorer l'UX.

**Recommandation:** Tester le système actuel pendant 1-2 semaines, puis ajouter l'upload direct comme prochaine évolution.

---

**Créé:** 3 Février 2026  
**Dernière mise à jour:** 3 Février 2026  
**Statut:** Feuille de route 1.0
