// components/Header.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Brain, 
  Menu, 
  X, 
  Upload, 
  BookOpen, 
  Settings, 
  BarChart3,
  User
} from 'lucide-react';

const Header = ({ sidebarOpen, setSidebarOpen, currentCourse }) => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: Brain },
    { name: 'Upload', href: '/upload', icon: Upload },
    { name: 'Progress', href: '/progress', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <Link to="/" className="flex items-center ml-2 lg:ml-0">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">BrainForge</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Learn Smarter</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} className="mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="flex items-center">
            {currentCourse && (
              <div className="hidden md:flex items-center mr-4 px-3 py-1 bg-blue-50 rounded-full">
                <BookOpen size={16} className="text-blue-600 mr-2" />
                <span className="text-sm text-blue-800 font-medium truncate max-w-xs">
                  {currentCourse.title}
                </span>
              </div>
            )}
            
            <button className="flex items-center p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200">
              <User size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {sidebarOpen && (
        <div className="lg:hidden absolute top-16 inset-x-0 bg-white shadow-lg border-b border-gray-200 z-20">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;