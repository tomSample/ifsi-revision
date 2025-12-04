#!/bin/bash
# Script de lancement du serveur de développement

echo "🚀 Démarrage de l'application IFSI Révision..."
echo ""

# Vérifier Python
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null
then
    echo "❌ Python n'est pas installé"
    exit 1
fi

# Utiliser python3 si disponible, sinon python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null
then
    PYTHON_CMD="python"
fi

echo "✅ Python trouvé: $($PYTHON_CMD --version)"
echo ""

# Installer les dépendances si nécessaire
if [ ! -d "venv" ]; then
    echo "📦 Création de l'environnement virtuel..."
    $PYTHON_CMD -m venv venv
fi

echo "📦 Activation de l'environnement virtuel..."
source venv/bin/activate

echo "📦 Installation des dépendances..."
pip install -q -r src/backend/requirements.txt

echo ""
echo "✅ Lancement du serveur Flask..."
echo "🌐 URL: http://localhost:5000"
echo ""

cd src/backend && $PYTHON_CMD app.py
