import React, { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { Input } from '../ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { useUserSearch } from '../hooks/useUserSearch';

/**
 * MemberSearch Component - Live search for users with dropdown results
 * @param {Array} selectedUsers - Array of already selected user IDs
 * @param {Function} onAddUser - Callback when a user is selected
 * @param {string} placeholder - Placeholder text for search input
 */
export function MemberSearch({ selectedUsers = [], onAddUser, placeholder = 'Search people...' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const { users, isLoading } = useUserSearch(searchQuery);
  
  // Filter out already selected users
  const availableUsers = users.filter(
    (user) => !selectedUsers.includes(user._id)
  );

  const handleSelectUser = (user) => {
    onAddUser(user);
    setSearchQuery('');
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="pl-10"
        />
      </div>

      {/* Dropdown Results */}
      {showDropdown && (searchQuery.trim().length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : availableUsers.length > 0 ? (
            <div className="py-2">
              {availableUsers.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => handleSelectUser(user)}
                  className="w-full px-4 py-3 hover:bg-gray-50 transition-colors focus:bg-gray-50 focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {user.imageUrl && (
                        <AvatarImage src={user.imageUrl} alt={user.name} />
                      )}
                      <AvatarFallback>
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <UserPlus className="h-4 w-4 text-green-600 opacity-0 group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No users found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
