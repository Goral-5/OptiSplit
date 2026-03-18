import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

export function GroupMembers({ members = [], users = {}, showRole = true }) {
  console.log('GroupMembers received:', { members, users });
  
  if (!members || members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No members yet
      </div>
    );
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-1">
      {members.map((member, index) => {
        console.log(`Member ${index}:`, member);
        // Access user data - userId is already populated with user object
        const user = member.userId; // The entire user object is in userId
        
        console.log(`User for member ${index}:`, user);
        
        return (
          <div 
            key={member.userId?._id || member.userId || index}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <p className="font-medium text-gray-900">{user?.name || 'Unknown User'}</p>
                {user?.email && (
                  <p className="text-sm text-gray-600">{user.email}</p>
                )}
              </div>
            </div>
            
            {showRole && member.role && (
              <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                {member.role}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
