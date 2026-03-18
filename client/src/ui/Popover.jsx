import React, { useState } from 'react';
import { cn } from '../utils/cn';

export function Popover({ open, onOpenChange, children }) {
  const [isOpen, setIsOpen] = useState(open || false);

  const handleOpenChange = (newState) => {
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (child.type === PopoverTrigger || child.type === PopoverContent) {
          return React.cloneElement(child, { isOpen, onOpenChange: handleOpenChange });
        }
        return child;
      })}
    </div>
  );
}

export function PopoverTrigger({ children, isOpen, onOpenChange, asChild }) {
  const Comp = asChild ? React.Fragment : 'button';
  
  return (
    <Comp onClick={() => onOpenChange(!isOpen)}>
      {children}
    </Comp>
  );
}

export function PopoverContent({ 
  children, 
  isOpen, 
  onOpenChange, 
  className = '', 
  align = 'center',
  sideOffset = 4,
  ...props 
}) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
