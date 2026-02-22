import React, {{ useState, useEffect }} from 'react';
import {{ Link }} from 'react-router-dom';
import {{ 
  ChevronRight, 
  TrendingUp, 
  Calendar,
  Target,
  Clock,
  BookOpen,
  BarChart3,
  Home,
  CheckCircle2,
  PlayCircle,
  Star,
  Users,
  Zap,
  Award
}} from 'lucide-react';
import { useCourse } from '../context/CourseContext';

const ProgressPage = () => {
  const { courses, loading } = useCourse();
  const [progressStats, setProgressStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Calculate progress statistics from courses
    if (courses && courses.length > 0) {
      const stats = calculateProgressStats(courses);
      setProgressStats(stats);
      setRecentActivity(getRecentActivity(courses));
    }
  }, [courses]);

  const calculateProgressStats = (courses) => {
    const totalCourses = courses.length;
    const completedCourses = courses.filter(course => course.progress === 100).length;
    const inProgressCourses = courses.filter(course => course.progress > 0 && course.progress < 100).length;
    const totalStudyTime = courses.reduce((total, course) => {
      const duration = parseInt(course.estimated_duration) || 2;
      return total + duration;
    }, 0);
    
    const totalModules = courses.reduce((total, course) => total + (course.modules_count || 0), 0);
    const completedModules = courses.reduce((total, course) => {
      const completed = course.modules_count > 0 ? Math.floor(((course.progress || 0) / 100) * (course.modules_count || 0)) : 0;
      return total + completed;
      }}, 0);

    return {
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalStudyTime: `${totalStudyTime}h`,
      completionRate: totalCourses === 0 ? 0 : Math.round((completedCourses / totalCourses) * 100),
      totalModules,
      completedModules,
      moduleCompletionRate: totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100)
    };
  };

  const getRecentActivity = (courses) => {
    return courses
      .sort((a, b) => new Date(b.lastAccessed || b.created_at) - new Date(a.lastAccessed || a.created_at))
      .slice(0, 5)
      .map(course => ({
        id: course._id,
        title: course.title,
        progress: course.progress || 0,
        lastAccessed: course.lastAccessed || 'Recently created',
        modulesCompleted: Math.floor(((course.progress || 0) / 100) * (course.modules_count || 0)),
        totalModules: course.modules_count || 0
      }));
  };

  const getProgressColor = (progress) => {
    if (progress === 100) return 'text-green-600 bg-green-100';
    if (progress >= 50) return 'text-blue-600 bg-blue-100';
    if (progress > 0) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-orange-600 bg-orange-100';
      case 'expert': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-gray-700 flex items-center">
            <Home size={14} className="mr-1" />
            Dashboard
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Learning Progress</span>
        </nav>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Progress</h1>
        <p className="text-gray-600">
          Track your learning journey and achievements across all courses
        </p>
      </div>

      {progressStats && (
        <>
          {/* Progress Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{progressStats.totalCourses}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-600">
                <CheckCircle2 size={14} className="text-green-500 mr-1" />
                <span>{progressStats.completedCourses} completed</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{progressStats.completionRate}%</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressStats.completionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Modules Completed</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {progressStats.completedModules}/{progressStats.totalModules}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                {progressStats.moduleCompletionRate}% module completion
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Study Time</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{progressStats.totalStudyTime}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                {progressStats.inProgressCourses} courses in progress
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                Recent Activity
              </h2>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getProgressColor(activity.progress)}`}>
                          {activity.progress === 100 ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <PlayCircle size={20} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{activity.title}</h3>
                          <p className="text-sm text-gray-500">
                            {activity.modulesCompleted} of {activity.totalModules} modules completed
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{activity.progress}%</div>
                          <div className="text-xs text-gray-500">Progress</div>
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${activity.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
                  <p className="text-gray-600 mb-4">Start learning to see your progress here</p>
                  <Link
                    to="/"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Courses
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Course Progress Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Award className="h-5 w-5 text-green-600 mr-2" />
                Course Progress Details
              </h2>
            </div>
            <div className="p-6">
              {courses.length > 0 ? (
                <div className="space-y-6">
                  {courses.map((course) => (
                    <div key={course._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                        <div className="flex-1 mb-4 lg:mb-0">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                          <p className="text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                          
                          <div className="flex flex-wrap gap-2 text-sm">
                            <span className={`px-2 py-1 rounded-full ${getDifficultyColor(course.difficulty)}`}>
                              {course.difficulty || 'Intermediate'}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center">
                              <BookOpen size={12} className="mr-1" />
                              {course.modules_count || 0} modules
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full flex items-center">
                              <Zap size={12} className="mr-1" />
                              {course.flashcards_count || 0} flashcards
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full flex items-center">
                              <Clock size={12} className="mr-1" />
                              {course.estimated_duration || '2-3 hours'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <div className="text-2xl font-bold text-gray-900 mb-2">{course.progress || 0}%</div>
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                (course.progress || 0) === 100 ? 'bg-green-600' : 
                                (course.progress || 0) >= 50 ? 'bg-blue-600' : 'bg-yellow-600'
                              }`}
                              style={{ width: `${course.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-500">
                          Created: {new Date(course.created_at).toLocaleDateString()}
                        </span>
                        <Link
                          to={`/course/${course._id}`}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          {course.progress > 0 ? 'Continue' : 'Start'} Learning
                          <ChevronRight size={16} className="ml-1" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Yet</h3>
                  <p className="text-gray-600 mb-4">Upload your first PDF to start learning</p>
                  <Link
                    to="/upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Course
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!progressStats && courses.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Learning Data Yet</h2>
          <p className="text-gray-600 mb-6">
            Start creating and completing courses to see your progress analytics here.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/upload"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Upload PDF
            </Link>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;
