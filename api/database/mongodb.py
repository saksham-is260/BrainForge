from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv
import json
from bson import ObjectId
from bson.json_util import dumps

load_dotenv()

class MongoDBManager:
    def __init__(self):
        try:
            mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
            self.client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
            self.db = self.client['brainforge_db']
            self.content_collection = self.db['extracted_content']
            self.courses_collection = self.db['generated_courses']
            self.user_sessions_collection = self.db['user_sessions']
            self.analytics_collection = self.db['learning_analytics']
            self.partial_courses_collection = self.db['partial_courses']  # New for batching support
            
            # Test connection
            self.client.admin.command('ismaster')
            
            # Create indexes for better performance
            self.content_collection.create_index("filename")
            self.courses_collection.create_index("content_id")
            self.partial_courses_collection.create_index("content_id")
            self.partial_courses_collection.create_index("batch_num")
            self.user_sessions_collection.create_index("course_id")
            self.analytics_collection.create_index("course_id")
            
            print("✅ MongoDB connected successfully")
        except Exception as e:
            print(f"❌ MongoDB connection error: {e}")
            self.client = None
            self.db = None
            self.content_collection = None
            self.courses_collection = None
            self.user_sessions_collection = None
            self.analytics_collection = None
            self.partial_courses_collection = None
    
    def is_connected(self):
        """Check if MongoDB is connected"""
        return self.client is not None and self.db is not None
    
    def save_extracted_content(self, content_data):
        """Save extracted content to database"""
        if not self.is_connected() or self.content_collection is None:
            print("⚠️ MongoDB not connected, using mock ID")
            return "mock_content_id_123"
        
        try:
            content_data['created_at'] = datetime.now()
            content_data['updated_at'] = datetime.now()
            result = self.content_collection.insert_one(content_data)
            print(f"✅ Content saved with ID: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            print(f"❌ Error saving content: {e}")
            return f"mock_content_id_{datetime.now().timestamp()}"
    
    def get_content_by_id(self, content_id):
        """Get content by ID"""
        if not self.is_connected() or self.content_collection is None:
            print("⚠️ MongoDB not connected")
            return None
        
        try:
            # Handle both string and ObjectId
            if isinstance(content_id, str) and content_id.startswith('mock_'):
                return {
                    "_id": content_id,
                    "filename": "mock_file.pdf",
                    "content": "Mock content for testing",
                    "source_type": "pdf",
                    "length": 100,
                    "created_at": datetime.now()
                }
            
            content = self.content_collection.find_one({"_id": ObjectId(content_id)})
            if content:
                content['_id'] = str(content['_id'])  # Convert ObjectId to string
            return content
        except Exception as e:
            print(f"❌ Error getting content: {e}")
            return None
    
    def save_course_structure(self, course_data):
        """Save course structure to database"""
        if not self.is_connected() or self.courses_collection is None:
            print("⚠️ MongoDB not connected, using mock ID")
            return "mock_course_id_123"
        
        try:
            course_data['created_at'] = datetime.now()
            course_data['updated_at'] = datetime.now()
            result = self.courses_collection.insert_one(course_data)
            print(f"✅ Course saved with ID: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            print(f"❌ Error saving course: {e}")
            return f"mock_course_id_{datetime.now().timestamp()}"
    
    def get_course_by_content_id(self, content_id):
        """Get course by content ID"""
        if not self.is_connected() or self.courses_collection is None:
            print("⚠️ MongoDB not connected")
            return None
        
        try:
            # Handle mock IDs
            if isinstance(content_id, str) and content_id.startswith('mock_'):
                return self._create_mock_course(content_id)
            
            course = self.courses_collection.find_one({"content_id": content_id})
            if course:
                course['_id'] = str(course['_id'])  # Convert ObjectId to string
            return course
        except Exception as e:
            print(f"❌ Error getting course: {e}")
            return None
    
    def get_course_by_id(self, course_id):
        """Get course by course ID"""
        if not self.is_connected() or self.courses_collection is None:
            print("⚠️ MongoDB not connected")
            return None
        
        try:
            if isinstance(course_id, str) and course_id.startswith('mock_'):
                return self._create_mock_course(course_id)
            
            course = self.courses_collection.find_one({"_id": ObjectId(course_id)})
            if course:
                course['_id'] = str(course['_id'])
            return course
        except Exception as e:
            print(f"❌ Error getting course by ID: {e}")
            return None
    
    def get_recent_courses(self, limit=5):
        """Get recent courses with enhanced data"""
        if not self.is_connected() or self.courses_collection is None:
            print("⚠️ MongoDB not connected")
            return self._get_mock_recent_courses(limit)
        
        try:
            courses = list(self.courses_collection.find()
                         .sort("created_at", -1)
                         .limit(limit))
            
            # Convert ObjectId to string and enhance data
            enhanced_courses = []
            for course in courses:
                course['_id'] = str(course['_id'])
                
                # Extract course info for display
                if 'course_structure' in course and 'course' in course['course_structure']:
                    course_data = course['course_structure']['course']
                    enhanced_course = {
                        '_id': course['_id'],
                        'content_id': course.get('content_id', ''),
                        'title': course_data.get('title', 'Untitled Course'),
                        'description': course_data.get('description', 'No description'),
                        'total_modules': course_data.get('total_modules', 0),
                        'difficulty': course_data.get('difficulty', 'beginner'),
                        'learning_pace': course_data.get('learning_pace', 'medium'),
                        'depth_level': course_data.get('depth_level', 'comprehensive'),
                        'estimated_duration': course_data.get('estimated_duration', 'Unknown'),
                        'created_at': course.get('created_at', datetime.now()),
                        'modules_count': len(course_data.get('modules', [])),
                        'flashcards_count': len(course_data.get('flashcards', [])),
                        'has_practical': course_data.get('include_practical', False),
                        'has_case_studies': course_data.get('include_case_studies', False),
                        'has_exam_prep': course_data.get('include_exam_prep', False)
                    }
                    enhanced_courses.append(enhanced_course)
                else:
                    # Fallback for old format
                    enhanced_courses.append({
                        '_id': course['_id'],
                        'title': 'Generated Course',
                        'description': 'AI-generated learning course',
                        'total_modules': 4,
                        'difficulty': 'intermediate',
                        'created_at': course.get('created_at', datetime.now())
                    })
            
            # Include recent partials if any (for batching visibility)
            partials = list(self.partial_courses_collection.find()
                          .sort("created_at", -1)
                          .limit(2))
            for partial in partials:
                partial['_id'] = str(partial['_id'])
                enhanced_courses.append({
                    '_id': f"partial_{partial['_id']}",
                    'title': f'Partial Course (Batch {partial["batch_num"]}/{partial["total_batches"]})',
                    'description': 'In-progress batched course',
                    'total_modules': partial.get('course_partial', {}).get('total_modules', 0),
                    'created_at': partial.get('created_at', datetime.now()),
                    'is_partial': True
                })
            
            return enhanced_courses
        except Exception as e:
            print(f"❌ Error getting recent courses: {e}")
            return self._get_mock_recent_courses(limit)
    
    # NEW: Partial course methods for batching
    def save_partial_course(self, partial_data, content_id, batch_num, total_batches):
        """Save partial course data for batched generation"""
        if not self.is_connected() or self.partial_courses_collection is None:
            print("⚠️ MongoDB not connected, using mock partial ID")
            return f"mock_partial_batch_{batch_num}_{content_id}"
        
        try:
            partial_doc = {
                'content_id': content_id,
                'batch_num': batch_num,
                'total_batches': total_batches,
                'course_partial': partial_data,  # {'course': {...}}
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            result = self.partial_courses_collection.insert_one(partial_doc)
            print(f"✅ Partial course (batch {batch_num}/{total_batches}) saved with ID: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            print(f"❌ Error saving partial course: {e}")
            return f"mock_partial_batch_{batch_num}_{content_id}_{datetime.now().timestamp()}"
    
    def get_partial_course(self, content_id, batch_num):
        """Get specific partial course by content_id and batch_num"""
        if not self.is_connected() or self.partial_courses_collection is None:
            print("⚠️ MongoDB not connected")
            return self._create_mock_partial(content_id, batch_num)
        
        try:
            partial = self.partial_courses_collection.find_one({
                "content_id": content_id,
                "batch_num": batch_num
            })
            if partial:
                partial['_id'] = str(partial['_id'])
                return partial
            return None
        except Exception as e:
            print(f"❌ Error getting partial course: {e}")
            return None
    
    def merge_partials_to_full(self, content_id):
        """Merge all partials for a content_id into a full course and save"""
        if not self.is_connected():
            print("⚠️ MongoDB not connected")
            return None
        
        try:
            # Get all partials for this content_id
            partials = list(self.partial_courses_collection.find({
                "content_id": content_id
            }).sort("batch_num", 1))
            
            if not partials or len(partials) < 1:
                print("❌ No partials found to merge")
                return None
            
            total_batches = partials[0].get('total_batches', len(partials))
            if len(partials) != total_batches:
                print(f"⚠️ Incomplete partials: {len(partials)}/{total_batches}")
                return None
            
            # Merge logic (simple append of modules, flashcards from last)
            merged_modules = []
            merged_flashcards = []
            merged_bonus = {}
            metadata = partials[0]['course_partial']['course'].copy()  # Metadata from first
            
            for partial in partials:
                partial_course = partial['course_partial']['course']
                merged_modules.extend(partial_course.get('modules', []))
                if partial['batch_num'] == total_batches:  # Last batch has flashcards/bonus
                    merged_flashcards = partial_course.get('flashcards', [])
                    merged_bonus = partial_course.get('course_completion_bonus', {})
            
            metadata['modules'] = merged_modules
            metadata['flashcards'] = merged_flashcards
            metadata['course_completion_bonus'] = merged_bonus
            metadata['total_modules'] = len(merged_modules)
            
            # Save merged as full course
            full_course_data = {
                "content_id": content_id,
                "course_structure": {'course': metadata},
                "settings_used": {},  # Will be filled by caller
                "merged_from_partials": [str(p['_id']) for p in partials],
                "created_at": datetime.now(),
                "source": "merged_batched"
            }
            
            # Insert full course
            result = self.courses_collection.insert_one(full_course_data)
            full_id = str(result.inserted_id)
            
            # Optional: Remove partials after merge
            self.partial_courses_collection.delete_many({"content_id": content_id})
            
            print(f"✅ Merged {total_batches} partials into full course ID: {full_id}")
            return self.courses_collection.find_one({"_id": ObjectId(full_id)})
            
        except Exception as e:
            print(f"❌ Error merging partials: {e}")
            return None
    
    def update_course_progress(self, course_id, module_number, progress_data):
        """Update user progress for a course"""
        if not self.is_connected() or self.user_sessions_collection is None:
            print("⚠️ MongoDB not connected")
            return False
        
        try:
            update_data = {
                'course_id': course_id,
                'module_number': module_number,
                'progress_data': progress_data,
                'updated_at': datetime.now()
            }
            
            result = self.user_sessions_collection.update_one(
                {'course_id': course_id, 'module_number': module_number},
                {'$set': update_data},
                upsert=True
            )
            return result.acknowledged
        except Exception as e:
            print(f"❌ Error updating progress: {e}")
            return False
    
    def get_course_progress(self, course_id):
        """Get user progress for a course"""
        if not self.is_connected() or self.user_sessions_collection is None:
            print("⚠️ MongoDB not connected")
            return {}
        
        try:
            progress_data = list(self.user_sessions_collection.find(
                {'course_id': course_id}
            ).sort('module_number', 1))
            
            # Convert ObjectId to string
            for progress in progress_data:
                progress['_id'] = str(progress['_id'])
            
            return progress_data
        except Exception as e:
            print(f"❌ Error getting progress: {e}")
            return {}
    
    def save_user_quiz_results(self, course_id, module_number, quiz_results):
        """Save user quiz results"""
        if not self.is_connected() or self.user_sessions_collection is None:
            print("⚠️ MongoDB not connected")
            return False
        
        try:
            quiz_data = {
                'course_id': course_id,
                'module_number': module_number,
                'quiz_results': quiz_results,
                'completed_at': datetime.now(),
                'score': quiz_results.get('score', 0),
                'total_questions': quiz_results.get('total_questions', 0)
            }
            
            result = self.user_sessions_collection.insert_one(quiz_data)
            return result.acknowledged
        except Exception as e:
            print(f"❌ Error saving quiz results: {e}")
            return False
    
    def get_user_quiz_results(self, course_id):
        """Get user quiz results for a course"""
        if not self.is_connected() or self.user_sessions_collection is None:
            print("⚠️ MongoDB not connected")
            return []
        
        try:
            quiz_results = list(self.user_sessions_collection.find(
                {'course_id': course_id, 'quiz_results': {'$exists': True}}
            ).sort('completed_at', -1))
            
            # Convert ObjectId to string
            for result in quiz_results:
                result['_id'] = str(result['_id'])
            
            return quiz_results
        except Exception as e:
            print(f"❌ Error getting quiz results: {e}")
            return []
    
    def save_learning_analytics(self, analytics_data):
        """Save learning analytics data"""
        if not self.is_connected() or self.analytics_collection is None:
            print("⚠️ MongoDB not connected")
            return False
        
        try:
            analytics_data['created_at'] = datetime.now()
            result = self.analytics_collection.insert_one(analytics_data)
            return result.acknowledged
        except Exception as e:
            print(f"❌ Error saving analytics: {e}")
            return False
    
    def _create_mock_course(self, content_id):
        """Create mock course data for testing"""
        return {
            "_id": "mock_course_id_123",
            "content_id": content_id,
            "course_structure": {
                "course": {
                    "title": "Data Communications & Networking",
                    "description": "Comprehensive course on networking fundamentals",
                    "total_modules": 4,
                    "difficulty": "intermediate",
                    "learning_pace": "medium",
                    "depth_level": "comprehensive",
                    "estimated_duration": "3 hours",
                    "include_practical": True,
                    "include_case_studies": True,
                    "include_exam_prep": True,
                    "modules": [
                        {
                            "module_number": 1,
                            "title": "Introduction to Networking",
                            "learning_objectives": ["Understand basic concepts", "Learn protocols"],
                            "content": {
                                "introduction": "Networking basics",
                                "sections": [{"heading": "Concepts", "content": "Basic networking concepts"}],
                                "conclusion": "Summary"
                            },
                            "quiz": {
                                "questions": [
                                    {
                                        "question": "What is a network?",
                                        "options": ["A) Connected devices", "B) Single computer", "C) Software", "D) None"],
                                        "correct_answer": "A",
                                        "explanation": "Network means connected devices"
                                    }
                                ]
                            },
                            "practical_exercises": [
                                {
                                    "title": "Network Setup Simulation",
                                    "description": "Set up a basic network topology",
                                    "steps": ["Step 1: Identify devices", "Step 2: Connect cables", "Step 3: Configure IP addresses"],
                                    "expected_outcome": "Working network connection"
                                }
                            ],
                            "important_topics": ["OSI Model", "TCP/IP", "Network Topologies"],
                            "exam_questions": [
                                {
                                    "question": "Explain the OSI model layers",
                                    "type": "descriptive",
                                    "marks": 10,
                                    "importance": "high"
                                }
                            ]
                        }
                    ],
                    "flashcards": [
                        {"front": "LAN", "back": "Local Area Network", "mnemonic": "Small network"}
                    ]
                }
            },
            "created_at": datetime.now()
        }
    
    def _get_mock_recent_courses(self, limit):
        """Get mock recent courses for testing"""
        return [
            {
                "_id": f"mock_course_{i}",
                "title": f"Course {i} - Data Communications",
                "description": f"Mock course description {i}",
                "total_modules": 4,
                "difficulty": "intermediate",
                "learning_pace": "medium",
                "depth_level": "comprehensive",
                "estimated_duration": "2 hours",
                "created_at": datetime.now(),
                "modules_count": 4,
                "flashcards_count": 8,
                "has_practical": True,
                "has_case_studies": True,
                "has_exam_prep": True
            }
            for i in range(1, limit + 1)
        ]
    
    # NEW: Mock for partial
    def _create_mock_partial(self, content_id, batch_num):
        """Create mock partial for testing"""
        return {
            "_id": f"mock_partial_{batch_num}_{content_id}",
            "content_id": content_id,
            "batch_num": batch_num,
            "total_batches": 2,
            "course_partial": {
                "course": {
                    "title": "Mock Partial Course",
                    "modules": [{"module_number": 1 if batch_num == 1 else 2, "title": f"Mock Module {batch_num}"}]
                }
            },
            "created_at": datetime.now()
        }
    
    def get_database_stats(self):
        """Get database statistics"""
        if not self.is_connected():
            return {"error": "Database not connected"}
        
        try:
            stats = {
                "content_count": self.content_collection.count_documents({}),
                "courses_count": self.courses_collection.count_documents({}),
                "partials_count": self.partial_courses_collection.count_documents({}),
                "sessions_count": self.user_sessions_collection.count_documents({}),
                "analytics_count": self.analytics_collection.count_documents({}),
                "recent_activity": list(self.courses_collection.find()
                                      .sort("created_at", -1)
                                      .limit(3))
            }
            return stats
        except Exception as e:
            return {"error": str(e)}
    
    def close_connection(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            print("✅ MongoDB connection closed")

# Test function
def test_database():
    """Test database functionality"""
    try:
        print("🧪 Testing database connection...")
        db = MongoDBManager()
        
        if not db.is_connected():
            print("❌ Database not connected, using mock mode")
            return
        
        # Test content saving
        test_content = {
            "filename": "test.pdf",
            "content": "Data communications involves exchanging data between devices through transmission media. Networks connect multiple devices to share resources.",
            "source_type": "pdf",
            "length": 120,
            "settings": {
                "modules": 3,
                "difficulty": "beginner",
                "learning_pace": "medium",
                "depth_level": "comprehensive",
                "include_practical": True,
                "include_case_studies": True,
                "include_exam_prep": True
            }
        }
        
        content_id = db.save_extracted_content(test_content)
        print(f"✅ Content saved with ID: {content_id}")
        
        # Test partial saving (for batching)
        partial1 = {"course": {"modules": [{"title": "Partial Module 1"}]}}
        partial_id1 = db.save_partial_course(partial1, content_id, 1, 2)
        print(f"✅ Partial 1 saved with ID: {partial_id1}")
        
        partial2 = {"course": {"modules": [{"title": "Partial Module 2"}], "flashcards": []}}
        partial_id2 = db.save_partial_course(partial2, content_id, 2, 2)
        print(f"✅ Partial 2 saved with ID: {partial_id2}")
        
        # Test merge
        merged = db.merge_partials_to_full(content_id)
        if merged:
            print(f"✅ Merged course: {merged.get('_id')}")
        
        # Test course saving
        test_course = {
            "content_id": content_id,
            "course_structure": {
                "course": {
                    "title": "Test Course",
                    "description": "Test course description",
                    "modules": [],
                    "flashcards": []
                }
            },
            "settings_used": test_content["settings"]
        }
        
        course_id = db.save_course_structure(test_course)
        print(f"✅ Course saved with ID: {course_id}")
        
        # Test recent courses
        recent = db.get_recent_courses(2)
        print(f"✅ Recent courses: {len(recent)} found")
        
        # Test database stats
        stats = db.get_database_stats()
        print(f"✅ Database stats: {stats}")
        
    except Exception as e:
        print(f"❌ Database test error: {e}")

if __name__ == "__main__":
    test_database()