import React from 'react';

export function LoadingSpinner({ size = 'default', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4',
    default: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} border-4 border-primary/20 border-t-primary rounded-full animate-spin`}
      />
    </div>
  );
}

export function BarLoader({ width = '100%', color = '#36d7b7' }) {
  return (
    <div 
      className="w-full flex justify-center py-12"
      style={{ width }}
    >
      <div
        className="h-1 rounded-full animate-pulse"
        style={{ 
          backgroundColor: color,
          width: '100%',
          maxWidth: '200px'
        }}
      />
    </div>
  );
}
