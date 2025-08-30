import React from 'react';
import { BudgetRequestForm } from '@/components/BudgetRequestForm';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-semibold text-gray-900">
                  🏛️ Ministry of Forestry
                </h1>
              </div>
              <div className="hidden md:block">
                <nav className="flex space-x-8">
                  <a
                    href="#"
                    className="text-blue-600 hover:text-blue-700 px-3 py-2 text-sm font-medium"
                  >
                    Budget Requests
                  </a>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                  >
                    Dashboard
                  </a>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                  >
                    Reports
                  </a>
                </nav>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Budget Consolidation System
              </span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">U</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <BudgetRequestForm />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-sm text-gray-500">
              © 2024 Ministry of Forestry, Republic of Indonesia. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Help & Support
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;