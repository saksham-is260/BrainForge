// services/api.js - UPDATED VERSION
const API_BASE_URL = "https://brainforge-5.onrender.com/api";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      console.log(`🌐 API Calling: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API Success: ${url}`);
      return data;

    } catch (error) {
      console.error(`❌ API Failed: ${url}`, error);
      
      // Better error handling
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Backend server not reachable. Please check if backend is running.');
      }
      throw error;
    }
  }

  // ✅ FIXED COURSE ENDPOINTS
  async getRecentCourses() {
    try {
      const response = await this.request('/recent-courses');
      return response;
    } catch (error) {
      console.error('Failed to fetch recent courses:', error);
      return { 
        success: false, 
        error: error.message,
        courses: [] 
      };
    }
  }

  async getCourse(courseId) {
    try {
      const response = await this.request(`/course/${courseId}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch course ${courseId}:`, error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async getCourseByContentId(contentId) {
    try {
      const response = await this.request(`/course/content/${contentId}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch course by content ${contentId}:`, error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // ✅ UPLOAD WITH BETTER ERROR HANDLING
  async uploadFile(formData) {
    try {
      const url = `${this.baseURL}/upload`;
      console.log('📤 Uploading file to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Upload successful:', result);
      return result;

    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  }

  // ✅ QUIZ & FLASHCARDS DATA
  async getQuizData(courseId, moduleNumber = null) {
    try {
      // First get course data
      const courseResponse = await this.getCourse(courseId);
      if (!courseResponse.success) {
        throw new Error('Course not found');
      }

      const course = courseResponse.course;
      
      // Extract quiz from course modules
      let quizData = null;
      if (moduleNumber && course.modules) {
        const module = course.modules.find(m => m.module_number === parseInt(moduleNumber));
        quizData = module?.quiz;
      }
      
      // If no specific module, create comprehensive quiz
      if (!quizData) {
        quizData = this.createComprehensiveQuiz(course);
      }

      return {
        success: true,
        quiz: quizData,
        course: course
      };

    } catch (error) {
      console.error('Failed to get quiz data:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  createComprehensiveQuiz(course) {
    // Create quiz from course modules
    const allQuestions = [];
    
    course.modules?.forEach(module => {
      if (module.quiz?.questions) {
        allQuestions.push(...module.quiz.questions.map(q => ({
          ...q,
          module: module.module_number,
          moduleTitle: module.title
        })));
      }
    });

    return {
      totalQuestions: allQuestions.length,
      moduleTitle: 'Course Comprehensive Quiz',
      timeLimit: 600, // 10 minutes
      questions: allQuestions.slice(0, 10) // Take first 10 questions
    };
  }

  async getFlashcardsData(courseId) {
    try {
      const courseResponse = await this.getCourse(courseId);
      if (!courseResponse.success) {
        throw new Error('Course not found');
      }

      const course = courseResponse.course;
      const flashcards = course.flashcards || [];

      return {
        success: true,
        flashcards: flashcards,
        course: course
      };

    } catch (error) {
      console.error('Failed to get flashcards:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // ✅ PROGRESS TRACKING
  async saveProgress(courseId, moduleNumber, progressData) {
    return this.request('/analytics/progress', {
      method: 'POST',
      body: JSON.stringify({
        course_id: courseId,
        module_number: moduleNumber,
        progress_data: progressData
      }),
    });
  }

  // ✅ DEBUG ENDPOINTS
  async getDebugInfo() {
    return this.request('/debug');
  }

  async getDatabaseStats() {
    return this.request('/debug/db');
  }

  async healthCheck() {
    return this.request('/health');
  }
}

export const api = new ApiService();