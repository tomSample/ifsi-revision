#!/usr/bin/env node

// Test du parser CSV restructuré
var fs = require('fs');

// Mock window global pour Node.js
global.window = {};

// Charger le module pharma-quiz
eval(fs.readFileSync('./src/frontend/assets/scripts/modules/pharma-quiz.js', 'utf8'));

// Créer instance
var quiz = new PharmaQuiz();

// Tester le parseCSV avec données simples
var testCSV = `Famille,Sous_type,Medicament_Principal,Exemples_Commerciaux,Indication_1,Indication_2,Mecanisme_Court,IDE_1_Grave,IDE_2,Surveillance_Clinique,Surveillance_Biologique,Antidote
Antalgique palier 1,Non opioïdes,Paracétamol,Doliprane,Douleur légère-modérée,Fièvre,Modulation prostaglandines SNC,Hépatotoxicité,Réactions cutanées graves,Douleur, température, fonction hépatique,Paracétamolémie + bilan hépatique,N-acétylcystéine
AINS,AINS,Ibuprofène,Advil,Douleur rhumatologique,Inflammation,Inhibition COX-1/2,Hémorragie digestive,Insuffisance rénale,Signes digestifs, diurèse, créatininémie,Créatininémie, NFS,Pas d'antidote spécifique`;

console.log('🧪 Test du parser CSV...');
quiz.parseCsvData(testCSV);
console.log(`✓ ${quiz.pharmaData.length} entrées chargées`);

// Afficher la première entrée
if (quiz.pharmaData.length > 0) {
  var first = quiz.pharmaData[0];
  console.log(`\n📋 Première entrée:`);
  console.log(`  Famille: ${first.famille}`);
  console.log(`  Médicament: ${first.medicamentPrincipal}`);
  console.log(`  Indication 1: ${first.indication1}`);
  console.log(`  Indication 2: ${first.indication2}`);
  console.log(`  IDE 1: ${first.ide1Grave}`);
  console.log(`  IDE 2: ${first.ide2}`);
  console.log(`  Surveillance CLI: ${first.surveillanceClinique}`);
  console.log(`  Surveillance BIO: ${first.surveillanceBiologique}`);
  console.log(`  Antidote: ${first.antidote}`);
}

// Générer des questions de test
console.log(`\n🎯 Génération de questions...`);
quiz.generateQuiz(10, 'qcu');
console.log(`✓ ${quiz.currentQuiz.length} questions générées`);

// Afficher un échantillon
console.log(`\n📝 Exemples de questions:`);
for (var i = 0; i < Math.min(3, quiz.currentQuiz.length); i++) {
  var q = quiz.currentQuiz[i];
  console.log(`  ${i+1}. ${q.question}`);
  console.log(`     Réponse: ${q.correctAnswer ? 'Vrai' : 'Faux'}`);
}

console.log(`\n✅ Test complété avec succès!`);
