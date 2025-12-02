# 📚 Guide Rapide - Ajouter des Cours

## Prérequis
✅ Serveur Flask en local  
✅ Fichier cours au format `.odt`

---

## 🚀 Étapes

### 1. Démarrer le serveur local
```bash
python app.py
```
➡️ Le serveur démarre sur `http://localhost:5000`

### 2. Ouvrir l'interface admin
```
http://localhost:5000/admin.html
```

### 3. Uploader le fichier .odt
1. Glisser-déposer le fichier `.odt` dans la zone prévue
2. Vérifier l'aperçu des métadonnées extraites
3. Cliquer sur **"Ajouter le cours"**

---

## 📋 Format du fichier ODT

Le fichier doit respecter cette structure :

```
UE 2.2.S1
titre : Titre du cours
auteur : nom_auteur
01/12/2024
========
1. Terme 1 : Définition du premier terme
2. Terme 2 : Définition du second terme
...
```

**Points clés :**
- UE au format `UE X.X.SX`
- Séparateur : `========` (min 4 signes `=`)
- Définitions : `N. Terme : Définition`

---

## ✅ Vérification

Après l'upload, le cours est automatiquement ajouté à :
- `ifsi_courses_2025-09-23.json`
- Disponible immédiatement dans l'app de révision

---

## ⚠️ Cours en doublon

Si le cours existe déjà :
- Un dialogue de confirmation s'affiche
- Choisir **OK** pour remplacer ou **Annuler** pour conserver l'ancien

---

## 🐛 Problèmes courants

| Problème | Solution |
|----------|----------|
| Serveur inaccessible | Vérifier que `python app.py` tourne |
| Erreur de parsing | Vérifier le format du fichier ODT |
| Upload bloqué | Rafraîchir la page (F5) |
