from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from mongo import mongo_db
from bson import ObjectId
import csv, io
from werkzeug.utils import secure_filename

batch_management_bp = Blueprint('batch_management', __name__)

@batch_management_bp.route('/', methods=['GET'])
@jwt_required()
def list_batches():
    batches = list(mongo_db.batches.find())
    batch_list = []
    for batch in batches:
        campus_objs = list(mongo_db.campuses.find({'_id': {'$in': batch.get('campus_ids', [])}}))
        course_objs = list(mongo_db.courses.find({'_id': {'$in': batch.get('course_ids', [])}}))
        # Get student count for this batch
        student_count = mongo_db.students.count_documents({'batch_id': batch['_id']})
        batch_list.append({
            'id': str(batch['_id']),
            'name': batch['name'],
            'campuses': [{'id': str(c['_id']), 'name': c['name']} for c in campus_objs],
            'courses': [{'id': str(c['_id']), 'name': c['name']} for c in course_objs],
            'student_count': student_count
        })
    return jsonify({'success': True, 'data': batch_list}), 200

@batch_management_bp.route('/', methods=['POST'])
@jwt_required()
def create_batch():
    data = request.get_json()
    name = data.get('name')
    campus_ids = [ObjectId(cid) for cid in data.get('campus_ids', [])]
    course_ids = [ObjectId(cid) for cid in data.get('course_ids', [])]
    if not name or not campus_ids or not course_ids:
        return jsonify({'success': False, 'message': 'Name, campuses, and courses are required'}), 400
    if mongo_db.batches.find_one({'name': name}):
        return jsonify({'success': False, 'message': 'Batch name already exists'}), 409
    batch_id = mongo_db.batches.insert_one({
        'name': name,
        'campus_ids': campus_ids,
        'course_ids': course_ids
    }).inserted_id
    return jsonify({'success': True, 'data': {'id': str(batch_id)}}), 201

@batch_management_bp.route('/<batch_id>', methods=['PUT'])
@jwt_required()
def edit_batch(batch_id):
    data = request.get_json()
    update = {}
    if 'name' in data:
        update['name'] = data['name']
    if 'campus_ids' in data:
        update['campus_ids'] = [ObjectId(cid) for cid in data['campus_ids']]
    if 'course_ids' in data:
        update['course_ids'] = [ObjectId(cid) for cid in data['course_ids']]
    result = mongo_db.batches.update_one({'_id': ObjectId(batch_id)}, {'$set': update})
    if result.matched_count == 0:
        return jsonify({'success': False, 'message': 'Batch not found'}), 404
    return jsonify({'success': True}), 200

@batch_management_bp.route('/<batch_id>', methods=['DELETE'])
@jwt_required()
def delete_batch(batch_id):
    result = mongo_db.batches.delete_one({'_id': ObjectId(batch_id)})
    if result.deleted_count == 0:
        return jsonify({'success': False, 'message': 'Batch not found'}), 404
    return jsonify({'success': True}), 200

@batch_management_bp.route('/campuses', methods=['GET'])
@jwt_required()
def get_campuses():
    campuses = list(mongo_db.campuses.find())
    return jsonify({'success': True, 'data': [{'id': str(c['_id']), 'name': c['name']} for c in campuses]}), 200

@batch_management_bp.route('/courses', methods=['GET'])
@jwt_required()
def get_courses():
    campus_ids = request.args.getlist('campus_ids')
    if not campus_ids:
        return jsonify({'success': False, 'message': 'campus_ids required'}), 400
    campus_obj_ids = [ObjectId(cid) for cid in campus_ids]
    courses = list(mongo_db.courses.find({'campus_id': {'$in': campus_obj_ids}}))
    return jsonify({'success': True, 'data': [{'id': str(c['_id']), 'name': c['name'], 'campus_id': str(c['campus_id'])} for c in courses]}), 200

@batch_management_bp.route('/upload-students', methods=['POST'])
@jwt_required()
def upload_students_to_batch():
    try:
        campus_id = request.form.get('campus_id')
        batch_id = request.form.get('batch_id')
        file = request.files.get('csv_file')
        if not campus_id or not batch_id or not file:
            return jsonify({'success': False, 'message': 'campus_id, batch_id, and csv_file are required'}), 400
        if not file.filename.endswith('.csv'):
            return jsonify({'success': False, 'message': 'Please upload a valid CSV file'}), 400
        
        csv_content = file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        required_fields = ['Campus Name', 'Course Name', 'Student Name', 'Roll Number', 'Email', 'Mobile Number']
        students_to_create = []
        roll_numbers = set()
        mobile_numbers = set()
        errors = []
        created = []

        # Validate CSV structure
        if not all(field in next(csv_reader, {}) for field in required_fields):
            return jsonify({'success': False, 'message': 'Invalid CSV structure. Required fields missing.'}), 400

        # Reset file pointer
        csv_content = io.StringIO(csv_content)
        csv_reader = csv.DictReader(csv_content)

        for row in csv_reader:
            if not all(row.get(field) for field in required_fields):
                errors.append(f"Missing required fields in row: {row}")
                continue

            roll_number = row['Roll Number'].strip()
            mobile_number = row['Mobile Number'].strip()
            email = row['Email'].strip()
            name = row['Student Name'].strip()
            course_name = row['Course Name'].strip()

            # Check for duplicates
            if roll_number in roll_numbers:
                errors.append(f"Duplicate roll number: {roll_number}")
                continue
            if mobile_number in mobile_numbers:
                errors.append(f"Duplicate mobile number: {mobile_number}")
                continue
            if mongo_db.students.find_one({'roll_number': roll_number}):
                errors.append(f"Roll number already exists: {roll_number}")
                continue
            if mongo_db.students.find_one({'mobile_number': mobile_number}):
                errors.append(f"Mobile number already exists: {mobile_number}")
                continue
            if mongo_db.students.find_one({'email': email}):
                errors.append(f"Email already exists: {email}")
                continue

            roll_numbers.add(roll_number)
            mobile_numbers.add(mobile_number)

            students_to_create.append({
                'name': name,
                'roll_number': roll_number,
                'email': email,
                'mobile_number': mobile_number,
                'course_name': course_name
            })

        for student in students_to_create:
            # Find course by name and campus
            course = mongo_db.courses.find_one({
                'name': student['course_name'],
                'campus_id': ObjectId(campus_id)
            })
            if not course:
                errors.append(f"Course not found for student {student['name']}: {student['course_name']}")
                continue

            # Generate credentials
            username = student['roll_number']
            password = f"{student['name'][:4]}{student['roll_number'][-4:]}".lower()

            # Create user account
            user_data = {
                'username': username,
                'password': password,  # In production, this should be hashed
                'email': student['email'],
                'role': 'student',
                'name': student['name'],
                'mobile_number': student['mobile_number'],
                'campus_id': ObjectId(campus_id),
                'course_id': course['_id'],
                'batch_id': ObjectId(batch_id),
                'status': 'active',
                'authorized_levels': ['beginner']
            }
            user_id = mongo_db.users.insert_one(user_data).inserted_id

            # Create student profile
            student_data = {
                'user_id': user_id,
                'roll_number': student['roll_number'],
                'name': student['name'],
                'email': student['email'],
                'mobile_number': student['mobile_number'],
                'campus_id': ObjectId(campus_id),
                'course_id': course['_id'],
                'batch_id': ObjectId(batch_id),
                'status': 'active',
                'authorized_levels': ['beginner']
            }
            mongo_db.students.insert_one(student_data)
            
            created.append({
                'name': student['name'],
                'roll_number': student['roll_number'],
                'username': username,
                'password': password
            })

        return jsonify({
            'success': True,
            'created': created,
            'errors': errors
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error uploading students: {str(e)}")
        return jsonify({'success': False, 'message': f'Failed to upload students: {str(e)}'}), 500

@batch_management_bp.route('/batch/<batch_id>/students', methods=['GET'])
@jwt_required()
def get_batch_students(batch_id):
    try:
        # Get batch information first
        batch = mongo_db.batches.find_one({'_id': ObjectId(batch_id)})
        if not batch:
            return jsonify({'success': False, 'message': 'Batch not found'}), 404

        # Get campus and course information
        campus = mongo_db.campuses.find_one({'_id': {'$in': batch['campus_ids']}})
        courses = list(mongo_db.courses.find({'_id': {'$in': batch['course_ids']}}))

        # Get students
        students = list(mongo_db.students.find({'batch_id': ObjectId(batch_id)}))
        student_list = []
        for student in students:
            student_list.append({
                'id': str(student['_id']),
                'name': student['name'],
                'roll_number': student['roll_number'],
                'email': student['email'],
                'mobile_number': student['mobile_number'],
                'course_id': str(student['course_id']),
                'campus_id': str(student['campus_id'])
            })

        batch_info = {
            'id': str(batch['_id']),
            'name': batch['name'],
            'campus_name': campus['name'] if campus else 'Unknown Campus',
            'course_name': ', '.join(c['name'] for c in courses) if courses else 'No Courses'
        }

        return jsonify({
            'success': True,
            'data': student_list,
            'batch_info': batch_info
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching batch students: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@batch_management_bp.route('/student/<student_id>', methods=['GET'])
@jwt_required()
def get_student_details(student_id):
    try:
        # Get student information
        student = mongo_db.students.find_one({'_id': ObjectId(student_id)})
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404

        # Get associated user information
        user = mongo_db.users.find_one({'_id': student['user_id']})
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        # Get course and campus details
        course = mongo_db.courses.find_one({'_id': student['course_id']})
        campus = mongo_db.campuses.find_one({'_id': student['campus_id']})
        batch = mongo_db.batches.find_one({'_id': student['batch_id']})

        student_details = {
            'id': str(student['_id']),
            'name': student['name'],
            'roll_number': student['roll_number'],
            'email': student['email'],
            'mobile_number': student['mobile_number'],
            'course': {'id': str(course['_id']), 'name': course['name']} if course else None,
            'campus': {'id': str(campus['_id']), 'name': campus['name']} if campus else None,
            'batch': {'id': str(batch['_id']), 'name': batch['name']} if batch else None,
            'status': student.get('status', 'active'),
            'authorized_levels': user.get('authorized_levels', ['beginner'])
        }

        return jsonify({'success': True, 'data': student_details}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching student details: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@batch_management_bp.route('/student/<student_id>', methods=['PUT'])
@jwt_required()
def update_student(student_id):
    try:
        data = request.get_json()
        required_fields = ['name', 'email', 'mobile_number']
        
        if not all(field in data for field in required_fields):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400

        # Get student first
        student = mongo_db.students.find_one({'_id': ObjectId(student_id)})
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404

        # Check if email or mobile number already exists for other students
        existing_student = mongo_db.students.find_one({
            '_id': {'$ne': ObjectId(student_id)},
            '$or': [
                {'email': data['email']},
                {'mobile_number': data['mobile_number']}
            ]
        })
        if existing_student:
            if existing_student['email'] == data['email']:
                return jsonify({'success': False, 'message': 'Email already exists'}), 400
            return jsonify({'success': False, 'message': 'Mobile number already exists'}), 400

        # Update student
        update_result = mongo_db.students.update_one(
            {'_id': ObjectId(student_id)},
            {'$set': {
                'name': data['name'],
                'email': data['email'],
                'mobile_number': data['mobile_number'],
                'status': data.get('status', 'active')
            }}
        )

        if update_result.modified_count == 0:
            return jsonify({'success': False, 'message': 'No changes made'}), 400

        # Update associated user
        mongo_db.users.update_one(
            {'_id': student['user_id']},
            {'$set': {
                'name': data['name'],
                'email': data['email'],
                'mobile_number': data['mobile_number']
            }}
        )

        return jsonify({'success': True, 'message': 'Student updated successfully'}), 200
    except Exception as e:
        current_app.logger.error(f"Error updating student: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@batch_management_bp.route('/student/<student_id>', methods=['DELETE'])
@jwt_required()
def delete_student(student_id):
    try:
        student = mongo_db.students.find_one({'_id': ObjectId(student_id)})
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404

        # Delete student and associated user
        mongo_db.students.delete_one({'_id': ObjectId(student_id)})
        mongo_db.users.delete_one({'_id': student['user_id']})

        return jsonify({'success': True, 'message': 'Student deleted successfully'}), 200
    except Exception as e:
        current_app.logger.error(f"Error deleting student: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@batch_management_bp.route('/student/<student_id>/authorize-level', methods=['POST'])
@jwt_required()
def authorize_student_level(student_id):
    try:
        data = request.get_json()
        level = data.get('level')
        if not level or level not in ['beginner', 'intermediate', 'advanced']:
            return jsonify({'success': False, 'message': 'Invalid level'}), 400
            
        student = mongo_db.students.find_one({'_id': ObjectId(student_id)})
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
            
        authorized_levels = set(student.get('authorized_levels', ['beginner']))
        authorized_levels.add(level)
        
        mongo_db.students.update_one(
            {'_id': ObjectId(student_id)},
            {'$set': {'authorized_levels': list(authorized_levels)}}
        )
        
        return jsonify({'success': True, 'message': f'Student authorized for {level} level'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@batch_management_bp.route('/student/<student_id>/authorize-module', methods=['POST'])
@jwt_required()
def authorize_student_module(student_id):
    try:
        data = request.get_json()
        module = data.get('module')
        if not module:
            return jsonify({'success': False, 'message': 'Module is required'}), 400

        # Find all levels for this module
        from config.constants import LEVELS
        module_levels = [level_id for level_id, level in LEVELS.items() if (level.get('module_id') if isinstance(level, dict) else None) == module]
        if not module_levels:
            return jsonify({'success': False, 'message': 'No levels found for this module.'}), 404

        # Ensure authorized_levels exists
        student = mongo_db.students.find_one({'_id': ObjectId(student_id)})
        if not student:
            return jsonify({'success': False, 'message': 'Student not found.'}), 404
        if 'authorized_levels' not in student:
            mongo_db.students.update_one({'_id': ObjectId(student_id)}, {'$set': {'authorized_levels': []}})

        # Add all levels to authorized_levels
        mongo_db.students.update_one({'_id': ObjectId(student_id)}, {'$addToSet': {'authorized_levels': {'$each': module_levels}}})
        student = mongo_db.students.find_one({'_id': ObjectId(student_id)})
        return jsonify({'success': True, 'message': f"Module '{module}' authorized for student.", 'authorized_levels': student.get('authorized_levels', [])}), 200
    except Exception as e:
        current_app.logger.error(f"Error authorizing module: {e}")
        return jsonify({'success': False, 'message': 'An error occurred authorizing the module.'}), 500

@batch_management_bp.route('/student/<student_id>/lock-module', methods=['POST'])
@jwt_required()
def lock_student_module(student_id):
    try:
        data = request.get_json()
        module = data.get('module')
        if not module:
            return jsonify({'success': False, 'message': 'Module is required'}), 400

        from config.constants import LEVELS
        module_levels = [level_id for level_id, level in LEVELS.items() if level.get('module_id') == module or level.get('module') == module]
        if not module_levels:
            return jsonify({'success': False, 'message': 'No levels found for this module.'}), 404

        # Remove all levels from authorized_levels
        mongo_db.students.update_one({'_id': ObjectId(student_id)}, {'$pull': {'authorized_levels': {'$in': module_levels}}})
        student = mongo_db.students.find_one({'_id': ObjectId(student_id)})
        return jsonify({'success': True, 'message': f"Module '{module}' locked for student.", 'authorized_levels': student.get('authorized_levels', [])}), 200
    except Exception as e:
        current_app.logger.error(f"Error locking module: {e}")
        return jsonify({'success': False, 'message': 'An error occurred locking the module.'}), 500

@batch_management_bp.route('/student/<student_id>/access-status', methods=['GET'])
@jwt_required()
def get_student_access_status(student_id):
    try:
        student = mongo_db.students.find_one({'_id': ObjectId(student_id)})
        if not student:
            return jsonify({'success': False, 'message': 'Student not found.'}), 404
        
        authorized_levels = student.get('authorized_levels', [])
        return jsonify({'success': True, 'authorized_levels': authorized_levels}), 200
    except Exception as e:
        current_app.logger.error(f"Error getting student access status: {e}")
        return jsonify({'success': False, 'message': 'An error occurred getting student access status.'}), 500

@batch_management_bp.route('/course/<course_id>/batches', methods=['GET'])
@jwt_required()
def get_batches_for_course(course_id):
    try:
        batches = list(mongo_db.batches.find({'course_ids': ObjectId(course_id)}))
        batch_list = []
        for batch in batches:
            campus_objs = list(mongo_db.campuses.find({'_id': {'$in': batch.get('campus_ids', [])}}))
            # Get student count for this batch
            student_count = mongo_db.students.count_documents({'batch_id': batch['_id']})
            batch_list.append({
                'id': str(batch['_id']),
                'name': batch['name'],
                'campuses': [{'id': str(c['_id']), 'name': c['name']} for c in campus_objs],
                'student_count': student_count
            })
        return jsonify({'success': True, 'data': batch_list}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching batches for course: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500 