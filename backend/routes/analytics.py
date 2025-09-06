from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/', methods=['GET'])
@jwt_required()
def get_analytics():
    """Get analytics"""
    return jsonify({
        'success': True,
        'message': 'Analytics endpoint'
    }), 200 