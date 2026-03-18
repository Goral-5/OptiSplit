import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Users, DollarSign, Plus, TrendingUp, UserPlus, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { StackedAvatars } from '../ui/Avatar';
import { ExpenseList } from '../components/ExpenseList';
import { GroupBalances } from '../components/GroupBalances';
import { GroupMembers } from '../components/GroupMembers';
import api from '../services/api';
import { showToast } from '../ui/Sonner';

export default function GroupDetail() {
  const { id } = useParams();

  // Fetch group details with expenses and balances
  const { data: groupData, isLoading, error } = useQuery(
    ['group', id],
    async () => {
      try {
        const response = await api.get(`/groups/${id}/expenses`);
        return response.data;
      } catch (err) {
        console.error('Error fetching group:', err);
        throw err;
      }
    },
    {
      retry: 2,
      staleTime: 30000, // Cache for 30 seconds
      onError: (err) => {
        const message = err.response?.data?.message || 'Failed to load group details';
        showToast.error(message);
        console.error('Group detail error:', err);
      }
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading group details...</p>
          <p className="text-sm text-muted-foreground">Group ID: {id}</p>
        </div>
      </div>
    );
  }

  if (error || !groupData?.data) {
    const errorMessage = error?.response?.data?.message || 'Group not found or access denied';
    const errorStatus = error?.response?.status;
    
    console.error('Group detail error state:', {
      error,
      hasData: !!groupData?.data,
      status: errorStatus
    });
    
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{errorMessage}</h2>
              <p className="text-muted-foreground mt-2">
                This group doesn't exist or you don't have permission to view it.
              </p>
              {errorStatus === 403 && (
                <p className="text-sm text-red-600 mt-2">
                  Error 403: You are not a member of this group
                </p>
              )}
              {errorStatus === 404 && (
                <p className="text-sm text-red-600 mt-2">
                  Error 404: Group not found
                </p>
              )}
              <div className="flex gap-3 mt-6 justify-center">
                <Link to="/app/groups">
                  <Button>
                    Back to Groups
                  </Button>
                </Link>
                <Link to="/app/dashboard">
                  <Button variant="outline">
                    Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Debug log the data structure
  console.log('Group data loaded:', groupData);
  console.log('Members from API:', groupData?.data?.members);

  const group = groupData.data.group;
  const expenses = groupData.data.expenses || [];
  const balances = groupData.data.balances || {};
  // Members come from the separate 'members' field, not from group object
  const members = groupData.data.members || [];
  
  console.log('Extracted members:', members);
  console.log('First member userId object:', members[0]?.userId);

  // Build users map for expense list
  const usersMap = {};
  members.forEach(member => {
    if (member.userId) {
      usersMap[member.userId._id] = member.userId;
    }
  });
  expenses.forEach(exp => {
    if (exp.paidByUserId) {
      usersMap[exp.paidByUserId._id] = exp.paidByUserId;
    }
  });

  // Calculate total balance
  const totalBalance = Object.values(balances).reduce((sum, bal) => sum + bal.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
          <p className="text-sm text-gray-600 mt-1">
            Shared group • {members.length} members
          </p>
          {group.description && (
            <p className="text-gray-600 mt-2">{group.description}</p>
          )}
          
          {/* Stacked Member Avatars */}
          <div className="mt-4">
            <StackedAvatars members={members} maxDisplay={5} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/app/groups">
            <Button variant="ghost">Back to Groups</Button>
          </Link>
          <Link to={`/settlements/group/${id}`}>
            <Button variant="secondary">Settle Up</Button>
          </Link>
          <Link to="/app/expenses/new">
            <Button className="bg-emerald-600 hover:bg-emerald-500">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Balance Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Your Total Balance</p>
              <p className={`text-4xl font-bold mt-2 tracking-tight ${
                totalBalance > 0 ? 'text-emerald-600' : 
                totalBalance < 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                ₹{Math.abs(totalBalance).toFixed(2)}
              </p>
              {totalBalance > 0 && (
                <Badge variant="success" className="mt-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  You are owed money
                </Badge>
              )}
              {totalBalance < 0 && (
                <Badge variant="destructive" className="mt-2">
                  <DollarSign className="h-3 w-3 mr-1" />
                  You owe money
                </Badge>
              )}
              {totalBalance === 0 && (
                <Badge variant="secondary" className="mt-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  All settled up
                </Badge>
              )}
            </div>
            <DollarSign className="h-16 w-16 text-gray-300" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
            <Link to="/app/expenses/new">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </Link>
          </div>

          {expenses.length > 0 ? (
            <ExpenseList
              expenses={expenses}
              users={usersMap}
              showDelete={false}
              emptyMessage="No expenses in this group yet"
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-gray-600">
                  No expenses yet. Add your first expense to start tracking!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Balances Tab */}
        <TabsContent value="balances" className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Balances</h2>
          <GroupBalances
            balances={balances}
            currentUserId={usersMap?._id}
          />
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Members</h2>
            <Button variant="secondary" size="sm">
              <UserPlus className="h-4 w-4 mr-1" />
              Invite
            </Button>
          </div>
          <Card>
            <CardContent className="p-2">
              <GroupMembers
                members={members}
                users={usersMap}
                showRole={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
