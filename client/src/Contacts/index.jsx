import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { Users, Plus, Search, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import api from '../services/api';
import { showToast } from '../ui/Sonner';
import { groupService } from '../services/index';
import { MemberSearch } from '../components/MemberSearch';
import { MemberChip } from '../components/MemberChip';

export default function Contacts() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  
  console.log('🔍 Contacts component rendering');
  
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    members: [] // Changed from memberIds to members array
  });

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

  // Create group mutation
  const createGroupMutation = useMutation(
    (groupData) => groupService.createGroup(groupData),
    {
      onSuccess: () => {
        showToast.success('Group created successfully!');
        setCreateGroupOpen(false);
        queryClient.invalidateQueries(['groups']);
        setNewGroup({ name: '', description: '', members: [] });
      },
      onError: (error) => {
        showToast.error(error.response?.data?.message || 'Failed to create group');
      }
    }
  );

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroup.name.trim()) {
      showToast.error('Group name is required');
      return;
    }
    if (newGroup.members.length === 0) {
      showToast.error('At least one additional member is required');
      return;
    }
    createGroupMutation.mutate(newGroup);
  };

  const toggleUserSelection = (userId) => {
    setNewGroup(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId]
    }));
  };

  const groups = groupsData?.data || [];
  const searchResults = usersData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-title">Groups</h1>
          <p className="text-muted-foreground mt-1">
            Manage your groups and create new ones
          </p>
        </div>
        <Button onClick={() => setCreateGroupOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Add Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Add Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Member Search Component */}
            <MemberSearch
              selectedUsers={newGroup.members}
              onAddUser={(user) => {
                setNewGroup(prev => ({
                  ...prev,
                  members: [...prev.members, user._id]
                }));
              }}
              placeholder="Search people to add..."
            />

            {/* Selected Members Display */}
            {newGroup.members.length > 0 && (
              <div className="mt-4">
                <Label>Selected Members ({newGroup.members.length})</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {searchResults
                    .filter(user => newGroup.members.includes(user._id))
                    .map(user => (
                      <MemberChip
                        key={user._id}
                        user={user}
                        onRemove={() => toggleUserSelection(user._id)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 Search for users and click to add them to your group. You must add at least one member.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {groupsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : groups.length > 0 ? (
              <div className="space-y-3">
                {groups.map(group => (
                  <Link key={group._id} to={`/groups/${group._id}`}>
                    <Card className="card-hover cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{group.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {group.description || 'No description'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {group.memberCount || 0} members
                              </span>
                            </div>
                          </div>
                          <Badge variant="secondary">Group</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No groups yet</p>
                <p className="text-sm mt-1">Create your first group to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Group Modal */}
      <Modal
        isOpen={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        title="Create New Group"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <Input
            label="Group Name"
            placeholder="e.g., Roommates, Vacation, Project Team"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            disabled={createGroupMutation.isPending}
            required
          />

          <Textarea
            label="Description (Optional)"
            placeholder="What's this group for?"
            value={newGroup.description}
            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
            rows={3}
            disabled={createGroupMutation.isPending}
          />

          <div>
            <Label>Add Members *</Label>
            <MemberSearch
              selectedUsers={newGroup.members}
              onAddUser={(user) => {
                setNewGroup(prev => ({
                  ...prev,
                  members: [...prev.members, user._id]
                }));
              }}
              placeholder="Search and add members..."
            />
            
            {newGroup.members.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {searchResults
                  .filter(user => newGroup.members.includes(user._id))
                  .map(user => (
                    <MemberChip
                      key={user._id}
                      user={user}
                      onRemove={() => toggleUserSelection(user._id)}
                    />
                  ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-2">
              You will be the admin of this group. Add at least one more member.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateGroupOpen(false)}
              disabled={createGroupMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createGroupMutation.isPending || newGroup.members.length === 0}
            >
              {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
