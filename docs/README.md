# 📚 IFSI Lannion 2025 - Plateforme de Révision

> Système intelligent de révision avec répétition espacée (SM-2) et synchronisation cloud

[![Version](https://img.shields.io/badge/version-2.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

---

## 🎯 Vue d'Ensemble

Application web pour étudiants IFSI permettant une révision efficace grâce à :
- **Algorithme SM-2** : Optimise la mémorisation à long terme
- **Synchronisation Firebase** : Progression accessible partout
- **Interface intuitive** : Révision fluide et motivante

**🔗 Stack** : HTML/CSS/JS + Python Flask + Firebase

---

## ✨ Fonctionnalités

| Feature | Description |
|---------|-------------|
| 🧠 **Répétition Espacée** | Algorithme SM-2 pour mémorisation optimale |
| 📊 **Statistiques** | Heatmap 30 jours, graphiques UE, taux de réussite |
| 🔐 **Auth Firebase** | Inscription, connexion, reset password |
| ☁️ **Sync Cloud** | Progression multi-devices temps réel |
| 🖼️ **Galerie Médicale** | Images anatomie/systèmes/normes |
| ⚙️ **Admin** | Upload ODT, gestion cours |

---

## 🚀 Démarrage Rapide

### 1. Installation
```bash
# Cloner le projet
git clone https://github.com/tomSample/ifsi-revision.git
cd "ifsi-revision/révision 6"

# Installer dépendances Python
pip install -r requirements.txt
```

### 2. Configuration Firebase
Voir → [`docs/FIREBASE.md`](docs/FIREBASE.md)

### 3. Lancement
```bash
python app.py
```
➡️ Ouvrir http://localhost:5000

---

## 📁 Structure du Projet

```
révision 6/
├── css/              # CSS modulaire refactorisé
│   ├── variables.css  # Design tokens
│   ├── base.css       # Reset & base
│   ├── components.css # Composants réutilisables
│   └── ...
├── docs/             # Documentation
│   ├── FIREBASE.md    # Setup Firebase
│   ├── AJOUT_COURS.md # Guide admin
│   └── GOOGLE_FORM.md # Config signalements
├── *.js              # Modules JavaScript
├── *.html            # Pages
├── app.py            # Backend Flask
└── ifsi_courses_*.json # Base de données locale
```

---

## 📖 Documentation

| Guide | Description |
|-------|-------------|
| [**Setup Firebase**](docs/FIREBASE.md) | Configuration auth + Firestore (10 min) |
| [**Ajouter des cours**](docs/AJOUT_COURS.md) | Upload fichiers ODT |
| [**Google Form**](docs/GOOGLE_FORM.md) | Config signalements (optionnel) |

---

## 🎯 Utilisation

### Pour Étudiants
1. **S'inscrire** via `register.html`
2. **Choisir UE** à réviser
3. **Lancer session** (10 termes par défaut)
4. **Auto-évaluer** (facile/moyen/difficile)
5. **Consulter stats** sur `statistics.html`

### Pour Administrateurs
1. **Ouvrir** `admin.html`
2. **Uploader** fichiers `.odt` (voir [guide](docs/AJOUT_COURS.md))
3. **Valider** extraction automatique
4. **Gérer** images médicales

---

## 🛠️ Technologies

**Frontend**
- HTML5, CSS3 (Variables CSS), JavaScript ES6+
- Firebase SDK 10.7.0 (Auth + Firestore)
- Design System modulaire

**Backend**
- Python 3.11 + Flask 2.3.3
- python-odf 1.4.0 (extraction ODT)
- Flask-CORS 4.0.0

**Base de données**
- Firestore (progression utilisateur)
- JSON local (cours + cache)

---

## 📊 Métriques

- **500+** termes disponibles
- **6 UE** couvertes (2.2, 2.4, 3.1, 3.10, 4.1, 4.4)
- **15** cours
- **9** images médicales
- **Algorithme SM-2** éprouvé

---

## 🤝 Contribuer

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -m 'Ajout ma feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvrir une Pull Request

---

## 📝 Roadmap

- [ ] PWA (mode hors ligne)
- [ ] Dark mode
- [ ] Export PDF stats
- [ ] Révision collaborative
- [ ] Tests automatisés (Jest + Cypress)

Voir issues GitHub pour détails

---

## 📄 License

MIT License - Voir [LICENSE](LICENSE)

---

## 👥 Auteur

**Thomas** - [@tomSample](https://github.com/tomSample)

**Projet** : IFSI Lannion 2025

---

**Dernière MAJ** : Décembre 2025 • **Version** : 2.0
