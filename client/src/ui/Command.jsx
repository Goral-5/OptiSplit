import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../utils/cn';
import { Input } from './Input';

export function Command({ className = '', children, ...props }) {
  return (
    <div 
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CommandInput({ placeholder, onValueChange, className = '', ...props }) {
  return (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        placeholder={placeholder}
        onChange={(e) => onValueChange?.(e.target.value)}
        {...props}
      />
    </div>
  );
}

export function CommandList({ className = '', children, ...props }) {
  return (
    <div className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)} {...props}>
      <div className="p-2">
        {children}
      </div>
    </div>
  );
}

export function CommandEmpty({ children }) {
  return (
    <div className="py-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function CommandGroup({ heading, className = '', children, ...props }) {
  return (
    <div className={cn("overflow-hidden p-1 text-foreground", className)} {...props}>
      {heading && (
        <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">
          {heading}
        </div>
      )}
      {children}
    </div>
  );
}

export function CommandItem({ className = '', children, onSelect, ...props }) {
  return (
    <div
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onSelect={onSelect}
      {...props}
    >
      {children}
    </div>
  );
}
