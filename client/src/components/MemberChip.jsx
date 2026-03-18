import React from 'react';
import { X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

/**
 * MemberChip Component - Displays a selected member with remove button
 * @param {Object} user - User object with _id, name, email, imageUrl
 * @param {Function} onRemove - Callback when remove button is clicked
 * @param {boolean} disabled - Whether the chip can be removed
 */
export function MemberChip({ user, onRemove, disabled = false }) {
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Badge 
      variant="secondary" 
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 transition-all"
    >
      <Avatar className="h-5 w-5">
        {user.imageUrl && (
          <AvatarImage src={user.imageUrl} alt={user.name} />
        )}
        <AvatarFallback className="text-xs">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{user.name}</span>
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full p-0.5"
          aria-label={`Remove ${user.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </Badge>
  );
}
