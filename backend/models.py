from datetime import datetime
from bson import ObjectId
from config.constants import ROLES, MODULES, LEVELS, TEST_TYPES, STATUS

class User:
    def __init__(self, username, email, password_hash, role, name, mobile, 
                 campus_id=None, course_id=None, batch_id=None, is_active=True):
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.role = role
        self.name = name
        self.mobile = mobile
        self.campus_id = ObjectId(campus_id) if campus_id else None
        self.course_id = ObjectId(course_id) if course_id else None
        self.batch_id = ObjectId(batch_id) if batch_id else None
        self.is_active = is_active
        self.created_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            'username': self.username,
            'email': self.email,
            'password_hash': self.password_hash,
            'role': self.role,
            'name': self.name,
            'mobile': self.mobile,
            'campus_id': self.campus_id,
            'course_id': self.course_id,
            'batch_id': self.batch_id,
            'is_active': self.is_active,
            'created_at': self.created_at
        }

class Student:
    def __init__(self, name, email, batch_course_instance_id, roll_number=None, mobile=None, **kwargs):
        self.name = name
        self.email = email
        self.batch_course_instance_id = batch_course_instance_id
        self.roll_number = roll_number
        self.mobile = mobile
        self.created_at = datetime.utcnow()
        # Ignore course_id, use batch_course_instance_id only
        # ... other fields ...

    def to_dict(self):
        return {
            'name': self.name,
            'email': self.email,
            'batch_course_instance_id': self.batch_course_instance_id,
            'roll_number': self.roll_number,
            'mobile': self.mobile,
            'created_at': self.created_at
        }

class Module:
    def __init__(self, name, description, status='active'):
        self.name = name
        self.description = description
        self.status = status
    
    def to_dict(self):
        return {
            'name': self.name,
            'description': self.description,
            'status': self.status
        }

class Level:
    def __init__(self, name, description, status='active'):
        self.name = name
        self.description = description
        self.status = status
    
    def to_dict(self):
        return {
            'name': self.name,
            'description': self.description,
            'status': self.status
        }

class Test:
    def __init__(self, name, module_id, level_id, created_by, test_type='practice',
                 status='active', total_questions=0, time_limit=30, passing_score=70):
        self.name = name
        self.module_id = ObjectId(module_id)
        self.level_id = ObjectId(level_id)
        self.created_by = ObjectId(created_by)
        self.test_type = test_type
        self.status = status
        self.total_questions = total_questions
        self.time_limit = time_limit
        self.passing_score = passing_score
        self.created_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            'name': self.name,
            'module_id': self.module_id,
            'level_id': self.level_id,
            'created_by': self.created_by,
            'test_type': self.test_type,
            'status': self.status,
            'total_questions': self.total_questions,
            'time_limit': self.time_limit,
            'passing_score': self.passing_score,
            'created_at': self.created_at
        }

class OnlineExam:
    def __init__(self, test_id, name, start_date, end_date, duration,
                 campus_ids, course_ids, batch_ids, status='scheduled', created_by=None):
        self.test_id = ObjectId(test_id)
        self.name = name
        self.start_date = start_date
        self.end_date = end_date
        self.duration = duration
        self.campus_ids = [ObjectId(cid) for cid in campus_ids]
        self.course_ids = [ObjectId(cid) for cid in course_ids]
        self.batch_ids = [ObjectId(bid) for bid in batch_ids]
        self.status = status
        self.created_by = ObjectId(created_by) if created_by else None
    
    def to_dict(self):
        return {
            'test_id': self.test_id,
            'name': self.name,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'duration': self.duration,
            'campus_ids': self.campus_ids,
            'course_ids': self.course_ids,
            'batch_ids': self.batch_ids,
            'status': self.status,
            'created_by': self.created_by
        }

class StudentTestAttempt:
    def __init__(self, student_id, test_id, exam_id=None, module_id=None, level_id=None,
                 status='in_progress', score=0, total_questions=0, correct_answers=0,
                 time_taken=0, started_at=None, completed_at=None):
        self.student_id = ObjectId(student_id)
        self.test_id = ObjectId(test_id)
        self.exam_id = ObjectId(exam_id) if exam_id else None
        self.module_id = ObjectId(module_id) if module_id else None
        self.level_id = ObjectId(level_id) if level_id else None
        self.status = status
        self.score = score
        self.total_questions = total_questions
        self.correct_answers = correct_answers
        self.time_taken = time_taken
        self.started_at = started_at or datetime.utcnow()
        self.completed_at = completed_at
    
    def to_dict(self):
        return {
            'student_id': self.student_id,
            'test_id': self.test_id,
            'exam_id': self.exam_id,
            'module_id': self.module_id,
            'level_id': self.level_id,
            'status': self.status,
            'score': self.score,
            'total_questions': self.total_questions,
            'correct_answers': self.correct_answers,
            'time_taken': self.time_taken,
            'started_at': self.started_at,
            'completed_at': self.completed_at
        }

class StudentProgress:
    def __init__(self, student_id, module_id, level_id, total_tests=0, completed_tests=0,
                 average_score=0, highest_score=0, current_level='Beginner', last_test_date=None):
        self.student_id = ObjectId(student_id)
        self.module_id = ObjectId(module_id)
        self.level_id = ObjectId(level_id)
        self.total_tests = total_tests
        self.completed_tests = completed_tests
        self.average_score = average_score
        self.highest_score = highest_score
        self.current_level = current_level
        self.last_test_date = last_test_date
    
    def to_dict(self):
        return {
            'student_id': self.student_id,
            'module_id': self.module_id,
            'level_id': self.level_id,
            'total_tests': self.total_tests,
            'completed_tests': self.completed_tests,
            'average_score': self.average_score,
            'highest_score': self.highest_score,
            'current_level': self.current_level,
            'last_test_date': self.last_test_date
        }

class Course:
    def __init__(self, name, campus_id, admin_id, created_at=None):
        self.name = name
        self.campus_id = ObjectId(campus_id)
        self.admin_id = ObjectId(admin_id)
        self.created_at = created_at or datetime.utcnow()

    def to_dict(self):
        return {
            'name': self.name,
            'campus_id': self.campus_id,
            'admin_id': self.admin_id,
            'created_at': self.created_at
        }

# BatchCourseInstance model (MongoDB collection)
class BatchCourseInstance:
    def __init__(self, db):
        self.collection = db.batch_course_instances

    def find_or_create(self, batch_id, course_id):
        instance = self.collection.find_one({'batch_id': batch_id, 'course_id': course_id})
        if instance:
            return instance['_id']
        result = self.collection.insert_one({'batch_id': batch_id, 'course_id': course_id})
        return result.inserted_id

    def get_by_id(self, instance_id):
        return self.collection.find_one({'_id': instance_id}) 