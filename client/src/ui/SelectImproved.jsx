import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../utils/cn"

export function Select({ className = '', children, value, onValueChange, ...props }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (newValue) => {
    if (onValueChange) {
      onValueChange(newValue);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)} {...props}>
      {React.Children.map(children, child => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, {
            isOpen,
            onClick: handleToggle
          });
        }
        if (child.type === SelectContent) {
          return React.cloneElement(child, {
            isOpen,
            onSelect: handleSelect,
            selectedValue: value
          });
        }
        return child;
      })}
    </div>
  )
}

export function SelectTrigger({ className = '', children, onClick, isOpen, ...props }) {
  return (
    <>
      <button
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400 transition-colors",
          className
        )}
        onClick={onClick}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        {...props}
      >
        {children}
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isOpen && "transform rotate-180")} />
      </button>
    </>
  )
}

export function SelectValue({ placeholder, children }) {
  return (
    <span className="block truncate">
      {children || placeholder}
    </span>
  )
}

export function SelectContent({ className = '', children, isOpen, onSelect, selectedValue, ...props }) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute z-[100] min-w-[8rem] overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-900 shadow-lg mt-1 max-h-64 overflow-y-auto animate-in fade-in-0 zoom-in-95",
        className
      )}
      role="listbox"
      {...props}
    >
      <div className="p-1">
        {React.Children.map(children, child => {
          if (child.type === SelectItem) {
            return React.cloneElement(child, {
              onSelect,
              selectedValue,
              isSelected: child.props.value === selectedValue
            });
          }
          return child;
        })}
      </div>
    </div>
  )
}

export function SelectItem({ className = '', children, onSelect, selectedValue, isSelected, value, ...props }) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(value);
    }
  };

  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-md py-2 px-3 text-sm outline-none transition-colors hover:bg-gray-50 cursor-pointer",
        isSelected && "bg-green-50 text-green-700 font-medium",
        className
      )}
      role="option"
      aria-selected={isSelected}
      onClick={handleClick}
      {...props}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
      <span className={cn("truncate", isSelected ? "pl-5" : "pl-2")}>{children}</span>
    </div>
  )
}
