"""
Script d'optimisation des images pour IFSI Révision App
Convertit JPG/PNG en WebP avec compression intelligente
"""
import os
from pathlib import Path
from PIL import Image
import json

# Configuration
SOURCE_DIR = 'images'
OUTPUT_DIR = 'public/images'
QUALITY = 85  # Qualité WebP (80-90 recommandé)
METADATA_FILE = 'src/data/images_metadata.json'

def convert_to_webp(image_path, output_path, quality=QUALITY):
    """Convertit une image en WebP"""
    try:
        img = Image.open(image_path)
        
        # Convertir en RGB si nécessaire (pour PNG avec transparence)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        
        # Sauvegarder en WebP
        img.save(output_path, 'webp', quality=quality, method=6)
        
        # Calculer la réduction
        original_size = os.path.getsize(image_path)
        new_size = os.path.getsize(output_path)
        reduction = ((original_size - new_size) / original_size) * 100
        
        return {
            'success': True,
            'original_size': original_size,
            'new_size': new_size,
            'reduction': reduction
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def main():
    """Processus principal d'optimisation"""
    print("🖼️  Optimisation des images IFSI Révision App")
    print("=" * 60)
    
    # Créer dossier de sortie
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Stats globales
    total_original = 0
    total_optimized = 0
    converted_count = 0
    failed_count = 0
    
    # Parcourir toutes les images
    for root, dirs, files in os.walk(SOURCE_DIR):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                # Chemins
                source_path = os.path.join(root, file)
                rel_path = os.path.relpath(root, SOURCE_DIR)
                output_folder = os.path.join(OUTPUT_DIR, rel_path)
                os.makedirs(output_folder, exist_ok=True)
                
                # Nouveau nom avec extension .webp
                webp_filename = os.path.splitext(file)[0] + '.webp'
                output_path = os.path.join(output_folder, webp_filename)
                
                # Conversion
                print(f"\n📸 {source_path}")
                result = convert_to_webp(source_path, output_path)
                
                if result['success']:
                    total_original += result['original_size']
                    total_optimized += result['new_size']
                    converted_count += 1
                    
                    print(f"   ✅ {result['original_size'] // 1024} KB → {result['new_size'] // 1024} KB")
                    print(f"   💾 Réduction: {result['reduction']:.1f}%")
                else:
                    failed_count += 1
                    print(f"   ❌ Erreur: {result['error']}")
    
    # Résumé
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DE L'OPTIMISATION")
    print("=" * 60)
    print(f"✅ Images converties: {converted_count}")
    print(f"❌ Échecs: {failed_count}")
    print(f"📦 Taille originale: {total_original / (1024*1024):.2f} MB")
    print(f"📦 Taille optimisée: {total_optimized / (1024*1024):.2f} MB")
    
    if total_original > 0:
        global_reduction = ((total_original - total_optimized) / total_original) * 100
        print(f"💾 Réduction totale: {global_reduction:.1f}%")
        print(f"🎉 Économie: {(total_original - total_optimized) / (1024*1024):.2f} MB")
    
    print("\n💡 N'oubliez pas de mettre à jour les chemins d'images dans le code:")
    print("   - .jpg/.png → .webp")
    print("   - /images/ → /public/images/")

if __name__ == '__main__':
    # Vérifier que Pillow est installé
    try:
        import PIL
        main()
    except ImportError:
        print("❌ Erreur: Pillow n'est pas installé")
        print("📦 Installation: pip install Pillow")
        print("Puis relancez ce script")
