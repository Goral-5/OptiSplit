import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { cn } from '../utils/cn';
import { Button } from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Calendar({ selected, onSelect, className = '' }) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={previousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-xs text-muted-foreground text-center py-1">
            {day}
          </div>
        ))}
        
        {days.map((day) => (
          <button
            key={day.toString()}
            onClick={() => onSelect?.(day)}
            className={cn(
              "h-8 w-8 text-sm rounded-md transition-colors",
              !isSameMonth(day, currentMonth) && "text-muted-foreground opacity-50",
              isSameDay(day, selected) && "bg-primary text-primary-foreground",
              !isSameDay(day, selected) && "hover:bg-accent"
            )}
          >
            {format(day, 'd')}
          </button>
        ))}
      </div>
    </div>
  );
}
