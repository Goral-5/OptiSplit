import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function GroupBalances({ balances, currentUserId }) {
  if (!balances || Object.keys(balances).length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No balances yet</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate total balance for current user
  const totalBalance = Object.values(balances).reduce((sum, bal) => sum + bal.balance, 0);

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
              ₹{totalBalance.toFixed(2)}
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
        {Object.entries(balances).map(([userId, data]) => {
          const isPositive = data.balance > 0;
          const isZero = data.balance === 0;

          return (
            <Card key={userId} className="transition-all hover:shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{data.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {isPositive 
                        ? `${data.userName} owes you` 
                        : isZero 
                          ? 'Settled up'
                          : `You owe ${data.userName}`
                      }
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      isPositive ? 'text-green-600' : isZero ? 'text-gray-500' : 'text-red-600'
                    }`}>
                      {isZero ? '₹0.00' : `₹${Math.abs(data.balance).toFixed(2)}`}
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
