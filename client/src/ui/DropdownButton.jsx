import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * DropdownButton Component - Button with dropdown menu
 * @param {Array} options - Array of { label, icon, onClick, href }
 * @param {string} primaryLabel - Main button text
 */
export function DropdownButton({ options = [], primaryLabel = 'Create' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (option) => {
    setIsOpen(false);
    if (option.onClick) {
      option.onClick();
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div className="flex">
        {/* Main Button */}
        <Button
          onClick={() => {
            if (options.length > 0) {
              // If there are options, open dropdown on main button click too
              setIsOpen(!isOpen);
            }
          }}
          className="rounded-r-none"
        >
          {primaryLabel}
        </Button>
        
        {/* Dropdown Toggle */}
        <Button
          variant="default"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-l-none border-l border-white/20 px-2"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-2">
            {options.map((option, index) => (
              <a
                key={index}
                href={option.href || '#'}
                onClick={(e) => {
                  if (!option.href) {
                    e.preventDefault();
                    handleOptionClick(option);
                  }
                }}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {option.icon && (
                  <span className="text-gray-600">
                    {option.icon}
                  </span>
                )}
                <span className="font-medium text-gray-900">{option.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
