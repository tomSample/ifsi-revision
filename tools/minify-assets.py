"""
Script de minification pour l'application IFSI Révision
Minifie CSS et JavaScript pour réduire la taille et améliorer les performances
"""
import os
import re
from pathlib import Path

def minify_css(css_content):
    """Minifie du CSS en supprimant espaces, commentaires, etc."""
    # Supprimer les commentaires
    css_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    # Supprimer les espaces inutiles
    css_content = re.sub(r'\s+', ' ', css_content)
    # Supprimer espaces autour des caractères spéciaux
    css_content = re.sub(r'\s*([{}:;,])\s*', r'\1', css_content)
    # Supprimer le dernier ; avant }
    css_content = re.sub(r';}', '}', css_content)
    return css_content.strip()

def minify_js_simple(js_content):
    """Minification simple de JavaScript (commentaires et espaces)"""
    # Supprimer les commentaires sur une ligne
    js_content = re.sub(r'//.*?$', '', js_content, flags=re.MULTILINE)
    # Supprimer les commentaires multi-lignes
    js_content = re.sub(r'/\*.*?\*/', '', js_content, flags=re.DOTALL)
    # Supprimer les espaces multiples
    js_content = re.sub(r'\s+', ' ', js_content)
    # Supprimer espaces autour des opérateurs (prudent)
    js_content = re.sub(r'\s*([{}();,=+\-*/<>!&|])\s*', r'\1', js_content)
    return js_content.strip()

def minify_directory(source_dir, output_dir, file_extension, minify_func):
    """Minifie tous les fichiers d'un type dans un dossier"""
    total_original = 0
    total_minified = 0
    count = 0
    
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            if file.endswith(file_extension):
                source_path = os.path.join(root, file)
                
                # Créer structure de sortie
                rel_path = os.path.relpath(root, source_dir)
                output_folder = os.path.join(output_dir, rel_path)
                os.makedirs(output_folder, exist_ok=True)
                
                # Nom de sortie: ajouter .min avant l'extension
                base_name = os.path.splitext(file)[0]
                output_filename = f"{base_name}.min{file_extension}"
                output_path = os.path.join(output_folder, output_filename)
                
                # Lire, minifier, écrire
                try:
                    with open(source_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    minified = minify_func(content)
                    
                    with open(output_path, 'w', encoding='utf-8') as f:
                        f.write(minified)
                    
                    original_size = len(content.encode('utf-8'))
                    minified_size = len(minified.encode('utf-8'))
                    reduction = ((original_size - minified_size) / original_size) * 100
                    
                    total_original += original_size
                    total_minified += minified_size
                    count += 1
                    
                    print(f"✅ {file}")
                    print(f"   {original_size // 1024} KB → {minified_size // 1024} KB (-{reduction:.1f}%)")
                    
                except Exception as e:
                    print(f"❌ {file}: {e}")
    
    return total_original, total_minified, count

def main():
    """Processus principal de minification"""
    print("⚡ Minification IFSI Révision App")
    print("=" * 60)
    
    # Configuration
    css_source = 'src/frontend/assets/styles'
    css_output = 'public/css'
    js_source = 'src/frontend/assets/scripts'
    js_output = 'public/js'
    
    # Minifier CSS
    print("\n📄 MINIFICATION CSS")
    print("-" * 60)
    css_orig, css_min, css_count = minify_directory(css_source, css_output, '.css', minify_css)
    
    # Minifier JavaScript
    print("\n📜 MINIFICATION JAVASCRIPT")
    print("-" * 60)
    js_orig, js_min, js_count = minify_directory(js_source, js_output, '.js', minify_js_simple)
    
    # Résumé
    total_original = css_orig + js_orig
    total_minified = css_min + js_min
    
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ")
    print("=" * 60)
    print(f"✅ Fichiers CSS minifiés: {css_count}")
    print(f"✅ Fichiers JS minifiés: {js_count}")
    print(f"📦 Taille originale: {total_original / 1024:.2f} KB")
    print(f"📦 Taille minifiée: {total_minified / 1024:.2f} KB")
    
    if total_original > 0:
        global_reduction = ((total_original - total_minified) / total_original) * 100
        print(f"💾 Réduction totale: {global_reduction:.1f}%")
    
    print("\n⚠️  IMPORTANT:")
    print("   Pour utiliser les versions minifiées en production,")
    print("   modifiez les imports dans les HTML:")
    print("   - style.css → /public/css/style.min.css")
    print("   - script.js → /public/js/script.min.js")

if __name__ == '__main__':
    main()
