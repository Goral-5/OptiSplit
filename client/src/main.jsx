import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/app/dashboard"
      signUpFallbackRedirectUrl="/app/dashboard"
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        variables: {
          colorPrimary: '#16a34a',
          colorBackground: '#ffffff',
          colorInputBackground: '#f9fafb',
          colorInputText: '#111827',
          borderRadius: '0.5rem',
          spacingUnit: '0.75rem',
        },
        elements: {
          buttonPrimary: 'bg-green-600 hover:bg-green-700 transition-colors shadow-md',
          buttonSecondary: 'bg-gray-100 hover:bg-gray-200 transition-colors',
          card: 'shadow-xl rounded-lg',
          headerTitle: 'text-2xl font-bold text-gray-900',
          headerSubtitle: 'text-gray-600',
          socialButtonsBlockButtonText: 'font-medium',
          footerActionLink: 'text-green-600 hover:text-green-700 font-medium',
          formFieldLabel: 'text-gray-700 font-medium',
          formFieldInput: 'border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500',
        }
      }}
    >
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ClerkProvider>
  </React.StrictMode>,
)
