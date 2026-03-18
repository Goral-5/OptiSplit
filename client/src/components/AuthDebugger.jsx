import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

/**
 * Authentication Debug Component
 * Only use in development to diagnose auth issues
 */
export function AuthDebugger() {
  const { isLoaded, userId, sessionId, getToken } = useAuth();
  const { user, isSignedIn } = useUser();
  const [token, setToken] = useState(null);
  const [localStorageToken, setLocalStorageToken] = useState(null);

  useEffect(() => {
    // Get current token
    if (isLoaded && userId) {
      getToken().then((t) => setToken(t));
    }
    
    // Check localStorage
    setLocalStorageToken(localStorage.getItem('clerk_token'));
  }, [isLoaded, userId, getToken]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-white border-2 border-red-500 rounded-lg shadow-2xl p-4 max-w-sm text-xs font-mono">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-red-600">🐛 Auth Debugger</h3>
        <span className={`px-2 py-1 rounded ${isLoaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {isLoaded ? 'LOADED' : 'LOADING'}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">User ID:</span>
          <span className={userId ? 'text-green-600' : 'text-red-600'}>
            {userId || 'NOT AUTHENTICATED'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Session:</span>
          <span className={sessionId ? 'text-green-600' : 'text-red-600'}>
            {sessionId ? sessionId.substring(0, 20) + '...' : 'NONE'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Clerk Token:</span>
          <span className={token ? 'text-green-600' : 'text-red-600'}>
            {token ? token.substring(0, 20) + '...' : 'NONE'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Local Storage:</span>
          <span className={localStorageToken ? 'text-green-600' : 'text-red-600'}>
            {localStorageToken ? localStorageToken.substring(0, 20) + '...' : 'NONE'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">User Email:</span>
          <span className="text-blue-600 truncate max-w-[150px]">
            {user?.primaryEmailAddress?.emailAddress || 'N/A'}
          </span>
        </div>

        <div className="pt-2 border-t">
          <button
            onClick={() => {
              localStorage.removeItem('clerk_token');
              window.location.reload();
            }}
            className="w-full bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 transition-colors"
          >
            Clear Token & Reload
          </button>
        </div>

        <div className="pt-2">
          <button
            onClick={() => {
              console.log({
                isLoaded,
                userId,
                sessionId,
                token,
                localStorageToken,
                user: user ? {
                  id: user.id,
                  email: user.primaryEmailAddress?.emailAddress,
                  name: user.fullName,
                } : null,
              });
              alert('Check console for full auth state');
            }}
            className="w-full bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 transition-colors"
          >
            Log Full State
          </button>
        </div>
      </div>
    </div>
  );
}
