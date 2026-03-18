import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { DollarSign, Plus } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { ExpenseList } from '../components/ExpenseList';
import api from '../services/api';
import { showToast } from '../ui/Sonner';

export default function PersonDetail() {
  const { id } = useParams();

  const { data: userData, isLoading } = useQuery(
    ['user', id],
    async () => {
      const response = await api.get(`/users/${id}`);
      return response.data;
    },
    {
      onError: () => showToast.error('Failed to load user details')
    }
  );

  const { data: expensesData } = useQuery(
    ['bilateralExpenses', id],
    async () => {
      const response = await api.get(`/expenses/user/${id}`);
      return response.data;
    },
    {
      enabled: !!id,
      onError: () => console.log('Failed to load expenses')
    }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const user = userData?.data || {};
  const expenses = expensesData?.data || [];

  // Calculate balance
  const totalOwed = expenses
    .filter(exp => exp.paidByUserId?._id === id)
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  const totalOwe = expenses
    .filter(exp => exp.paidByUserId?._id !== id)
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  const netBalance = totalOwed - totalOwe;

  return (
    <div className="space-y-6">
      {/* User Profile */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.imageUrl} />
            <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold gradient-title">{user.name}</h1>
            <p className="text-muted-foreground mt-1">{user.email}</p>
          </div>
        </div>
        <Link to={`/settlements/person/${id}`}>
          <Button>Settle Up</Button>
        </Link>
      </div>

      {/* Balance Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
              <p className={`text-4xl font-bold mt-2 ${
                netBalance > 0 ? 'text-green-600' : 
                netBalance < 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                ₹{Math.abs(netBalance).toFixed(2)}
              </p>
              {netBalance > 0 && (
                <Badge className="mt-2 bg-green-100 text-green-800">
                  They owe you money
                </Badge>
              )}
              {netBalance < 0 && (
                <Badge className="mt-2 bg-red-100 text-red-800">
                  You owe them money
                </Badge>
              )}
              {netBalance === 0 && (
                <Badge className="mt-2" variant="secondary">
                  All settled up
                </Badge>
              )}
            </div>
            <DollarSign className="h-16 w-16 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      {/* Shared Expenses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Shared Expenses</h2>
          <Link to="/app/expenses/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </Link>
        </div>

        {expenses.length > 0 ? (
          <ExpenseList
            expenses={expenses}
            users={{ [user._id]: user }}
            showDelete={false}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                No shared expenses yet. Add an expense to start tracking!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
