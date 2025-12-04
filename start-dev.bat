@echo off
REM Script de lancement du serveur de développement (Windows)

echo 🚀 Démarrage de l'application IFSI Révision...
echo.

REM Vérifier Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python n'est pas installé
    pause
    exit /b 1
)

echo ✅ Python trouvé
python --version
echo.

REM Créer l'environnement virtuel si nécessaire
if not exist "venv" (
    echo 📦 Création de l'environnement virtuel...
    python -m venv venv
)

echo 📦 Activation de l'environnement virtuel...
call venv\Scripts\activate.bat

echo 📦 Installation des dépendances...
pip install -q -r src\backend\requirements.txt

echo.
echo ✅ Lancement du serveur Flask...
echo 🌐 URL: http://localhost:5000
echo.

cd src\backend
python app.py
