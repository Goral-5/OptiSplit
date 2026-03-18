import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { Badge } from '../ui/Badge';
import api from '../services/api';
import { showToast } from '../ui/Sonner';
import { settlementService } from '../services/index';

export default function Settlement() {
  const { type, id } = useParams(); // type: 'group' or 'person'
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    amount: '',
    note: ''
  });
  const [selectedBalance, setSelectedBalance] = useState(null);

  // Fetch settlement data
  const { data: settlementData, isLoading } = useQuery(
    ['settlementData', type, id],
    async () => {
      const response = await api.get(`/settlements/${type}/${id}/data`);
      return response.data;
    },
    {
      onError: (error) => {
        console.error('Failed to load settlement data:', error);
        showToast.error('Failed to load settlement data');
      }
    }
  );

  // Create settlement mutation
  const createSettlementMutation = useMutation(
    (data) => settlementService.createSettlement({ ...data, type, entityId: id }),
    {
      onSuccess: () => {
        showToast.success('Settlement recorded successfully!');
        queryClient.invalidateQueries(['settlementData']);
        navigate(type === 'group' ? `/groups/${id}` : '/dashboard');
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
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast.error('Valid amount is required');
      return;
    }

    createSettlementMutation.mutate({
      amount: parseFloat(formData.amount),
      note: formData.note.trim()
    });
  };

  const data = settlementData?.data || {};
  const isGroup = type === 'group';
  const balances = data.balances || [];
  
  // For person-to-person, use the balance from API
  const balance = !isGroup ? (data.balance || 0) : null;
  const payer = data.payer;
  const receiver = data.receiver;
  const optimized = optimizedData?.data || [];

  // Filter balances where someone owes money (amount > 0)
  const debtsOwed = isGroup 
    ? balances.filter(b => b.owes && b.owes.length > 0)
    : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-title">Settle Up</h1>
        <p className="text-muted-foreground mt-1">
          Record a payment to settle balances
        </p>
      </div>

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
          {/* For Person-to-Person: Show single balance */}
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

          {/* For Groups: Show all balances */}
          {isGroup && (
            <Card>
              <CardHeader>
                <CardTitle>Who Owes What</CardTitle>
              </CardHeader>
              <CardContent>
                {balances.length === 0 ? (
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
          )}

          {/* Optimized Settlements (for groups) */}
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
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  disabled={createSettlementMutation.isPending}
                />

                <Textarea
                  label="Note (Optional)"
                  placeholder="What's this payment for?"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
                  <Button type="submit" disabled={createSettlementMutation.isPending}>
                    {createSettlementMutation.isPending ? 'Recording...' : 'Record Payment'}
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
