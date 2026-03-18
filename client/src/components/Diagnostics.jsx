import React, { useState, useEffect } from 'react';

/**
 * Simple diagnostic page to check what's happening
 */
export default function Diagnostics() {
  const [checks, setChecks] = useState([]);

  useEffect(() => {
    const runChecks = async () => {
      const results = [];

      // Check 1: Clerk loaded
      try {
        const hasClerk = typeof window.Clerk !== 'undefined';
        results.push({
          name: 'Clerk Loaded',
          status: hasClerk ? '✅' : '❌',
          details: hasClerk ? 'Clerk is available' : 'Clerk not found on window object'
        });
      } catch (error) {
        results.push({
          name: 'Clerk Check',
          status: '❌',
          details: error.message
        });
      }

      // Check 2: Environment Variables
      try {
        const hasKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
        results.push({
          name: 'Clerk Key Exists',
          status: hasKey ? '✅' : '❌',
          details: hasKey ? 'Key found (first 20 chars): ' + hasKey.substring(0, 20) + '...' : 'VITE_CLERK_PUBLISHABLE_KEY not defined'
        });
      } catch (error) {
        results.push({
          name: 'Environment Check',
          status: '❌',
          details: error.message
        });
      }

      // Check 3: React Router
      try {
        results.push({
          name: 'Current Path',
          status: 'ℹ️',
          details: window.location.pathname
        });
      } catch (error) {
        results.push({
          name: 'Path Check',
          status: '❌',
          details: error.message
        });
      }

      // Check 4: Local Storage
      try {
        const token = localStorage.getItem('clerk_token');
        results.push({
          name: 'Local Storage Token',
          status: token ? '✅' : '⚠️',
          details: token ? 'Token exists: ' + token.substring(0, 20) + '...' : 'No token in localStorage'
        });
      } catch (error) {
        results.push({
          name: 'Storage Check',
          status: '❌',
          details: error.message
        });
      }

      // Check 5: Console Errors
      results.push({
        name: 'Check Browser Console',
        status: 'ℹ️',
        details: 'Press F12 and check Console tab for errors'
      });

      setChecks(results);
    };

    runChecks();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🔍 OptiSplit Diagnostics
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">System Checks</h2>
          
          {checks.length === 0 ? (
            <p className="text-gray-600">Running checks...</p>
          ) : (
            <div className="space-y-3">
              {checks.map((check, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                  <span className="text-xl">{check.status}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{check.name}</p>
                    <p className="text-sm text-gray-600">{check.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">If you see a blank page:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Press <kbd className="px-2 py-1 bg-white rounded text-sm">F12</kbd> to open DevTools</li>
            <li>Check the <strong>Console</strong> tab for errors</li>
            <li>Check the <strong>Network</strong> tab for failed requests</li>
            <li>Verify both frontend and backend servers are running</li>
            <li>Try clearing browser cache with <kbd className="px-2 py-1 bg-white rounded text-sm">Ctrl+Shift+Delete</kbd></li>
          </ol>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-2">Required Setup:</h3>
          <ul className="list-disc list-inside space-y-2 text-green-800">
            <li>Backend running on <code className="px-2 py-1 bg-white rounded text-sm">http://localhost:5000</code></li>
            <li>Frontend running on <code className="px-2 py-1 bg-white rounded text-sm">http://localhost:5173</code></li>
            <li>Valid Clerk publishable key in <code className="px-2 py-1 bg-white rounded text-sm">.env</code></li>
            <li>Internet connection (for Clerk authentication)</li>
          </ul>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-6 w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          🔄 Reload Page
        </button>
      </div>
    </div>
  );
}
