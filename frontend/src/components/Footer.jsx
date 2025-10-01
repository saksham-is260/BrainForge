// components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Github, Twitter, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div className="ml-2">
                <h2 className="text-lg font-bold text-gray-900">BrainForge</h2>
                <p className="text-sm text-gray-600">AI-Powered Learning Platform</p>
              </div>
            </Link>
            <p className="mt-4 text-gray-500 text-sm max-w-md">
              Transform any content into comprehensive learning courses with AI. 
              Study smarter, not harder with personalized educational experiences.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
              Platform
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/upload" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Upload Content
                </Link>
              </li>
              <li>
                <Link to="/progress" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Learning Progress
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
              Support
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="#" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © 2024 BrainForge. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-gray-500 transition-colors">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500 transition-colors">
              <Github size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500 transition-colors">
              <Mail size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;