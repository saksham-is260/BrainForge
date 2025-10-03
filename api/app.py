from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import json
import traceback
from bson import ObjectId
import logging
import re  # Added for option formatting in quiz routes

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "https://brainforge-beta.vercel.app",
    "https://brainforge-5.onrender.com"
])

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['MAX_CONTENT_LENGTH'] = 60 * 1024 * 1024

class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(JSONEncoder, self).default(obj)

app.json_encoder = JSONEncoder

# Import your modules
try:
    from ocr.ultra_ocr_pro_clean import UltraOCREngine
    from database.mongodb import MongoDBManager
    from gemini_processor import GeminiCourseGenerator
    print("✅ All modules imported successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")
    traceback.print_exc()
    UltraOCREngine = None
    MongoDBManager = None
    GeminiCourseGenerator = None

# Initialize components
ocr_engine = UltraOCREngine() if UltraOCREngine else None
db_manager = MongoDBManager() if MongoDBManager else None
ai_processor = GeminiCourseGenerator() if GeminiCourseGenerator else None

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "service": "BrainForge Backend",
        "components": {
            "ocr": "ready" if ocr_engine else "error",
            "database": "ready" if db_manager and db_manager.is_connected() else "error",
            "ai": "ready" if ai_processor else "error"
        }
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload and processing with enhanced quiz settings"""
    try:
        print("📥 Received upload request")
        
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        print(f"📄 File received: {file.filename}")
        
        # Get ENHANCED settings with proper defaults
        settings = {
            "difficulty": request.form.get('difficulty', 'intermediate'),
            "learning_pace": request.form.get('learning_pace', 'medium'),
            "depth_level": request.form.get('depth_level', 'comprehensive'),
            "modules": int(request.form.get('modules', 4)),
            "flashcards": int(request.form.get('flashcards', 10)),
            "questions_per_module": int(request.form.get('questions_per_module', 3)),
            "include_practical": request.form.get('include_practical', 'true').lower() == 'true',
            "include_case_studies": request.form.get('include_case_studies', 'true').lower() == 'true',
            "include_exam_prep": request.form.get('include_exam_prep', 'true').lower() == 'true'
        }
        
        print(f"⚙️ Settings with quizzes: {settings}")
        
        # Save and process file
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        
        # Process with OCR
        if not ocr_engine:
            return jsonify({"error": "OCR engine not available"}), 500
        
        ocr_result = ocr_engine.process_file(file_path)
        
        if "error" in ocr_result:
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({"error": f"OCR Error: {ocr_result['error']}"}), 500
        
        extracted_content = ocr_result.get("text", "")
        print(f"📝 Extracted content length: {len(extracted_content)} characters")
        
        # Validate content
        if len(extracted_content.strip()) < 100:
            error_msg = f"Only {len(extracted_content.strip())} characters extracted. Please try a different file."
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({"error": error_msg}), 400
        
        # Save to database
        if not db_manager:
            return jsonify({"error": "Database not available"}), 500
        
        content_data = {
            "filename": file.filename,
            "content": extracted_content,
            "source_type": ocr_result.get("source_type", "unknown"),
            "length": len(extracted_content),
            "uploaded_at": datetime.now(),
            "settings": settings,
            "quality_metrics": ocr_result.get("quality_metrics", {})
        }
        
        content_id = db_manager.save_extracted_content(content_data)
        print(f"✅ Content saved with ID: {content_id}")
        
        # Generate course WITH QUIZ SETTINGS
        print("🤖 Generating course with quiz settings...")
        if not ai_processor:
            return jsonify({"error": "AI processor not available"}), 500
        
        course_result = ai_processor.generate_course(
            extracted_content, 
            settings, 
            db_manager=db_manager, 
            content_id=content_id
        )
        
        if not course_result['success']:
            error_msg = course_result.get('error', 'Course generation failed')
            print(f"❌ Course generation failed: {error_msg}")
            return jsonify({
                "success": False,
                "error": error_msg,
                "content_id": content_id,
                "message": "Content extracted but course generation failed"
            }), 500
        
        print("✅ Course generated successfully")
        
        # Handle batched or single course
        course_id = content_id
        batched = course_result.get('batched', False)
        
        # FIXED: For batched, generator already merged in memory - no need to call merge_partials_to_full()
        # Just use the complete course_data from generator
        if batched:
            print("🔗 Batched course merged in memory - no duplicate DB merge")
            # Clean up partials from DB after successful generation
            if db_manager and db_manager.partial_courses_collection is not None:
                delete_result = db_manager.partial_courses_collection.delete_many({"content_id": content_id})
                print(f"🧹 Cleaned up {delete_result.deleted_count} partials after merge")
        
        # Save full course structure (ONCE, using generator's complete course_data)
        course_data_to_save = {
            "content_id": content_id,
            "course_structure": course_result['course_data'],
            "settings_used": settings,  # Ensure settings are saved here
            "generated_at": datetime.now(),
            "source": course_result.get('source', 'unknown'),
            "batched": batched,
            "batches": course_result.get('batches', 1)
        }
        
        full_course_id = db_manager.save_course_structure(course_data_to_save)
        print(f"✅ Full course saved with ID: {full_course_id}")
        
        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)
        
        response_data = {
            "success": True,
            "content_id": content_id,
            "course_id": full_course_id,
            "filename": file.filename,
            "content_length": len(extracted_content),
            "course_data": course_result['course_data'],
            "source": course_result.get('source', 'unknown'),
            "message": "Course generated successfully",
            "settings_used": settings,
            "batched": batched,
            "generation_time": course_result.get('generation_time', 0)
        }
        
        print("🎉 Upload process completed successfully")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        traceback.print_exc()
        
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
            
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/course/<course_id>', methods=['GET'])
def get_course(course_id):
    """Get generated course by course ID"""
    try:
        print(f"📖 Getting course for: {course_id}")
        
        if not db_manager:
            return jsonify({"error": "Database not available"}), 500
            
        # Try to get course by course_id first
        course_data = db_manager.get_course_by_id(course_id)
        
        # If not found, try to get by content_id
        if not course_data:
            course_data = db_manager.get_course_by_content_id(course_id)
        
        if not course_data:
            return jsonify({"error": "Course not found"}), 404
        
        # FIXED: Validate course_structure exists and is valid
        course_structure = course_data.get('course_structure', {})
        if not isinstance(course_structure, dict):
            return jsonify({"error": "Invalid course structure"}), 500
        
        # Ensure 'course' key exists (for safety)
        if 'course' not in course_structure:
            # Fallback: Treat course_structure as the course directly
            course_structure = {'course': course_structure}
        
        # Ensure modules is always a list to prevent frontend 'length' error
        course_obj = course_structure.get('course', {})
        if not isinstance(course_obj, dict):
            return jsonify({"error": "Invalid course object"}), 500
        if 'modules' not in course_obj:
            course_obj['modules'] = []
        
        print(f"✅ Course found: {course_data.get('_id', 'Unknown ID')}")
        
        # Convert to JSON serializable format
        course_data = json.loads(json.dumps(course_data, cls=JSONEncoder))
        course_data['course_structure'] = course_structure  # Ensure validated structure is set
        
        return jsonify({
            "success": True,
            "course": course_data
        })
        
    except Exception as e:
        print(f"❌ Get course error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/course/<course_id>/module/<module_number>/quiz', methods=['GET'])
def get_module_quiz(course_id, module_number):
    """Get quiz for specific module with proper validation"""
    try:
        print(f"🎯 Getting quiz for course: {course_id}, module: {module_number}")
        
        if not db_manager:
            return jsonify({"error": "Database not available"}), 500
            
        course_data = db_manager.get_course_by_id(course_id)
        if not course_data:
            return jsonify({"error": "Course not found"}), 404
        
        module_num = int(module_number)
        module = None
        
        # FIXED: Handle both course_structure.course.modules and direct course_structure.modules
        course_structure = course_data.get('course_structure', {})
        if isinstance(course_structure, dict) and 'course' in course_structure:
            modules = course_structure['course'].get('modules', [])
        else:
            modules = course_structure.get('modules', []) if isinstance(course_structure, dict) else []
        
        # Ensure modules is array
        if not isinstance(modules, list):
            modules = []
        
        for mod in modules:
            if mod.get('module_number') == module_num:
                module = mod
                break
        
        if not module:
            return jsonify({
                "success": False,
                "error": f"Module {module_number} not found",
                "available_modules": [m.get('module_number') for m in modules if m.get('module_number')]
            }), 404
        
        quiz_data = module.get('quiz', {})
        
        # Ensure quiz has proper structure
        if not quiz_data or 'questions' not in quiz_data:
            return jsonify({
                "success": False,
                "error": "No quiz available for this module",
                "module_title": module.get('title', 'Unknown Module')
            }), 404
        
        # Validate and fix quiz questions
        validated_questions = []
        for i, question in enumerate(quiz_data.get('questions', [])):
            # Ensure options are properly formatted
            options = question.get('options', [])
            if not isinstance(options, list) or len(options) < 4:
                options = [
                    'A) Option A based on module content',
                    'B) Option B based on module content',
                    'C) Option C based on module content',
                    'D) Option D based on module content'
                ]
            else:
                # Ensure each option has proper formatting
                formatted_options = []
                for j, option in enumerate(options[:4]):  # Take only first 4 options
                    if isinstance(option, str):
                        option_letter = ['A', 'B', 'C', 'D'][j]
                        if not option.strip().startswith(f'{option_letter})'):
                            # Clean the option text and add proper formatting
                            clean_option = re.sub(r'^[A-D][\)\.]\s*', '', option.strip())
                            formatted_options.append(f"{option_letter}) {clean_option}")
                        else:
                            formatted_options.append(option.strip())
                    else:
                        option_letter = ['A', 'B', 'C', 'D'][j]
                        formatted_options.append(f"{option_letter}) {str(option)}")
                options = formatted_options
            
            # Ensure we have exactly 4 options
            while len(options) < 4:
                option_letter = ['A', 'B', 'C', 'D'][len(options)]
                options.append(f"{option_letter}) Option based on module content")
            
            validated_question = {
                'id': question.get('id', i + 1),
                'question': question.get('question', 'Question not available'),
                'options': options,
                'correct_answer': (question.get('correct_answer') or question.get('correctAnswer') or 'A').upper().strip(),
                'explanation': question.get('explanation', 'Explanation not available'),
                'difficulty': question.get('difficulty', 'medium'),
                'knowledgeArea': question.get('knowledgeArea', module.get('title', 'General Knowledge')),
                'commonMistake': question.get('commonMistake', 'No common mistake information available'),
                'points': question.get('points', 5)
            }
            validated_questions.append(validated_question)
        
        validated_quiz = {
            'questions': validated_questions,
            'totalQuestions': len(validated_questions),
            'timeLimit': 600,
            'moduleTitle': f"{module.get('title', 'Module')} Quiz"
        }
        
        print(f"✅ Found {len(validated_questions)} validated quiz questions")
        
        return jsonify({
            "success": True,
            "quiz": validated_quiz,
            "module_title": module.get('title', 'Unknown Module'),
            "module_number": module_num,
            "course_title": course_structure.get('course', {}).get('title', 'Unknown Course') if isinstance(course_structure, dict) else 'Unknown Course'
        })
        
    except Exception as e:
        print(f"❌ Get quiz error: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/course/<course_id>/quiz', methods=['GET'])
def get_course_quiz(course_id):
    """Get comprehensive quiz for entire course"""
    try:
        print(f"🎯 Getting comprehensive quiz for course: {course_id}")
        
        if not db_manager:
            return jsonify({"error": "Database not available"}), 500
            
        course_data = db_manager.get_course_by_id(course_id)
        if not course_data:
            return jsonify({"error": "Course not found"}), 404
        
        all_questions = []
        course_structure = course_data.get('course_structure', {})
        
        # FIXED: Handle structure safely
        if isinstance(course_structure, dict) and 'course' in course_structure:
            modules = course_structure['course'].get('modules', [])
        else:
            modules = course_structure.get('modules', []) if isinstance(course_structure, dict) else []
        
        # Ensure modules is list
        if not isinstance(modules, list):
            modules = []
        
        for module in modules:
            quiz_data = module.get('quiz', {})
            questions = quiz_data.get('questions', [])
            
            for i, question in enumerate(questions):
                # Validate and format options
                options = question.get('options', [])
                if not isinstance(options, list) or len(options) < 4:
                    options = [
                        'A) Option A based on module content',
                        'B) Option B based on module content',
                        'C) Option C based on module content',
                        'D) Option D based on module content'
                    ]
                else:
                    formatted_options = []
                    for j, option in enumerate(options[:4]):
                        if isinstance(option, str):
                            option_letter = ['A', 'B', 'C', 'D'][j]
                            if not option.strip().startswith(f'{option_letter})'):
                                clean_option = re.sub(r'^[A-D][\)\.]\s*', '', option.strip())
                                formatted_options.append(f"{option_letter}) {clean_option}")
                            else:
                                formatted_options.append(option.strip())
                        else:
                            option_letter = ['A', 'B', 'C', 'D'][j]
                            formatted_options.append(f"{option_letter}) {str(option)}")
                    options = formatted_options
                
                # Ensure 4 options
                while len(options) < 4:
                    option_letter = ['A', 'B', 'C', 'D'][len(options)]
                    options.append(f"{option_letter}) Option based on course content")
                
                validated_question = {
                    'id': len(all_questions) + 1,
                    'question': question.get('question', 'Question not available'),
                    'options': options,
                    'correct_answer': (question.get('correct_answer') or question.get('correctAnswer') or 'A').upper().strip(),
                    'explanation': question.get('explanation', 'Explanation not available'),
                    'difficulty': question.get('difficulty', 'medium'),
                    'knowledgeArea': question.get('knowledgeArea', module.get('title', 'General Knowledge')),
                    'commonMistake': question.get('commonMistake', 'No common mistake information available'),
                    'points': question.get('points', 5),
                    'module': module.get('module_number'),
                    'module_title': module.get('title', 'Unknown Module')
                }
                all_questions.append(validated_question)
        
        if not all_questions:
            return jsonify({
                "success": False,
                "error": "No quiz questions found in this course"
            }), 404
        
        comprehensive_quiz = {
            'questions': all_questions,
            'totalQuestions': len(all_questions),
            'timeLimit': 1200,  # 20 minutes for comprehensive quiz
            'moduleTitle': 'Course Comprehensive Assessment'
        }
        
        print(f"✅ Found {len(all_questions)} questions for comprehensive quiz")
        
        return jsonify({
            "success": True,
            "quiz": comprehensive_quiz,
            "course_title": course_structure.get('course', {}).get('title', 'Unknown Course') if isinstance(course_structure, dict) else 'Unknown Course'
        })
        
    except Exception as e:
        print(f"❌ Get comprehensive quiz error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/recent-courses', methods=['GET'])
def get_recent_courses():
    """Get recently generated courses"""
    try:
        if not db_manager:
            return jsonify({"error": "Database not available"}), 500
            
        courses = db_manager.get_recent_courses(limit=10)
        courses = json.loads(json.dumps(courses, cls=JSONEncoder))
        
        return jsonify({
            "success": True,
            "courses": courses
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/debug/db', methods=['GET'])
def debug_database():
    """Debug database information"""
    try:
        if not db_manager:
            return jsonify({"error": "Database not available"}), 500
            
        stats = db_manager.get_database_stats()
        return jsonify({
            "success": True,
            "database_stats": stats
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analytics/quiz-result', methods=['POST'])
def save_quiz_result():
    """Save quiz results"""
    try:
        if not db_manager:
            return jsonify({"error": "Database not available"}), 500
            
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        quiz_data = {
            'course_id': data.get('course_id'),
            'module_number': data.get('module_number'),
            'score': data.get('score'),
            'total_questions': data.get('total_questions'),
            'correct_answers': data.get('correct_answers'),
            'time_spent': data.get('time_spent'),
            'answers': data.get('answers', []),
            'completed_at': datetime.now()
        }
        
        success = db_manager.save_user_quiz_results(
            quiz_data['course_id'],
            quiz_data['module_number'],
            quiz_data
        )
        
        return jsonify({"success": success})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Keep all your existing routes below...
@app.route('/api/generate-course', methods=['POST'])
def generate_course():
    """Generate course from extracted content with settings - Supports batching"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        content_id = data.get('content_id')
        settings = data.get('settings', {})
        
        print(f"🔄 Generate course request for content_id: {content_id}")
        print(f"⚙️ Settings provided: {settings}")
        
        if not content_id:
            return jsonify({"error": "Content ID required"}), 400
        
        # Get extracted content
        if not db_manager:
            return jsonify({"error": "Database not available"}), 500
            
        content_data = db_manager.get_content_by_id(content_id)
        if not content_data:
            return jsonify({"error": "Content not found"}), 404
        
        print(f"📝 Found content: {len(content_data['content'])} characters")
        
        # Generate course WITH SETTINGS AND BATCHING
        print("🤖 Generating course with settings...")
        if not ai_processor:
            return jsonify({"error": "AI processor not available"}), 500
        
        course_result = ai_processor.generate_course(
            content_data['content'], 
            settings, 
            db_manager=db_manager, 
            content_id=content_id
        )
        
        if not course_result['success']:
            return jsonify({"error": course_result.get('error', 'Course generation failed')}), 500
        
        # If batched, generator already merged - no duplicate DB merge
        batched = course_result.get('batched', False)
        course_id = content_id
        
        if batched:
            print("🔗 Batched course merged in memory - no duplicate DB merge")
            # Clean up partials
            if db_manager and db_manager.partial_courses_collection is not None:
                delete_result = db_manager.partial_courses_collection.delete_many({"content_id": content_id})
                print(f"🧹 Cleaned up {delete_result.deleted_count} partials")
        
        # Save full course (ONCE)
        course_data_to_save = {
            "content_id": content_id,
            "course_structure": course_result['course_data'],
            "settings_used": settings,
            "generated_at": datetime.now(),
            "source": course_result.get('source', 'unknown'),
            "batched": batched,
            "batches": course_result.get('batches', 1)
        }
        
        full_course_id = db_manager.save_course_structure(course_data_to_save)
        
        return jsonify({
            "success": True,
            "course_id": full_course_id,
            "content_id": content_id,
            "course_data": course_result['course_data'],
            "source": course_result.get('source', 'unknown'),
            "message": "Course generated successfully",
            "settings_used": settings,
            "batched": batched,
            "batches": course_result.get('batches', 1) if batched else None,
            "generation_time": course_result.get('generation_time')
        })
        
    except Exception as e:
        print(f"❌ Course generation error: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/merge-partial-course/<content_id>', methods=['POST'])
def merge_partial_course(content_id):
    """Manually merge partial courses for a content_id"""
    try:
        if not db_manager:
            return jsonify({"error": "Database not available"}), 500
            
        merged = db_manager.merge_partials_to_full(content_id)
        if not merged:
            return jsonify({"error": "No partials to merge or merge failed"}), 400
        
        print(f"✅ Manual merge for {content_id}: {merged.get('_id')}")
        return jsonify({
            "success": True,
            "course_id": str(merged.get('_id')),
            "content_id": content_id,
            "message": "Partials merged successfully"
        })
    except Exception as e:
        print(f"❌ Merge error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/content/<content_id>', methods=['GET'])
def get_content(content_id):
    """Get extracted content by ID"""
    try:
        print(f"📄 Getting content for: {content_id}")
        
        if not db_manager:
            return jsonify({"error": "Database not available"}), 500
            
        content_data = db_manager.get_content_by_id(content_id)
        if not content_data:
            return jsonify({"error": "Content not found"}), 404
        
        # Convert to JSON serializable format
        content_data = json.loads(json.dumps(content_data, cls=JSONEncoder))
        
        return jsonify({
            "success": True,
            "content": content_data
        })
        
    except Exception as e:
        print(f"❌ Get content error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/course-settings/options', methods=['GET'])
def get_course_settings_options():
    """Get available course settings options"""
    return jsonify({
        "difficulty_levels": [
            {"value": "beginner", "label": "Beginner", "description": "No prior knowledge required"},
            {"value": "intermediate", "label": "Intermediate", "description": "Basic understanding assumed"},
            {"value": "advanced", "label": "Advanced", "description": "For experienced learners"},
            {"value": "expert", "label": "Expert", "description": "Professional level insights"}
        ],
        "learning_paces": [
            {"value": "slow", "label": "Slow & Detailed", "description": "Comprehensive explanations with multiple examples"},
            {"value": "medium", "label": "Balanced Pace", "description": "Balance between depth and conciseness"},
            {"value": "fast", "label": "Fast & Focused", "description": "Key concepts and summaries only"}
        ],
        "depth_levels": [
            {"value": "basic", "label": "Basic Overview", "description": "Fundamental concepts only"},
            {"value": "intermediate", "label": "Practical Focus", "description": "Includes practical applications"},
            {"value": "comprehensive", "label": "Comprehensive", "description": "In-depth analysis with advanced topics"},
            {"value": "expert", "label": "Expert Level", "description": "Research-level insights and case studies"}
        ],
        "enhanced_features": [
            {"value": "include_practical", "label": "Practical Exercises", "description": "Hands-on coding exercises and real-world projects"},
            {"value": "include_case_studies", "label": "Case Studies", "description": "Real industry examples and success stories"},
            {"value": "include_exam_prep", "label": "Exam Preparation", "description": "Previous year questions and important topics"}
        ],
        "defaults": {
            "modules": 4,
            "flashcards": 10,
            "questions_per_module": 3
        },
        "batching_note": "For >4 modules, generation uses batching to avoid timeouts (faster & reliable)"
    })

@app.route('/api/debug', methods=['GET'])
def debug_info():
    """Debug information (enhanced)"""
    return jsonify({
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "upload_folder": UPLOAD_FOLDER,
        "files_in_upload": len(os.listdir(UPLOAD_FOLDER)) if os.path.exists(UPLOAD_FOLDER) else 0,
        "database_connected": db_manager.is_connected() if db_manager else False,
        "batching_supported": True,
        "timeout_limit": "300s"
    })

@app.route('/api/test-upload', methods=['POST'])
def test_upload():
    """Test upload endpoint"""
    try:
        print("🧪 Test upload endpoint called")
        return jsonify({
            "success": True,
            "message": "Upload endpoint is working",
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        print(f"❌ Test upload error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/analytics/progress', methods=['POST'])
def save_progress_analytics():
    """Save learning progress analytics"""
    try:
        if not db_manager:
            return jsonify({"error": "Database not available"}), 500
            
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        analytics_data = {
            'course_id': data.get('course_id'),
            'module_number': data.get('module_number'),
            'progress_type': data.get('progress_type', 'general'),
            'score': data.get('score'),
            'time_spent': data.get('time_spent'),
            'completed_at': datetime.now()
        }
        
        success = db_manager.save_learning_analytics(analytics_data)
        return jsonify({"success": success})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("🚀 Starting BrainForge Backend with Quiz Support...")
    print("🔧 Debug mode: ON | Quiz Generation: Enabled")
    print("🌐 Server running on http://localhost:5000")
    print("💡 Make sure MongoDB is running and GEMINI_API_KEY is set")
    
    app.run(debug=True, port=5000, host='0.0.0.0')
