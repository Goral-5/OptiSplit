import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, DollarSign, Plus, FileText, ArrowUpRight, ArrowDownRight, Wallet, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { DropdownButton } from '../ui/DropdownButton';
import { ExpenseList } from '../components/ExpenseList';
import { Badge } from '../ui/Badge';
import { PageHeader } from '../ui/PageHeader';
import api from '../services/api';
import { showToast } from '../ui/Sonner';

export default function Dashboard() {
  const [usersMap, setUsersMap] = useState({});

  // Fetch dashboard summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery(
    ['dashboardSummary'],
    async () => {
      const response = await api.get('/dashboard/summary');
      return response.data;
    },
    {
      onError: (error) => {
        showToast.error('Failed to load dashboard summary');
      }
    }
  );

  // Fetch user's groups
  const { data: groupsData, isLoading: groupsLoading } = useQuery(
    ['groups'],
    async () => {
      const response = await api.get('/groups');
      return response.data;
    },
    {
      onError: (error) => {
        showToast.error('Failed to load groups');
      }
    }
  );

  // Fetch recent expenses (from all groups)
  const { data: expensesData, isLoading: expensesLoading } = useQuery(
    ['recentExpenses'],
    async () => {
      const response = await api.get('/expenses');
      return response.data;
    },
    {
      onError: (error) => {
        console.log('Failed to load expenses', error);
      }
    }
  );

  // Build users map for expense list
  useEffect(() => {
    if (expensesData?.data) {
      const map = {};
      expensesData.data.forEach(exp => {
        if (exp.paidByUserId) {
          map[exp.paidByUserId._id] = exp.paidByUserId;
        }
        if (exp.splits) {
          exp.splits.forEach(split => {
            if (split.userId) {
              map[split.userId._id] = split.userId;
            }
          });
        }
      });
      setUsersMap(map);
    }
  }, [expensesData]);

  const summary = summaryData?.data || {};
  const groups = groupsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        subtitle="Manage your shared expenses"
        actions={
          <DropdownButton
            primaryLabel="Create"
            options={[
              {
                label: 'Create Group',
                href: '/app/groups/create',
                icon: <Users className="h-4 w-4" />
              },
              {
                label: 'Add Expense',
                href: '/app/expenses/new',
                icon: <FileText className="h-4 w-4" />
              }
            ]}
          />
        }
      />

      {/* Balance Summary Cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Net Balance - Enhanced */}
          <Card className="relative overflow-hidden card-hover border-l-4 border-l-gray-500">
            <div className={`absolute inset-0 opacity-5 ${
              summary.netBalance > 0 ? 'bg-gradient-to-br from-green-500 to-green-600' : 
              summary.netBalance < 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 
              'bg-gradient-to-br from-gray-500 to-gray-600'
            }`}></div>
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${
                  summary.netBalance > 0 ? 'bg-green-100' : 
                  summary.netBalance < 0 ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <DollarSign className={`h-6 w-6 ${
                    summary.netBalance > 0 ? 'text-green-600' : 
                    summary.netBalance < 0 ? 'text-red-600' : 'text-gray-600'
                  }`} />
                </div>
                {summary.netBalance !== 0 && (
                  <Badge variant={summary.netBalance > 0 ? 'default' : 'destructive'} className="text-xs">
                    {summary.netBalance > 0 ? '+' : ''}{Math.round((summary.netBalance / Math.max(summary.totalOwedToUser || 1, summary.totalUserOwes || 1)) * 100)}%
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
                <p className={`text-4xl font-bold mt-2 tracking-tight ${
                  summary.netBalance > 0 ? 'text-green-600' : 
                  summary.netBalance < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  ₹{Math.abs(summary.netBalance || 0).toFixed(2)}
                </p>
                <div className="flex items-center mt-3">
                  {summary.netBalance > 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                  ) : summary.netBalance < 0 ? (
                    <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                  ) : null}
                  <span className={`text-xs font-medium ${
                    summary.netBalance > 0 ? 'text-green-600' : 
                    summary.netBalance < 0 ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {summary.netBalance > 0 ? 'You are owed' : summary.netBalance < 0 ? 'You owe' : 'Settled'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* You Are Owed - Enhanced */}
          <Card className="relative overflow-hidden card-hover border-l-4 border-l-green-500">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-50"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <Badge variant="default" className="bg-green-600 text-xs">
                  Receivable
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">You Are Owed</p>
                <p className="text-4xl font-bold text-green-600 mt-2 tracking-tight">
                  ₹{(summary.totalOwedToUser || 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-3 flex items-center">
                  <Activity className="h-3 w-3 mr-1" />
                  From all groups and activities
                </p>
              </div>
            </CardContent>
          </Card>

          {/* You Owe - Enhanced */}
          <Card className="relative overflow-hidden card-hover border-l-4 border-l-red-500">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50 opacity-50"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <Badge variant="destructive" className="text-xs">
                  Payable
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">You Owe</p>
                <p className="text-4xl font-bold text-red-600 mt-2 tracking-tight">
                  ₹{(summary.totalUserOwes || 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-3 flex items-center">
                  <Wallet className="h-3 w-3 mr-1" />
                  To all groups and activities
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Row - Enhanced */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <Card className="card-hover border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
                <p className="text-sm text-gray-600">Active Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-100">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">₹{(summary.personalExpensesThisMonth || 0).toFixed(2)}</p>
                <p className="text-sm text-gray-600">Personal (This Month)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-100">
                <Wallet className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(summary.settlements || {}).length}</p>
                <p className="text-sm text-gray-600">Settlements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Expenses Enhanced */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Expenses</h2>
              <p className="text-sm text-gray-600 mt-1">
                Track your latest transactions
              </p>
            </div>
            <Link to="/app/expenses/new">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </Link>
          </div>

          {expensesLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-lg border">
                      <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : expensesData?.data && expensesData.data.length > 0 ? (
            <Card className="border border-gray-200">
              <CardContent className="p-0">
                <ExpenseList
                  expenses={expensesData.data.slice(0, 5)}
                  users={usersMap}
                  showDelete={false}
                />
                {expensesData.data.length > 5 && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <Link to="/app/expenses/new">
                      <Button variant="secondary" className="w-full">
                        View All Expenses
                        <ArrowUpRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="p-4 rounded-full bg-emerald-100 inline-block animate-pulse">
                    <DollarSign className="h-12 w-12 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">No expenses yet</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Add your first expense to start tracking
                    </p>
                  </div>
                  <Link to="/app/expenses/new">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-lg transition-all duration-200">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Expense
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Groups Enhanced */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Your Groups</h2>
            <Link to="/app/groups">
              <Button variant="secondary" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                View All
              </Button>
            </Link>
          </div>

          {groupsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : groups.length > 0 ? (
            <div className="space-y-3">
              {groups.map((group, index) => (
                <Link key={group._id} to={`/app/groups/${group._id}`}>
                  <Card className="card-hover cursor-pointer group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Users className="h-4 w-4 text-emerald-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                              {group.name}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {group.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {group.memberCount || 0}
                            </Badge>
                            {group.expenseCount !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                {group.expenseCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 transition-colors opacity-0 group-hover:opacity-100" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <div className="p-4 rounded-full bg-emerald-100 inline-block animate-pulse">
                    <Users className="h-12 w-12 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">No groups yet</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Create a group to start splitting expenses
                    </p>
                  </div>
                  <Link to="/app/groups/create">
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-lg transition-all duration-200">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Group
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
