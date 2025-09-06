from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from mongo import mongo_db
from config.shared import bcrypt
from config.constants import ROLES
from datetime import datetime
import pytz
from utils.email_service import send_email, render_template
from routes.access_control import require_permission

admin_management_bp = Blueprint('admin_management', __name__)

@admin_management_bp.route('/create', methods=['POST'])
@jwt_required()
@require_permission(module='admin_permissions')
def create_admin():
    """Create a new admin user - SUPER ADMIN ONLY"""
    try:
        current_user_id = get_jwt_identity()
        user = mongo_db.find_user_by_id(current_user_id)
        
        # Only super admin can create admins
        if not user or user.get('role') != 'superadmin':
            return jsonify({
                'success': False,
                'message': 'Access denied. Super admin privileges required.'
            }), 403
        
        data = request.get_json()
        admin_name = data.get('name')
        admin_email = data.get('email')
        admin_password = data.get('password')
        admin_role = data.get('role')
        campus_id = data.get('campus_id')
        course_id = data.get('course_id')
        
        # Validate required fields
        if not all([admin_name, admin_email, admin_password, admin_role]):
            return jsonify({
                'success': False,
                'message': 'All fields are required'
            }), 400
        
        # Validate role
        if admin_role not in ['campus_admin', 'course_admin']:
            return jsonify({
                'success': False,
                'message': 'Invalid admin role'
            }), 400
        
        # Check if email already exists
        if mongo_db.users.find_one({'email': admin_email}):
            return jsonify({
                'success': False,
                'message': 'Admin with this email already exists'
            }), 409
        
        # Validate campus/course assignments
        if admin_role == 'campus_admin':
            if not campus_id:
                return jsonify({
                    'success': False,
                    'message': 'Campus ID is required for campus admin'
                }), 400
            
            # Verify campus exists
            campus = mongo_db.campuses.find_one({'_id': ObjectId(campus_id)})
            if not campus:
                return jsonify({
                    'success': False,
                    'message': 'Campus not found'
                }), 404
        
        elif admin_role == 'course_admin':
            if not course_id:
                return jsonify({
                    'success': False,
                    'message': 'Course ID is required for course admin'
                }), 400
            
            # Verify course exists
            course = mongo_db.courses.find_one({'_id': ObjectId(course_id)})
            if not course:
                return jsonify({
                    'success': False,
                    'message': 'Course not found'
                }), 404
        
        # Hash password
        password_hash = bcrypt.generate_password_hash(admin_password).decode('utf-8')
        
        # Create admin user
        admin_user = {
            'name': admin_name,
            'email': admin_email,
            'username': admin_name,
            'password_hash': password_hash,
            'role': admin_role,
            'is_active': True,
            'created_at': datetime.now(pytz.utc)
        }
        
        # Add campus/course assignments
        if admin_role == 'campus_admin':
            admin_user['campus_id'] = ObjectId(campus_id)
        elif admin_role == 'course_admin':
            admin_user['course_id'] = ObjectId(course_id)
            # Get campus_id from course
            course = mongo_db.courses.find_one({'_id': ObjectId(course_id)})
            if course and 'campus_id' in course:
                admin_user['campus_id'] = course['campus_id']
        
        # Insert admin user
        user_id = mongo_db.users.insert_one(admin_user).inserted_id
        
        # Send welcome email
        try:
            template_name = 'campus_admin_credentials.html' if admin_role == 'campus_admin' else 'course_admin_credentials.html'
            html_content = render_template(
                template_name,
                params={
                    'name': admin_name,
                    'username': admin_name,
                    'email': admin_email,
                    'password': admin_password,
                    'login_url': "https://pydah-studyedge.vercel.app/login"
                }
            )
            send_email(
                to_email=admin_email,
                to_name=admin_name,
                subject=f"Welcome to Study Edge - Your {admin_role.replace('_', ' ').title()} Credentials",
                html_content=html_content
            )
        except Exception as e:
            print(f"Failed to send welcome email to {admin_email}: {e}")
        
        return jsonify({
            'success': True,
            'message': f'{admin_role.replace("_", " ").title()} created successfully',
            'data': {
                'admin_id': str(user_id),
                'admin_name': admin_name,
                'admin_email': admin_email,
                'admin_role': admin_role
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to create admin: {str(e)}'
        }), 500

@admin_management_bp.route('/list', methods=['GET'])
@jwt_required()
@require_permission(module='admin_permissions')
def list_admins():
    """Get list of all admins - SUPER ADMIN ONLY"""
    try:
        current_user_id = get_jwt_identity()
        user = mongo_db.find_user_by_id(current_user_id)
        
        # Only super admin can access admin list
        if not user or user.get('role') != 'superadmin':
            return jsonify({
                'success': False,
                'message': 'Access denied. Super admin privileges required.'
            }), 403
        
        # Get all admins
        admins = list(mongo_db.users.find({
            'role': {'$in': ['campus_admin', 'course_admin']}
        }))
        
        admin_list = []
        for admin in admins:
            admin_data = {
                'id': str(admin['_id']),
                'name': admin.get('name'),
                'email': admin.get('email'),
                'role': admin.get('role'),
                'is_active': admin.get('is_active', True),
                'created_at': admin.get('created_at')
            }
            
            # Add campus/course information
            if admin.get('campus_id'):
                campus = mongo_db.campuses.find_one({'_id': admin['campus_id']})
                if campus:
                    admin_data['campus_name'] = campus.get('name')
            
            if admin.get('course_id'):
                course = mongo_db.courses.find_one({'_id': admin['course_id']})
                if course:
                    admin_data['course_name'] = course.get('name')
            
            admin_list.append(admin_data)
        
        return jsonify({
            'success': True,
            'data': admin_list
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get admin list: {str(e)}'
        }), 500

@admin_management_bp.route('/<admin_id>', methods=['DELETE'])
@jwt_required()
@require_permission(module='admin_permissions')
def delete_admin(admin_id):
    """Delete an admin user - SUPER ADMIN ONLY"""
    try:
        current_user_id = get_jwt_identity()
        user = mongo_db.find_user_by_id(current_user_id)
        
        # Only super admin can delete admins
        if not user or user.get('role') != 'superadmin':
            return jsonify({
                'success': False,
                'message': 'Access denied. Super admin privileges required.'
            }), 403
        
        # Check if admin exists
        admin = mongo_db.users.find_one({'_id': ObjectId(admin_id)})
        if not admin:
            return jsonify({
                'success': False,
                'message': 'Admin not found'
            }), 404
        
        # Delete admin
        mongo_db.users.delete_one({'_id': ObjectId(admin_id)})
        
        return jsonify({
            'success': True,
            'message': 'Admin deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to delete admin: {str(e)}'
        }), 500 