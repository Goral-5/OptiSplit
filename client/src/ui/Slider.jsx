import React from 'react';
import { cn } from '../utils/cn';

export function Slider({ 
  className = '', 
  value, 
  onValueChange, 
  min = 0, 
  max = 100, 
  step = 1,
  ...props 
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onValueChange?.(Number(e.target.value))}
      className={cn(
        "w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer",
        "accent-primary",
        className
      )}
      {...props}
    />
  );
}
