import React from 'react';
import { cn } from '../utils/cn';

const variants = {
  default: 'bg-gray-900 text-white',
  secondary: 'bg-gray-100 text-gray-700',
  outline: 'border border-gray-200 bg-transparent text-gray-600',
  destructive: 'bg-red-600 text-white',
  success: 'bg-emerald-100 text-emerald-700',
};

export function Badge({ 
  className = '', 
  variant = 'default', 
  children, 
  ...props 
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function RoleBadge({ role }) {
  if (role === 'admin') {
    return (
      <span className="bg-gray-900 text-white text-xs rounded-full px-2 py-1 font-medium">
        Admin
      </span>
    );
  }
  
  return (
    <span className="bg-gray-100 text-gray-700 text-xs rounded-full px-2 py-1 font-medium">
      Member
    </span>
  );
}

export function StatusBadge({ variant = 'default', children }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
  };

  return (
    <span className={cn('text-xs rounded-full px-2 py-1 font-medium', variants[variant])}>
      {children}
    </span>
  );
}
