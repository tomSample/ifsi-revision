"""
Static files route
"""
from flask import Blueprint, send_file, send_from_directory
from pathlib import Path
import os
import subprocess
import sys
from config import BASE_DIR
from utils.logger import setup_logger

logger = setup_logger(__name__)
bp = Blueprint('static', __name__, url_prefix='')

UE26_WORKBOOK = BASE_DIR.parent / 'src' / 'data' / 'UE-2.6' / 'UE 2.6 - processus psychopathologiques.xlsx'
UE26_JSON = BASE_DIR.parent / 'src' / 'data' / 'UE-2.6' / 'psychopathologie.normalized.json'
UE26_GENERATOR = BASE_DIR.parent / 'scripts' / 'generate-ue26-json.py'


def refresh_ue26_data():
    """Regenerate UE 2.6 data when the workbook is newer than its JSON."""
    if not UE26_WORKBOOK.is_file():
        raise FileNotFoundError(f"UE 2.6 workbook not found: {UE26_WORKBOOK}")
    if UE26_JSON.is_file() and UE26_JSON.stat().st_mtime >= UE26_WORKBOOK.stat().st_mtime:
        return

    result = subprocess.run(
        [sys.executable, str(UE26_GENERATOR)],
        cwd=BASE_DIR.parent,
        capture_output=True,
        text=True,
        check=False,
        timeout=30,
    )
    if result.returncode != 0:
        message = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"UE 2.6 data generation failed: {message}")

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
        if filename == 'UE-2.6/psychopathologie.normalized.json':
            refresh_ue26_data()
        data_dir = os.path.join(BASE_DIR, 'data')
        response = send_from_directory(data_dir, filename)
        if filename.startswith('UE-2.6/'):
            response.headers['Cache-Control'] = 'no-store'
        return response
    except Exception as e:
        logger.error(f"Error serving data file {filename}: {e}")
        return {'error': 'Data file unavailable'}, 500

@bp.route('/<path:filename>')
def serve_static(filename):
    """Serve static files from src/frontend/pages/"""
    try:
        pages_dir = os.path.join(BASE_DIR, 'frontend', 'pages')
        return send_from_directory(pages_dir, filename)
    except Exception as e:
        logger.debug(f"Static file not found: {filename}")
        return {'error': 'File not found'}, 404
