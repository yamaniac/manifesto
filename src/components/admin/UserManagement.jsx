'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Users, Crown, User, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

export default function UserManagement() {
  const { isSuperAdmin, getAllUsers, assignRole, removeRole, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasInitialized, setHasInitialized] = useState(false);

  // Input validation
  const validateRole = (role) => {
    const validRoles = ['admin', 'super_admin'];
    return validRoles.includes(role);
  };

  // Show message with auto-hide
  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }, []);

  // Memoize the user list to prevent unnecessary re-renders
  const memoizedUsers = useMemo(() => users, [users]);

  useEffect(() => {
    // Only fetch users once when component mounts and user is super admin
    if (isSuperAdmin() && !hasInitialized) {
      setHasInitialized(true);
      fetchUsers();
    }
  }, [hasInitialized]); // Only depend on hasInitialized to prevent infinite loops

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAllUsers();
      if (error) {
        console.error('Error fetching users:', error);
        showMessage('error', 'Error fetching users: ' + error.message);
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching users:', err);
      showMessage('error', 'An unexpected error occurred while fetching users.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !newRole) return;

    // Validate role
    if (!validateRole(newRole)) {
      showMessage('error', 'Invalid role specified.');
      return;
    }

    // Prevent self-modification
    if (selectedUser.id === user?.id) {
      showMessage('error', 'Cannot modify your own roles.');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await assignRole(selectedUser.id, newRole);
      if (error) {
        showMessage('error', 'Error assigning role: ' + error.message);
      } else {
        showMessage('success', 'Role assigned successfully!');
        fetchUsers();
        setSelectedUser(null);
        setNewRole('');
      }
    } catch (err) {
      console.error('Unexpected error assigning role:', err);
      showMessage('error', 'An unexpected error occurred while assigning the role.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveRole = async (userId, role) => {
    if (role === 'user') {
      showMessage('error', 'Cannot remove the basic user role.');
      return;
    }

    // Prevent self-modification
    if (userId === user?.id) {
      showMessage('error', 'Cannot modify your own roles.');
      return;
    }

    if (confirm(`Are you sure you want to remove the ${role} role from this user?`)) {
      setActionLoading(true);
      try {
        const { error } = await removeRole(userId, role);
        if (error) {
          showMessage('error', 'Error removing role: ' + error.message);
        } else {
          showMessage('success', 'Role removed successfully!');
          fetchUsers();
        }
      } catch (err) {
        console.error('Unexpected error removing role:', err);
        showMessage('error', 'An unexpected error occurred while removing the role.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  if (!isSuperAdmin()) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You need super admin privileges to access user management.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't render the main content until we've initialized
  if (!hasInitialized) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions across your application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Message Display */}
          {message.text && (
            <div className={`p-3 mb-4 rounded-md flex items-center gap-2 ${
              message.type === 'error' 
                ? 'text-red-600 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                : 'text-green-600 bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
            }`}>
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Total users: {memoizedUsers.length}
                </p>
                <Button 
                  onClick={fetchUsers} 
                  variant="outline" 
                  size="sm"
                  disabled={loading || actionLoading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                  ) : null}
                  Refresh
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memoizedUsers.map((userRecord) => (
                    <TableRow key={userRecord.id}>
                      <TableCell className="font-medium">
                        <span className="break-all">{userRecord.email}</span>
                      </TableCell>
                      <TableCell>{userRecord.full_name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {userRecord.roles?.map((role) => (
                            <Badge
                              key={role}
                              variant={getRoleBadgeVariant(role)}
                              className="flex items-center gap-1"
                            >
                              {getRoleIcon(role)}
                              {role}
                              {role !== 'user' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-0 ml-1 hover:bg-red-100 dark:hover:bg-red-900/20"
                                  onClick={() => handleRemoveRole(userRecord.id, role)}
                                  disabled={actionLoading || userRecord.id === user?.id}
                                  title="Remove role"
                                >
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                </Button>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(userRecord.user_created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(userRecord)}
                              disabled={actionLoading || userRecord.id === user?.id}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Role
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assign Role to {selectedUser?.email}</DialogTitle>
                              <DialogDescription>
                                Select a role to assign to this user. Only super admins can assign roles.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(null);
                                    setNewRole('');
                                  }}
                                  disabled={actionLoading}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleAssignRole} 
                                  disabled={!newRole || actionLoading}
                                >
                                  {actionLoading ? 'Assigning...' : 'Assign Role'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
