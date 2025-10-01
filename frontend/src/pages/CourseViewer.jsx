import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  BookOpen, 
  Clock, 
  Target,
  CheckCircle2,
  PlayCircle,
  FileText,
  Star,
  Users,
  Download,
  Share2,
  ArrowLeft,
  ArrowRight,
  Brain,
  Award,
  Zap,
  Home,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Menu,
  X
} from 'lucide-react';
import { useCourse } from '../context/CourseContext';

const CourseViewer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getCourseById } = useCourse();
  const [course, setCourse] = useState(null);
  const [activeModule, setActiveModule] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      try {
        console.log(`🎯 Loading course: ${courseId}`);
        const courseData = await getCourseById(courseId);
        
        if (courseData) {
          setCourse(courseData);
          console.log('✅ Course data loaded in CourseViewer:', {
            title: courseData.actualCourse?.title || courseData.title,
            modules: courseData.actualCourse?.modules?.length || courseData.modules?.length,
            hasCourseStructure: !!courseData.course_structure,
            hasActualCourse: !!courseData.actualCourse
          });

          // Initialize progress from localStorage or default
          const savedProgress = JSON.parse(localStorage.getItem(`progress_${courseId}`)) || {};
          setProgress(savedProgress);
        }
      } catch (error) {
        console.error('❌ Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, getCourseById]);

  // Close sidebar when clicking on a module on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [activeModule]);

  // ✅ FIXED: Get actual course data with proper structure handling
  const getActualCourseData = () => {
    if (!course) return null;
    
    // Priority 1: Use actualCourse from Context (already processed)
    if (course.actualCourse) {
      return course.actualCourse;
    }
    
    // Priority 2: Use course_structure.course from backend
    if (course.course_structure && course.course_structure.course) {
      return course.course_structure.course;
    }
    
    // Priority 3: Use direct course data
    return course;
  };

  // ✅ FIXED: Get modules with proper fallback
  const getModules = () => {
    const actualCourse = getActualCourseData();
    return actualCourse?.modules || [];
  };

  // ✅ FIXED: Get flashcards with proper fallback
  const getFlashcards = () => {
    const actualCourse = getActualCourseData();
    return actualCourse?.flashcards || [];
  };

  const markModuleComplete = (moduleNumber) => {
    const newProgress = { ...progress, [moduleNumber]: 100 };
    setProgress(newProgress);
    localStorage.setItem(`progress_${courseId}`, JSON.stringify(newProgress));
  };

  const handleTakeQuiz = (moduleNumber) => {
    navigate(`/quiz/${courseId}/${moduleNumber}`);
  };

  const handleStudyFlashcards = () => {
    navigate(`/flashcards/${courseId}`);
  };

  const getModuleProgress = (moduleNumber) => {
    return progress[moduleNumber] || 0;
  };

  const getOverallProgress = () => {
    const modules = getModules();
    if (!modules || modules.length === 0) return 0;
    const totalModules = modules.length;
    const completedModules = Object.values(progress).filter(p => p === 100).length;
    return Math.round((completedModules / totalModules) * 100);
  };

  // ✅ FIXED: Get current module with proper data structure
  const getCurrentModule = () => {
    const modules = getModules();
    if (!modules || !modules[activeModule]) {
      return null;
    }
    
    const module = modules[activeModule];
    
    // Ensure module has required structure with proper fallbacks
    return {
      module_number: module.module_number || activeModule + 1,
      title: module.title || `Part ${activeModule + 1}`,
      duration_estimate: module.duration_estimate || '30-45 minutes',
      learning_objectives: module.learning_objectives || ['Understand key concepts', 'Apply knowledge practically'],
      description: module.description || 'Comprehensive learning module',
      content: module.content || {
        introduction: module.introduction || 'Introduction to module topics',
        sections: module.sections || [],
        summary: module.summary || 'Module summary'
      },
      practical_exercises: module.practical_exercises || [],
      quiz: module.quiz || { total_questions: 0, questions: [] },
      important_topics: module.important_topics || [],
      exam_questions: module.exam_questions || [],
      case_studies: module.case_studies || []
    };
  };

  // ✅ NEW: Format introduction text to points
  const formatIntroductionToPoints = (introduction) => {
    if (!introduction) return [];
    
    // If already in point format, return as is
    if (Array.isArray(introduction)) {
      return introduction;
    }
    
    // Convert paragraph to points
    const points = introduction
      .split('.')
      .filter(point => point.trim().length > 0)
      .map(point => point.trim() + '.');
    
    return points.length > 0 ? points : [introduction];
  };

  // ✅ NEW: Format content to points and bold important terms
  const formatContentWithPointsAndBold = (content) => {
    if (!content) return [];
    
    // If content is already an array, process each item
    if (Array.isArray(content)) {
      return content.map(item => formatTextWithBold(item));
    }
    
    // Convert paragraph to points
    const points = content
      .split(/(?:\n|\.\s+)/)
      .filter(point => point.trim().length > 10) // Only keep meaningful points
      .map(point => formatTextWithBold(point.trim()));
    
    return points.length > 0 ? points : [formatTextWithBold(content)];
  };

  // ✅ NEW: Add bold formatting to important terms
  const formatTextWithBold = (text) => {
    if (!text) return '';
    
    // Common important terms to bold (you can expand this list)
    const importantTerms = [
      'protocol', 'bandwidth', 'latency', 'OSI model', 'TCP/IP', 'router', 'switch',
      'firewall', 'encryption', 'authentication', 'LAN', 'WAN', 'packet', 'frame',
      'topology', 'ethernet', 'wireless', 'bluetooth', 'firewall', 'VPN', 'DNS',
      'DHCP', 'HTTP', 'HTTPS', 'FTP', 'SMTP', 'UDP', 'ICMP', 'ARP', 'NAT'
    ];
    
    let formattedText = text;
    
    importantTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      formattedText = formattedText.replace(regex, `**${term}**`);
    });
    
    // Convert **bold** to <strong>bold</strong>
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    return formattedText;
  };

  // Toggle mobile sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course content...</p>
          <p className="text-sm text-gray-500 mt-2">Course ID: {courseId}</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4">The requested course could not be loaded.</p>
          <p className="text-sm text-gray-500 mb-4">Course ID: {courseId}</p>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const actualCourse = getActualCourseData();
  const modules = getModules();
  const flashcards = getFlashcards();
  const currentModule = getCurrentModule();
  const overallProgress = getOverallProgress();
  const isMockData = course.isMock;

  const courseDescription = actualCourse?.description || course.description || 'Comprehensive AI-generated learning course';
  const shouldTruncateDescription = courseDescription.length > 120;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden flex items-center justify-between mb-4">
        <button
          onClick={toggleSidebar}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg font-medium"
        >
          {isSidebarOpen ? <X size={18} className="mr-2" /> : <Menu size={18} className="mr-2" />}
          {isSidebarOpen ? 'Close' : 'Parts'}
        </button>

        {/* Debug Info Toggle */}
        <button
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
        >
          {showDebugInfo ? <EyeOff size={14} className="mr-1" /> : <Eye size={14} className="mr-1" />}
          {showDebugInfo ? 'Hide Debug' : 'Debug'}
        </button>
      </div>

      {/* Debug Information */}
      {showDebugInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Debug Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><strong>Course ID:</strong> {courseId}</div>
            <div><strong>Data Source:</strong> {isMockData ? 'Mock Data' : 'Real Database'}</div>
            <div><strong>Parts:</strong> {modules.length}</div>
            <div><strong>Progress:</strong> {overallProgress}%</div>
            <div><strong>Has Flashcards:</strong> {flashcards.length}</div>
            <div><strong>Current Part:</strong> {activeModule + 1}</div>
          </div>
        </div>
      )}

      {/* Demo Mode Warning */}
      {isMockData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <span className="text-yellow-800 font-medium">Demo Mode - Using Sample Data</span>
              <p className="text-yellow-700 text-sm mt-1">
                This is sample data. Upload a PDF file to generate a real AI-powered course with your content.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Course Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white p-6 md:p-8 mb-6 md:mb-8">
        <nav className="flex items-center space-x-2 text-sm text-blue-200 mb-4">
          <Link to="/" className="hover:text-white flex items-center">
            <Home size={14} className="mr-1" />
            Dashboard
          </Link>
          <ChevronRight size={14} />
          <span>Course</span>
        </nav>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-3">
              {actualCourse?.title || course.title || 'Untitled Course'}
              {isMockData && <span className="text-blue-200 text-lg ml-2">(Sample)</span>}
            </h1>
            
            {/* Enhanced Description with Read More */}
            <div className="text-blue-100 text-base md:text-lg mb-4 max-w-3xl">
              <p className={`leading-relaxed ${!isDescriptionExpanded && shouldTruncateDescription ? 'line-clamp-2' : ''}`}>
                {courseDescription}
              </p>
              {shouldTruncateDescription && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="flex items-center mt-2 text-blue-200 hover:text-white font-medium text-sm transition-colors"
                >
                  {isDescriptionExpanded ? (
                    <>
                      <ChevronUp size={16} className="mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} className="mr-1" />
                      Read More
                    </>
                  )}
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3 md:gap-4 text-sm">
              <div className="flex items-center">
                <BookOpen size={16} className="mr-2" />
                {modules.length} parts
              </div>
              <div className="flex items-center">
                <Clock size={16} className="mr-2" />
                {actualCourse?.estimated_duration || course.estimated_duration || '2-3 hours'}
              </div>
              <div className="flex items-center">
                <Target size={16} className="mr-2" />
                {actualCourse?.difficulty || course.difficulty || 'Intermediate'}
              </div>
              <div className="flex items-center">
                <Users size={16} className="mr-2" />
                {actualCourse?.target_audience || course.target_audience || 'All learners'}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-4 lg:mt-0">
            <button className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              <Share2 size={16} className="mr-2" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors">
              <Download size={16} className="mr-2" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mt-6 bg-white bg-opacity-20 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-100 font-medium">Overall Progress</span>
            <span className="text-white font-bold">{overallProgress}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Parts List */}
        <div className={`lg:col-span-1 ${isSidebarOpen ? 'fixed inset-y-0 left-0 w-80 bg-white z-50 lg:static lg:w-auto lg:z-auto transform transition-transform duration-300 ease-in-out' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6 h-[calc(100vh-2rem)] lg:h-auto lg:max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Course Parts</h3>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-1 hover:bg-gray-100 rounded"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {Object.values(progress).filter(p => p === 100).length} of {modules.length} completed
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {modules.map((module, index) => (
                <div
                  key={module.module_number || index}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-all ${
                    activeModule === index
                      ? 'bg-blue-50 border border-blue-200 shadow-sm'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => setActiveModule(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        getModuleProgress(module.module_number || index + 1) === 100
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getModuleProgress(module.module_number || index + 1) === 100 ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <PlayCircle size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                          Part {module.module_number || index + 1}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {module.title || `Part ${index + 1}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {module.duration_estimate || '30 min'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  {getModuleProgress(module.module_number || index + 1) > 0 && 
                   getModuleProgress(module.module_number || index + 1) < 100 && (
                    <div className="mt-2 ml-11">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full progress-bar"
                          style={{ width: `${getModuleProgress(module.module_number || index + 1)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {modules.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <BookOpen size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No parts available</p>
                  <p className="text-xs text-gray-400 mt-1">Upload a PDF to generate content</p>
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="p-4 border-t border-gray-200 space-y-3">
              <button
                onClick={handleStudyFlashcards}
                disabled={flashcards.length === 0}
                className={`flex items-center justify-center w-full py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
                  flashcards.length > 0
                    ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Brain size={16} className="mr-2" />
                Study Flashcards ({flashcards.length})
              </button>
              <button
                onClick={() => handleTakeQuiz(currentModule?.module_number || activeModule + 1)}
                disabled={!currentModule}
                className={`flex items-center justify-center w-full py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
                  currentModule
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Zap size={16} className="mr-2" />
                Take Part Quiz
              </button>
            </div>
          </div>

          {/* Course Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-4 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Course Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Parts Completed</span>
                <span className="font-semibold text-gray-900">
                  {Object.values(progress).filter(p => p === 100).length}/{modules.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Study Time</span>
                <span className="font-semibold text-gray-900">
                  {modules.reduce((total, module) => {
                    const duration = parseInt(module.duration_estimate) || 30;
                    return total + duration;
                  }, 0)} min
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Flashcards</span>
                <span className="font-semibold text-gray-900">
                  {flashcards.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {currentModule ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-slide-in">
              {/* Part Header */}
              <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium mr-2">
                        Part {currentModule.module_number || activeModule + 1}
                      </span>
                      <span>{currentModule.duration_estimate || '30-45 minutes'}</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                      {currentModule.title}
                    </h2>
                    <p className="text-gray-600">
                      {currentModule.description || 'Comprehensive learning part with practical exercises'}
                    </p>
                  </div>
                  
                  {getModuleProgress(currentModule.module_number || activeModule + 1) === 100 ? (
                    <div className="flex items-center px-3 py-1 bg-green-100 rounded-full self-start">
                      <CheckCircle2 size={16} className="text-green-600 mr-1" />
                      <span className="text-green-800 text-sm font-medium">Completed</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => markModuleComplete(currentModule.module_number || activeModule + 1)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors self-start"
                    >
                      <CheckCircle2 size={16} className="mr-2" />
                      Mark Complete
                    </button>
                  )}
                </div>

                {/* Learning Objectives */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Target size={16} className="mr-2 text-blue-600" />
                    Learning Objectives
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentModule.learning_objectives.map((objective, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <Star size={12} className="mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Part Content */}
              <div className="p-4 md:p-6">
                <div className="prose max-w-none">
                  {/* Introduction - NOW IN POINTS FORMAT */}
                  {currentModule.content?.introduction && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <BookOpen size={18} className="mr-2 text-blue-600" />
                        Introduction
                      </h3>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <ul className="space-y-2">
                          {formatIntroductionToPoints(currentModule.content.introduction).map((point, index) => (
                            <li key={index} className="flex items-start text-gray-700 leading-relaxed">
                              <span className="text-blue-600 font-bold mr-2 mt-1">•</span>
                              <span 
                                dangerouslySetInnerHTML={{ 
                                  __html: formatTextWithBold(point) 
                                }} 
                                className="flex-1"
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Sections */}
                  {currentModule.content?.sections?.map((section, index) => (
                    <div key={index} className="mb-8">
                      <h4 className="font-semibold text-gray-900 mb-3 text-lg border-b pb-2">
                        {section.heading || `Section ${index + 1}`}
                      </h4>
                      
                      {/* Section Content - NOW IN POINTS FORMAT */}
                      {section.content && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                          <ul className="space-y-2">
                            {formatContentWithPointsAndBold(section.content).map((point, pointIndex) => (
                              <li key={pointIndex} className="flex items-start text-gray-700 leading-relaxed">
                                <span className="text-gray-600 mr-2 mt-1">-</span>
                                <span 
                                  dangerouslySetInnerHTML={{ 
                                    __html: point 
                                  }} 
                                  className="flex-1"
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Hierarchical Notes */}
                      {section.notes_hierarchy && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <h5 className="font-semibold text-blue-900 mb-3 text-md">
                            📚 {section.notes_hierarchy.main_topic || 'Key Concepts'}
                          </h5>
                          
                          {section.notes_hierarchy.subtopics?.map((subtopic, subIndex) => (
                            <div key={subIndex} className="mb-4 last:mb-0">
                              <h6 className="font-medium text-blue-800 mb-2 text-sm">
                                • {subtopic.subtopic || `Subtopic ${subIndex + 1}`}
                              </h6>
                              
                              {subtopic.points?.length > 0 && (
                                <ul className="text-sm text-blue-700 space-y-1 mb-2 ml-4">
                                  {subtopic.points.map((point, pointIndex) => (
                                    <li key={pointIndex} 
                                      dangerouslySetInnerHTML={{ 
                                        __html: formatTextWithBold(`- ${point}`) 
                                      }} 
                                    />
                                  ))}
                                </ul>
                              )}
                              
                              {subtopic.sub_points?.length > 0 && (
                                <ul className="text-sm text-blue-600 space-y-1 mb-2 ml-8">
                                  {subtopic.sub_points.map((subPoint, subPointIndex) => (
                                    <li key={subPointIndex} 
                                      dangerouslySetInnerHTML={{ 
                                        __html: formatTextWithBold(`∘ ${subPoint}`) 
                                      }} 
                                    />
                                  ))}
                                </ul>
                              )}
                              
                              {subtopic.important_concepts?.length > 0 && (
                                <div className="bg-white rounded p-3 mt-2">
                                  <span className="text-xs font-semibold text-blue-900 block mb-2">
                                    💡 Important Concepts:
                                  </span>
                                  <ul className="text-sm text-blue-800 space-y-1">
                                    {subtopic.important_concepts.map((concept, conceptIndex) => (
                                      <li key={conceptIndex} 
                                        dangerouslySetInnerHTML={{ 
                                          __html: formatTextWithBold(concept) 
                                        }} 
                                      />
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {/* Key Takeaways */}
                          {section.notes_hierarchy.key_takeaways && (
                            <div className="mt-4 pt-3 border-t border-blue-200">
                              <span className="text-xs font-semibold text-blue-900 block mb-2">
                                🎯 Key Takeaways:
                              </span>
                              <ul className="text-sm text-blue-700 space-y-1">
                                {section.notes_hierarchy.key_takeaways.map((takeaway, takeawayIndex) => (
                                  <li key={takeawayIndex} 
                                    dangerouslySetInnerHTML={{ 
                                      __html: formatTextWithBold(`• ${takeaway}`) 
                                    }} 
                                  />
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Key Points */}
                      {section.key_points?.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                          <h5 className="font-semibold text-yellow-900 mb-2 text-sm">
                            ⭐ Key Points
                          </h5>
                          <ul className="text-sm text-yellow-800 space-y-1">
                            {section.key_points.map((point, pointIndex) => (
                              <li key={pointIndex} 
                                dangerouslySetInnerHTML={{ 
                                  __html: formatTextWithBold(`• ${point}`) 
                                }} 
                              />
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Show message if no sections */}
                  {(!currentModule.content?.sections || currentModule.content.sections.length === 0) && (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <BookOpen size={32} className="mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600">No detailed content available for this part.</p>
                      <p className="text-sm text-gray-500 mt-1">Try uploading a PDF to generate comprehensive content.</p>
                    </div>
                  )}

                  {/* Summary */}
                  {currentModule.content?.summary && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                        <Award size={18} className="mr-2" />
                        Summary
                      </h4>
                      <div className="text-green-800 text-sm">
                        <ul className="space-y-1">
                          {formatContentWithPointsAndBold(currentModule.content.summary).map((point, index) => (
                            <li key={index} 
                              dangerouslySetInnerHTML={{ 
                                __html: formatTextWithBold(`• ${point}`) 
                              }} 
                            />
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Practical Exercises */}
                {currentModule.practical_exercises?.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Zap size={18} className="mr-2 text-orange-600" />
                      Practical Exercises
                    </h3>
                    <div className="grid gap-4">
                      {currentModule.practical_exercises.map((exercise, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-medium text-gray-900 mb-2">{exercise.title}</h4>
                          <p className="text-gray-600 text-sm mb-3">{exercise.description}</p>
                          
                          {exercise.steps?.length > 0 && (
                            <div className="bg-gray-50 rounded p-3 mb-3">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Steps:</h5>
                              <ol className="text-sm text-gray-600 space-y-1">
                                {exercise.steps.map((step, stepIndex) => (
                                  <li key={stepIndex}>
                                    {stepIndex + 1}. <span dangerouslySetInnerHTML={{ __html: formatTextWithBold(step) }} />
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                          
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Expected Outcome: </span>
                            <span className="text-gray-600" dangerouslySetInnerHTML={{ __html: formatTextWithBold(exercise.expected_outcome) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="px-4 md:px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between gap-3">
                <button
                  onClick={() => setActiveModule(Math.max(0, activeModule - 1))}
                  disabled={activeModule === 0}
                  className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium ${
                    activeModule === 0
                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                      : 'text-gray-700 hover:bg-white border border-gray-300'
                  }`}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Previous Part
                </button>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleTakeQuiz(currentModule.module_number || activeModule + 1)}
                    disabled={!currentModule.quiz || currentModule.quiz.questions.length === 0}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium ${
                      currentModule.quiz && currentModule.quiz.questions.length > 0
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Zap size={16} className="mr-2" />
                    Take Quiz ({currentModule.quiz?.questions?.length || 0})
                  </button>
                  
                  <button
                    onClick={() => setActiveModule(Math.min(modules.length - 1, activeModule + 1))}
                    disabled={activeModule === modules.length - 1}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium ${
                      activeModule === modules.length - 1
                        ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Next Part
                    <ArrowRight size={16} className="ml-2" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Part Content</h3>
              <p className="text-gray-600 mb-4">The selected part doesn't have any content available.</p>
              <Link 
                to="/upload" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload PDF to Generate Content
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseViewer;
