"""
API routes for data endpoints
"""
from flask import Blueprint, send_from_directory, jsonify
from pathlib import Path
import os
from config import BASE_DIR
from utils.logger import setup_logger

logger = setup_logger(__name__)
bp = Blueprint('api', __name__, url_prefix='/api')

@bp.route('/data/<path:filename>')
def get_data(filename):
    """Serve data files from src/data/"""
    try:
        data_dir = os.path.join(BASE_DIR, 'data')
        return send_from_directory(data_dir, filename)
    except Exception as e:
        logger.debug(f"Data file not found: {filename}")
        return {'error': f'File not found: {filename}'}, 404

@bp.route('/courses')
def get_courses():
    """Get courses data (JSON)"""
    try:
        courses_file = os.path.join(BASE_DIR, 'data', 'courses.json')
        return send_from_directory(os.path.dirname(courses_file), os.path.basename(courses_file))
    except Exception as e:
        logger.error(f"Error loading courses: {e}")
        return {'error': 'Could not load courses'}, 500
