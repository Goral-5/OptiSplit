import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { DollarSign, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import api from '../services/api';
import { showToast } from '../ui/Sonner';

export default function Settlement() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [customAmount, setCustomAmount] = useState('');
  const [note, setNote] = useState('');
  const [partialAmount, setPartialAmount] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedDebt, setSelectedDebt] = useState(null);

  // Determine if this is a group settlement (needed for hooks below)
  const isGroup = type === 'group';

  // Fetch settlement data
  const { data: settlementData, isLoading, error, refetch } = useQuery(
    ['settlementData', type, id],
    async () => {
      const response = await api.get(`/settlements/${type}/${id}/data`);
      return response.data;
    },
    {
      onError: (error) => {
        console.error('Failed to load settlement data:', error);
        showToast.error(error.response?.data?.message || 'Failed to load settlement data');
      }
    }
  );

  // Get current user ID from Clerk
  useEffect(() => {
    const getCurrentUser = async () => {
      if (window.Clerk?.user) {
        setCurrentUserId(window.Clerk.user.id);
        console.log('✅ Set currentUserId from window.Clerk:', window.Clerk.user.id);
      } else if (window.getUserId) {
        setCurrentUserId(window.getUserId());
        console.log('✅ Set currentUserId from window.getUserId:', window.getUserId());
      } else {
        console.warn('⚠️ Clerk user not found, trying fallback methods...');
      }
    };
    getCurrentUser();
  }, []);

  // Create settlement mutation
  const createSettlementMutation = useMutation(
    async (data) => {
      const response = await api.post('/settlements', {
        ...data,
        type,
        entityId: id,
      });
      return response.data;
    },
    {
      onSuccess: () => {
        showToast.success('Settlement recorded successfully!');
        
        // Invalidate all related queries to refresh data
        queryClient.invalidateQueries(['settlementData']);
        queryClient.invalidateQueries(['group', id]);
        queryClient.invalidateQueries(['optimizedSettlements']);
        queryClient.invalidateQueries(['groupBalances']);
        
        // Show success animation
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        
        // Reset form
        setCustomAmount('');
        setNote('');
        setSelectedDebt(null);
        
        // Wait for queries to refetch before redirecting
        setTimeout(async () => {
          // Ensure data is refreshed
          await queryClient.refetchQueries(['settlementData']);
          await queryClient.refetchQueries(['group', id]);
          
          // Navigate back
          navigate(type === 'group' ? `/groups/${id}` : '/dashboard');
        }, 1500);
      },
      onError: (error) => {
        showToast.error(error.response?.data?.message || 'Failed to record settlement');
      }
    }
  );

  // Generate optimized transactions from balances (SOURCE OF TRUTH)
  const generateTransactions = (balances) => {
    let creditors = [];
    let debtors = [];

    balances.forEach(b => {
      if (b.totalBalance > 0.01) creditors.push({ ...b });
      if (b.totalBalance < -0.01) debtors.push({ ...b });
    });

    creditors.sort((a,b) => b.totalBalance - a.totalBalance);
    debtors.sort((a,b) => a.totalBalance - b.totalBalance);

    let i = 0, j = 0;
    let transactions = [];

    while (i < creditors.length && j < debtors.length) {
      let credit = creditors[i];
      let debt = debtors[j];

      let settleAmount = Math.min(
        credit.totalBalance,
        Math.abs(debt.totalBalance)
      );

      transactions.push({
        from: { _id: debt.id, name: debt.name, imageUrl: debt.imageUrl },
        to: { _id: credit.id, name: credit.name, imageUrl: credit.imageUrl },
        amount: Number(settleAmount.toFixed(2)),
        _id: `${debt.id}-${credit.id}`
      });

      credit.totalBalance -= settleAmount;
      debt.totalBalance += settleAmount;

      if (Math.abs(credit.totalBalance) < 0.01) i++;
      if (Math.abs(debt.totalBalance) < 0.01) j++;
    }

    return transactions;
  };

  // Get optimized settlements for groups
  const { data: optimizedData } = useQuery(
    ['optimizedSettlements', type, id],
    async () => {
      if (type !== 'group') return null;
      const response = await api.get(`/settlements/${type}/${id}/optimized`);
      return response.data;
    },
    {
      enabled: type === 'group'
    }
  );

  // Handle settlement with backend integration
  const handleSettle = async (tx, enteredAmount) => {
    const amount = enteredAmount || tx.amount;

    if (amount <= 0 || amount > tx.amount) {
      showToast.error("Invalid amount");
      return;
    }

    try {
      // Call backend settlement API
      await api.post('/settlements', {
        groupId: id,
        paidByUserId: tx.from._id,
        receivedByUserId: tx.to._id,
        amount: amount,
        note: `Payment: ${tx.from.name} → ${tx.to.name}`
      });

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // REFETCH: Mandatory to get fresh data from backend
      await refetch();
      
    } catch (error) {
      console.error('Settlement error:', error);
      showToast.error(error.response?.data?.message || 'Failed to record settlement');
    }
  };

  const handleSubmit = async (e, tx = null) => {
    e?.preventDefault();
    
    console.log('📝 Submitting settlement form...', { customAmount, selectedDebt, isGroup });
    
    if (!customAmount || parseFloat(customAmount) <= 0) {
      showToast.error('Valid amount is required');
      return;
    }

    const amountToPay = parseFloat(customAmount);
    
    try {
      // If settling a specific transaction (from optimized plan)
      if (tx) {
        console.log('✅ Settling optimized transaction:', tx);
        await handleSettle(tx, amountToPay);
      } else {
        // Determine which debt to settle
        let debtToSettle = selectedDebt;
        
        console.log('🔍 Looking for debt to settle...', { selectedDebt, debtsCount: debtsList.length });
        
        // If no specific debt selected, find first debt involving current user
        if (!debtToSettle && isGroup && debtsList.length > 0) {
          debtToSettle = debtsList.find(
            debt => debt.from.id === currentUserId
          );
          console.log('🎯 Auto-selected debt:', debtToSettle);
        }
        
        if (debtToSettle) {
          // Settle specific debt
          const tempTx = {
            _id: debtToSettle.id,
            from: { _id: debtToSettle.from.id, name: debtToSettle.from.name, imageUrl: debtToSettle.from.imageUrl },
            to: { _id: debtToSettle.to.id, name: debtToSettle.to.name, imageUrl: debtToSettle.to.imageUrl }
          };
          
          console.log('💰 Settling debt:', tempTx, 'Amount:', amountToPay);
          await handleSettle(tempTx, amountToPay);
        } else if (!isGroup) {
          // Person-to-person settlement
          console.log('👤 Person-to-person settlement');
          await api.post('/settlements', {
            amount: amountToPay,
            note: note.trim(),
            paidByUserId: currentUserId,
            receivedByUserId: id,
          });
          
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
          await refetch();
        } else {
          console.error('❌ No debt found to settle');
          showToast.error('No debt selected. Please click "Settle" on a debt above.');
          return;
        }
      }
      
      console.log('✅ Settlement successful!');
      
      // Reset form
      setCustomAmount('');
      setNote('');
      setSelectedDebt(null);
      
    } catch (error) {
      console.error('❌ Settlement error:', error);
      showToast.error(error.response?.data?.message || 'Failed to record settlement');
    }
  };

  const handlePartialPay = async (tx) => {
    const entered = partialAmount[tx._id] || tx.amount;

    if (entered <= 0 || entered > tx.amount) {
      showToast.error("Invalid amount");
      return;
    }

    await handleSettle(tx, entered);
    
    // Clear partial amount input
    setPartialAmount(prev => {
      const newState = { ...prev };
      delete newState[tx._id];
      return newState;
    });
  };

  const data = settlementData?.data || {};
  const balances = data.balances || [];
  const settlements = data.settlements || [];
  const balance = !isGroup ? (data.balance || 0) : null;
  const payer = data.payer;
  const receiver = data.receiver;
  const optimized = optimizedData?.data || [];

  // Generate transactions from balances NOW that balances is defined
  const optimizedTransactions = isGroup ? generateTransactions(balances) : [];

  // Inline styles for animations
  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    },
    modal: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '1rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      textAlign: 'center',
      animation: 'scaleIn 0.3s ease'
    }
  };

  // Build debt list for group settlement (from balances - SOURCE OF TRUTH)
  const debtsList = [];
  if (isGroup) {
    balances.forEach(member => {
      if (member.owes && member.owes.length > 0) {
        member.owes.forEach(debt => {
          const toMember = balances.find(b => b.id === debt.to);
          debtsList.push({
            id: `${member.id}-${toMember?.id}`,
            from: member,
            to: toMember,
            amount: debt.amount,
            description: `${member.name} owes ${toMember?.name}`,
          });
        });
      }
    });
  }

  // Use generated transactions instead of backend optimization
  const displayTransactions = optimizedTransactions.length > 0 ? optimizedTransactions : debtsList;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-title">Settle Up</h1>
        <p className="text-muted-foreground mt-1">
          Record a payment to settle balances
        </p>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              <p className="font-semibold">Error loading settlement data</p>
              <p className="text-sm mt-2">{error.message}</p>
              <Button onClick={() => refetch()} className="mt-4" variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* For Person-to-Person */}
          {!isGroup && (
            <Card>
              <CardHeader>
                <CardTitle>Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Net Balance</p>
                    <p className={`text-4xl font-bold mt-2 ${
                      balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      ₹{Math.abs(balance).toFixed(2)}
                    </p>
                    {balance !== 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {balance > 0 
                          ? `${receiver?.name || 'User'} owes ${payer?.name || 'User'}`
                          : `${payer?.name || 'User'} owes ${receiver?.name || 'User'}`
                        }
                      </p>
                    )}
                  </div>
                  <DollarSign className="h-12 w-12 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* For Groups */}
          {isGroup && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Who Owes What</CardTitle>
                </CardHeader>
                <CardContent>
                  {!balances || balances.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <p>No expenses recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {balances.map((member, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.imageUrl} />
                              <AvatarFallback>
                                {member.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-600">
                                {member.totalBalance > 0 ? 'To receive' : member.totalBalance < 0 ? 'To pay' : 'Settled'}
                              </p>
                            </div>
                          </div>
                          <Badge variant={member.totalBalance > 0 ? 'default' : member.totalBalance < 0 ? 'destructive' : 'secondary'}>
                            {member.totalBalance > 0 ? '+' : ''}₹{member.totalBalance.toFixed(2)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Unsettled Debts List */}
              {debtsList.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Unsettled Debts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {debtsList.map((debt, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex -space-x-2">
                              <Avatar className="h-6 w-6 border-2 border-white">
                                <AvatarImage src={debt.from.imageUrl} />
                                <AvatarFallback className="text-xs">
                                  {debt.from.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <Avatar className="h-6 w-6 border-2 border-white">
                                <AvatarImage src={debt.to.imageUrl} />
                                <AvatarFallback className="text-xs">
                                  {debt.to.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {debt.description}
                              </p>
                              <p className="text-xs text-gray-500">Original debt</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="destructive" className="font-bold">
                              ₹{debt.amount.toFixed(2)}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => {
                                setCustomAmount(debt.amount.toString());
                                setNote(`Settling: ${debt.description}`);
                                setSelectedDebt(debt);
                              }}
                              variant="outline"
                            >
                              Settle
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Optimized Settlements - Use generated transactions (SOURCE OF TRUTH) */}
          {type === 'group' && displayTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Optimized Settlement Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayTransactions.map((transaction, idx) => {
                    const isPayer = currentUserId && transaction.from._id === currentUserId;
                    const isReceiver = currentUserId && transaction.to._id === currentUserId;
                    const enteredAmount = partialAmount[transaction._id] || '';
                    
                    return (
                      <div 
                        key={transaction._id || idx} 
                        className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 animate-slide-up"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={transaction.from?.imageUrl} />
                              <AvatarFallback>
                                {transaction.from?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold text-gray-900">
                              {transaction.from?.name}
                            </span>
                            <span className="text-gray-400">→</span>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={transaction.to?.imageUrl} />
                              <AvatarFallback>
                                {transaction.to?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold text-gray-900">
                              {transaction.to?.name}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-lg font-bold bg-blue-600 text-white">
                            ₹{transaction.amount.toFixed(2)}
                          </Badge>
                        </div>
                        
                        {/* User-specific messaging */}
                        {isPayer && (
                          <p className="text-xs text-blue-600 font-medium mb-2">
                            💸 You pay ₹{transaction.amount.toFixed(2)}
                          </p>
                        )}
                        {isReceiver && (
                          <p className="text-xs text-green-600 font-medium mb-2">
                            💰 You receive ₹{transaction.amount.toFixed(2)}
                          </p>
                        )}
                        
                        {/* Partial payment input */}
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Enter amount"
                              value={enteredAmount}
                              onChange={(e) =>
                                setPartialAmount(prev => ({
                                  ...prev,
                                  [transaction._id]: Number(e.target.value)
                                }))
                              }
                              className="flex-1"
                              disabled={createSettlementMutation.isPending}
                            />
                            <Button
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handlePartialPay(transaction)}
                              disabled={createSettlementMutation.isPending}
                            >
                              Pay Now
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Enter full amount (₹{transaction.amount.toFixed(2)}) or partial amount
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  This plan minimizes the number of transactions needed
                </p>
              </CardContent>
            </Card>
          )}

          {/* Settlement History (from backend - REAL DATA) */}
          {settlements && settlements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Settlement History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {settlements.map((settlement) => (
                    <div key={settlement._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex -space-x-2">
                          <Avatar className="h-8 w-8 border-2 border-white">
                            <AvatarImage src={settlement.paidByUserId?.imageUrl} />
                            <AvatarFallback>
                              {settlement.paidByUserId?.name?.charAt(0) || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <Avatar className="h-8 w-8 border-2 border-white">
                            <AvatarImage src={settlement.receivedByUserId?.imageUrl} />
                            <AvatarFallback>
                              {settlement.receivedByUserId?.name?.charAt(0) || 'R'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {settlement.paidByUserId?.name} paid {settlement.receivedByUserId?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(settlement.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            {settlement.note && ` • ${settlement.note}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant="default" className="font-bold bg-green-600">
                        ₹{settlement.amount.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settlement Form */}
          <Card>
            <CardHeader>
              <CardTitle>Record Payment</CardTitle>
              {selectedDebt && (
                <p className="text-sm text-green-600 mt-2">
                  ✅ Selected: {selectedDebt.description} - ₹{selectedDebt.amount.toFixed(2)}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  disabled={createSettlementMutation.isPending}
                />

                <Textarea
                  label="Note (Optional)"
                  placeholder="What's this payment for?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  disabled={createSettlementMutation.isPending}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={createSettlementMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSettlementMutation.isPending || !customAmount}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {createSettlementMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Recording...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Record Payment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Success Animation Modal */}
          {showSuccess && (
            <div style={styles.overlay}>
              <div style={styles.modal}>
                <div className="text-4xl mb-2 animate-bounce">✅</div>
                <h2 className="text-lg font-bold text-gray-900">Payment Successful</h2>
                <p className="text-sm text-gray-500 mt-1">Settlement recorded</p>
                <div className="mt-4 flex justify-center gap-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse delay-200"></div>
                </div>
              </div>
            </div>
          )}

          <style>{`
            @keyframes scaleIn {
              0% { transform: scale(0.8); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes slideUp {
              0% { transform: translateY(20px); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
            .animate-slide-up {
              animation: slideUp 0.4s ease-out;
            }
            .delay-100 {
              animation-delay: 100ms;
            }
            .delay-200 {
              animation-delay: 200ms;
            }
          `}</style>
        </>
      )}
    </div>
  );
}
