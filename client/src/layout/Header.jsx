import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  PieChart, 
  Wallet,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Groups', href: '/app/groups', icon: Users },
  { name: 'Expenses', href: '/app/expenses/new', icon: Receipt },
  { name: 'Personal', href: '/app/personal', icon: Wallet },
  { name: 'Analytics', href: '/app/analytics', icon: PieChart },
];

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white/70 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 transition duration-200">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/app/dashboard" className="flex items-center space-x-2">
            <img src="/fav.jpeg" alt="OptiSplit" className="h-8 w-8 rounded-lg object-cover shadow-sm" />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">OptiSplit</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-sm",
                  isActive(item.href)
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-200"
                )}
              >
                <item.icon className={cn("h-4 w-4 mr-2 transition-transform", isActive(item.href) ? "scale-110" : "")} />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Clerk User Button */}
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 rounded-lg",
                }
              }}
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white/50 backdrop-blur-lg rounded-b-xl">
            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive(item.href)
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-200"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className={cn("h-5 w-5 mr-3 transition-transform", isActive(item.href) ? "scale-110" : "")} />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
