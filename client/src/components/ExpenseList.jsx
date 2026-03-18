import React from 'react';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';

export function ExpenseList({ 
  expenses, 
  users = {}, 
  showDelete = false,
  onDelete,
  emptyMessage = "No expenses found"
}) {
  if (!expenses || expenses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  const getCategoryColor = (category) => {
    const colors = {
      food: 'bg-orange-100 text-orange-800',
      transport: 'bg-blue-100 text-blue-800',
      shopping: 'bg-purple-100 text-purple-800',
      entertainment: 'bg-pink-100 text-pink-800',
      bills: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <Card key={expense._id} className="transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={users[expense.paidByUserId]?.imageUrl} />
                  <AvatarFallback>
                    {users[expense.paidByUserId]?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{expense.description}</h4>
                    <Badge variant="secondary" className={getCategoryColor(expense.category)}>
                      {expense.category}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    Paid by {users[expense.paidByUserId]?.name || 'Unknown'} • {format(new Date(expense.date), 'MMM d, yyyy')}
                  </p>
                  
                  {/* Split Details */}
                  {expense.splits && expense.splits.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {expense.splits.map((split, idx) => (
                        <span key={idx} className="inline-block mr-2">
                          {users[split.userId]?.name || 'User'}: ₹{split.amount.toFixed(2)}
                          {split.paid && <span className="text-green-600 ml-1">✓</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <span className="text-lg font-semibold text-gray-900">
                  ₹{expense.amount.toFixed(2)}
                </span>
                
                {showDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete?.(expense._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
