import React from 'react';
import { cn } from '../utils/cn';

export function RadioGroup({ className = '', value, onValueChange, children, ...props }) {
  return (
    <div className={cn("grid gap-2", className)} {...props}>
      {React.Children.map(children, child => {
        if (child.type === RadioGroupItem) {
          return React.cloneElement(child, { 
            checked: value === child.props.value, 
            onValueChange,
            name: 'splitType' // Ensure all radio buttons have same name
          });
        }
        return child;
      })}
    </div>
  );
}

export function RadioGroupItem({ 
  className = '', 
  value, 
  checked, 
  onValueChange, 
  children,
  id,
  name,
  ...props 
}) {
  return (
    <label className={cn("flex items-center space-x-2 cursor-pointer", className)}>
      <input
        type="radio"
        value={value}
        checked={checked}
        onChange={() => onValueChange?.(value)}
        name={name} // Add name attribute
        className="h-4 w-4 rounded-full border-primary text-primary focus:ring-primary"
        {...props}
      />
      {children && <span className="text-sm">{children}</span>}
    </label>
  );
}
