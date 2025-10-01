import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Upload,
  BookOpen,
  TrendingUp,
  Settings,
  X,
  FileText,
  Target,
  BarChart3,
  Brain,
  Zap
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, selectedCourse }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Create Course', href: '/upload', icon: Upload },
    { name: 'Learning Progress', href: '/progress', icon: TrendingUp },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-white">BrainForge</h1>
              <p className="text-xs text-gray-400">AI Learning Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  active
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${active ? 'text-blue-400' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Selected Course Quick Access */}
        {selectedCourse && (
          <div className="mt-8 px-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Current Course
            </h3>
            <div className="bg-gray-800 rounded-lg p-3">
              <h4 className="text-sm font-medium text-white line-clamp-1">
                {selectedCourse.title}
              </h4>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                {selectedCourse.description}
              </p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-3">
                  <Link
                    to={`/course/${selectedCourse._id}`}
                    onClick={onClose}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Continue
                  </Link>
                  <Link
                    to={`/flashcards/${selectedCourse._id}`}
                    onClick={onClose}
                    className="text-xs text-gray-400 hover:text-gray-300"
                    title="Flashcards"
                  >
                    <FileText className="h-4 w-4" />
                  </Link>
                  <Link
                    to={`/quiz/${selectedCourse._id}`}
                    onClick={onClose}
                    className="text-xs text-gray-400 hover:text-gray-300"
                    title="Quiz"
                  >
                    <Zap className="h-4 w-4" />
                  </Link>
                </div>
                <div className="w-16 bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${selectedCourse.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 px-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Quick Stats
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Courses</span>
              <span className="text-white font-medium">12</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Study Time</span>
              <span className="text-white font-medium">45h</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Progress</span>
              <span className="text-white font-medium">68%</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Study Smart, Not Hard
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;