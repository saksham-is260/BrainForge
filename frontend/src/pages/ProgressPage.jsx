import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  TrendingUp, 
  Calendar, 
  Award,
  Target,
  Clock,
  BookOpen,
  BarChart3,
  Home
} from 'lucide-react';

const ProgressPage = () => {
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
          Track your learning journey and achievements
        </p>
      </div>

      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Progress Tracking Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          Detailed progress analytics and learning insights will be available in the next update.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ProgressPage;