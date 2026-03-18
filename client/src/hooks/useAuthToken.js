import { useAuth } from '@clerk/clerk-react';
import { useEffect, useCallback } from 'react';

/**
 * Custom hook to manage Clerk authentication tokens
 * Handles token refresh and synchronization with localStorage
 */
export function useAuthToken() {
  const { isLoaded, userId, getToken } = useAuth();

  // Get token function - returns fresh token on demand
  const getAuthToken = useCallback(async () => {
    if (!isLoaded || !userId) return null;

    try {
      // Try to get token with template first
      let token;
      try {
        token = await getToken({ template: 'convex' });
      } catch (templateError) {
        // Fallback to default token
        token = await getToken();
      }

      if (token) {
        localStorage.setItem('clerk_token', token);
        // Also expose globally for API interceptor
        window.getClerkToken = () => Promise.resolve(token);
        return token;
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }, [isLoaded, userId, getToken]);

  // Auto-refresh token periodically
  useEffect(() => {
    if (!isLoaded || !userId) return;

    // Refresh token immediately
    getAuthToken();

    // Set up interval to refresh before expiration (every 10 minutes)
    const interval = setInterval(() => {
      getAuthToken();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [isLoaded, userId, getAuthToken]);

  return {
    isLoaded,
    isAuthenticated: !!userId,
    getAuthToken,
  };
}

/**
 * Hook to handle redirect after login
 */
export function useRedirectAfterLogin() {
  const navigate = useNavigate();

  const redirectAfterLogin = useCallback(() => {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath);
    } else {
      navigate('/app/dashboard');
    }
  }, [navigate]);

  return redirectAfterLogin;
}
