import api from './api';

export const userService = {
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Search users
  searchUsers: async (query) => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

export const groupService = {
  // Create group
  createGroup: async (groupData) => {
    const response = await api.post('/groups', groupData);
    return response.data;
  },

  // Get all groups
  getGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  // Get group by ID
  getGroupById: async (groupId) => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },

  // Get group expenses with balances
  getGroupExpenses: async (groupId) => {
    const response = await api.get(`/groups/${groupId}/expenses`);
    return response.data;
  },

  // Add member to group
  addMember: async (groupId, userId) => {
    const response = await api.post(`/groups/${groupId}/members`, { userId });
    return response.data;
  },

  // Remove member from group
  removeMember: async (groupId, userId) => {
    const response = await api.delete(`/groups/${groupId}/members/${userId}`);
    return response.data;
  },

  // Delete group
  deleteGroup: async (groupId) => {
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
  },
};

export const expenseService = {
  // Create expense
  createExpense: async (expenseData) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  // Get expenses between two users
  getExpensesBetweenUsers: async (userId) => {
    const response = await api.get(`/expenses/user/${userId}`);
    return response.data;
  },

  // Delete expense
  deleteExpense: async (expenseId) => {
    const response = await api.delete(`/expenses/${expenseId}`);
    return response.data;
  },
};

export const settlementService = {
  // Create settlement
  createSettlement: async (settlementData) => {
    const response = await api.post('/settlements', settlementData);
    return response.data;
  },

  // Get settlement data
  getSettlementData: async (type, id) => {
    const response = await api.get(`/settlements/${type}/${id}/data`);
    return response.data;
  },

  // Get optimized settlements
  getOptimizedSettlements: async (type, id) => {
    const response = await api.get(`/settlements/${type}/${id}/optimized`);
    return response.data;
  },
};
