"""
Static files route
"""
from flask import Blueprint, send_file, send_from_directory
from pathlib import Path
import os
from config import BASE_DIR
from utils.logger import setup_logger

logger = setup_logger(__name__)
bp = Blueprint('static', __name__, url_prefix='')

@bp.route('/')
def index():
    """Serve index.html from src/frontend/pages/"""
    try:
        index_path = os.path.join(BASE_DIR, 'frontend', 'pages', 'index.html')
        if os.path.exists(index_path):
            return send_file(index_path)
        else:
            return {'error': 'index.html not found'}, 404
    except Exception as e:
        logger.error(f"Error serving index: {e}")
        return {'error': 'Internal server error'}, 500

@bp.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve asset files from src/frontend/assets/"""
    try:
        assets_dir = os.path.join(BASE_DIR, 'frontend', 'assets')
        return send_from_directory(assets_dir, filename)
    except Exception as e:
        logger.debug(f"Asset not found: {filename}")
        return {'error': 'Asset not found'}, 404

@bp.route('/public/<path:filename>')
def serve_public(filename):
    """Serve public files"""
    try:
        public_dir = os.path.join(BASE_DIR.parent, 'public')
        return send_from_directory(public_dir, filename)
    except Exception as e:
        logger.debug(f"Public file not found: {filename}")
        return {'error': 'File not found'}, 404

@bp.route('/src/data/<path:filename>')
def serve_src_data(filename):
    """Serve data files from src/data/ (legacy compatibility)"""
    try:
        data_dir = os.path.join(BASE_DIR, 'data')
        return send_from_directory(data_dir, filename)
    except Exception as e:
        logger.debug(f"Data file not found: {filename}")
        return {'error': 'File not found'}, 404

@bp.route('/data/<path:filename>')
def serve_data(filename):
    """Serve data files from src/data/"""
    try:
        data_dir = os.path.join(BASE_DIR, 'data')
        return send_from_directory(data_dir, filename)
    except Exception as e:
        logger.debug(f"Data file not found: {filename}")
        return {'error': 'File not found'}, 404

@bp.route('/<path:filename>')
def serve_static(filename):
    """Serve static files from src/frontend/pages/"""
    try:
        pages_dir = os.path.join(BASE_DIR, 'frontend', 'pages')
        return send_from_directory(pages_dir, filename)
    except Exception as e:
        logger.debug(f"Static file not found: {filename}")
        return {'error': 'File not found'}, 404
