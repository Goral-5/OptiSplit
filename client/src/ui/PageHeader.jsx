import React from 'react';
import { cn } from '../utils/cn';

export function PageHeader({ 
  title, 
  subtitle, 
  actions, 
  className = '',
  ...props 
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)} {...props}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
