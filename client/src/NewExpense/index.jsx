import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import { DollarSign, Users, Calendar, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
import { Tabs, TabsList, TabsTrigger } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { PageHeader } from '../ui/PageHeader';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import api from '../services/api';
import { showToast } from '../ui/Sonner';
import { expenseService } from '../services/index';
import ExpenseSuccessModal from '../components/ExpenseSuccessModal';

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Groceries', 'Other'];

export default function NewExpense() {
  const navigate = useNavigate();
  
  // State for expense form
  const [expenseType, setExpenseType] = useState('individual');
  const [groupId, setGroupId] = useState('');
  const [members, setMembers] = useState([]);
  const [paidBy, setPaidBy] = useState([]);
  const [splitType, setSplitType] = useState('equal');
  const [splits, setSplits] = useState([]);
  
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // UI state
  const [showSuccess, setShowSuccess] = useState(false);
  const [percentages, setPercentages] = useState({});
  const [exactAmounts, setExactAmounts] = useState({});
  const [shares, setShares] = useState({});

  // Fetch user's groups
  const { data: groupsData } = useQuery(
    ['groups'],
    async () => {
      const response = await api.get('/groups');
      return response.data;
    }
  );

  // Fetch current user
  const { data: userData } = useQuery(
    ['user'],
    async () => {
      const response = await api.get('/users/me');
      return response.data;
    }
  );

  // Get group members when group is selected
  useEffect(() => {
    if (!groupId) {
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      try {
        const res = await api.get(`/groups/${groupId}/expenses`);
        
        // CRITICAL FIX: Extract members correctly
        const membersData = res.data.data.members.map(m => m.userId);
        
    console.log('Members loaded:', membersData);
        setMembers(membersData);

        // Default: Current user paid
        if (userData?.data?._id) {
          setPaidBy([{ userId: userData.data._id, amount: Number(amount) || 0 }]);
          
          // Default: Split among all members
          setSplits(membersData.map(m => ({ userId: m._id })));
        }
      } catch (error) {
        console.error('Failed to fetch members:', error);
        showToast.error('Failed to load group members');
      }
    };

    fetchMembers();
  }, [groupId, userData]); // REMOVED 'amount' from dependencies to prevent lag

  // Clear split-specific inputs when type changes
  useEffect(() => {
    if (members.length > 0) {
      setSplits(members.map(m => ({ userId: m._id })));
      
      // Reset type-specific inputs
      setPercentages({});
      setExactAmounts({});
      setShares({});
    }
  }, [splitType, members]);

  // Keep single payer amount in sync with total
  useEffect(() => {
    if (paidBy.length === 1) {
      setPaidBy([
        { userId: paidBy[0].userId, amount: Number(amount) || 0 }
      ]);
    }
  }, [amount]);

  // Create expense mutation
  const createExpenseMutation = useMutation(
    (data) => expenseService.createExpense(data),
    {
      onSuccess: () => {
        setShowSuccess(true);
        
        setTimeout(() => {
          setShowSuccess(false);
          resetForm();
        }, 2000);
      },
      onError: (error) => {
        console.error('Expense creation error:', error);
        const errorMessage = error.response?.data?.message || 
                             error.response?.data?.error || 
                             'Failed to create expense';
        showToast.error(errorMessage);
      }
    }
  );

  // Reset form
  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
    setGroupId('');
    setPaidBy([]);
    setSplits([]);
    setPercentages({});
    setExactAmounts({});
    setShares({});
  };

  // ===== HANDLERS FOR DYNAMIC INPUTS =====
  const handlePercentageChange = (userId, value) => {
    setPercentages(prev => ({ ...prev, [userId]: Number(value) }));
  };

  const handleExactChange = (userId, value) => {
    setExactAmounts(prev => ({ ...prev, [userId]: Number(value) }));
  };

  const handleShareChange = (userId, value) => {
    setShares(prev => ({ ...prev, [userId]: Number(value) }));
  };

  // Round to 2 decimal places
  const round = (num) => Math.round(num * 100) / 100;

  // Calculate who owes what in real-time
  const calculatePreview = () => {
    const total = Number(amount);
    if (!total || splits.length === 0 || members.length === 0) return [];

    let splitAmounts = {};

    if (splitType === "equal") {
      const perHead = total / splits.length;
      splits.forEach(s => {
        splitAmounts[s.userId] = perHead;
      });
    }

    if (splitType === "percentage") {
      splits.forEach(s => {
        splitAmounts[s.userId] = total * ((percentages[s.userId] || 0) / 100);
      });
    }

    if (splitType === "exact") {
      splits.forEach(s => {
        splitAmounts[s.userId] = exactAmounts[s.userId] || 0;
      });
    }

    if (splitType === "shares") {
      const totalShares = Object.values(shares).reduce((a, b) => a + b, 0);
      if (totalShares > 0) {
        splits.forEach(s => {
          splitAmounts[s.userId] = total * ((shares[s.userId] || 0) / totalShares);
        });
      }
    }

    return members.map(member => {
      const paid = paidBy.find(p => p.userId === member._id)?.amount || 0;
      const owes = splitAmounts[member._id] || 0;

      return {
        name: member.name,
        paid: round(paid),
        owes: round(owes),
        net: round(paid - owes)
      };
    });
  };

  const preview = calculatePreview();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check required fields
    if (!description.trim()) {
      showToast.error('Description is required');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      showToast.error('Valid amount is required');
      return;
    }

    const totalAmount = Number(amount);

    // Validate group expense specifics
    if (expenseType === 'group') {
      if (members.length === 0) {
        showToast.error('No members in this group');
        return;
      }

      if (paidBy.length === 0) {
        showToast.error('At least one person must pay');
        return;
      }

    // Make sure a split type was picked
      if (!splitType) {
        showToast.error('Please select a split type (Equal, Percentage, Exact, or Shares)');
        return;
      }

    // Double-check the paid amounts add up
      const totalPaid = paidBy.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPaid - totalAmount) > 0.01) {
        showToast.error(`Paid amount mismatch. Total paid: ₹${totalPaid.toFixed(2)}, Expected: ₹${totalAmount.toFixed(2)}`);
        return;
      }

    // Type-specific validation
      if (splitType === 'percentage') {
        const totalPercent = Object.values(percentages).reduce((sum, p) => sum + p, 0);
        if (totalPercent !== 100) {
          showToast.error(`Percentages must equal 100% (current: ${totalPercent}%)`);
          return;
        }
      }

      if (splitType === 'exact') {
        const totalExact = Object.values(exactAmounts).reduce((sum, a) => sum + a, 0);
        if (Math.abs(totalExact - totalAmount) > 0.01) {
          showToast.error(`Exact amounts must equal ₹${totalAmount.toFixed(2)} (current: ₹${totalExact.toFixed(2)})`);
          return;
        }
      }

      if (splitType === 'shares') {
        const totalShares = Object.values(shares).reduce((sum, s) => sum + s, 0);
        if (totalShares <= 0) {
          showToast.error('Total shares must be greater than 0');
          return;
        }
      }
    }

    // Build the payload to send
    const payload = {
      description: description.trim(),
      amount: totalAmount,
      category: category.trim(),
      date: new Date(date),
      groupId: expenseType === 'group' ? groupId : undefined,
      splitType: expenseType === 'group' ? splitType : undefined,
      paidBy: expenseType === 'group' ? paidBy : [{ userId: userData.data._id, amount: totalAmount }],
      splits: expenseType === 'group' ? splits : [{ userId: userData.data._id }],
    };

    // Add percentage/share/exact data if needed
    if (expenseType === 'group') {
      if (splitType === 'percentage') {
        payload.splits = splits.map(s => ({
          userId: s.userId,
          percentage: percentages[s.userId] || 0
        }));
      } else if (splitType === 'exact') {
        payload.splits = splits.map(s => ({
          userId: s.userId,
          amount: exactAmounts[s.userId] || 0
        }));
      } else if (splitType === 'shares') {
        payload.splits = splits.map(s => ({
          userId: s.userId,
          share: shares[s.userId] || 1
        }));
      }
    }

    console.log('Submitting expense:', payload);
    createExpenseMutation.mutate(payload);
  };

  const groups = groupsData?.data || [];
  const currentUser = userData?.data;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Add New Expense"
        subtitle={expenseType === 'individual' 
          ? 'Add a personal expense for yourself' 
          : 'Split an expense with friends or groups'}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Expense Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Expense Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={expenseType} onValueChange={setExpenseType}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="group">Group Expense</TabsTrigger>
                <TabsTrigger value="individual">Individual Expense</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Basic Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Basic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Description"
              placeholder="What's this expense for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createExpenseMutation.isPending}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={createExpenseMutation.isPending}
              />

              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger disabled={createExpenseMutation.isPending}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={createExpenseMutation.isPending}
            />
          </CardContent>
        </Card>

        {/* Group Selection */}
        {expenseType === 'group' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Users className="h-5 w-5" />
                Select Group
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger disabled={createExpenseMutation.isPending}>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group._id} value={group._id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Who paid for this expense */}
        {expenseType === 'group' && members.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Who Paid the Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Select who paid and enter amounts (must total ₹{Number(amount || 0).toFixed(2)})
              </p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {members.map((member) => {
                  const payer = paidBy.find(p => p.userId === member._id);
                  const paidAmount = payer?.amount || 0;
                  
                  return (
                    <div
                      key={member._id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        paidAmount > 0 ? 'bg-emerald-50 border-emerald-500' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={paidBy.some(p => p.userId === member._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPaidBy(prev => [
                              ...prev,
                              { userId: member._id, amount: Number(amount) || 0 }
                            ]);
                          } else {
                            setPaidBy(prev => prev.filter(p => p.userId !== member._id));
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.imageUrl} />
                        <AvatarFallback>{member.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                      {paidAmount > 0 && (
                        <Input
                          type="number"
                          placeholder="₹"
                          className="w-24"
                          value={paidAmount}
                          onChange={(e) => {
                            const newAmount = Number(e.target.value);
                            setPaidBy(prev =>
                              prev.map(p => p.userId === member._id ? { ...p, amount: newAmount } : p)
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* How should we split this? */}
        {expenseType === 'group' && members.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Split Type</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={splitType} onValueChange={setSplitType}>
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="equal" id="equal" />
                    <Label htmlFor="equal">Equal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage">Percentage</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="exact" id="exact" />
                    <Label htmlFor="exact">Exact</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="shares" id="shares" />
                    <Label htmlFor="shares">Shares</Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Dynamic Split Inputs */}
        {expenseType === 'group' && members.length > 0 && splitType === 'percentage' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Enter Percentages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Total must equal 100%</p>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member._id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.imageUrl} />
                      <AvatarFallback>{member.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 font-medium text-gray-900">{member.name}</span>
                    <Input
                      type="number"
                      placeholder="%"
                      className="w-24"
                      value={percentages[member._id] || ''}
                      onChange={(e) => handlePercentageChange(member._id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-medium text-gray-900">Total:</span>
                <Badge variant={Object.values(percentages).reduce((sum, p) => sum + p, 0) === 100 ? 'default' : 'destructive'}>
                  {Object.values(percentages).reduce((sum, p) => sum + p, 0)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {expenseType === 'group' && members.length > 0 && splitType === 'exact' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Enter Exact Amounts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Must total ₹{Number(amount || 0).toFixed(2)}</p>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member._id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.imageUrl} />
                      <AvatarFallback>{member.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 font-medium text-gray-900">{member.name}</span>
                    <Input
                      type="number"
                      placeholder="₹"
                      className="w-24"
                      value={exactAmounts[member._id] || ''}
                      onChange={(e) => handleExactChange(member._id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-medium text-gray-900">Total:</span>
                <Badge variant={Math.abs(Object.values(exactAmounts).reduce((sum, a) => sum + a, 0) - Number(amount)) <= 0.01 ? 'default' : 'destructive'}>
                  ₹{Object.values(exactAmounts).reduce((sum, a) => sum + a, 0).toFixed(2)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {expenseType === 'group' && members.length > 0 && splitType === 'shares' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Enter Shares</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Assign shares (weights) to each person</p>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member._id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.imageUrl} />
                      <AvatarFallback>{member.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 font-medium text-gray-900">{member.name}</span>
                    <Input
                      type="number"
                      placeholder="Shares"
                      className="w-24"
                      min="1"
                      value={shares[member._id] || ''}
                      onChange={(e) => handleShareChange(member._id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show real-time calculation */}
        {expenseType === 'group' && members.length > 0 && preview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {preview.map((p, i) => (
                  <div key={i} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{p.name}</span>
                      <Badge variant={p.net >= 0 ? 'default' : 'destructive'}>
                        {p.net >= 0 ? `Gets ₹${p.net}` : `Owes ₹${Math.abs(p.net)}`}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Paid:</span>
                        <span className="ml-2 font-medium text-emerald-600">₹{p.paid}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Owes:</span>
                        <span className="ml-2 font-medium text-red-600">₹{p.owes}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createExpenseMutation.isPending} 
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            {createExpenseMutation.isPending ? 'Creating...' : 'Create Expense'}
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      <ExpenseSuccessModal show={showSuccess} />
    </div>
  );
}
