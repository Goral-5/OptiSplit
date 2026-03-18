import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, useAuth, SignIn, SignUp, UserButton } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from 'react-query';
import ErrorBoundary from './components/ErrorBoundary';
import Diagnostics from './components/Diagnostics';

// Import pages 
import Landing from './Landing';
import Dashboard from './Dashboard';
import Groups from './pages/Groups'; // New dedicated Groups page
import GroupDetail from './GroupDetail';
import NewExpense from './NewExpense';
import PersonDetail from './PersonDetail';
import Settlement from './Settlement';
import PersonalExpenses from './PersonalExpenses';
import Analytics from './Analytics';
import CreateGroup from './pages/CreateGroup';

// Layout components
import DashboardLayout from './layout/DashboardLayout';
import { AuthDebugger } from './components/AuthDebugger';

// Protected Route Component with fixed redirect logic
function ProtectedRoute({ children }) {
  const { isLoaded, userId } = useAuth();
  const location = useLocation();

  // Show loading while auth state is being determined
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated using Navigate component
  if (!userId) {
    const isOnAuthPage = location.pathname === '/sign-in' || location.pathname === '/sign-up';
    if (!isOnAuthPage) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      return <Navigate to="/sign-in" replace />;
    }
    // Allow access to auth pages when not logged in
    return children;
  }

  // User is authenticated, render protected content
  return children;
}

// Enhanced Sign In Component with proper configuration
function CustomSignIn() {
  const { isLoaded, userId } = useAuth();
  const navigate = useNavigate();
  
  console.log('🔐 SignIn component rendering, current path:', window.location.pathname);
  console.log('📍 Auth state - isLoaded:', isLoaded, 'userId:', userId);
  
  // Redirect to dashboard if already signed in
  React.useEffect(() => {
    if (isLoaded && userId) {
      console.log('✅ User already signed in, redirecting to dashboard');
      navigate('/app/dashboard', { replace: true });
    }
  }, [isLoaded, userId]);
  
  // Show loading while checking auth state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't render sign-in if already authenticated
  if (userId) {
    return null;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/fav.jpeg" alt="OptiSplit" className="h-16 w-16 rounded-xl object-cover shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to OptiSplit</h1>
          <p className="text-gray-600">Sign in to manage your shared expenses</p>
        </div>
        
        {/* Clerk SignIn Component */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <SignIn 
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/app/dashboard"
            afterSignUpUrl="/app/dashboard"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "max-w-md w-full shadow-none",
                headerTitle: "text-2xl font-bold text-gray-900",
                headerSubtitle: "text-gray-600",
                socialButtonsBlockButtonText: "font-medium",
                footerActionLink: "text-green-600 hover:text-green-700 font-medium",
                formFieldLabel: "text-gray-700 font-medium",
                formFieldInput: "border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500",
                buttonPrimary: "bg-green-600 hover:bg-green-700 transition-colors shadow-md",
                dividerLine: "bg-gray-200",
                socialButtonsBlockButton: "border-gray-300 hover:bg-gray-50",
              }
            }}
          />
        </div>
        
        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Manage expenses • Split bills • Track debts</p>
        </div>
      </div>
    </div>
  );
}

// Enhanced Sign Up Component with proper configuration
function CustomSignUp() {
  const { isLoaded, userId } = useAuth();
  const navigate = useNavigate();
  
  console.log('🔐 SignUp component rendering, current path:', window.location.pathname);
  console.log('📍 Auth state - isLoaded:', isLoaded, 'userId:', userId);
  
  // Redirect to dashboard if already signed in
  React.useEffect(() => {
    if (isLoaded && userId) {
      console.log('✅ User already signed up/in, redirecting to dashboard');
      navigate('/app/dashboard', { replace: true });
    }
  }, [isLoaded, userId]);
  
  // Show loading while checking auth state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't render sign-up if already authenticated
  if (userId) {
    return null;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/fav.jpeg" alt="OptiSplit" className="h-16 w-16 rounded-xl object-cover shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Start managing shared expenses with OptiSplit</p>
        </div>
        
        {/* Clerk SignUp Component */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <SignUp 
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/app/dashboard"
            afterSignInUrl="/app/dashboard"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "max-w-md w-full shadow-none",
                headerTitle: "text-2xl font-bold text-gray-900",
                headerSubtitle: "text-gray-600",
                socialButtonsBlockButtonText: "font-medium",
                footerActionLink: "text-green-600 hover:text-green-700 font-medium",
                formFieldLabel: "text-gray-700 font-medium",
                formFieldInput: "border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500",
                buttonPrimary: "bg-green-600 hover:bg-green-700 transition-colors shadow-md",
                dividerLine: "bg-gray-200",
                socialButtonsBlockButton: "border-gray-300 hover:bg-gray-50",
              }
            }}
          />
        </div>
        
        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Join OptiSplit • Split smart • Save money</p>
        </div>
      </div>
    </div>
  );
}

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* Auth Debugger - Uncomment to debug authentication issues */}
        {/* {process.env.NODE_ENV === 'development' && <AuthDebugger />} */}
        
        <Routes>
          {/* Diagnostic route - temporarily accessible */}
          <Route path="/diagnostics" element={<Diagnostics />} />
          
          {/* Public routes - accessible without login */}
          <Route path="/" element={<Landing />} />
          
          {/* Clerk authentication routes - must be before protected routes */}
          <Route path="/sign-in/*" element={<CustomSignIn />} />
          <Route path="/sign-up/*" element={<CustomSignUp />} />
          
          {/* Protected routes - require login */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="groups" element={<Groups />} />
            <Route path="groups/create" element={<CreateGroup />} />
            <Route path="groups/:id" element={<GroupDetail />} />
            <Route path="expenses/new" element={<NewExpense />} />
            <Route path="person/:id" element={<PersonDetail />} />
            <Route path="settlements/:type/:id" element={<Settlement />} />
            <Route path="personal" element={<PersonalExpenses />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
