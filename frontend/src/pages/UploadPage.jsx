import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Settings,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

const UploadPage = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [courseSettings, setCourseSettings] = useState({
    difficulty: 'intermediate',
    learning_pace: 'medium',
    depth_level: 'comprehensive',
    modules: 4,
    flashcards: 10,
    questions_per_module: 3, // ✅ ADDED: Questions per module setting
    include_practical: true,
    include_case_studies: true,
    include_exam_prep: true
  });
  const [generatedCourse, setGeneratedCourse] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const supportedFormats = [
    { type: 'PDF', icon: FileText, extensions: ['.pdf'] },
    { type: 'PPT', icon: FileText, extensions: ['.ppt', '.pptx'] },
    { type: 'Images', icon: FileText, extensions: ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'] },
    { type: 'Text', icon: FileText, extensions: ['.txt', '.doc', '.docx'] }
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    const isSupported = supportedFormats.some(format => 
      format.extensions.includes(fileExtension)
    );

    if (!isSupported) {
      setError('Unsupported file format. Please upload PDF, PPT, images, or text files.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size too large. Please upload files smaller than 50MB.');
      return;
    }

    setSelectedFile(file);
    setUploadComplete(false);
    setGeneratedCourse(null);
    setError('');
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Add course settings to form data
      Object.keys(courseSettings).forEach(key => {
        formData.append(key, courseSettings[key].toString());
      });

      console.log('🚀 Starting upload with settings:', courseSettings);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const result = await api.uploadFile(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setUploadComplete(true);
        setGeneratedCourse({
          id: result.course_id,
          title: result.filename.replace(/\.[^/.]+$/, ""),
          description: 'AI-generated course based on your content',
          modules: courseSettings.modules,
          duration: '2-3 hours',
          difficulty: courseSettings.difficulty
        });
        
        // Navigate to the course page
        setTimeout(() => {
          navigate(`/course/${result.course_id}`);
        }, 1500);
      } else {
        throw new Error(result.error || 'Course generation failed');
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const updateCourseSetting = (key, value) => {
    setCourseSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-gray-700">Dashboard</Link>
          <ChevronRight size={16} />
          <span className="text-gray-900 font-medium">Create Course</span>
        </nav>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Course</h1>
            <p className="text-gray-600 text-lg">
              Upload your content and AI will transform it into a comprehensive learning course
            </p>
          </div>
          <div className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white">
            <Sparkles size={20} className="mr-2" />
            <span className="font-semibold">AI Powered</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <p className="text-red-800 font-medium">{error}</p>
              <p className="text-red-700 text-sm mt-1">
                Please check your file and try again. Make sure the file contains readable text.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Upload Area */}
        <div className="xl:col-span-3">
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-50 scale-105'
                : selectedFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-white hover:border-gray-400 shadow-sm'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!selectedFile ? (
              <>
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Drag and drop your file here
                </h3>
                <p className="text-gray-500 text-lg mb-6 max-w-md mx-auto">
                  Supported formats: PDF, PowerPoint, Images, Text documents
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Choose File
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  className="hidden"
                  accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png,.bmp,.tiff,.webp,.txt,.doc,.docx"
                />
                <p className="text-sm text-gray-400 mt-4">
                  Maximum file size: 50MB
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  File Ready!
                </h3>
                <p className="text-gray-600 text-lg mb-2">{selectedFile.name}</p>
                <p className="text-sm text-gray-500 mb-6">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to generate course
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Choose Different File
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Generate Course
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="text-center mb-6">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Creating Your Course...
                </h3>
                <p className="text-gray-600">
                  AI is analyzing your content and generating a comprehensive learning course
                </p>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>Processing</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="font-semibold text-blue-900">OCR</div>
                  <div className="text-blue-700">Extracting Text</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="font-semibold text-purple-900">AI</div>
                  <div className="text-purple-700">Generating Content</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="font-semibold text-green-900">Database</div>
                  <div className="text-green-700">Saving Course</div>
                </div>
              </div>
            </div>
          )}

          {uploadComplete && generatedCourse && (
            <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200">
              <div className="text-center">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Course Created Successfully!
                </h3>
                <p className="text-gray-600 text-lg mb-6">
                  Your AI-generated course is ready to explore
                </p>
                <div className="bg-white rounded-xl p-6 max-w-md mx-auto mb-6 shadow-sm">
                  <h4 className="font-semibold text-gray-900 text-lg mb-2">{generatedCourse.title}</h4>
                  <p className="text-gray-600 mb-4">{generatedCourse.description}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{generatedCourse.modules} modules</span>
                    <span>{generatedCourse.duration}</span>
                    <span className="capitalize">{generatedCourse.difficulty}</span>
                  </div>
                </div>
                <p className="text-green-600 font-medium">
                  Redirecting to your course...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Course Settings Sidebar */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 sticky top-6 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
              <div className="flex items-center">
                <Settings className="h-6 w-6 text-blue-400 mr-3" />
                <h3 className="text-xl font-bold">Course Settings</h3>
              </div>
              <p className="text-gray-300 text-sm mt-2">
                Customize your learning experience
              </p>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Difficulty */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  🎯 Difficulty Level
                </label>
                <select
                  value={courseSettings.difficulty}
                  onChange={(e) => updateCourseSetting('difficulty', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                >
                  <option value="beginner">🚀 Beginner</option>
                  <option value="intermediate">⚡ Intermediate</option>
                  <option value="advanced">🔥 Advanced</option>
                  <option value="expert">🎓 Expert</option>
                </select>
              </div>

              {/* Learning Pace */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  🐢 Learning Pace
                </label>
                <select
                  value={courseSettings.learning_pace}
                  onChange={(e) => updateCourseSetting('learning_pace', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                >
                  <option value="slow">🐢 Slow & Detailed</option>
                  <option value="medium">🚶 Balanced Pace</option>
                  <option value="fast">⚡ Fast & Focused</option>
                </select>
              </div>

              {/* Depth Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  📚 Depth Level
                </label>
                <select
                  value={courseSettings.depth_level}
                  onChange={(e) => updateCourseSetting('depth_level', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                >
                  <option value="basic">📖 Basic Overview</option>
                  <option value="intermediate">🛠️ Practical Focus</option>
                  <option value="comprehensive">🎓 Comprehensive</option>
                  <option value="expert">🔬 Expert Level</option>
                </select>
              </div>

              {/* Modules, Flashcards & Questions */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    📖 Modules
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={courseSettings.modules}
                    onChange={(e) => updateCourseSetting('modules', parseInt(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    🎴 Flashcards
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={courseSettings.flashcards}
                    onChange={(e) => updateCourseSetting('flashcards', parseInt(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    ❓ Questions/Module
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={courseSettings.questions_per_module}
                    onChange={(e) => updateCourseSetting('questions_per_module', parseInt(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  />
                </div>
              </div>

              {/* Enhanced Features */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-900">
                  ✨ Course Features
                </label>
                <div className="space-y-3">
                  {[
                    { key: 'include_practical', label: '🛠️ Practical Exercises', description: 'Hands-on coding exercises' },
                    { key: 'include_case_studies', label: '💼 Case Studies', description: 'Real industry examples' },
                    { key: 'include_exam_prep', label: '📝 Exam Preparation', description: 'Previous year questions' }
                  ].map((feature) => (
                    <label key={feature.key} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={courseSettings[feature.key]}
                        onChange={(e) => updateCourseSetting(feature.key, e.target.checked)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{feature.label}</div>
                        <div className="text-xs text-gray-500">{feature.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                  !selectedFile || isUploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Generating Course...
                  </div>
                ) : (
                  '🚀 Generate Course'
                )}
              </button>
            </div>
          </div>

          {/* Supported Formats Info */}
          <div className="mt-6 bg-blue-50 rounded-2xl p-5 border border-blue-200">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Supported Formats
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 📄 PDF documents (up to 50MB)</li>
                  <li>• 🎓 PowerPoint (.ppt, .pptx)</li>
                  <li>• 🖼️ Images (JPG, PNG, BMP, TIFF, WEBP)</li>
                  <li>• 📝 Text documents (.txt, .doc, .docx)</li>
                </ul>
                <p className="text-xs text-blue-600 mt-3 font-medium">
                  💡 Tip: Clear, text-based files work best!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;