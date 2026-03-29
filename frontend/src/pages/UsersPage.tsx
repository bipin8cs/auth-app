import { useState, useEffect } from 'react';
import { usersApi, rolesApi } from '../services/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Trash2, Edit, X, Save } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

interface Role {
  id: string;
  name: string;
}

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  provider: string;
  isActive: boolean;
  department: string;
  location: string;
  roles: Role[];
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string | boolean | string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([usersApi.list(), rolesApi.list()]);
      setUsers(usersRes.data.users);
      setAllRoles(rolesRes.data.roles);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: UserData) => {
    setEditingId(user.id);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      department: user.department || '',
      location: user.location || '',
      isActive: user.isActive,
      roleIds: user.roles.map((r) => r.id),
    });
  };

  const saveEdit = async (id: string) => {
    try {
      await usersApi.update(id, editForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error('Failed to update user', err);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersApi.delete(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const toggleRole = (roleId: string) => {
    const current = editForm.roleIds as string[];
    if (current.includes(roleId)) {
      setEditForm({ ...editForm, roleIds: current.filter((id) => id !== roleId) });
    } else {
      setEditForm({ ...editForm, roleIds: [...current, roleId] });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-slate-500">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-slate-500 mt-1">Manage users and their role assignments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">User</th>
                  <th className="text-left py-3 px-2 font-medium">Provider</th>
                  <th className="text-left py-3 px-2 font-medium">Department</th>
                  <th className="text-left py-3 px-2 font-medium">Roles</th>
                  <th className="text-left py-3 px-2 font-medium">Status</th>
                  <th className="text-right py-3 px-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-slate-50">
                    {editingId === user.id ? (
                      <>
                        <td className="py-3 px-2">
                          <div className="space-y-1">
                            <Input
                              value={editForm.firstName as string}
                              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                              placeholder="First name"
                              className="h-7 text-xs"
                            />
                            <Input
                              value={editForm.lastName as string}
                              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                              placeholder="Last name"
                              className="h-7 text-xs"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-2 text-slate-500">{user.provider}</td>
                        <td className="py-3 px-2">
                          <Input
                            value={editForm.department as string}
                            onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                            placeholder="Department"
                            className="h-7 text-xs"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-1">
                            {allRoles.map((role) => (
                              <Badge
                                key={role.id}
                                variant={(editForm.roleIds as string[]).includes(role.id) ? 'default' : 'outline'}
                                className="cursor-pointer text-xs"
                                onClick={() => toggleRole(role.id)}
                              >
                                {role.name}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editForm.isActive as boolean}
                              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                            />
                            <span className="text-xs">Active</span>
                          </Label>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" onClick={() => saveEdit(user.id)}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="capitalize text-xs">
                            {user.provider}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-slate-600">{user.department || '—'}</td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <Badge
                                key={role.id}
                                variant={role.name === 'admin' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {role.name}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={user.isActive ? 'success' : 'destructive'} className="text-xs">
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" onClick={() => startEdit(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => deleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
