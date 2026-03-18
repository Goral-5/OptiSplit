import React from 'react';
import { cn } from '../utils/cn';

export function PillTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex gap-2 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
            activeTab === tab.value
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
