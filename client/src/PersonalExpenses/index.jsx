import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/SelectImproved';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import api from '../services/api';
import { showToast } from '../ui/Sonner';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Groceries', 'Other'];

export default function PersonalExpenses() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Fetch personal expenses
  const { data: expensesData, isLoading } = useQuery(
    ['personalExpenses', selectedMonth, selectedYear],
    async () => {
      const response = await api.get(`/personal-expenses?month=${selectedMonth}&year=${selectedYear}`);
      return response.data;
    },
    {
      onError: () => showToast.error('Failed to load personal expenses')
    }
  );

  // Fetch summary
  const { data: summaryData } = useQuery(
    ['personalSummary', selectedMonth, selectedYear],
    async () => {
      const response = await api.get(`/personal-expenses/summary?month=${selectedMonth}&year=${selectedYear}`);
      return response.data;
    }
  );

  // Create personal expense mutation
  const createExpenseMutation = useMutation(
    async (expenseData) => {
      const response = await api.post('/personal-expenses', expenseData);
      return response.data;
    },
    {
      onSuccess: () => {
        showToast.success('Personal expense added successfully!');
        setAddExpenseOpen(false);
        queryClient.invalidateQueries(['personalExpenses', selectedMonth, selectedYear]);
        queryClient.invalidateQueries(['personalSummary', selectedMonth, selectedYear]);
        setNewExpense({
          amount: '',
          category: 'Food',
          description: '',
          date: new Date().toISOString().split('T')[0],
          notes: ''
        });
      },
      onError: (error) => {
        showToast.error(error.response?.data?.message || 'Failed to add expense');
      }
    }
  );

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      showToast.error('Valid amount is required');
      return;
    }
    if (!newExpense.category) {
      showToast.error('Category is required');
      return;
    }
    createExpenseMutation.mutate({
      ...newExpense,
      amount: parseFloat(newExpense.amount),
      date: newExpense.date || new Date().toISOString()
    });
  };

  const expenses = expensesData?.data || [];
  const summary = summaryData?.data || {};
  const categoryBreakdown = summary.categoryBreakdown || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-title">Personal Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track your individual spending
          </p>
        </div>
        <Button onClick={() => setAddExpenseOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Month & Year Selector */}
      <div className="flex gap-4 flex-wrap">
        <div className="min-w-[160px]">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                <SelectItem key={month} value={(idx + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[140px]">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027, 2028].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-4xl font-bold mt-2">
                ₹{(summary.totalSpent || 0).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <TrendingUp className="h-16 w-16 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{cat._id}</Badge>
                    <span className="text-sm text-muted-foreground">{cat.count} expenses</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{cat.total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {((cat.total / (summary.totalSpent || 1)) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-3">
                  <div className="h-10 w-10 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map(expense => (
                <div key={expense._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{expense.category[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium">{expense.description || expense.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">₹{expense.amount.toFixed(2)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No personal expenses this month</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      <Modal
        isOpen={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        title="Add Personal Expense"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
            disabled={createExpenseMutation.isPending}
          />

          <div>
            <Label>Category</Label>
            <Select
              value={newExpense.category}
              onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
              disabled={createExpenseMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            label="Description (Optional)"
            placeholder="What's this expense for?"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            disabled={createExpenseMutation.isPending}
          />

          <Input
            label="Date"
            type="date"
            value={newExpense.date}
            onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            disabled={createExpenseMutation.isPending}
          />

          <Textarea
            label="Notes (Optional)"
            placeholder="Add any additional details"
            value={newExpense.notes}
            onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
            rows={3}
            disabled={createExpenseMutation.isPending}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddExpenseOpen(false)}
              disabled={createExpenseMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createExpenseMutation.isPending}>
              {createExpenseMutation.isPending ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
