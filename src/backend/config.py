"""
Flask Application Configuration
"""
import os
from pathlib import Path

# Environment settings
FLASK_ENV = os.getenv('FLASK_ENV', 'development')
FLASK_DEBUG = FLASK_ENV == 'development'
FLASK_HOST = os.getenv('FLASK_HOST', '127.0.0.1')
FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))

# CORS settings
CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')

# File paths
# BASE_DIR = src/ (backend folder parent)
BASE_DIR = Path(__file__).parent.parent
# PROJECT_ROOT = révision 6/
PROJECT_ROOT = Path(__file__).parent.parent.parent
STATIC_DIR = os.path.join(BASE_DIR, 'frontend', 'pages')

# Flask settings
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max request size
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FILE = os.path.join(BASE_DIR, 'logs', 'app.log')
