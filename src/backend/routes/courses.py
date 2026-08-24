"""
Courses API routes
"""
from flask import Blueprint, jsonify
from utils.logger import setup_logger

logger = setup_logger(__name__)
bp = Blueprint('courses', __name__, url_prefix='/api/courses')

@bp.route('/', methods=['GET'])
def get_courses():
    """Get all courses"""
    try:
        # TODO: Implement courses endpoint
        return jsonify({'courses': []}), 200
    except Exception as e:
        logger.error(f"Error getting courses: {e}")
        return {'error': 'Internal server error'}, 500
