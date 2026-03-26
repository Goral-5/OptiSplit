import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';

export function GroupBalances({ balances, currentUserId }) {
  console.log('GroupBalances received:', { balances, currentUserId });
  
  // Handle array format (from balance.service.js)
  if (!balances || !Array.isArray(balances) || balances.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No balances yet</p>
        </CardContent>
      </Card>
    );
  }

  // Find current user's balance
  const currentUserBalance = balances.find(b => b.id === currentUserId);
  const totalBalance = currentUserBalance?.totalBalance || 0;

  return (
    <div className="space-y-4">
      {/* Total Balance Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Your Total Balance</p>
            <p className={`text-3xl font-bold ${
              totalBalance > 0 ? 'text-green-600' : totalBalance < 0 ? 'text-red-600' : 'text-gray-900'
            }`}>
              ₹{Math.abs(totalBalance).toFixed(2)}
            </p>
            {totalBalance > 0 && (
              <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                You are owed money
              </Badge>
            )}
            {totalBalance < 0 && (
              <Badge variant="secondary" className="mt-2 bg-red-100 text-red-800">
                You owe money
              </Badge>
            )}
            {totalBalance === 0 && (
              <Badge variant="secondary" className="mt-2">
                All settled up
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Individual Balances */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-700 mb-3">Balances with Members</h3>
        {balances.map((member) => {
          if (member.id === currentUserId) return null; // Skip self
          
          const isPositive = member.totalBalance > 0;
          const isZero = Math.abs(member.totalBalance) < 0.01;

          return (
            <Card key={member.id} className="transition-all hover:shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.imageUrl} />
                      <AvatarFallback>
                        {member.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isPositive 
                          ? `${member.name} owes you` 
                          : isZero 
                            ? 'Settled up'
                            : `You owe ${member.name}`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      isPositive ? 'text-green-600' : isZero ? 'text-gray-500' : 'text-red-600'
                    }`}>
                      {isZero ? '₹0.00' : `₹${Math.abs(member.totalBalance).toFixed(2)}`}
                    </p>
                    {!isZero && (
                      <Badge 
                        variant="outline" 
                        className={`mt-1 ${
                          isPositive ? 'border-green-600 text-green-600' : 'border-red-600 text-red-600'
                        }`}
                      >
                        {isPositive ? '+RECEIVE' : '-GIVE'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
