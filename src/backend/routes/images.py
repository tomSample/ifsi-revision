"""
Images API routes
"""
from flask import Blueprint, jsonify
from utils.logger import setup_logger

logger = setup_logger(__name__)
bp = Blueprint('images', __name__, url_prefix='/api/images')

@bp.route('/', methods=['GET'])
def get_images():
    """Get all images"""
    try:
        # TODO: Implement images endpoint
        return jsonify({'images': []}), 200
    except Exception as e:
        logger.error(f"Error getting images: {e}")
        return {'error': 'Internal server error'}, 500
