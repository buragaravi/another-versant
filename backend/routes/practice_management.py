from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

practice_management_bp = Blueprint('practice_management', __name__)

@practice_management_bp.route('/', methods=['GET'])
@jwt_required()
def get_practice_tests():
    """Get practice tests"""
    return jsonify({
        'success': True,
        'message': 'Practice management endpoint'
    }), 200 