from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

online_exam_management_bp = Blueprint('online_exam_management', __name__)

@online_exam_management_bp.route('/', methods=['GET'])
@jwt_required()
def get_online_exams():
    """Get online exams"""
    return jsonify({
        'success': True,
        'message': 'Online exam management endpoint'
    }), 200 