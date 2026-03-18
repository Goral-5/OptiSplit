import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { MemberSearch } from '../components/MemberSearch';
import { MemberChip } from '../components/MemberChip';
import { groupService } from '../services/index';
import { showToast } from '../ui/Sonner';
import api from '../services/api';

export default function CreateGroup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    members: [] // Array of user IDs
  });

  // Fetch selected users for display
  const [selectedUsers, setSelectedUsers] = useState([]);

  const createGroupMutation = useMutation(
    async (groupData) => {
      const response = await groupService.createGroup(groupData);
      return response.data;
    },
    {
      onSuccess: (group) => {
        showToast.success('Group created successfully!');
        queryClient.invalidateQueries(['groups']);
        // Navigate to the newly created group page
        navigate(`/app/groups/${group._id}`);
      },
      onError: (error) => {
        showToast.error(error.response?.data?.message || 'Failed to create group');
      }
    }
  );

  const handleAddUser = (user) => {
    if (!formData.members.includes(user._id)) {
      setFormData(prev => ({
        ...prev,
        members: [...prev.members, user._id]
      }));
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const handleRemoveUser = (userId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter(id => id !== userId)
    }));
    setSelectedUsers(prev => prev.filter(user => user._id !== userId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast.error('Group name is required');
      return;
    }
    
    if (formData.members.length === 0) {
      showToast.error('At least one additional member is required');
      return;
    }

    createGroupMutation.mutate(formData);
  };

  const isLoading = createGroupMutation.isLoading;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/app/dashboard')}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold gradient-title">Create New Group</h1>
          <p className="text-muted-foreground mt-1">
            Set up a group to manage shared expenses
          </p>
        </div>
      </div>

      {/* Create Group Form */}
      <Card>
        <CardHeader>
          <CardTitle>Group Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Name */}
            <div>
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Goa Trip 2026, Roommates, Office Lunch"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What's this group for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                disabled={isLoading}
              />
            </div>

            {/* Add Members Section */}
            <div>
              <Label>Add Members *</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Search and select members to add to this group
              </p>
              
              <MemberSearch
                selectedUsers={formData.members}
                onAddUser={handleAddUser}
                placeholder="Search by name or email..."
              />

              {/* Selected Members Display */}
              {selectedUsers.length > 0 && (
                <div className="mt-4">
                  <Label>Selected Members ({selectedUsers.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUsers.map((user) => (
                      <MemberChip
                        key={user._id}
                        user={user}
                        onRemove={() => handleRemoveUser(user._id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                💡 You will be the admin of this group. Add at least one more member.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/app/dashboard')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || formData.members.length === 0}
              >
                {isLoading ? 'Creating Group...' : 'Create Group'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
