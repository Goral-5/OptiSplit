import React from 'react';
import { Link } from 'react-router-dom';
import { UserButton, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { Show, SignedIn, SignedOut, UserAvatar, RequireAuth } from '../components/ClerkComponents';

/**
 * Example: Header with Clerk Components
 * Shows different content based on authentication state
 */
export function HeaderExample() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-green-600">
            OptiSplit
          </Link>

          {/* Navigation - Different for signed in/out users */}
          <nav className="flex items-center gap-4">
            {/* Show to signed-out users only */}
            <Show when="signed-out">
              <div className="flex items-center gap-2">
                <SignInButton />
                <SignUpButton />
              </div>
            </Show>

            {/* Show to signed-in users only */}
            <Show when="signed-in">
              <div className="flex items-center gap-4">
                <Link to="/app/dashboard" className="text-sm font-medium text-gray-700 hover:text-green-600">
                  Dashboard
                </Link>
                <Link to="/app/groups" className="text-sm font-medium text-gray-700 hover:text-green-600">
                  Groups
                </Link>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 rounded-lg"
                    }
                  }}
                />
              </div>
            </Show>
          </nav>
        </div>
      </div>
    </header>
  );
}

/**
 * Example: Landing Page with Conditional Content
 */
export function LandingPageExample() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Split Expenses Smartly
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Manage shared expenses with friends and family
        </p>

        {/* Different CTAs based on auth state */}
        <SignedOut>
          <div className="flex items-center justify-center gap-4">
            <SignUpButton 
              appearance={{
                elements: {
                  buttonPrimary: "px-8 py-3 text-lg"
                }
              }}
            />
            <SignInButton mode="modal" />
          </div>
        </SignedOut>

        <SignedIn>
          <Link 
            to="/app/dashboard"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </SignedIn>
      </div>

      {/* Features Section - Visible to everyone */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="💰"
            title="Split Expenses"
            description="Divide bills equally or custom amounts"
          />
          <FeatureCard
            icon="📊"
            title="Track Balances"
            description="See who owes what at a glance"
          />
          <FeatureCard
            icon="✨"
            title="Optimize Debts"
            description="Minimize transactions with smart algorithms"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Example: Protected Dashboard Route
 */
export function DashboardRouteExample() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
          
          {/* Dashboard content here */}
          <DashboardContent />
        </main>
      </div>
    </RequireAuth>
  );
}

/**
 * Example: User Profile Section
 */
export function UserProfileExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <UserAvatar className="w-16 h-16" showName={false} />
          <UserInfo />
        </div>
        
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Email</h3>
            <p className="text-gray-900">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700">Member Since</h3>
            <p className="text-gray-900">
              {user?.createdAt?.toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example: Group Member List with User Info
 */
export function GroupMembersExample({ members }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Group Members</h3>
      
      <div className="space-y-2">
        {members.map((member) => (
          <div 
            key={member.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <img
                src={member.imageUrl}
                alt={member.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
            </div>
            
            <Badge variant={member.role === 'admin' ? 'primary' : 'secondary'}>
              {member.role}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example: Expense Card with Payer Info
 */
export function ExpenseCardExample({ expense }) {
  const { userId } = useAuth();
  const isPayer = expense.paidByUserId._id === userId;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar 
              user={expense.paidByUserId} 
              className="w-10 h-10"
            />
            <div>
              <p className="font-medium text-gray-900">
                {expense.description}
              </p>
              <p className="text-sm text-gray-600">
                Paid by {expense.paidByUserId.name} • {expense.date.toLocaleDateString()}
              </p>
              {isPayer && (
                <Badge variant="success">You paid</Badge>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              ${expense.amount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              Your share: ${expense.yourShare?.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Helper Components
 */
function Card({ children }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {children}
    </div>
  );
}

function CardHeader({ children }) {
  return <div className="mb-4">{children}</div>;
}

function CardTitle({ children }) {
  return <h3 className="text-lg font-semibold text-gray-900">{children}</h3>;
}

function CardContent({ children }) {
  return <div>{children}</div>;
}

function Badge({ children, variant = 'secondary' }) {
  const variants = {
    primary: 'bg-green-100 text-green-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Your dashboard content */}
      <p className="text-gray-600">Dashboard content goes here...</p>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-xl font-bold text-green-600">OptiSplit</h1>
      </div>
    </header>
  );
}
