import React from 'react';
import { cn } from '../utils/cn';

const variants = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm hover:shadow-md transition-all duration-200',
  secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-sm transition-all duration-200',
  outline: 'border border-gray-200 bg-transparent hover:bg-gray-50 text-gray-700 transition-all duration-200',
  ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200',
  link: 'text-emerald-600 underline-offset-4 hover:underline transition-all duration-200',
  destructive: 'bg-red-600 text-white hover:bg-red-500 shadow-sm hover:shadow-md transition-all duration-200',
};

const sizes = {
  default: 'h-10 px-4 py-2 rounded-lg',
  sm: 'h-8 px-3 py-1.5 text-xs rounded-lg',
  lg: 'h-11 px-8 rounded-lg',
  icon: 'h-10 w-10 rounded-lg',
};

export function Button({ 
  className = '', 
  variant = 'primary', 
  size = 'default', 
  children, 
  disabled,
  type = 'button',
  onClick,
  ...props 
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
