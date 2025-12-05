"""
Script de migration des chemins dans les fichiers HTML
Met à jour les chemins relatifs vers la nouvelle structure
"""
import os
import re

# Mappings des anciens vers nouveaux chemins
PATH_MAPPINGS = {
    # CSS
    r'href="style\.css"': 'href="/src/frontend/assets/styles/style.css"',
    r'href="style-revision\.css"': 'href="/src/frontend/assets/styles/style-revision.css"',
    r'href="css/': 'href="/src/frontend/assets/styles/',
    
    # JavaScript - Config
    r'src="firebase-config\.js"': 'src="/src/frontend/assets/scripts/config/firebase-config.js"',
    r'src="app-config\.js"': 'src="/src/frontend/assets/scripts/config/app-config.js"',
    r'src="analytics-config\.js"': 'src="/src/frontend/assets/scripts/config/analytics-config.js"',
    r'src="google-form-config\.js"': 'src="/src/frontend/assets/scripts/config/google-form-config.js"',
    
    # JavaScript - Auth
    r'src="auth\.js"': 'src="/src/frontend/assets/scripts/auth/auth.js"',
    r'src="auth-guard\.js"': 'src="/src/frontend/assets/scripts/auth/auth-guard.js"',
    r'src="auth-firebase\.js"': 'src="/src/frontend/assets/scripts/auth/auth-firebase.js"',
    
    # JavaScript - Modules
    r'src="sync-manager\.js"': 'src="/src/frontend/assets/scripts/modules/sync-manager.js"',
    r'src="spaced-repetition\.js"': 'src="/src/frontend/assets/scripts/modules/spaced-repetition.js"',
    r'src="revision\.js"': 'src="/src/frontend/assets/scripts/modules/revision.js"',
    r'src="statistics\.js"': 'src="/src/frontend/assets/scripts/modules/statistics.js"',
    r'src="admin\.js"': 'src="/src/frontend/assets/scripts/modules/admin.js"',
    r'src="account\.js"': 'src="/src/frontend/assets/scripts/modules/account.js"',
    r'src="gallery\.js"': 'src="/src/frontend/assets/scripts/modules/gallery.js"',
    r'src="analytics\.js"': 'src="/src/frontend/assets/scripts/modules/analytics.js"',
    
    # JavaScript - Utils
    r'src="logger\.js"': 'src="/src/frontend/assets/scripts/utils/logger.js"',
    r'src="performance-utils\.js"': 'src="/src/frontend/assets/scripts/utils/performance-utils.js"',
    r'src="smart-cache\.js"': 'src="/src/frontend/assets/scripts/utils/smart-cache.js"',
    r'src="image-optimizer\.js"': 'src="/src/frontend/assets/scripts/utils/image-optimizer.js"',
    
    # Manifest et assets
    r'href="/manifest\.json"': 'href="/public/manifest.json"',
    r'href="/images/': 'href="/public/images/',
    
    # Navigation entre pages (relatives)
    r'href="home\.html"': 'href="/src/frontend/pages/home.html"',
    r'href="login\.html"': 'href="/src/frontend/pages/login.html"',
    r'href="register\.html"': 'href="/src/frontend/pages/register.html"',
    r'href="revision\.html"': 'href="/src/frontend/pages/revision.html"',
    r'href="statistics\.html"': 'href="/src/frontend/pages/statistics.html"',
    r'href="account\.html"': 'href="/src/frontend/pages/account.html"',
    r'href="admin\.html"': 'href="/src/frontend/pages/admin.html"',
    r'href="gallery\.html"': 'href="/src/frontend/pages/gallery.html"',
    r'href="browse-courses\.html"': 'href="/src/frontend/pages/browse-courses.html"',
    r'href="logout\.html"': 'href="/src/frontend/pages/logout.html"',
    r'href="reset-password\.html"': 'href="/src/frontend/pages/reset-password.html"',
    
    # API endpoints (courses.json)
    r"'ifsi_courses_2025-09-23\.json'": "'/src/data/courses.json'",
    r'"ifsi_courses_2025-09-23\.json"': '"/src/data/courses.json"',
    r'fetch\(["\']ifsi_courses': 'fetch("/src/data/courses',
}

def update_html_file(filepath):
    """Met à jour les chemins dans un fichier HTML"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Appliquer toutes les substitutions
        for pattern, replacement in PATH_MAPPINGS.items():
            content = re.sub(pattern, replacement, content)
        
        # Écrire seulement si changement
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"❌ Erreur {filepath}: {e}")
        return False

def main():
    """Traite tous les fichiers HTML"""
    html_dir = 'src/frontend/pages'
    
    if not os.path.exists(html_dir):
        print(f"❌ Dossier {html_dir} introuvable")
        return
    
    updated_count = 0
    for filename in os.listdir(html_dir):
        if filename.endswith('.html'):
            filepath = os.path.join(html_dir, filename)
            if update_html_file(filepath):
                print(f"✅ {filename} mis à jour")
                updated_count += 1
            else:
                print(f"⏭️  {filename} (aucun changement)")
    
    print(f"\n🎉 Migration terminée: {updated_count} fichiers mis à jour")

if __name__ == '__main__':
    main()
