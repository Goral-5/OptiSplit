import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh flag to prevent multiple simultaneous requests
let isRefreshing = false;
let failedQueue = [];

// Process queue when token is refreshed
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Add token interceptor - gets fresh token dynamically from Clerk
api.interceptors.request.use(
  async (config) => {
    // Skip token for public endpoints
    const publicEndpoints = ['/health', '/auth'];
    if (publicEndpoints.some(endpoint => config.url.includes(endpoint))) {
      return config;
    }

    // Always get fresh token from Clerk to prevent expiration issues
    let token = null;
    
    try {
      // Try to get from window.Clerk first (most reliable)
      if (typeof window !== 'undefined' && window.Clerk?.session) {
        const session = await window.Clerk.session;
        if (session) {
          token = await session.getToken();
        }
      }
      
      // Fallback to useAuth hook token if available
      if (!token && window.getClerkToken) {
        token = await window.getClerkToken();
      }
      
      // Last resort: use localStorage (may be expired)
      if (!token) {
        token = localStorage.getItem('clerk_token');
      }
      
      // Store fresh token
      if (token) {
        localStorage.setItem('clerk_token', token);
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get Clerk token:', error);
      // Try with stored token even if fresh fetch failed
      const storedToken = localStorage.getItem('clerk_token');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors with better error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Mark as retried
      originalRequest._retry = true;
      
      // Clear invalid token
      localStorage.removeItem('clerk_token');
      
      // Try to get fresh token once before redirecting
      try {
        if (typeof window !== 'undefined' && window.Clerk?.session) {
          const session = await window.Clerk.session;
          if (session) {
            const freshToken = await session.getToken();
            localStorage.setItem('clerk_token', freshToken);
            
            // Retry original request with fresh token
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      // Check if user is on sign-in/sign-up page
      const isOnAuthPage = window.location.pathname.includes('/sign-in') || 
                          window.location.pathname.includes('/sign-up');
      
      // Only redirect if not already on auth page
      if (!isOnAuthPage) {
        // Store current location to redirect back after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = '/sign-in';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
