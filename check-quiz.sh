#!/bin/bash
# ============================================================================
# SCRIPT VÉRIFICATION - QUIZ PHARMACOLOGIE
# ============================================================================
# Vérifie l'installation complète du quiz pharmacologie
# ============================================================================

echo "🔍 VÉRIFICATION QUIZ PHARMACOLOGIE v1.0"
echo "========================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
PASSED=0
FAILED=0

# Fonction de test
test_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $description - NOT FOUND: $file"
        ((FAILED++))
    fi
}

test_string() {
    local file=$1
    local string=$2
    local description=$3
    
    if grep -q "$string" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $description - STRING NOT FOUND"
        ((FAILED++))
    fi
}

# === Tests fichiers ===
echo "📁 FICHIERS"
test_file "src/frontend/pages/quiz.html" "quiz.html existe"
test_file "src/frontend/pages/quiz-controller.js" "quiz-controller.js existe"
test_file "src/frontend/assets/scripts/modules/pharma-quiz.js" "pharma-quiz.js existe"
test_file "src/data/pharmaco.csv" "pharmaco.csv existe"
test_file "public/js/modules/pharma-quiz.min.js" "pharma-quiz.min.js (minifiée) existe"

echo ""
echo "📝 MODIFICATION HOME.HTML"
test_string "src/frontend/pages/home.html" "nav-btn quiz" "Style CSS du bouton quiz"
test_string "src/frontend/pages/home.html" "Quiz Pharmacologie" "Texte du bouton quiz"
test_string "src/frontend/pages/home.html" "openPharmaQuiz" "Fonction openPharmaQuiz"

echo ""
echo "📚 DOCUMENTATION"
test_file "docs/PHARMA_QUIZ_README.md" "Documentation technique"
test_file "docs/PHARMA_QUIZ_IMPLEMENTATION.md" "Détails implémentation"
test_file "docs/QUIZ_GUIDE_RAPIDE.md" "Guide utilisateur"

echo ""
echo "🧪 FICHIERS DE TEST"
test_file "src/frontend/pages/test-quiz.html" "Page de test/diagnostic"

echo ""
echo "📝 CONTENU CSV"
if [ -f "src/data/pharmaco.csv" ]; then
    SIZE=$(wc -l < "src/data/pharmaco.csv")
    echo -e "${GREEN}✓${NC} CSV contient $SIZE lignes"
    ((PASSED++))
    
    if grep -q "Antalgique" "src/data/pharmaco.csv"; then
        echo -e "${GREEN}✓${NC} CSV contient des données pharmacologiques"
        ((PASSED++))
    fi
fi

echo ""
echo "=== RÉSULTATS ==="
echo -e "${GREEN}Réussis${NC}: $PASSED"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Échoués${NC}: $FAILED"
else
    echo -e "${GREEN}Échoués${NC}: 0"
fi

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ IMPLÉMENTATION COMPLÈTE!${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Accéder à home.html"
    echo "2. Cliquer sur 'Quiz Pharmacologie'"
    echo "3. Commencer un quiz"
    echo ""
    echo "Ou tester: src/frontend/pages/test-quiz.html"
else
    echo -e "${RED}✗ CERTAINS FICHIERS MANQUENT${NC}"
    echo "Vérifiez l'installation"
fi

echo ""
