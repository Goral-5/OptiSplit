import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { TrendingUp, DollarSign, Users, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { PageHeader } from '../ui/PageHeader';
import api from '../services/api';
import { showToast } from '../ui/Sonner';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('6');

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery(
    ['analytics', timeRange],
    async () => {
      const response = await api.get(`/dashboard/analytics?months=${timeRange}`);
      return response.data;
    },
    {
      onError: () => showToast.error('Failed to load analytics')
    }
  );

  // Fetch financial summary
  const { data: summaryData } = useQuery(
    ['financialSummary'],
    async () => {
      const response = await api.get('/dashboard/summary');
      return response.data;
    }
  );

  const analytics = analyticsData?.data || {};
  const summary = summaryData?.data || {};
  const monthlyTrend = analytics.monthlyTrend || [];
  const categoryDistribution = analytics.categoryDistribution || [];
  const groupVsPersonal = analytics.groupVsPersonal || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Analytics"
        subtitle="Insights into your spending habits"
        actions={
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last year</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-100">
                <DollarSign className="h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">₹{(summary.totalOwedToUser || 0).toFixed(2)}</p>
                <p className="text-sm text-gray-600">You Are Owed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-100">
                <DollarSign className="h-10 w-10 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">₹{(summary.totalUserOwes || 0).toFixed(2)}</p>
                <p className="text-sm text-gray-600">You Owe</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-100">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{summary.activeGroups || 0}</p>
                <p className="text-sm text-gray-600">Active Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-100">
                <Wallet className="h-10 w-10 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">₹{(summary.personalExpensesThisMonth || 0).toFixed(2)}</p>
                <p className="text-sm text-gray-600">Personal (This Month)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spending Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Group vs Personal Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="h-4 bg-emerald-100 rounded-full mb-2 overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, (groupVsPersonal.groupExpenses / (groupVsPersonal.groupExpenses + groupVsPersonal.personalExpenses || 1)) * 100)}%` }}
                />
              </div>
              <p className="text-3xl font-bold text-gray-900">₹{(groupVsPersonal.groupExpenses || 0).toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">Group Expenses</p>
            </div>

            <div className="text-center">
              <div className="h-4 bg-blue-100 rounded-full mb-2 overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, (groupVsPersonal.personalExpenses / (groupVsPersonal.groupExpenses + groupVsPersonal.personalExpenses || 1)) * 100)}%` }}
                />
              </div>
              <p className="text-3xl font-bold text-gray-900">₹{(groupVsPersonal.personalExpenses || 0).toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">Personal Expenses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      {categoryDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryDistribution.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <Badge variant="secondary" className="w-32 justify-start">{cat._id}</Badge>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600"
                      style={{ width: `${(cat.total / (categoryDistribution[0]?.total || 1)) * 100}%` }}
                    />
                  </div>
                  <p className="font-semibold text-gray-900 w-24 text-right">₹{cat.total.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend */}
      {monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <TrendingUp className="h-5 w-5" />
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyTrend.map((month, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <p className="text-sm font-medium text-gray-900 w-24">
                    {new Date(month._id.year, month._id.month - 1).toLocaleDateString('en-US', { month: 'short' })}
                  </p>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600"
                      style={{ width: `${(month.total / (monthlyTrend[0]?.total || 1)) * 100}%` }}
                    />
                  </div>
                  <p className="font-semibold text-gray-900 w-24 text-right">₹{month.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-600 w-16 text-right">{month.count} expenses</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      )}
    </div>
  );
}
