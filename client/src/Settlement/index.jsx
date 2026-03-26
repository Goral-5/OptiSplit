import React, { useState } from 'react';
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
        queryClient.invalidateQueries(['settlementData']);
        queryClient.invalidateQueries(['group', id]);
        setTimeout(() => {
          navigate(type === 'group' ? `/groups/${id}` : '/dashboard');
        }, 1500);
      },
      onError: (error) => {
        showToast.error(error.response?.data?.message || 'Failed to record settlement');
      }
    }
  );

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!customAmount || parseFloat(customAmount) <= 0) {
      showToast.error('Valid amount is required');
      return;
    }

    createSettlementMutation.mutate({
      amount: parseFloat(customAmount),
      note: note.trim(),
    });
  };

  const data = settlementData?.data || {};
  const isGroup = type === 'group';
  const balances = data.balances || [];
  const settlements = data.settlements || [];
  const balance = !isGroup ? (data.balance || 0) : null;
  const payer = data.payer;
  const receiver = data.receiver;
  const optimized = optimizedData?.data || [];

  // Build debt list for group settlement
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

          {/* Optimized Settlements */}
          {type === 'group' && optimized.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Optimized Settlement Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {optimized.map((transaction, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">
                        {transaction.from?.name || 'User'} → {transaction.to?.name || 'User'}
                      </span>
                      <Badge variant="secondary">₹{transaction.amount.toFixed(2)}</Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  This plan minimizes the number of transactions needed
                </p>
              </CardContent>
            </Card>
          )}

          {/* Settlement History */}
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
        </>
      )}
    </div>
  );
}
