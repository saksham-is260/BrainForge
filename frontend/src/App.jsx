import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import CourseViewer from './pages/CourseViewer';
import FlashcardsPage from './pages/FlashcardsPage';
import QuizPage from './pages/QuizPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import { CourseProvider } from './Context/CourseContext';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSidebarOpen(false);
  };

  return (
    <CourseProvider>
      <Router>
        <div className="flex h-screen bg-gray-50">
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            selectedCourse={selectedCourse}
          />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile header */}
            <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900">BrainForge</h1>
              <div className="w-6"></div>
            </header>

            <main className="flex-1 overflow-auto p-4 lg:p-6">
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <Dashboard 
                      onCourseSelect={handleCourseSelect}
                      setSidebarOpen={setSidebarOpen}
                    />
                  } 
                />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/course/:courseId" element={<CourseViewer />} />
                <Route path="/flashcards/:courseId" element={<FlashcardsPage />} />
                <Route path="/quiz/:courseId" element={<QuizPage />} />
                <Route path="/quiz/:courseId/:moduleNumber" element={<QuizPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </CourseProvider>
  );
}

export default App;