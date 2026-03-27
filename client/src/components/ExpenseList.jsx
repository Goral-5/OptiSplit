import React from 'react';
import { format } from 'date-fns';
import { Trash2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';

export function ExpenseList({ 
  expenses, 
  users = {}, 
  showDelete = false,
  onDelete,
  emptyMessage = "No expenses found",
  groupId
}) {
  const [selectedExpense, setSelectedExpense] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);

  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
    setShowModal(true);
  };
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
      {expenses.map((expense) => {
        const hasUnpaidSplits = expense.splits && expense.splits.some(s => !s.paid);
        
        return (
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
                          <span key={idx} className="inline-block mr-2 mb-1">
                            {users[split.userId]?.name || 'User'}: ₹{split.amount.toFixed(2)}
                            {split.paid && <span className="text-green-600 ml-1">✓ Paid</span>}
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
                  
                  <div className="flex gap-2">
                    {groupId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(expense)}
                        className="text-xs"
                      >
                        View Split Details
                        <Info className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                    
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
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Expense Detail Modal */}
      {showModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedExpense.description}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(selectedExpense.date), 'MMMM d, yyyy')} • ₹{selectedExpense.amount.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Split Type & Payment Info */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              {selectedExpense.splitType && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-1">SPLIT TYPE</p>
                  <p className="text-sm font-medium text-blue-900 capitalize">{selectedExpense.splitType}</p>
                </div>
              )}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs font-semibold text-green-700 mb-1">PAID BY</p>
                <div className="space-y-1">
                  {selectedExpense.paidBy?.map((payer, i) => {
                    const payerName = users[payer.userId?._id || payer.userId]?.name || 'User';
                    return (
                      <p key={i} className="text-sm font-medium text-green-900">
                        {payerName}: ₹{payer.amount.toFixed(2)}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Net Summary */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-600 mb-2">NET BALANCE</p>
              <div className="space-y-1">
                {(() => {
                  // Get all unique user IDs from both paidBy and splits
                  const allUserIds = new Set();
                  
                  if (selectedExpense.paidBy) {
                    selectedExpense.paidBy.forEach(p => {
                      const userId = p.userId?._id || p.userId;
                      if (userId) allUserIds.add(userId);
                    });
                  }
                  
                  if (selectedExpense.splits) {
                    selectedExpense.splits.forEach(s => {
                      const userId = s.userId?._id || s.userId;
                      if (userId) allUserIds.add(userId);
                    });
                  }
                  
                  // Calculate net for each user
                  return Array.from(allUserIds).map((userId, i) => {
                    const paid = selectedExpense.paidBy?.find(p => 
                      (p.userId?._id === userId || p.userId === userId)
                    )?.amount || 0;
                    
                    const split = selectedExpense.splits?.find(s => 
                      (s.userId?._id === userId || s.userId === userId)
                    );
                    const owes = split?.amount || 0;
                    
                    const net = paid - owes;
                    const userName = users[userId]?.name || 'User';
                    
                    return (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-700">{userName}</span>
                        <span className={net >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                          {net >= 0 ? `Gets ₹${net.toFixed(2)}` : `Owes ₹${Math.abs(net).toFixed(2)}`}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Transaction Breakdown */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">WHO PAYS WHOM</p>
              <div className="space-y-2">
                {selectedExpense.transactions && selectedExpense.transactions.length > 0 ? (
                  selectedExpense.transactions.map((tx, i) => {
                    const fromUser = users[tx.from]?._id || tx.from;
                    const toUser = users[tx.to]?._id || tx.to;
                    const fromName = users[fromUser]?.name || 'Payer';
                    const toName = users[toUser]?.name || 'Receiver';
                    
                    return (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-semibold">
                              {fromName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-700">{fromName}</span>
                        </div>
                        <span className="text-xs text-gray-400">pays</span>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-green-100 text-green-700 font-semibold">
                              {toName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-700">{toName}</span>
                        </div>
                        <span className="font-semibold text-gray-900">₹{tx.amount.toFixed(2)}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No transaction details available</p>
                )}
              </div>
            </div>

            <Button
              className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white"
              onClick={() => setShowModal(false)}
            >
              Close
            </Button>

            <p className="text-xs text-gray-400 text-center mt-3">
              This is a read-only view. Use "Settle Up" to record payments.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
