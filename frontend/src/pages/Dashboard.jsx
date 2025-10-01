import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  FileText,
  ArrowRight,
  Sparkles,
  Users,
  RefreshCw,
  Brain,
  Zap
} from 'lucide-react';
import { useCourse } from '../context/CourseContext';

const Dashboard = ({ onCourseSelect, setSidebarOpen }) => {
  const { courses, loading, error, refreshCourses } = useCourse();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshCourses();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const stats = {
    totalCourses: courses.length,
    totalStudyTime: `${courses.reduce((total, course) => total + (parseInt(course.estimated_duration) || 2), 0)}h`,
    completionRate: courses.length > 0 
      ? Math.round((courses.filter(course => course.progress === 100).length / courses.length) * 100)
      : 0,
    activeLearners: courses.filter(course => course.progress > 0 && course.progress < 100).length
  };

  const handleCourseSelect = (course) => {
    onCourseSelect(course);
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Welcome to BrainForge! 👋
              </h1>
              <p className="text-blue-100 text-base md:text-lg">
                Transform any content into comprehensive learning courses with AI
              </p>
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-30 transition-colors duration-200 flex items-center disabled:opacity-50"
              >
                <RefreshCw size={20} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                to="/upload"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 flex items-center"
              >
                <Plus size={20} className="mr-2" />
                Create New Course
              </Link>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Sparkles size={20} className="text-yellow-600 mr-2" />
              <div>
                <p className="text-yellow-800 font-medium">{error}</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Using demo data. Make sure backend is running on port 5000.
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="text-yellow-700 hover:text-yellow-800 font-medium text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{stats.totalCourses}</p>
            </div>
            <div className="p-2 md:p-3 bg-blue-50 rounded-lg">
              <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Study Time</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{stats.totalStudyTime}</p>
            </div>
            <div className="p-2 md:p-3 bg-green-50 rounded-lg">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{stats.completionRate}%</p>
            </div>
            <div className="p-2 md:p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{stats.activeLearners}</p>
            </div>
            <div className="p-2 md:p-3 bg-orange-50 rounded-lg">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              Your Courses
            </h2>
            <Link 
              to="/upload" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              Create New
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {courses.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-500 mb-6">Upload your first content to get started with AI-powered learning!</p>
              <Link
                to="/upload"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <Plus size={20} className="mr-2" />
                Create Your First Course
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="border border-gray-200 rounded-lg hover-lift cursor-pointer group bg-white"
                  onClick={() => handleCourseSelect(course)}
                >
                  <div className="h-24 md:h-32 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-opacity"></div>
                    <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (course.difficulty === 'beginner' || course.difficulty === 'Beginner') 
                          ? 'bg-green-100 text-green-800'
                          : (course.difficulty === 'intermediate' || course.difficulty === 'Intermediate')
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {course.difficulty || 'Intermediate'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3 md:p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors mobile-text-lg">
                      {course.title || 'Untitled Course'}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {course.description || 'AI-generated learning course'}
                    </p>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                      <span className="flex items-center">
                        <BookOpen size={12} className="mr-1" />
                        {course.modules_count || course.total_modules || 4} modules
                      </span>
                      <span className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        {course.estimated_duration || '2-3 hours'}
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{course.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${course.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {course.lastAccessed || 'Never accessed'}
                      </span>
                      <Link
                        to={`/course/${course._id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {course.progress > 0 ? 'Continue' : 'Start'}
                        <ArrowRight size={14} className="ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
          <div className="flex items-center mb-4">
            <Brain className="h-8 w-8 mr-3" />
            <h3 className="text-xl font-bold">Study Flashcards</h3>
          </div>
          <p className="text-purple-100 mb-4">Master key concepts with interactive flashcards</p>
          <Link 
            to="/flashcards" 
            className="inline-flex items-center px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
          >
            Start Studying
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center mb-4">
            <Zap className="h-8 w-8 mr-3" />
            <h3 className="text-xl font-bold">Take Quizzes</h3>
          </div>
          <p className="text-green-100 mb-4">Test your knowledge with AI-generated quizzes</p>
          <Link 
            to="/quiz" 
            className="inline-flex items-center px-4 py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors"
          >
            Start Quiz
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
