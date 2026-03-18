import React from 'react';
import { cn } from '../utils/cn';

export function Avatar({ className = '', children, ...props }) {
  return (
    <div 
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarImage({ className = '', src, alt = '' }) {
  return (
    <img
      className={cn('aspect-square h-full w-full object-cover', className)}
      src={src}
      alt={alt}
    />
  );
}

export function AvatarFallback({ className = '', children }) {
  return (
    <div 
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-gray-200',
        className
      )}
    >
      {children}
    </div>
  );
}

export function MemberAvatar({ name, imageUrl, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center bg-gray-200 font-medium text-gray-700',
        sizeClasses[size]
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        name?.charAt(0)?.toUpperCase() || 'U'
      )}
    </div>
  );
}

export function StackedAvatars({ members, maxDisplay = 4 }) {
  const displayMembers = members.slice(0, maxDisplay);
  const remainingCount = members.length - maxDisplay;

  return (
    <div className="flex -ml-2">
      {displayMembers.map((member, index) => (
        <div key={member.userId?._id || index} className="border-2 border-white -ml-2 first:ml-0">
          <MemberAvatar
            name={member.userId?.name || member.name}
            imageUrl={member.userId?.imageUrl || member.imageUrl}
            size="md"
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="border-2 border-white -ml-2 first:ml-0">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
            +{remainingCount}
          </div>
        </div>
      )}
    </div>
  );
}
