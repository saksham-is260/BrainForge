import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const CourseContext = createContext();

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
};

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // ✅ FIXED: Proper course data extraction
  const extractCourseData = (course) => {
    if (!course) return null;
    
    // Check different possible data structures
    const courseStructure = course.course_structure?.course || course.actualCourse || course;
    
    return {
      _id: course._id || course.id,
      content_id: course.content_id,
      title: courseStructure.title || course.title || 'Untitled Course',
      description: courseStructure.description || course.description || 'No description available',
      total_modules: courseStructure.total_modules || course.total_modules || 0,
      difficulty: courseStructure.difficulty || course.difficulty || 'intermediate',
      learning_pace: courseStructure.learning_pace || course.learning_pace || 'medium',
      depth_level: courseStructure.depth_level || course.depth_level || 'comprehensive',
      estimated_duration: courseStructure.estimated_duration || course.estimated_duration || 'Unknown',
      modules: courseStructure.modules || course.modules || [],
      flashcards: courseStructure.flashcards || course.flashcards || [],
      created_at: course.created_at || new Date(),
      // Enhanced data for display
      modules_count: course.modules_count || (courseStructure.modules ? courseStructure.modules.length : 0) || 0,
      flashcards_count: course.flashcards_count || (courseStructure.flashcards ? courseStructure.flashcards.length : 0) || 0,
      has_practical: courseStructure.include_practical || course.include_practical || false,
      has_case_studies: courseStructure.include_case_studies || course.include_case_studies || false,
      has_exam_prep: courseStructure.include_exam_prep || course.include_exam_prep || false,
      // Original data for reference
      original_data: course
    };
  };

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔄 Fetching courses from API...');
      
      // First check backend health
      try {
        const health = await api.healthCheck();
        console.log('🔧 Backend health:', health);
      } catch (healthError) {
        console.log('❌ Backend not reachable, using mock data');
        const mockCourses = getMockCourses();
        setCourses(mockCourses);
        setLoading(false);
        return;
      }

      const response = await api.getRecentCourses();
      console.log('📦 API Response:', response);
      
      if (response.success && response.courses) {
        // ✅ FIXED: Properly process courses with enhanced data
        const processedCourses = response.courses.map(course => extractCourseData(course));
        setCourses(processedCourses);
        setLastUpdated(new Date());
        console.log(`✅ Loaded ${processedCourses.length} processed courses`);
        
        // Log course details for debugging
        processedCourses.forEach((course, index) => {
          console.log(`📚 Course ${index + 1}:`, {
            id: course._id,
            title: course.title,
            modules: course.modules_count,
            hasModules: course.modules.length > 0
          });
        });
      } else {
        setError(response.error || 'No courses found');
        console.log('❌ No courses in response:', response);
        // Fallback to mock data
        const mockCourses = getMockCourses();
        setCourses(mockCourses);
      }
    } catch (err) {
      console.error('❌ Failed to fetch courses:', err);
      setError(`Connection failed: ${err.message}`);
      
      // Fallback to mock data
      const mockCourses = getMockCourses();
      setCourses(mockCourses);
      console.log('🔄 Using mock data as fallback');
    } finally {
      setLoading(false);
    }
  };

  const getCourseById = async (courseId) => {
    try {
      console.log(`🔄 Fetching course: ${courseId}`);
      
      // Check if it's a mock ID
      if (courseId.startsWith('mock_')) {
        return getMockCourse(courseId);
      }

      const response = await api.getCourse(courseId);
      console.log('📦 Course API Response:', response);
      
      if (response.success && response.course) {
        const processedCourse = extractCourseData(response.course);
        
        console.log(`✅ Processed course loaded:`, {
          title: processedCourse.title,
          modules: processedCourse.modules.length,
          hasQuizData: processedCourse.modules.some(module => module.quiz)
        });

        return processedCourse;
      } else {
        console.log('❌ Course not found in response, using mock data');
        return getMockCourse(courseId);
      }
    } catch (error) {
      console.error('❌ Error fetching course:', error);
      return getMockCourse(courseId);
    }
  };

  // ✅ FIXED: Enhanced quiz data extraction
  const getQuizData = async (courseId, moduleNumber = null) => {
    try {
      console.log(`🎯 Fetching quiz for course: ${courseId}, module: ${moduleNumber}`);
      
      const course = await getCourseById(courseId);
      
      if (!course) {
        throw new Error('Course not found');
      }

      let quizData = null;
      let moduleTitle = 'Course Comprehensive Quiz';

      if (moduleNumber) {
        // Module-specific quiz
        const module = course.modules.find(m => m.module_number === parseInt(moduleNumber));
        if (module && module.quiz) {
          quizData = module.quiz;
          moduleTitle = `${module.title} - Quiz`;
        }
      } else {
        // Course comprehensive quiz - combine all module questions
        const allQuestions = [];
        course.modules.forEach(module => {
          if (module.quiz && module.quiz.questions) {
            allQuestions.push(...module.quiz.questions.map(q => ({
              ...q,
              module: module.module_number,
              moduleTitle: module.title
            })));
          }
        });
        
        if (allQuestions.length > 0) {
          quizData = {
            totalQuestions: allQuestions.length,
            questions: allQuestions,
            timeLimit: 1200 // 20 minutes for comprehensive quiz
          };
          moduleTitle = 'Course Comprehensive Assessment';
        }
      }

      // If no quiz found in data, use enhanced fallback
      if (!quizData) {
        console.log('📝 Using enhanced fallback quiz');
        return getEnhancedFallbackQuiz(courseId, moduleNumber, course);
      }

      // ✅ FIXED: Transform quiz data to consistent format
      const transformedQuiz = {
        totalQuestions: quizData.totalQuestions || quizData.questions?.length || 0,
        moduleTitle: moduleTitle,
        timeLimit: quizData.timeLimit || 600,
        questions: (quizData.questions || []).map((q, index) => ({
          id: q.id || index + 1,
          question: q.question || 'Question not available',
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: q.correct_answer || q.correctAnswer || 'A',
          explanation: q.explanation || 'Explanation not available',
          difficulty: q.difficulty || 'medium',
          knowledgeArea: q.knowledgeArea || course.title,
          commonMistake: q.commonMistake || 'No common mistake information available',
          points: q.points || 5
        }))
      };

      console.log(`✅ Quiz data prepared:`, {
        totalQuestions: transformedQuiz.totalQuestions,
        moduleTitle: transformedQuiz.moduleTitle
      });

      return {
        success: true,
        quiz: transformedQuiz,
        course: course
      };

    } catch (error) {
      console.error('❌ Error fetching quiz:', error);
      return getEnhancedFallbackQuiz(courseId, moduleNumber);
    }
  };

  // ✅ FIXED: Enhanced fallback quiz with module-specific content
  const getEnhancedFallbackQuiz = (courseId, moduleNumber, course = null) => {
    const courseTitle = course?.title || 'Data Communications';
    
    const moduleSpecificQuestions = {
      1: [
        {
          id: 1,
          question: 'What is the primary purpose of data communications?',
          options: [
            'A) To exchange data between devices',
            'B) To store data securely', 
            'C) To process data locally',
            'D) To display data visually'
          ],
          correctAnswer: 'A',
          explanation: 'Data communications involves transmitting digital data between two or more devices through transmission media.',
          difficulty: 'easy',
          knowledgeArea: 'Data Communications',
          commonMistake: 'Confusing data communications with data storage',
          points: 5
        },
        {
          id: 2,
          question: 'Which component is essential for network communication?',
          options: [
            'A) Protocols and standards',
            'B) Color coding',
            'C) User interfaces', 
            'D) Graphics processing'
          ],
          correctAnswer: 'A',
          explanation: 'Protocols define the rules and standards for data communication between devices.',
          difficulty: 'easy',
          knowledgeArea: 'Networking Fundamentals',
          commonMistake: 'Thinking hardware alone enables communication',
          points: 5
        }
      ],
      2: [
        {
          id: 1,
          question: 'What does the OSI model represent in networking?',
          options: [
            'A) A conceptual framework with 7 layers',
            'B) A physical network topology',
            'C) A specific brand of networking equipment', 
            'D) A programming language for networks'
          ],
          correctAnswer: 'A',
          explanation: 'The OSI (Open Systems Interconnection) model divides network communication into 7 abstraction layers.',
          difficulty: 'medium',
          knowledgeArea: 'Network Models',
          commonMistake: 'Confusing OSI with TCP/IP model layers',
          points: 10
        }
      ]
    };

    const questions = moduleNumber ? 
      (moduleSpecificQuestions[moduleNumber] || moduleSpecificQuestions[1]) : 
      Object.values(moduleSpecificQuestions).flat();

    const quiz = {
      totalQuestions: questions.length,
      moduleTitle: moduleNumber ? 
        `Module ${moduleNumber} Assessment - ${courseTitle}` : 
        `Comprehensive Quiz - ${courseTitle}`,
      timeLimit: moduleNumber ? 600 : 1200,
      questions: questions
    };

    return {
      success: true,
      quiz: quiz,
      course: course || getMockCourse(courseId),
      isFallback: true
    };
  };

  const getFlashcardsData = async (courseId) => {
    try {
      const course = await getCourseById(courseId);
      
      if (course && course.flashcards && course.flashcards.length > 0) {
        return {
          success: true,
          flashcards: course.flashcards
        };
      }
      
      // Fallback to mock flashcards
      return getMockFlashcardsData();
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      return getMockFlashcardsData();
    }
  };

  // Mock data functions
  const getMockCourses = () => [
    {
      _id: 'mock_1',
      title: 'Data Communications & Networking',
      description: 'Comprehensive course on networking fundamentals and protocols with real-world applications',
      progress: 75,
      modules_count: 4,
      estimated_duration: '3 hours',
      difficulty: 'Intermediate',
      lastAccessed: '2 hours ago',
      created_at: new Date().toISOString(),
      isMock: true,
      modules: [
        {
          module_number: 1,
          title: 'Introduction to Networking',
          duration_estimate: '45 minutes',
          learning_objectives: [
            'Understand basic networking concepts',
            'Learn about network types and topologies'
          ],
          content: {
            introduction: 'Networking forms the backbone of modern digital communication.',
            sections: [
              {
                heading: 'What is a Computer Network?',
                content: 'A computer network is a collection of interconnected devices that can communicate and share resources.'
              }
            ]
          },
          quiz: {
            questions: [
              {
                question: 'What is the primary purpose of a computer network?',
                options: [
                  'A) To share resources and communicate',
                  'B) To increase computer speed',
                  'C) To store more data',
                  'D) To play games'
                ],
                correct_answer: 'A',
                explanation: 'Networks primarily enable resource sharing and communication between devices.',
                difficulty: 'easy',
                points: 5
              }
            ]
          }
        }
      ],
      flashcards: [
        {
          id: 1,
          front: 'What is a LAN?',
          back: 'Local Area Network - A network covering a small geographical area like an office or building',
          mnemonic: 'LAN = Local Area Network',
          category: 'Network Types',
          importance: 'high'
        }
      ]
    }
  ];

  const getMockCourse = (courseId) => {
    return getMockCourses().find(c => c._id === courseId) || getMockCourses()[0];
  };

  const getMockFlashcardsData = () => {
    return {
      success: true,
      flashcards: getMockCourses()[0].flashcards
    };
  };

  const refreshCourses = () => {
    console.log('🔄 Manually refreshing courses...');
    fetchCourses();
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const value = {
    courses,
    loading,
    error,
    lastUpdated,
    refreshCourses,
    getCourseById,
    getQuizData,
    getFlashcardsData,
    fetchCourses
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};