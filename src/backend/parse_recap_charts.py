#!/usr/bin/env python3
"""
Script pour convertir les CSV de révision en JSON structuré
Utilisé pour le module UE25 - Révision des cours
"""

import csv
import json
import os
from pathlib import Path

def parse_csv_to_json(csv_dir, output_file):
    """
    Parse tous les fichiers CSV du répertoire et crée un JSON unifié
    """
    data = {
        "ue": "UE 2.5.S2",
        "semester": 2,
        "pathologies": [],
        "columns": [
            "Affection",
            "Définition",
            "Facteurs de risque",
            "Agent(s) infectieux",
            "Mode de transmission",
            "Précautions",
            "Isolement/éviction",
            "Physiopathologie",
            "Signes cliniques",
            "Symptômes",
            "Examens spécifiques",
            "Signes biologiques",
            "Traitements",
            "Contre-indications",
            "Conseils patient/entourage",
            "Surveillances IDE",
            "Complications",
            "Vaccins",
            "Mesures préventives"
        ]
    }
    
    # Parcourir tous les CSV du répertoire
    csv_files = list(Path(csv_dir).glob("*.csv"))
    
    for csv_file in sorted(csv_files):
        print(f"Traitement: {csv_file.name}")
        
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                pathologie = {
                    "id": row["Affection"].lower().replace(" ", "_").replace("/", "_"),
                    "nom": row["Affection"],
                    "fichier_source": csv_file.name,
                    "data": row
                }
                data["pathologies"].append(pathologie)
    
    # Écrire le fichier JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ JSON créé: {output_file}")
    print(f"📊 Total pathologies: {len(data['pathologies'])}")
    
    return data

if __name__ == "__main__":
    csv_dir = Path(__file__).parent.parent / "data" / "recap_charts" / "charts_definitive"
    output_file = csv_dir.parent / "ue25_pathologies.json"
    
    print(f"📂 Répertoire CSV: {csv_dir}")
    print(f"📁 Vérification existence: {csv_dir.exists()}")
    
    if csv_dir.exists():
        data = parse_csv_to_json(str(csv_dir), str(output_file))
        print(f"📋 Fichiers traités: {len(list(csv_dir.glob('*.csv')))}")
    else:
        print(f"❌ Répertoire non trouvé: {csv_dir}")
