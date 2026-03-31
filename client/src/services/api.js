import axios from 'axios';

// Get API base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Log configuration for debugging (remove in production if needed)
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:');
  console.log('  - Base URL:', API_BASE_URL);
  console.log('  - Environment:', import.meta.env.MODE);
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for auth
});

// Add request interceptor for debugging (development only)
if (import.meta.env.DEV) {
  api.interceptors.request.use(
    (config) => {
      console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => Promise.reject(error)
  );
}

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
    // Enhanced 404 error messaging
    if (error.response?.status === 404) {
      console.error('❌ 404 Error - Backend endpoint not found:');
      console.error('  URL:', error.config?.url);
      console.error('  Base URL:', API_BASE_URL);
      console.error('  Full URL:', error.config?.baseURL + error.config?.url);
      
      // Check if it's a common mistake
      if (!API_BASE_URL.includes('onrender.com') && !API_BASE_URL.includes('localhost')) {
        console.warn('⚠️  Warning: Your VITE_API_URL might be incorrect!');
        console.warn('   Expected: https://your-app.onrender.com/api');
        console.warn(`   Found: ${API_BASE_URL}`);
      }
    }

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
