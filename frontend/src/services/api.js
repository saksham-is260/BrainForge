// services/api.js - UPDATED FOR PRODUCTION
const API_BASE_URL = "https://brainforge-5.onrender.com/api";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      console.log(`🌐 API Calling: ${url}`);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      // Add body for non-GET requests
      if (options.body && config.method !== 'GET') {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ API Success: ${url}`, data);
      return data;

    } catch (error) {
      console.error(`❌ API Failed: ${url}`, error);
      
      // Better error messages
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to backend server. Please check if the server is running.');
      }
      if (error.message.includes('404')) {
        throw new Error('API endpoint not found. Please check the endpoint URL.');
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

  // ✅ UPLOAD WITH PROPER FORM DATA
  async uploadFile(formData, settings = {}) {
    try {
      const url = `${this.baseURL}/upload`;
      console.log('📤 Uploading file to:', url);
      
      // Add settings to formData
      Object.keys(settings).forEach(key => {
        formData.append(key, settings[key]);
      });

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type for FormData
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

  // ✅ QUIZ ENDPOINTS
  async getModuleQuiz(courseId, moduleNumber) {
    try {
      const response = await this.request(`/course/${courseId}/module/${moduleNumber}/quiz`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch quiz for module ${moduleNumber}:`, error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async getCourseQuiz(courseId) {
    try {
      const response = await this.request(`/course/${courseId}/quiz`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch course quiz ${courseId}:`, error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // ✅ COURSE GENERATION
  async generateCourse(contentId, settings = {}) {
    try {
      const response = await this.request('/generate-course', {
        method: 'POST',
        body: {
          content_id: contentId,
          settings: settings
        }
      });
      return response;
    } catch (error) {
      console.error('Failed to generate course:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // ✅ COURSE SETTINGS
  async getCourseSettingsOptions() {
    try {
      const response = await this.request('/course-settings/options');
      return response;
    } catch (error) {
      console.error('Failed to fetch course settings:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // ✅ PROGRESS TRACKING
  async saveQuizResult(quizData) {
    try {
      const response = await this.request('/analytics/quiz-result', {
        method: 'POST',
        body: quizData
      });
      return response;
    } catch (error) {
      console.error('Failed to save quiz result:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async saveProgress(progressData) {
    try {
      const response = await this.request('/analytics/progress', {
        method: 'POST',
        body: progressData
      });
      return response;
    } catch (error) {
      console.error('Failed to save progress:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // ✅ HEALTH & DEBUG
  async healthCheck() {
    try {
      const response = await this.request('/health');
      return response;
    } catch (error) {
      console.error('Health check failed:', error);
      return { 
        status: 'unhealthy',
        error: error.message 
      };
    }
  }

  async getDebugInfo() {
    try {
      const response = await this.request('/debug');
      return response;
    } catch (error) {
      console.error('Debug info failed:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // ✅ TEST UPLOAD
  async testUpload() {
    try {
      const response = await this.request('/test-upload', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Test upload failed:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}

export const api = new ApiService();
