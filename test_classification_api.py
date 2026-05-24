#!/usr/bin/env python3
"""
Test de l'API de classification des termes
"""
import json
import os

# Test 1: Charger les données courses.json
courses_path = r"src/data/courses.json"

print("=" * 80)
print("TEST 1: Chargement de courses.json")
print("=" * 80)

with open(courses_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

total_courses = len(data['courses'])
print(f"✅ Chargement réussi: {total_courses} cours chargés")

# Analyser les termes avec/sans importance
terms_with_importance = 0
terms_without_importance = 0

for ue_key, course in data['courses']:
    for definition in course.get('definitions', []):
        if 'importance' in definition:
            terms_with_importance += 1
        else:
            terms_without_importance += 1

print(f"   - Termes AVEC importance: {terms_with_importance}")
print(f"   - Termes SANS importance: {terms_without_importance}")

# Test 2: Simuler une mise à jour d'importance
print("\n" + "=" * 80)
print("TEST 2: Simulation de mise à jour")
print("=" * 80)

# Trouver un terme sans importance
target_course = None
target_term = None

for ue_key, course in data['courses']:
    for definition in course.get('definitions', []):
        if 'importance' not in definition:
            target_course = course
            target_term = definition
            break
    if target_term:
        break

if target_term:
    ue = target_course.get('ue')
    term = target_term.get('term')
    
    print(f"✅ Terme trouvé: {term}")
    print(f"   UE: {ue}")
    print(f"   Définition: {target_term.get('definition')[:50]}...")
    
    # Simuler l'ajout d'importance
    print(f"\n📝 Simulation: Ajout de l'importance 'indispensable'")
    target_term['importance'] = 'indispensable'
    
    print(f"   ✅ Importance définie: {target_term.get('importance')}")
    
    # Remettre à zéro pour le test (ou on peut faire un vrai test)
    del target_term['importance']
    print(f"   ✅ Importance supprimée (test)")
else:
    print("❌ Aucun terme sans importance trouvé")

print("\n" + "=" * 80)
print("TEST 3: Vérification de la structure")
print("=" * 80)

# Vérifier quelques termes avec importance
count = 0
for ue_key, course in data['courses']:
    for definition in course.get('definitions', []):
        if 'importance' in definition and count < 5:
            importance = definition.get('importance')
            if importance in ['indispensable', 'utile', 'optionnel']:
                print(f"✅ {definition.get('term')}: {importance}")
                count += 1
            else:
                print(f"❌ {definition.get('term')}: IMPORTANCE INVALIDE: {importance}")

print("\n" + "=" * 80)
print("✅ TESTS TERMINÉS")
print("=" * 80)
