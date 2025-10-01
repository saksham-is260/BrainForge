import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw,
  Shuffle,
  BookOpen,
  CheckCircle2,
  XCircle,
  Home,
  Star,
  Zap,
  Brain,
  Target
} from 'lucide-react';
import { useCourse } from '../Context/CourseContext';

const FlashcardsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getCourseById } = useCourse();
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [studyMode, setStudyMode] = useState('all'); // 'all', 'unstudied', 'difficult'

  useEffect(() => {
    const fetchFlashcards = async () => {
      setLoading(true);
      try {
        const courseData = await getCourseById(courseId);
        if (courseData) {
          setCourse(courseData);
          
          // Use actual flashcards from course or create mock ones
          const courseFlashcards = courseData.flashcards || getMockFlashcards();
          setFlashcards(courseFlashcards);
          
          // Load studied cards from localStorage
          const savedStudied = JSON.parse(localStorage.getItem(`studied_${courseId}`)) || [];
          setStudiedCards(new Set(savedStudied));
        }
      } catch (error) {
        console.error('Error fetching flashcards:', error);
        setFlashcards(getMockFlashcards());
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcards();
  }, [courseId, getCourseById]);

  // Mock flashcards for development
  const getMockFlashcards = () => [
    {
      id: 1,
      front: 'What is the OSI Model?',
      back: 'The OSI (Open Systems Interconnection) model is a conceptual framework that standardizes the functions of a telecommunication or computing system into seven abstraction layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application.',
      mnemonic: 'Please Do Not Throw Sausage Pizza Away (Physical, Data Link, Network, Transport, Session, Presentation, Application)',
      category: 'Networking Fundamentals',
      importance: 'high',
      visual_cue: '7-layer cake representing each layer',
      related_concepts: ['TCP/IP Model', 'Network Protocols', 'Data Encapsulation'],
      difficulty: 'medium'
    },
    {
      id: 2,
      front: 'What is TCP/IP?',
      back: 'TCP/IP (Transmission Control Protocol/Internet Protocol) is the fundamental communication protocol suite that enables internetworking and forms the basis of the modern internet. It consists of four layers: Application, Transport, Internet, and Network Access.',
      mnemonic: 'Transmission Control Protocol / Internet Protocol',
      category: 'Protocols',
      importance: 'high',
      visual_cue: 'Internet backbone connecting the world',
      related_concepts: ['OSI Model', 'UDP', 'IP Addressing', 'HTTP'],
      difficulty: 'medium'
    },
    {
      id: 3,
      front: 'Difference between TCP and UDP',
      back: 'TCP is connection-oriented, reliable, and provides error checking and flow control. UDP is connectionless, faster, but unreliable with no guarantee of delivery. TCP is used for web browsing, email; UDP for streaming, gaming.',
      mnemonic: 'TCP = Thorough Careful Protocol, UDP = Unreliable Datagram Protocol',
      category: 'Transport Layer',
      importance: 'high',
      visual_cue: 'TCP as a registered mail, UDP as a postcard',
      related_concepts: ['Port Numbers', 'Three-way Handshake', 'Datagrams'],
      difficulty: 'hard'
    },
    {
      id: 4,
      front: 'What is a Router?',
      back: 'A router is a networking device that forwards data packets between computer networks. It operates at the Network Layer (Layer 3) and uses IP addresses to determine the best path for data transmission.',
      mnemonic: 'Router = Road Director for data packets',
      category: 'Network Devices',
      importance: 'medium',
      visual_cue: 'Traffic intersection directing cars',
      related_concepts: ['Switch', 'Gateway', 'Routing Table', 'IP Address'],
      difficulty: 'easy'
    },
    {
      id: 5,
      front: 'What is DNS?',
      back: 'DNS (Domain Name System) is the phonebook of the internet. It translates human-readable domain names (like google.com) into IP addresses that computers use to identify each other on the network.',
      mnemonic: 'DNS = Directory for Network Sites',
      category: 'Application Layer',
      importance: 'high',
      visual_cue: 'Phonebook translating names to numbers',
      related_concepts: ['Domain Names', 'IP Addresses', 'Name Resolution'],
      difficulty: 'easy'
    }
  ];

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev + 1) % filteredFlashcards.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev - 1 + filteredFlashcards.length) % filteredFlashcards.length);
  };

  const shuffleCards = () => {
    const shuffled = [...filteredFlashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentCard(0);
    setIsFlipped(false);
  };

  const markAsStudied = () => {
    const currentCardId = filteredFlashcards[currentCard]?.id;
    if (currentCardId) {
      const newStudied = new Set([...studiedCards, currentCardId]);
      setStudiedCards(newStudied);
      localStorage.setItem(`studied_${courseId}`, JSON.stringify([...newStudied]));
    }
  };

  const markAsDifficult = () => {
    // Implement difficult cards tracking
    const currentCardId = filteredFlashcards[currentCard]?.id;
    if (currentCardId) {
      const difficultCards = JSON.parse(localStorage.getItem(`difficult_${courseId}`)) || [];
      if (!difficultCards.includes(currentCardId)) {
        localStorage.setItem(`difficult_${courseId}`, JSON.stringify([...difficultCards, currentCardId]));
      }
    }
  };

  const resetProgress = () => {
    setStudiedCards(new Set());
    localStorage.removeItem(`studied_${courseId}`);
    localStorage.removeItem(`difficult_${courseId}`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Filter flashcards based on study mode
  const filteredFlashcards = flashcards.filter(card => {
    switch (studyMode) {
      case 'unstudied':
        return !studiedCards.has(card.id);
      case 'difficult':
        const difficultCards = JSON.parse(localStorage.getItem(`difficult_${courseId}`)) || [];
        return difficultCards.includes(card.id);
      default:
        return true;
    }
  });

  const currentFlashcard = filteredFlashcards[currentCard];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-gray-700 flex items-center">
            <Home size={14} className="mr-1" />
            Dashboard
          </Link>
          <ChevronRight size={14} />
          <Link to={`/course/${courseId}`} className="hover:text-gray-700">Course</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Flashcards</span>
        </nav>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Study Flashcards
            </h1>
            <p className="text-gray-600">
              Master key concepts with interactive flashcards from {course?.title || 'this course'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <div className="text-sm text-gray-600">
              {studiedCards.size} of {flashcards.length} studied
            </div>
            <button
              onClick={resetProgress}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              <RotateCcw size={16} className="mr-1" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Study Mode Selector */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { mode: 'all', label: 'All Cards', icon: BookOpen },
            { mode: 'unstudied', label: 'Unstudied', icon: Target },
            { mode: 'difficult', label: 'Difficult', icon: Brain }
          ].map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => {
                setStudyMode(mode);
                setCurrentCard(0);
                setIsFlipped(false);
              }}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                studyMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon size={16} className="mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Study Progress ({studyMode} cards)</span>
          <span>{Math.round((studiedCards.size / flashcards.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(studiedCards.size / flashcards.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Flashcard Container */}
      <div className="flex flex-col items-center">
        {/* Card Counter */}
        <div className="text-sm text-gray-500 mb-4">
          Card {currentCard + 1} of {filteredFlashcards.length} 
          {filteredFlashcards.length !== flashcards.length && ` (${studyMode} mode)`}
        </div>

        {/* Flashcard */}
        {currentFlashcard && (
          <div className="w-full max-w-2xl h-96 md:h-80 perspective-1000 mb-8">
            <div 
              className={`relative w-full h-full transition-transform duration-600 transform-style-preserve-3d cursor-pointer ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Front of Card */}
              <div className="absolute inset-0 w-full h-full bg-white rounded-2xl shadow-xl border-2 border-blue-200 backface-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentFlashcard.difficulty)}`}>
                      {currentFlashcard.difficulty}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImportanceColor(currentFlashcard.importance)}`}>
                      {currentFlashcard.importance} importance
                    </span>
                  </div>
                  <div className="text-sm text-blue-600 font-medium">
                    {currentFlashcard.category}
                  </div>
                </div>
                
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <Brain className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {currentFlashcard.front}
                    </h2>
                    <div className="text-sm text-gray-500">
                      Click to reveal answer
                    </div>
                  </div>
                </div>
              </div>

              {/* Back of Card */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl border-2 border-indigo-200 backface-hidden rotate-y-180 flex flex-col">
                <div className="p-6 border-b border-indigo-200 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-2xl">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">Answer</div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 rounded-full text-xs bg-white bg-opacity-20">
                        {currentFlashcard.category}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    {/* Main Answer */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h3 className="font-semibold text-gray-900 text-lg mb-3">
                        {currentFlashcard.front}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {currentFlashcard.back}
                      </p>
                    </div>

                    {/* Mnemonic */}
                    {currentFlashcard.mnemonic && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Star className="h-4 w-4 text-yellow-600 mr-2" />
                          <span className="text-sm font-medium text-yellow-800">Memory Aid</span>
                        </div>
                        <p className="text-sm text-yellow-700">{currentFlashcard.mnemonic}</p>
                      </div>
                    )}

                    {/* Visual Cue */}
                    {currentFlashcard.visual_cue && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Zap className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-green-800">Visual Cue</span>
                        </div>
                        <p className="text-sm text-green-700">{currentFlashcard.visual_cue}</p>
                      </div>
                    )}

                    {/* Related Concepts */}
                    {currentFlashcard.related_concepts && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Brain className="h-4 w-4 text-purple-600 mr-2" />
                          <span className="text-sm font-medium text-purple-800">Related Concepts</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {currentFlashcard.related_concepts.map((concept, index) => (
                            <span key={index} className="px-2 py-1 bg-white rounded text-xs text-purple-700 border border-purple-200">
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <button
            onClick={prevCard}
            className="p-3 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
            disabled={filteredFlashcards.length <= 1}
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={shuffleCards}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors shadow-sm"
            >
              <Shuffle size={16} className="mr-2" />
              Shuffle
            </button>
          </div>
          
          <button
            onClick={nextCard}
            className="p-3 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
            disabled={filteredFlashcards.length <= 1}
          >
            <ArrowRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Study Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <button
            onClick={markAsStudied}
            disabled={studiedCards.has(currentFlashcard?.id)}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors shadow-sm ${
              studiedCards.has(currentFlashcard?.id)
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <CheckCircle2 size={16} className="mr-2" />
            {studiedCards.has(currentFlashcard?.id) ? '✓ Studied' : 'Mark as Studied'}
          </button>
          
          <button
            onClick={markAsDifficult}
            className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors shadow-sm"
          >
            <Target size={16} className="mr-2" />
            Mark as Difficult
          </button>
        </div>
      </div>

      {/* All Flashcards Grid */}
      <div className="mt-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Flashcards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashcards.map((card, index) => (
            <div
              key={card.id}
              className={`bg-white rounded-lg p-4 border-2 cursor-pointer transition-all hover:shadow-md ${
                currentCard === index && filteredFlashcards.includes(card)
                  ? 'border-blue-500 bg-blue-50'
                  : studiedCards.has(card.id)
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200'
              } ${
                !filteredFlashcards.includes(card) ? 'opacity-50' : ''
              }`}
              onClick={() => {
                const filteredIndex = filteredFlashcards.findIndex(fc => fc.id === card.id);
                if (filteredIndex !== -1) {
                  setCurrentCard(filteredIndex);
                  setIsFlipped(false);
                }
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(card.difficulty)}`}>
                  {card.difficulty}
                </span>
                {studiedCards.has(card.id) && (
                  <CheckCircle2 size={16} className="text-green-500" />
                )}
              </div>
              
              <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                {card.front}
              </h4>
              
              <div className="text-xs text-gray-500 mb-2">
                {card.category}
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{card.importance} importance</span>
                {!filteredFlashcards.includes(card) && (
                  <span className="text-orange-500">Filtered out</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlashcardsPage;