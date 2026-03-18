import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { LoadingSpinner } from '../ui/LoadingSpinner';

/**
 * Show Component - Conditional Rendering Based on Auth State
 * 
 * Usage:
 * <Show when="signed-out">
 *   <SignInButton />
 * </Show>
 * 
 * <Show when="signed-in">
 *   <UserButton />
 * </Show>
 */
export function Show({ when, children }) {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return null; // Or show loading state
  }

  if (when === 'signed-out') {
    return !userId ? children : null;
  }

  if (when === 'signed-in') {
    return userId ? children : null;
  }

  return null;
}

/**
 * SignedIn Component - Render only when user is signed in
 * 
 * Usage:
 * <SignedIn>
 *   <DashboardContent />
 * </SignedIn>
 */
export function SignedIn({ children, fallback }) {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return fallback || <LoadingSpinner />;
  }

  if (!userId) {
    return fallback || null;
  }

  return children;
}

/**
 * SignedOut Component - Render only when user is signed out
 * 
 * Usage:
 * <SignedOut>
 *   <MarketingContent />
 * </SignedOut>
 */
export function SignedOut({ children }) {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return null;
  }

  return !userId ? children : null;
}

/**
 * RequireAuth Component - Protect routes with authentication
 * 
 * Usage:
 * <RequireAuth>
 *   <ProtectedDashboard />
 * </RequireAuth>
 */
export function RequireAuth({ children }) {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!userId) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}

/**
 * UserAvatar Component - Display user's avatar with fallback
 * 
 * Usage:
 * <UserAvatar className="w-10 h-10" />
 */
export function UserAvatar({ className = "w-8 h-8", showName = false }) {
  const { isLoaded, userId, user } = useAuth();

  if (!isLoaded || !userId) {
    return null;
  }

  const userName = showName ? user?.firstName || user?.email : '';

  return (
    <div className="flex items-center gap-2">
      <img
        src={user?.imageUrl}
        alt={user?.firstName || 'User'}
        className={`${className} rounded-full object-cover`}
      />
      {showName && (
        <span className="text-sm font-medium text-gray-700">
          {userName}
        </span>
      )}
    </div>
  );
}

/**
 * UserInfo Component - Display user information
 * 
 * Usage:
 * <UserInfo />
 */
export function UserInfo() {
  const { isLoaded, userId, user } = useAuth();

  if (!isLoaded || !userId) {
    return null;
  }

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-900">
        {user?.firstName} {user?.lastName}
      </p>
      <p className="text-xs text-gray-500">
        {user?.primaryEmailAddress?.emailAddress}
      </p>
    </div>
  );
}
