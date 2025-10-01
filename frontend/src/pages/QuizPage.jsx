import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ArrowLeft, 
  ArrowRight, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  Brain,
  Home,
  Star,
  Zap,
  Target,
  BookOpen,
  AlertTriangle,
  FileText,
  Layers
} from 'lucide-react';
import { useCourse } from '../Context/CourseContext';

const QuizPage = () => {
  const { courseId, moduleNumber } = useParams();
  const navigate = useNavigate();
  const { getCourseById, getQuizData } = useCourse();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(600);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [error, setError] = useState('');
  const [moduleInfo, setModuleInfo] = useState(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      setLoading(true);
      setError('');
      try {
        console.log(`🎯 Fetching quiz data for course: ${courseId}, module: ${moduleNumber}`);
        
        const quizResponse = await getQuizData(courseId, moduleNumber);
        
        console.log('📦 Raw Quiz API Response:', quizResponse);
        
        if (quizResponse.success && quizResponse.quiz && quizResponse.quiz.questions) {
          // ✅ FIXED: Process quiz data to ensure correct format
          const processedQuiz = processQuizData(quizResponse.quiz);
          
          console.log('✅ Processed Quiz Data:', {
            totalQuestions: processedQuiz.questions.length,
            moduleTitle: processedQuiz.moduleTitle,
            questionsSample: processedQuiz.questions.slice(0, 2)
          });
          
          setQuiz(processedQuiz);
          setCourse(quizResponse.course);
          setModuleInfo(quizResponse.moduleInfo);
          
          if (processedQuiz.timeLimit) {
            setTimeLeft(processedQuiz.timeLimit);
          }
          
          if (quizResponse.isFallback) {
            setError('Using enhanced sample questions - Real quiz data not available for this module');
          }
        } else {
          console.log('❌ Invalid quiz data, using enhanced fallback');
          const fallbackResponse = getEnhancedFallbackQuiz(courseId, moduleNumber);
          setQuiz(fallbackResponse.quiz);
          setCourse(fallbackResponse.course);
          setError('Real quiz data not available. Using enhanced sample questions.');
        }
        
      } catch (error) {
        console.error('❌ Error fetching quiz data:', error);
        const fallbackResponse = getEnhancedFallbackQuiz(courseId, moduleNumber);
        setQuiz(fallbackResponse.quiz);
        setCourse(fallbackResponse.course);
        setError('Failed to load quiz data. Using enhanced sample questions.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [courseId, moduleNumber, getCourseById, getQuizData]);

  // ✅ FIXED: Process quiz data to ensure consistent format
  const processQuizData = (quizData) => {
    if (!quizData || !quizData.questions) return quizData;
    
    const processedQuestions = quizData.questions.map((question, index) => {
      // Ensure question has all required fields
      return {
        id: question.id || index + 1,
        question: question.question || 'Question not available',
        options: Array.isArray(question.options) ? question.options : [
          'Option A not available',
          'Option B not available', 
          'Option C not available',
          'Option D not available'
        ],
        // ✅ FIXED: Handle both correct_answer and correctAnswer
        correctAnswer: (question.correct_answer || question.correctAnswer || 'A').toUpperCase().trim(),
        explanation: question.explanation || 'Explanation not available',
        difficulty: question.difficulty || 'medium',
        knowledgeArea: question.knowledgeArea || 'General Knowledge',
        commonMistake: question.commonMistake || 'No common mistake information available',
        points: question.points || 5
      };
    });

    return {
      ...quizData,
      questions: processedQuestions,
      totalQuestions: processedQuestions.length
    };
  };

  // ✅ FIXED: Enhanced fallback quiz with proper data
  const getEnhancedFallbackQuiz = (courseId, moduleNum) => {
    const moduleNumInt = parseInt(moduleNum);
    
    const moduleSpecificContent = {
      1: {
        title: "Foundations of Data Communication",
        questions: [
          {
            id: 1,
            question: 'Which of the following refers to the variation in packet arrival time?',
            options: [
              'A) Latency',
              'B) Jitter', 
              'C) Bandwidth',
              'D) Throughput'
            ],
            correctAnswer: 'B',
            explanation: 'Jitter is the variation in the arrival time of data packets. It is a critical factor in real-time applications like audio and video streaming.',
            difficulty: 'medium',
            knowledgeArea: 'Fundamentals of Data Communications and Networking',
            commonMistake: 'Confusing jitter with latency (delay)',
            points: 5
          },
          {
            id: 2,
            question: 'A set of rules that governs data communications is called a ________.',
            options: [
              'A) Standard',
              'B) Format',
              'C) Protocol',
              'D) Specification'
            ],
            correctAnswer: 'C',
            explanation: 'A protocol is a set of rules agreed upon by the communicating parties to ensure that data is exchanged meaningfully and correctly.',
            difficulty: 'medium',
            knowledgeArea: 'Fundamentals of Data Communications and Networking',
            commonMistake: 'Confusing protocol with standard (protocol is the rule, standard is the implementation)',
            points: 5
          },
          {
            id: 3,
            question: 'What is the primary purpose of the OSI model?',
            options: [
              'A) To define hardware specifications',
              'B) To provide a framework for network communication',
              'C) To create internet standards',
              'D) To encrypt network data'
            ],
            correctAnswer: 'B',
            explanation: 'The OSI model provides a conceptual framework that standardizes the functions of a communication system into seven abstraction layers.',
            difficulty: 'medium',
            knowledgeArea: 'Network Models',
            commonMistake: 'Thinking OSI model is used for actual implementation rather than reference',
            points: 5
          },
          {
            id: 4,
            question: 'Which layer is responsible for end-to-end delivery of messages?',
            options: [
              'A) Network Layer',
              'B) Transport Layer',
              'C) Data Link Layer',
              'D) Application Layer'
            ],
            correctAnswer: 'B',
            explanation: 'The Transport Layer ensures complete data transfer with error checking and flow control between end systems.',
            difficulty: 'medium',
            knowledgeArea: 'OSI Model',
            commonMistake: 'Confusing Transport Layer with Network Layer (which handles routing)',
            points: 5
          }
        ]
      },
      2: {
        title: "Network Protocols and Standards",
        questions: [
          {
            id: 1,
            question: 'What does TCP stand for in networking?',
            options: [
              'A) Transmission Control Protocol',
              'B) Transfer Communication Process',
              'C) Technical Control Panel',
              'D) Terminal Communication Protocol'
            ],
            correctAnswer: 'A',
            explanation: 'TCP stands for Transmission Control Protocol, which provides reliable, ordered, and error-checked delivery of data.',
            difficulty: 'easy',
            knowledgeArea: 'Transport Protocols',
            commonMistake: 'Confusing TCP with UDP (connectionless protocol)',
            points: 5
          },
          {
            id: 2,
            question: 'Which protocol is used for sending email?',
            options: [
              'A) HTTP',
              'B) FTP',
              'C) SMTP',
              'D) SNMP'
            ],
            correctAnswer: 'C',
            explanation: 'SMTP (Simple Mail Transfer Protocol) is used for sending email messages between servers.',
            difficulty: 'medium',
            knowledgeArea: 'Application Protocols',
            commonMistake: 'Confusing SMTP with POP3/IMAP (which are for receiving email)',
            points: 5
          }
        ]
      }
    };

    const moduleData = moduleSpecificContent[moduleNumInt] || moduleSpecificContent[1];
    
    const quiz = {
      totalQuestions: moduleData.questions.length,
      moduleTitle: `Module ${moduleNum} Quiz: ${moduleData.title}`,
      timeLimit: 600,
      questions: moduleData.questions
    };

    return {
      quiz: quiz,
      course: {
        _id: courseId,
        title: 'Data Communications & Networking',
        description: 'Comprehensive networking course'
      },
      moduleInfo: {
        number: moduleNumInt,
        title: moduleData.title
      }
    };
  };

  useEffect(() => {
    if (timeLeft > 0 && !quizCompleted && quiz && quiz.questions) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !quizCompleted && quiz && quiz.questions) {
      handleQuizComplete();
    }
  }, [timeLeft, quizCompleted, quiz]);

  const getCurrentQuestionData = () => {
    if (!quiz || !quiz.questions || !quiz.questions[currentQuestion]) {
      return null;
    }
    return quiz.questions[currentQuestion];
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    setShowExplanation(false);
  };

  const handleNextQuestion = () => {
    const currentQuestionData = getCurrentQuestionData();
    if (selectedAnswer && currentQuestionData) {
      const newAnswers = [...answers];
      
      // ✅ FIXED: Proper answer comparison
      const userAnswer = selectedAnswer.toUpperCase().trim();
      const correctAnswer = currentQuestionData.correctAnswer.toUpperCase().trim();
      const isCorrect = userAnswer === correctAnswer;
      
      console.log('🔍 Answer Check:', {
        userAnswer,
        correctAnswer,
        isCorrect,
        question: currentQuestionData.question
      });
      
      newAnswers[currentQuestion] = {
        questionId: currentQuestionData.id,
        selectedAnswer: selectedAnswer,
        isCorrect: isCorrect,
        points: isCorrect ? currentQuestionData.points : 0,
        explanation: currentQuestionData.explanation,
        commonMistake: currentQuestionData.commonMistake,
        difficulty: currentQuestionData.difficulty,
        knowledgeArea: currentQuestionData.knowledgeArea,
        correctAnswer: currentQuestionData.correctAnswer // Store for display
      };
      setAnswers(newAnswers);

      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowExplanation(false);
      } else {
        handleQuizComplete();
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]?.selectedAnswer || null);
      setShowExplanation(false);
    }
  };

  const handleQuizComplete = () => {
    if (!quiz || !quiz.questions) return;
    
    const currentQuestionData = getCurrentQuestionData();
    const newAnswers = [...answers];
    
    if (selectedAnswer && !newAnswers[currentQuestion] && currentQuestionData) {
      const userAnswer = selectedAnswer.toUpperCase().trim();
      const correctAnswer = currentQuestionData.correctAnswer.toUpperCase().trim();
      const isCorrect = userAnswer === correctAnswer;
      
      newAnswers[currentQuestion] = {
        questionId: currentQuestionData.id,
        selectedAnswer: selectedAnswer,
        isCorrect: isCorrect,
        points: isCorrect ? currentQuestionData.points : 0,
        explanation: currentQuestionData.explanation,
        commonMistake: currentQuestionData.commonMistake,
        difficulty: currentQuestionData.difficulty,
        knowledgeArea: currentQuestionData.knowledgeArea,
        correctAnswer: currentQuestionData.correctAnswer
      };
      setAnswers(newAnswers);
    }
    setQuizCompleted(true);
  };

  const calculateScore = () => {
    if (!quiz || !quiz.questions) return { points: 0, maxPoints: 0, percentage: 0, correctAnswers: 0, totalQuestions: 0 };
    
    const totalPoints = answers.reduce((total, answer) => total + (answer?.points || 0), 0);
    const maxPoints = quiz.questions.reduce((total, question) => total + question.points, 0);
    const correctAnswers = answers.filter(answer => answer?.isCorrect).length;
    const totalQuestions = quiz.questions.length;
    
    console.log('📊 Score Calculation:', {
      totalPoints,
      maxPoints,
      correctAnswers,
      totalQuestions,
      answers: answers.map(a => ({ isCorrect: a?.isCorrect, points: a?.points }))
    });
    
    return {
      points: totalPoints,
      maxPoints: maxPoints,
      percentage: maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0,
      correctAnswers: correctAnswers,
      totalQuestions: totalQuestions
    };
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getKnowledgeAreaColor = (area) => {
    const colors = {
      'Fundamentals of Data Communications and Networking': 'bg-blue-100 text-blue-800',
      'Network Models': 'bg-purple-100 text-purple-800',
      'OSI Model': 'bg-green-100 text-green-800',
      'Transport Protocols': 'bg-orange-100 text-orange-800',
      'Application Protocols': 'bg-indigo-100 text-indigo-800',
      'Network Topologies': 'bg-teal-100 text-teal-800',
      'IP Addressing': 'bg-red-100 text-red-800',
      'Network Routing': 'bg-cyan-100 text-cyan-800'
    };
    return colors[area] || 'bg-gray-100 text-gray-800';
  };

  // ✅ FIXED: Get option text properly
  const getOptionText = (question, optionLetter) => {
    if (!question || !question.options) return 'Option not available';
    
    const optionIndex = ['A', 'B', 'C', 'D'].indexOf(optionLetter);
    return question.options[optionIndex] || `Option ${optionLetter} not available`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-base">Loading quiz questions...</p>
          <p className="text-xs text-gray-500 mt-1">
            Course: {courseId} | Module: {moduleNumber}
          </p>
        </div>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Quiz Not Available</h2>
          <p className="text-gray-600 mb-4 text-sm">No quiz questions found for this module.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              Back to Course
            </button>
            <button
              onClick={() => navigate(`/course/${courseId}/module/${moduleNumber}`)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors text-sm"
            >
              View Module Content
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const score = calculateScore();
    
    console.log('🎯 Final Score:', score);
    
    return (
      <div className="min-h-screen bg-gray-50 py-4 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              score.percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
              score.percentage >= 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
              'bg-gradient-to-r from-red-500 to-pink-600'
            }`}>
              <Trophy className="h-8 w-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h1>
            <p className="text-base text-gray-600 mb-2">{quiz.moduleTitle}</p>
            
            {error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-md mx-auto mb-3">
                <div className="flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 text-sm">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Score Card */}
          <div className="bg-white rounded-xl p-6 shadow border border-gray-200 max-w-2xl mx-auto mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">{score.percentage}%</div>
              <div className="text-base text-gray-600 mb-4">
                {score.points} / {score.maxPoints} points
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-green-900">{score.correctAnswers}</div>
                  <div className="text-xs text-green-700 font-medium">Correct</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-blue-900">{score.totalQuestions}</div>
                  <div className="text-xs text-blue-700 font-medium">Total</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-purple-900">{formatTime((quiz.timeLimit || 600) - timeLeft)}</div>
                  <div className="text-xs text-purple-700 font-medium">Time Used</div>
                </div>
              </div>

              {/* Performance Message */}
              <div className={`rounded-lg p-3 mb-4 ${
                score.percentage >= 80 ? 'bg-green-50 border border-green-200' :
                score.percentage >= 60 ? 'bg-yellow-50 border border-yellow-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm font-medium ${
                  score.percentage >= 80 ? 'text-green-800' :
                  score.percentage >= 60 ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  {score.percentage >= 80 ? '🎉 Excellent! You have mastered this material!' :
                   score.percentage >= 60 ? '👍 Good job! You have a solid understanding.' :
                   '📚 Keep practicing! Review the material and try again.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => navigate(`/course/${courseId}`)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
              >
                Back to Course
              </button>
              <button
                onClick={() => {
                  setCurrentQuestion(0);
                  setSelectedAnswer(null);
                  setAnswers([]);
                  setTimeLeft(quiz.timeLimit || 600);
                  setQuizCompleted(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
              >
                Retake Quiz
              </button>
              {moduleNumber && (
                <button
                  onClick={() => navigate(`/course/${courseId}/module/${moduleNumber}`)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                >
                  Review Module
                </button>
              )}
            </div>
          </div>

          {/* Results Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
              <Brain className="h-5 w-5 text-blue-600 mr-2" />
              Detailed Review
            </h3>
            <div className="space-y-4">
              {quiz.questions.map((question, index) => {
                const userAnswer = answers[index];
                const isCorrect = userAnswer?.isCorrect;
                
                return (
                  <div
                    key={question.id || index}
                    className={`p-4 rounded-lg border ${
                      isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2 flex-wrap gap-1">
                          <span className="text-xs font-medium text-gray-500">
                            Q{index + 1}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKnowledgeAreaColor(question.knowledgeArea)}`}>
                            {question.knowledgeArea}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {question.question}
                        </h4>
                      </div>
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-xs">
                        <span className="font-medium text-gray-700">Your answer: </span>
                        <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                          {userAnswer?.selectedAnswer || 'Not answered'} - {getOptionText(question, userAnswer?.selectedAnswer)}
                        </span>
                      </div>
                      
                      {!isCorrect && userAnswer?.selectedAnswer && (
                        <div className="text-xs">
                          <span className="font-medium text-gray-700">Correct answer: </span>
                          <span className="text-green-700 font-medium">
                            {userAnswer.correctAnswer} - {getOptionText(question, userAnswer.correctAnswer)}
                          </span>
                        </div>
                      )}
                      
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <div className="flex items-center mb-1">
                          <Zap className="h-3 w-3 text-blue-600 mr-1" />
                          <span className="font-medium text-gray-700 text-xs">Explanation</span>
                        </div>
                        <p className="text-xs text-gray-600">{question.explanation}</p>
                      </div>
                      
                      {question.commonMistake && question.commonMistake !== 'No common mistake information available' && (
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                          <div className="flex items-center mb-1">
                            <AlertCircle className="h-3 w-3 text-yellow-600 mr-1" />
                            <span className="font-medium text-yellow-800 text-xs">Common Mistake</span>
                          </div>
                          <p className="text-xs text-yellow-700">{question.commonMistake}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionData = getCurrentQuestionData();

  if (!currentQuestionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Question Not Available</h2>
          <p className="text-gray-600 mb-4 text-sm">The current question could not be loaded.</p>
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <nav className="flex items-center space-x-1 text-xs text-gray-500 mb-3">
            <Link to="/" className="hover:text-gray-700 flex items-center">
              <Home size={12} className="mr-1" />
              Dashboard
            </Link>
            <ChevronRight size={12} />
            <Link to={`/course/${courseId}`} className="hover:text-gray-700">Course</Link>
            <ChevronRight size={12} />
            <span className="text-gray-900 font-medium">Quiz</span>
          </nav>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {quiz.moduleTitle}
              </h1>
              <p className="text-gray-600 text-sm">
                Test your knowledge and track your progress
              </p>
              
              {moduleInfo && (
                <div className="flex items-center mt-1 text-xs text-blue-600">
                  <Layers size={14} className="mr-1" />
                  <span>Module {moduleInfo.number}: {moduleInfo.title}</span>
                </div>
              )}
              
              {error && (
                <div className="flex items-center mt-1 text-xs text-yellow-600">
                  <AlertTriangle size={12} className="mr-1" />
                  <span>{error}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center px-3 py-1 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <Clock size={16} className="mr-1" />
                <span className="font-mono font-semibold text-sm">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>Progress</span>
            <span>{currentQuestion + 1} of {quiz.totalQuestions}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / quiz.totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Quiz Content */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {/* Question Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center text-xs text-gray-500 mb-2 flex-wrap gap-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentQuestionData.difficulty)}`}>
                    {currentQuestionData.difficulty}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKnowledgeAreaColor(currentQuestionData.knowledgeArea)}`}>
                    {currentQuestionData.knowledgeArea}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {currentQuestionData.points} pts
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Question {currentQuestion + 1}
                </h2>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-base font-medium text-gray-900 mb-6 leading-relaxed">
                {currentQuestionData.question}
              </h3>
              
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                      selectedAnswer === option
                        ? 'border-blue-500 bg-blue-50 shadow transform scale-[1.02]'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center mr-3 font-semibold text-sm ${
                        selectedAnswer === option
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 text-gray-600'
                      }`}>
                        {option}
                      </div>
                      <span className="text-gray-700 text-sm">
                        {getOptionText(currentQuestionData, option)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {currentQuestionData.commonMistake && currentQuestionData.commonMistake !== 'No common mistake information available' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-yellow-800 mb-1">
                      Common Mistake
                    </div>
                    <div className="text-xs text-yellow-700">
                      {currentQuestionData.commonMistake}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedAnswer && !showExplanation && (
              <button
                onClick={() => setShowExplanation(true)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow hover:shadow-md mb-4 text-sm"
              >
                <Brain className="inline h-4 w-4 mr-1" />
                Show Explanation
              </button>
            )}

            {showExplanation && currentQuestionData.explanation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <Target className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-blue-800 mb-1">
                      Explanation
                    </div>
                    <div className="text-blue-700 text-sm leading-relaxed">
                      {currentQuestionData.explanation}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                currentQuestion === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-white border border-gray-300 hover:shadow-sm'
              }`}
            >
              <ArrowLeft size={16} className="mr-1" />
              Previous
            </button>
            
            {currentQuestion < quiz.questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                disabled={!selectedAnswer}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  !selectedAnswer
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow hover:shadow-md'
                }`}
              >
                Next Question
                <ArrowRight size={16} className="ml-1" />
              </button>
            ) : (
              <button
                onClick={handleQuizComplete}
                disabled={!selectedAnswer}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  !selectedAnswer
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow hover:shadow-md'
                }`}
              >
                Complete Quiz
                <CheckCircle2 size={16} className="ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;