import React, { useState } from 'react';
import { cn } from '../utils/cn';

export function Tabs({ defaultValue, value, onValueChange, children, className = '' }) {
  const [activeValue, setActiveValue] = useState(defaultValue || value);

  const handleValueChange = (newValue) => {
    setActiveValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <div className={cn("w-full", className)} data-value={activeValue}>
      {React.Children.map(children, child => {
        if (child.type === TabsList || child.type === TabsContent) {
          return React.cloneElement(child, { activeValue, onValueChange: handleValueChange });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ children, activeValue, onValueChange, className = '' }) {
  return (
    <div
      className={cn(
        "flex gap-2",
        className
      )}
    >
      {React.Children.map(children, child => {
        if (child.type === TabsTrigger) {
          return React.cloneElement(child, { activeValue, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({ value, children, activeValue, onValueChange, className = '', ...props }) {
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      onClick={() => onValueChange?.(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
        isActive 
          ? "bg-gray-900 text-white shadow-md" 
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, activeValue, children, className = '', ...props }) {
  if (activeValue !== value) return null;

  return (
    <div
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
