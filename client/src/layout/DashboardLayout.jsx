import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Header } from './Header';
import socketService from '../services/socket';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export default function DashboardLayout() {
  const { isLoaded, userId, getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [socketInitialized, setSocketInitialized] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    // Redirect to sign-in if not authenticated (but only if not already on auth pages)
    if (!userId) {
      const isOnAuthPage = location.pathname === '/sign-in' || location.pathname === '/sign-up';
      if (!isOnAuthPage) {
        sessionStorage.setItem('redirectAfterLogin', location.pathname);
        navigate('/sign-in', { replace: true });
      }
      return;
    }

    // Initialize Socket.io connection only once
    if (!socketInitialized) {
      const initSocket = async () => {
        try {
          const token = await getToken({ template: 'convex' });
          if (token) {
            localStorage.setItem('clerk_token', token);
            socketService.connect(token);
            setSocketInitialized(true);
          } else {
            // Fallback without template
            const fallbackToken = await getToken();
            if (fallbackToken) {
              localStorage.setItem('clerk_token', fallbackToken);
              socketService.connect(fallbackToken);
              setSocketInitialized(true);
            }
          }
        } catch (error) {
          console.error('Failed to initialize socket:', error);
          // Try one more time without template
          getToken().then(token => {
            if (token) {
              localStorage.setItem('clerk_token', token);
              socketService.connect(token);
              setSocketInitialized(true);
            }
          }).catch(err => console.error('Failed to get token:', err));
        }
      };

      initSocket();
    }

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [isLoaded, userId, getToken, navigate, location, socketInitialized]);

  if (!isLoaded || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 relative">
      {/* Subtle Grid Background Layer */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-[1200px]">
        <Outlet />
      </main>
    </div>
  );
}
