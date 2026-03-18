import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from './Button';

export function Dialog({ open, onOpenChange, children }) {
  const [isOpen, setIsOpen] = useState(open || false);

  const handleOpenChange = (newState) => {
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => handleOpenChange(false)}
      />
      
      {/* Dialog Content */}
      <div className="relative z-50 w-full max-w-lg bg-background shadow-lg rounded-xl mx-4">
        {React.Children.map(children, child => {
          if (child.type === DialogContent) {
            return React.cloneElement(child, { onOpenChange: handleOpenChange });
          }
          return child;
        })}
      </div>
    </div>
  );
}

export function DialogTrigger({ children, asChild, ...props }) {
  const Comp = asChild ? React.Fragment : 'button';
  return <Comp {...props}>{children}</Comp>;
}

export function DialogContent({ children, onOpenChange, className = '', showCloseButton = true }) {
  return (
    <>
      <div className={cn("flex flex-col space-y-1.5 p-6", className)}>
        {children}
      </div>
      {showCloseButton && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      )}
    </>
  );
}

export function DialogHeader({ className = '', children }) {
  return (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
      {children}
    </div>
  );
}

export function DialogFooter({ className = '', children }) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>
      {children}
    </div>
  );
}

export function DialogTitle({ className = '', children, ...props }) {
  return (
    <h2
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

export function DialogDescription({ className = '', children, ...props }) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
}
