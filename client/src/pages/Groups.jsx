import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus, Search, UserPlus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Label } from '../ui/Label';
import { PageHeader } from '../ui/PageHeader';
import api from '../services/api';
import { showToast } from '../ui/Sonner';
import { groupService } from '../services/index';

export default function Groups() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  // Fetch groups
  const { data: groupsData, isLoading: groupsLoading } = useQuery(
    ['groups'],
    async () => {
      const response = await api.get('/groups');
      return response.data;
    },
    {
      onError: () => showToast.error('Failed to load groups')
    }
  );

  // Search users
  const { data: usersData, isLoading: usersLoading } = useQuery(
    ['searchUsers', searchQuery],
    async () => {
      if (!searchQuery.trim()) return { data: [] };
      const response = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      return response.data;
    },
    {
      enabled: searchQuery.length > 0,
      staleTime: 5000
    }
  );

  // Add member mutation
  const addMemberMutation = useMutation(
    ({ groupId, userId }) => groupService.addMember(groupId, userId),
    {
      onSuccess: () => {
        showToast.success('Member added successfully!');
        setShowAddToGroupModal(false);
        setSelectedUsers([]);
        queryClient.invalidateQueries(['groups']);
      },
      onError: (error) => {
        showToast.error(error.response?.data?.message || 'Failed to add member');
      }
    }
  );

  // Create group mutation
  const createGroupMutation = useMutation(
    async (groupData) => {
      const response = await groupService.createGroup(groupData);
      return response.data;
    },
    {
      onSuccess: (group) => {
        showToast.success('Group created successfully!');
        setShowCreateGroupModal(false);
        setSelectedUsers([]);
        queryClient.invalidateQueries(['groups']);
        navigate(`/app/groups/${group._id}`);
      },
      onError: (error) => {
        showToast.error(error.response?.data?.message || 'Failed to create group');
      }
    }
  );

  const handleSelectUser = (user) => {
    setSelectedUsers([user]);
    setShowAddToGroupModal(true);
  };

  const handleAddToExistingGroup = (groupId) => {
    if (selectedUsers.length > 0) {
      addMemberMutation.mutate({
        groupId,
        userId: selectedUsers[0]._id
      });
    }
  };

  const handleCreateNewGroup = () => {
    setShowAddToGroupModal(false);
    setShowCreateGroupModal(true);
  };

  const handleCreateGroupSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const groupName = formData.get('groupName');
    const description = formData.get('description');
    
    if (!groupName?.trim()) {
      showToast.error('Group name is required');
      return;
    }
    
    if (selectedUsers.length === 0) {
      showToast.error('At least one member is required');
      return;
    }

    createGroupMutation.mutate({
      name: groupName.trim(),
      description: description?.trim() || '',
      members: selectedUsers.map(u => u._id)
    });
  };

  const groups = groupsData?.data || [];
  const searchResults = usersData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Groups"
        subtitle="Manage your groups and add members"
        actions={
          <Link to="/app/groups/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </Link>
        }
      />

      {/* Search People Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Search className="h-5 w-5" />
            Search People to Add
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {usersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery && searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map(user => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-emerald-500 cursor-pointer transition-all"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.imageUrl} />
                      <AvatarFallback>
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <UserPlus className="h-4 w-4 text-emerald-600" />
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-8 text-gray-600">
              <div className="p-4 rounded-full bg-gray-100 inline-block mx-auto mb-3">
                <UserPlus className="h-8 w-8 text-gray-400" />
              </div>
              <p className="font-medium text-gray-900">No people found</p>
              <p className="text-sm text-gray-600 mt-1">
                No people found matching "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <div className="p-4 rounded-full bg-gray-100 inline-block mx-auto mb-3">
                <UserPlus className="h-8 w-8 text-gray-400" />
              </div>
              <p className="font-medium text-gray-900">Search for people</p>
              <p className="text-sm text-gray-600 mt-1">
                Search for people to add to your groups
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Groups Grid */}
      {groupsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <Link key={group._id} to={`/app/groups/${group._id}`}>
              <Card className="card-hover cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{group.name}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {group.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{group.memberCount || 0} members</span>
                      </div>
                      {group.expenseCount !== undefined && (
                        <div>
                          {group.expenseCount} expenses
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-4 rounded-full bg-emerald-100 inline-block animate-pulse mx-auto">
                <Users className="h-16 w-16 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  No groups yet
                </h3>
                <p className="text-gray-600 mt-2">
                  Create your first group to start managing shared expenses
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

      {/* Add to Group Modal */}
      <Modal
        isOpen={showAddToGroupModal}
        onClose={() => setShowAddToGroupModal(false)}
        title="Add Member to Group"
      >
        {selectedUsers.length > 0 && (
          <div className="space-y-4">
            {/* Selected User Display */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedUsers[0].imageUrl} />
                <AvatarFallback>
                  {selectedUsers[0].name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{selectedUsers[0].name}</p>
                <p className="text-sm text-muted-foreground">{selectedUsers[0].email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Add to:</Label>
              
              {/* Option 1: Existing Groups */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Existing Group</p>
                {groupsLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => (
                      <div key={i} className="animate-pulse h-12 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                ) : groups.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {groups.map(group => (
                      <button
                        key={group._id}
                        onClick={() => handleAddToExistingGroup(group._id)}
                        disabled={addMemberMutation.isLoading}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-500 transition-all disabled:opacity-50"
                      >
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900">{group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {group.memberCount || 0} members • {group.description || 'No description'}
                          </p>
                        </div>
                        <Users className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No existing groups</p>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">OR</span>
                </div>
              </div>

              {/* Option 2: Create New Group */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Create New Group</p>
                <Button
                  onClick={handleCreateNewGroup}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Group with {selectedUsers[0].name.split(' ')[0]}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Group Modal */}
      <Modal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        title="Create New Group"
      >
        <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUsers[0].imageUrl} />
                <AvatarFallback>
                  {selectedUsers[0].name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Adding:</p>
                <p className="text-sm text-blue-700">{selectedUsers[0].name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUsers([])}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div>
            <Label htmlFor="groupName">Group Name *</Label>
            <Input
              id="groupName"
              name="groupName"
              placeholder="e.g., Goa Trip 2026, Roommates"
              disabled={createGroupMutation.isLoading}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="What's this group for?"
              disabled={createGroupMutation.isLoading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateGroupModal(false)}
              disabled={createGroupMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createGroupMutation.isLoading || selectedUsers.length === 0}
            >
              {createGroupMutation.isLoading ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
